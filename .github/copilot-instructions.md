# Body Bridge - GitHub Copilot Instructions

## Project Overview
Body Bridge is a React 19 + Vite frontend, Express API, and Convex backend fitness app. Use TypeScript, React, and modern web patterns.

## Available Commands

This project has custom commands for Plane.so ticket management. When I ask you to "create a ticket", "start symphony", or "collect evidence", follow these command definitions:

### /create-ticket
Create a Plane.so ticket for tracking work.

**Usage:**
- Required: `--name "Ticket Title"` 
- Optional: `--type feature|bug|enhancement|investigation` (default: feature)
- Optional: `--priority none|low|medium|high|urgent` (default: medium) — MUST be string
- Optional: `--description "Detailed description"`
- Optional: `--files path/to/file.ts,path/to/other.ts`
- Optional: `--images screenshot.png,evidence.jpg`
- Optional: `--dry` to preview without creating

**Always do a dry run first:**
```bash
node scripts/create-plane-ticket.cjs --name "Ticket Title" --type feature --priority medium --dry
```

**Critical: Priority MUST be a string** like "medium", never an integer. The Plane API rejects integers with 400 error.

### /start-symphony
Start the Symphony workflow for a Plane.so ticket — creates branch, moves ticket to "In Progress", collects evidence.

**Usage:**
- Required: `--ticket BODYBRIDGE-7` (ticket identifier)
- Optional: `--branch custom-branch-name` (default: symphony/<ticket-slug>)
- Optional: `--evidence-only` — only collect evidence, no git changes
- Optional: `--skip-tests` — skip Playwright tests (use if dev server not running)
- Optional: `--skip-screenshots` — skip screenshot collection

**For evidence-only mode (safe, no git changes):**
```bash
node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-7 --evidence-only --skip-tests --skip-screenshots
```

**For full workflow:**
```bash
node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-7
```

### /collect-evidence
Collect evidence for a ticket without changing git state (read-only).

**Usage:**
- Required: `--ticket BODYBRIDGE-7` (ticket identifier)
- Optional: `--skip-tests` — skip Playwright tests
- Optional: `--skip-screenshots` — skip screenshot collection
- Optional: `--skip-security` — skip security scan

**Evidence types:**
- Automated Tests (Playwright) — requires dev server running at port 7770
- Health Check (GET /api/health on port 3001)
- Code Quality (npx knip dead code scan)
- Security Scan (dependency audit)
- Screenshots (browser capture)

## Plane.so Integration

- **Project ID:** `13cecebf-f9ff-41bd-b5bb-b88774ef6440`
- **Project Identifier:** `BODYBRIDGE`
- **Workspace:** `body-bridge`
- **API:** `http://10.0.0.112:3300/api/v1/`

**State Flow:** Backlog → Todo → In Progress → Review → Done / Cancelled

**Priority Options:** `"none"`, `"low"`, `"medium"`, `"high"`, `"urgent"` (STRING not integer)

## Development Commands

- `npm run dev` — Start full stack (Convex + Express + Vite)
- `npx playwright test` — Run Playwright tests (requires dev server running)
- `npx knip` — Run dead code scan

## Important Notes

- Use `--skip-tests` flag when evidence collection if the dev server isn't running
- Priority MUST always be a string, never an integer
- Always dry-run tickets before creating them
- Evidence report is posted as a comment on the Plane ticket
- Evidence failures keep the ticket in current state — fix issues and re-run