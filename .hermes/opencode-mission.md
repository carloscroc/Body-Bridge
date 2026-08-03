# Fix Convex Auth — Generate Valid PKCS#8 Private Key

## GOAL
Fix the broken Convex Auth by generating a valid PKCS#8 formatted private key for JWT_PRIVATE_KEY. This will restore user signup/signin capability and allow access to the exercise library for visual verification.

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## CONTEXT
The auth layer is blocked by: `"pkcs8 must be PKCS#8 formatted string"`. The current JWT_PRIVATE_KEY in .env.local is not a valid PKCS#8 PEM format. This prevents:
- User signup
- User signin
- Access to authenticated routes (like exercise library)
- Visual verification of the 51 Notion exercises

## FUNCTIONAL REQUIREMENTS
1. Generate a valid PKCS#8 EC private key using OpenSSL
2. Export the key in PEM format
3. Update .env.local with the valid JWT_PRIVATE_KEY
4. Deploy changes to Convex
5. Verify signup flow works
6. Sign in and navigate to exercise library
7. Capture visual evidence

## VISUAL REQUIREMENTS
1. Screenshot of the library list showing exercises
2. Screenshot of exercise detail modal with video play button
3. Evidence that 51 Notion exercises are visible

## ROUTES AND STATES
- Route: http://localhost:7770/
- State: Signed in user with access to exercise library
- Interaction: Navigate to exercises, click exercise card

## VIEWPORTS OR PLATFORMS
- Browser: http://localhost:7770/
- Dev server: Vite on port 7770

## REFERENCE EVIDENCE
None — this is the first visual verification attempt

## CONSTRAINTS
- Remain within task scope (fix auth only)
- Do NOT modify production
- Do NOT expose secrets in reports (replace JWT_PRIVATE_KEY value with <REDACTED>)
- Do NOT commit/push unless explicitly authorized
- Do NOT modify unrelated files

## VALIDATION
1. Generate PKCS#8 key
2. Update .env.local
3. Deploy: `npx convex dev --once --typecheck=disable`
4. Start dev server: `npm run dev:app`
5. Test signup flow via browser automation or Playwright
6. Sign in
7. Navigate to exercise library
8. Capture screenshots

## IMPLEMENTATION STEPS

### Step 1: Generate Valid PKCS#8 Key
Use OpenSSL to generate a proper EC private key in PKCS#8 PEM format:

```bash
# Generate EC key (secp256k1 or prime256v1)
openssl ecparam -name secp256k1 -genkey -noout -out /tmp/convex-key.pem

# Convert to PKCS#8 PEM format
openssl pkcs8 -topk8 -nocrypt -in /tmp/convex-key.pem -outform PEM -out /tmp/convex-private-pkcs8.pem
```

### Step 2: Update .env.local
Read the generated key and update .env.local:
```bash
# Read key content
KEY=$(cat /tmp/convex-private-pkcs8.pem)

# Update .env.local - replace existing JWT_PRIVATE_KEY line
sed -i 's/^JWT_PRIVATE_KEY=.*/JWT_PRIVATE_KEY='"$(echo "$KEY" | sed 's/$/\\n/' | tr -d '\n')"'/' .env.local
```

IMPORTANT: The key must preserve the PEM format with BEGIN/END lines and newlines.

### Step 3: Deploy Changes
```bash
npx convex dev --once --typecheck=disable
```

### Step 4: Verify Services Running
```bash
# Check Convex
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3210/version

# Check Vite client
curl -s -o /dev/null -w "%{http_code}" http://localhost:7770/
```

### Step 5: Test Signup and Signin Flow
Use browser automation or Playwright:

1. Navigate to http://localhost:7770/
2. Click "START TRAINING" or "SIGN IN"
3. Fill signup form (or use existing test credentials if available)
4. Submit form
5. Verify successful signin (redirect to dashboard or library)
6. Navigate to exercise library

### Step 6: Capture Visual Evidence
Capture screenshots to .hermes/screenshots/library-v2/:
- `library-list.png` — Exercise library list showing 51 exercises
- `exercise-detail-modal.png` — Exercise detail with video play button

## FINAL EVIDENCE REQUIRED
1. JWT_PRIVATE_KEY generated successfully (format confirmed)
2. .env.local updated (do NOT expose the actual key value)
3. Deployment successful (no errors)
4. Signup flow tested and working
5. Signin successful (user authenticated)
6. Exercise library accessed (51 exercises visible)
7. Screenshot paths: .hermes/screenshots/library-v2/library-list.png
8. Screenshot paths: .hermes/screenshots/library-v2/exercise-detail-modal.png
9. HEAD commit hash
10. Working tree status

## REPORT FORMAT
Return your final report with this exact structure:

```
OPENCODE EXECUTION STATUS:
COMPLETE | PARTIAL | BLOCKED

SCOPE:
- Original request: Fix Convex Auth by generating valid PKCS#8 JWT_PRIVATE_KEY
- Acceptance criteria: 1) Valid PKCS#8 key generated, 2) .env.local updated, 3) Signup/signin working, 4) Exercise library accessible, 5) Visual evidence captured
- Authorized scope: Auth fix only
- Excluded items: Production deployment, unrelated file modifications

IMPLEMENTATION:
- Summary: Generated PKCS#8 key, updated .env.local, deployed
- Files changed: .env.local (JWT_PRIVATE_KEY line)
- Unrelated existing changes preserved: Yes

FUNCTIONAL VALIDATION:
- Commands executed: [list all commands]
- Key generation result: [result]
- Deployment result: [result]
- Runtime checks: [http status codes]
- Signup flow tested: Yes/No with details
- Signin flow tested: Yes/No with details
- Routes tested: [list routes]
- Console findings: [any errors or warnings]
- Network findings: [any network issues]

VISUAL EVIDENCE PREPARED:
- Required: Yes | No
- Route or screen: Exercise library
- State reproduced: Signed in user viewing exercises
- Viewports or devices: Browser (desktop)
- Screenshot paths: [full paths]
- Capture timestamps: [timestamps]
- HEAD commit hash: [hash]
- Working-tree status: [status]
- Validation-cycle number: 1

VISUAL REVIEW STATUS:
- EVIDENCE PREPARED — AWAITING HERMES

HERMES VISUAL VERDICT:
- NOT YET REVIEWED

LIMITATIONS:
- Untested routes: [any]
- Untested states: [any]
- Environment restrictions: [any]

BLOCKERS:
- None or exact details
```

## CRITICAL NOTES
- Never expose JWT_PRIVATE_KEY value in reports — replace with <REDACTED>
- Preserve PEM format with proper newlines in .env.local
- Do NOT use `npm run dev` — it has runConvexDev.mjs fallthrough bug that corrupts .env.local
- Use `npm run dev:app` instead
- Do NOT commit or push changes