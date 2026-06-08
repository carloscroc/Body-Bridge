---
description: Start Symphony workflow on a Plane.so ticket — branch, state, evidence
---

Start the Symphony workflow for a Plane.so ticket.

**Ticket identifier from arguments:**
$ARGUMENTS

**Instructions:**

1. Parse the arguments to determine:
   - Ticket identifier (required, e.g. BODYBRIDGE-7) — this is `$1`
   - `--branch` (optional): Custom branch name (default: symphony/<ticket-slug>)
   - `--skip-tests` (optional): Skip Playwright tests (use if dev server isn't running)
   - `--skip-screenshots` (optional): Skip screenshot collection
   - `--evidence-only` (optional): Only collect evidence, no branch/state changes

2. If no ticket identifier is provided, ask the user which ticket to work on.

3. **For evidence-only mode** (safe, no git changes):
   ```
   node scripts/start-symphony-work.cjs --ticket <IDENTIFIER> --evidence-only --skip-tests --skip-screenshots
   ```

4. **For full workflow** (creates branch, moves to In Progress, collects evidence):
   ```
   node scripts/start-symphony-work.cjs --ticket <IDENTIFIER>
   ```

5. After completion, report:
   - Branch created (if applicable)
   - Ticket state transition
   - Evidence summary (pass/fail/skip counts)
   - Whether ticket moved to Review state

**State flow:** Backlog → Todo → In Progress → Review → Done / Cancelled

**Critical rules:**
- Run evidence-only first if you want to verify without making git changes.
- Use `--skip-tests` if the dev server isn't running (Playwright needs app at port 7770).
- If evidence has failures, the ticket stays in its current state — fix issues and re-run.
