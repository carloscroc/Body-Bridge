---
description: Collect evidence for a Plane.so ticket (tests, health, code quality, screenshots)
---

Collect and post evidence for a Plane.so ticket without changing git state.

**Ticket identifier from arguments:**
$ARGUMENTS

**Instructions:**

1. Parse the arguments to determine:
   - Ticket identifier (required, e.g. BODYBRIDGE-7) — this is `$1`
   - `--skip-tests` (optional): Skip Playwright tests
   - `--skip-screenshots` (optional): Skip screenshot collection
   - `--skip-security` (optional): Skip security scan

2. If no ticket identifier is provided, ask the user which ticket to collect evidence for.

3. Run the evidence collection:
   ```
   node scripts/start-symphony-work.cjs --ticket <IDENTIFIER> --evidence-only --skip-tests --skip-screenshots
   ```

   Remove `--skip-tests` if the dev server is running and you want to include Playwright results.
   Remove `--skip-screenshots` if you want browser screenshots captured.

4. After completion, report:
   - Evidence summary (pass/fail/skip counts per category)
   - Whether an evidence report was posted to the ticket
   - Report file location (`.symphony/evidence/<IDENTIFIER>/evidence-report.html`)
   - Whether ticket moved to Review state (only if all evidence passes)

**Evidence types collected:**
- Automated Tests (Playwright) — requires dev server running
- Health Check (GET /api/health on port 3001)
- Code Quality (npx knip dead code scan)
- Security Scan (dependency audit)
- Screenshots (browser capture)

**Critical rules:**
- This is read-only — no git changes, no branch creation.
- If all evidence passes, ticket moves to Review state.
- If any evidence fails, ticket stays in current state.
