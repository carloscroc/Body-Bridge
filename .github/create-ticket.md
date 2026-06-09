---
description: Create a Plane.so ticket (feature, bug, enhancement, or investigation)
---

Create a Plane.so ticket for the Body Bridge project.

**Ticket details from arguments:**
$ARGUMENTS

**Instructions:**

1. Parse the arguments to determine:
   - `--name` (required): Ticket title
   - `--type` (optional, default: feature): One of feature, bug, enhancement, investigation
   - `--priority` (optional, default: medium): One of none, low, medium, high, urgent (MUST be string, NOT integer)
   - `--description` (optional): Detailed description
   - `--files` (optional): Comma-separated file paths to reference
   - `--images` (optional): Comma-separated image paths to attach

2. If no `--name` is provided, ask the user for the ticket title before proceeding.

3. Always do a dry run first:
   ```
   node scripts/create-plane-ticket.cjs --name "<title>" --type <type> --priority <priority> --dry
   ```

4. After confirming the dry run looks correct, create the ticket:
   ```
   node scripts/create-plane-ticket.cjs --name "<title>" --type <type> --priority <priority>
   ```

5. Report back the ticket identifier (e.g. BODYBRIDGE-8) and confirm creation.

**Critical rules:**
- Priority MUST be a string like "medium", never an integer. The Plane API rejects integers with 400 error.
- Always dry-run first before creating.
- Include file references when relevant — they auto-collect git blame and line counts.
- Attach images when there's visual evidence (bugs, UI features).
