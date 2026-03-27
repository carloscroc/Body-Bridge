#!/usr/bin/env bash
set -euo pipefail

# deploy_convex_and_verify.sh
# Automated helper to set Convex envs, deploy, export function-spec, fetch logs for a Request ID,
# update local .env.local to point at the deployed cloud URL, run vite preview and the Playwright
# automated auth test to capture artifacts.
#
# IMPORTANT: This script requires an interactive `npx convex login` step (opens a browser).
# Run this script from the repo root on a machine that can authenticate with Convex.

usage() {
  cat <<EOF
Usage: $0 -d <deployment-name> -s <convex-site-url> [-r <request-id>] [-o <output-dir>]

Example:
  $0 -d dev:brilliant-newt-530 -s https://brilliant-newt-530.convex.site -r 3e226f73986c0140

Options:
  -d deployment-name   Convex deployment name (eg. dev:brilliant-newt-530)
  -s convex-site-url   CONVEX_SITE_URL (eg. https://brilliant-newt-530.convex.site)
  -r request-id        (optional) Request ID to search for in Convex logs
  -o output-dir        Directory to write artifacts (default: ./convex_deploy_artifacts)
EOF
}

DEPLOYMENT=""
SITE_URL=""
REQUEST_ID=""
OUT_DIR="convex_deploy_artifacts"

while getopts "d:s:r:o:h" opt; do
  case "$opt" in
    d) DEPLOYMENT="$OPTARG" ;;
    s) SITE_URL="$OPTARG" ;;
    r) REQUEST_ID="$OPTARG" ;;
    o) OUT_DIR="$OPTARG" ;;
    h) usage; exit 0 ;;
    *) usage; exit 1 ;;
  esac
done

if [ -z "$DEPLOYMENT" ] || [ -z "$SITE_URL" ]; then
  echo "ERROR: deployment-name and convex-site-url are required"
  usage
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "1) Ensure Convex CLI is installed"
if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found. Install Node.js/npm to proceed."
  exit 1
fi

echo "2) Login to Convex (interactive)"
echo "If you are already logged in, this will be a no-op."
npx convex login

echo "3) Ensure target deployment exists and is accessible: $DEPLOYMENT"
npx convex function-spec --deployment-name "$DEPLOYMENT" --file > "$OUT_DIR/function_spec_before.json" || true

echo "4) Generate or use existing CONVEX_AUTH_SECRET"
if [ -z "${CONVEX_AUTH_SECRET:-}" ]; then
  NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  echo "Generated CONVEX_AUTH_SECRET (save this) -> $NEW_SECRET"
  read -p "Press Enter to set this secret on deployment (or Ctrl-C to abort)"
  CONVEX_AUTH_SECRET_VAL="$NEW_SECRET"
else
  CONVEX_AUTH_SECRET_VAL="$CONVEX_AUTH_SECRET"
fi

echo "5) Set server-side environment variables on deployment: CONVEX_SITE_URL, CONVEX_AUTH_SECRET, AUTH_LOG_LEVEL"
npx convex env set CONVEX_SITE_URL="$SITE_URL"
npx convex env set CONVEX_AUTH_SECRET="$CONVEX_AUTH_SECRET_VAL"
npx convex env set AUTH_LOG_LEVEL=DEBUG

echo "6) Deploy functions to $DEPLOYMENT"
npx convex deploy --yes | tee "$OUT_DIR/deploy_output.log"

echo "7) Export function-spec to file"
npx convex function-spec --file > "$OUT_DIR/function_spec_after.json"

echo "8) If REQUEST_ID provided, fetch logs (last 500) and grep for it"
if [ -n "$REQUEST_ID" ]; then
  echo "Fetching logs and searching for Request ID: $REQUEST_ID"
  npx convex logs --history 500 --jsonl > "$OUT_DIR/convex_logs.jsonl" || true
  grep -n "$REQUEST_ID" -n "$OUT_DIR/convex_logs.jsonl" || echo "Request ID not found in last 500 logs"
fi

echo "9) Update local .env.local to point at deployed convex cloud URL (backup .env.local.bak)"
if [ -f .env.local ]; then
  cp .env.local .env.local.bak
fi
sed -E "s|^VITE_CONVEX_URL=.*|VITE_CONVEX_URL=${SITE_URL/.cloud/.cloud}|" .env.local.bak > .env.local || true
echo "Wrote .env.local (backup at .env.local.bak)."

echo "10) Start vite preview (background) and run Playwright auth test"
echo "Starting vite preview on port 7770"
npx kill-port 7770 || true
npm run preview -- --port 7770 &> "$OUT_DIR/preview_output.log" &
PREVIEW_PID=$!
echo "Vite preview started (PID=$PREVIEW_PID) — waiting 2s"
sleep 2

echo "Running Playwright auth automation"
node scripts/auto_auth_test.cjs || true
mv auto_auth_result.png "$OUT_DIR/" 2>/dev/null || true
mv auto_auth_logs.json "$OUT_DIR/" 2>/dev/null || true

echo "11) Cleanup: stop preview"
if ps -p $PREVIEW_PID >/dev/null 2>&1; then
  echo "Killing preview PID $PREVIEW_PID"
  kill $PREVIEW_PID || true
fi

echo "Finished. Artifacts written to: $OUT_DIR"
echo "Files:"
ls -la "$OUT_DIR" || true

echo "If you ran this, attach the files in $OUT_DIR (function_spec_after.json, convex_logs.jsonl, deploy_output.log, auto_auth_logs.json, auto_auth_result.png) for analysis."
