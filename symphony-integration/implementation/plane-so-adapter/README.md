# Plane.so Adapter for Symphony

Drop-in replacement for the Linear tracker in the Symphony worker orchestration system. Implements the `TrackerAdapter` interface so Symphony can manage issues in a self-hosted Plane.so instance.

## Setup

1. Copy `env.example` to `.env` and fill in values:

```bash
cp env.example .env
```

2. Required variables:

| Variable | Description |
|---|---|
| `PLANE_API_KEY` | API key from Plane (Settings → API) |
| `PLANE_BASE_URL` | Base API URL (default: `http://10.0.0.112:3300/api/v1/`) |
| `PLANE_WORKSPACE_SLUG` | Workspace slug from Plane URL |
| `PLANE_PROJECT_ID` | Project identifier used by the self-hosted API |

3. Optional variables:

| Variable | Default | Description |
|---|---|---|
| `PLANE_ACTIVE_STATE_GROUPS` | `unstarted,started` | Comma-separated state groups for candidate issues |
| `PLANE_TERMINAL_STATE_GROUPS` | `completed,cancelled` | State groups marking done work |

## Usage

```typescript
import { PlaneAdapter, planeConfigFromEnv } from "./plane-so-adapter/index.js";

const adapter = new PlaneAdapter(planeConfigFromEnv());

// Get issues eligible for workers to pick up
const candidates = await adapter.fetch_candidate_issues();

// Get issues in specific states
const inProgress = await adapter.fetch_issues_by_states(["In Progress", "In Review"]);

// Check current state of known issues
const states = await adapter.fetch_issue_states_by_ids(["uuid-1", "uuid-2"]);

// Post a comment (e.g., worker status update)
await adapter.create_comment("issue-uuid", "<p>Worker started processing</p>");

// Transition an issue to a new state
await adapter.update_issue_state("issue-uuid", "In Progress");
```

## How It Replaces Linear

The `TrackerAdapter` interface is the same contract Symphony uses with Linear. Swap the import and constructor — no other code changes needed. The adapter normalizes Plane work items into `SymphonyIssue` structs with:

- **Identifier**: `{project_prefix}-{sequence_id}` (e.g., `BODY-42`)
- **Priority**: mapped from Plane strings (`none`→0, `low`→1, `medium`→2, `high`→3, `urgent`→4)
- **Branch name**: `issue-{sequence_id}-{slug}` derived from title
- **State**: resolved from Plane UUID to human-readable name via cached state list

## Rate Limits

The client enforces Plane's 60 req/min limit automatically. 429 and 5xx responses are retried with exponential backoff.
