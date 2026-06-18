# Body Bridge Ticket Manager Agent

**Agent Name:** Body Bridge Ticket Manager
**Project ID:** 13cebf-f9ff-41bd-b5bb-b88774ef6440
**Workspace:** Body Bridge (Body Bridge)

## Purpose

Specialized agent for creating detailed


---
name: create-plane-ticket
description: Create detailed Plane.so tickets with element context, images, and evidence references. Triggers on "create ticket", "new ticket", "plane ticket", "create issue", "log bug", "feature request", or "add to plane". Includes file references, git context, and image attachments.
---

# Create Plane Ticket

Create detailed, evidence-backed Plane.so work items for the Body Bridge project.

## When to Use

- User asks to create a ticket, issue, or bug report in Plane
- User wants to log a feature request or investigation
- User says "add to plane", "create ticket", "new issue", "log bug"

## Workflow

### 1. Gather Context

Before creating the ticket, collect:

- **Element context**: What part of the codebase? Which files, components, or modules?
- **Type**: feature, bug, enhancement, or investigation
- **Priority**: none, low, medium, high, urgent (string, NOT integer)
- **Images**: Screenshots or evidence images to attach (optional)
- **References**: Files, line numbers, git context (auto-collected)

### 2. Create the Ticket

Run the ticket creation script:

```bash
# Dry run first (preview without creating)
node scripts/create-plane-ticket.cjs --name "Ticket Title" --type feature --priority medium --dry

# Create for real
node scripts/create-plane-ticket.cjs --name "Ticket Title" --type feature --priority medium

# With description
node scripts/create-plane-ticket.cjs --name "Ticket Title" --type bug --priority high --description "Detailed description of the issue"

# With file references
node scripts/create-plane-ticket.cjs --name "Ticket Title" --type feature --priority medium --files src/components/App.tsx,src/hooks/useAuth.ts

# With image attachments
node scripts/create-plane-ticket.cjs --name "Ticket Title" --type bug --priority high --images screenshots/bug-evidence.png

# Full example with all options
node scripts/create-plane-ticket.cjs \
  --name "Add exercise filtering by muscle group" \
  --type feature \
  --priority medium \
  --description "Users should be able to filter exercises by target muscle group" \
  --files src/components/ExerciseList.tsx,convex/exercises.ts \
  --images screenshots/current-exercise-view.png
```

### 3. Verify

After creation, the script outputs the ticket identifier (e.g., `BODYBRIDGE-8`). Verify it in Plane:
- Check the returned identifier and URL
- Confirm priority and type match expectations

## Options Reference

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--name` | Yes | - | Ticket title |
| `--type` | No | `feature` | One of: feature, bug, enhancement, investigation |
| `--priority` | No | `medium` | One of: none, low, medium, high, urgent (STRING not integer) |
| `--description` | No | Template default | Detailed description |
| `--files` | No | Auto-detected | Comma-separated file paths to reference |
| `--images` | No | None | Comma-separated image paths to attach |
| `--dry` | No | false | Preview without creating |
| `--json` | No | false | Output as JSON |

## Templates

Four templates exist in `scripts/plane-templates/`:
- **feature**: New functionality with acceptance criteria
- **bug**: Reproduction steps, expected vs actual behavior
- **enhancement**: Improvement to existing feature
- **investigation**: Research/spike with findings structure

## Key Rules

1. **Priority is always a string** — `"medium"` not `2`. Plane API rejects integers with 400.
2. **Always dry-run first** when uncertain about the ticket content.
3. **Include file references** — they auto-collect git blame and line counts.
4. **Attach images** when there's visual evidence (bugs, UI features).
5. **Project ID**: `13cecebf-f9ff-41bd-b5bb-b88774ef6440`, Identifier: `BODYBRIDGE`

## Environment

Requires `.env.symphony` with:
- `PLANE_API_KEY`
- `PLANE_WORKSPACE_SLUG`
- `PLANE_PROJECT_ID`
