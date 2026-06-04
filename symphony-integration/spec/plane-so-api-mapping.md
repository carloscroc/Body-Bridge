# Plane.so API Mapping — Symphony Tracker Adapter

> Critical reference for building the Plane.so adapter. Maps every Symphony Tracker behaviour callback to the corresponding Plane.so REST API endpoint, normalizes field differences, and documents gaps with workarounds.

---

## 1. Overview

Symphony's `Tracker` behaviour defines a minimal issue-tracker abstraction originally modelled after Linear's GraphQL API. Adapting it to Plane.so's REST API requires resolving several structural mismatches:

| Dimension | Linear (reference) | Plane.so (target) |
|---|---|---|
| Protocol | GraphQL (single endpoint) | REST (resource-specific endpoints) |
| Auth | `Authorization: Bearer <key>` | `X-API-Key: <key>` |
| Scoping | Single project slug | `workspace_slug` + `project_id` (two-level) |
| Issue entity | "Issue" | "Work Item" |
| Identifier | `identifier` field (e.g. `BODY-42`) | `sequence_id` integer; project prefix + sequence_id forms display ID |
| States | Global strings (`Todo`, `In Progress`, `Done`) | Per-project UUIDs with group categories (`backlog`, `unstarted`, `started`, `completed`, `cancelled`) |
| Priority | Integer 0–4 | Enum strings `none` / `urgent` / `high` / `medium` / `low` |
| Relations | Native `blocked_by` relation | No native blocking relation |
| Pagination | Cursor-based (GraphQL) | Cursor-based (REST): `?per_page=20&cursor=20:1:0` |
| Self-hosted | Cloud only | Self-hosted at `http://10.0.0.112:3300/api/v1/` |

Rate limit: **60 requests/minute** on self-hosted Plane.so.

---

## 2. Endpoint Mapping Table

| # | Symphony Callback | Plane.so REST Endpoint | HTTP Method | Notes |
|---|---|---|---|---|
| 1 | `fetch_candidate_issues()` | `/api/v1/workspaces/{ws}/projects/{pid}/work-items/` | `GET` | Fetch all candidate work items; use `?expand=state,assignees,labels` to inline related entities |
| 2 | `fetch_issues_by_states([state_id])` | `/api/v1/workspaces/{ws}/projects/{pid}/work-items/` | `GET` | Filter with `?state=<uuid>` (repeat for multiple states); requires state UUIDs, not names |
| 3 | `fetch_issue_states_by_ids([state_id])` | `/api/v1/workspaces/{ws}/projects/{pid}/states/` | `GET` | Fetch all states, then filter client-side by UUID; or fetch individual state via `/states/{state_id}/` per ID |
| 4 | `create_comment(issue_id, body)` | `/api/v1/workspaces/{ws}/projects/{pid}/work-items/{wi}/comments/` | `POST` | Body in `comment_html` field; `issue_id` maps to `work_item_id` |
| 5 | `update_issue_state(issue_id, state_id)` | `/api/v1/workspaces/{ws}/projects/{pid}/work-items/{wi}/` | `PATCH` | JSON body `{"state": "<state_uuid>"}`; `issue_id` → `work_item_id`, `state_id` → state UUID |

**Path parameters:**

- `{ws}` = `workspace_slug` (configured at adapter init)
- `{pid}` = `project_id` (UUID, configured at adapter init)
- `{wi}` = `work_item_id` (UUID of the work item)

---

## 3. Field Mapping Table

Symphony Issue struct fields → Plane.so Work Item fields.

| Symphony Field | Plane.so Field | Type Conversion | Notes |
|---|---|---|---|
| `id` | `id` | UUID → String | Direct mapping; Plane returns UUID |
| `identifier` | `{project_identifier}-{sequence_id}` | Computed | Plane has no single `identifier` field. Construct from project prefix + `sequence_id` (e.g. `"BODY-" <> Integer.to_string(sequence_id)` → `"BODY-42"`) |
| `title` | `name` | String | Direct mapping |
| `description` | `description_stripped` | String | Use `description_stripped` (plain text). `description_html` available if rich text needed |
| `priority` | `priority` | See §5 | Linear integers → Plane enum strings |
| `state` | `state` | UUID → String | Requires `?expand=state` to resolve UUID to state object; adapter extracts `state.group` or `state.name` |
| `branch_name` | _none_ | — | Must be computed: `"BODY-42"` or slugified title. Plane has no native branch name field |
| `url` | _computed_ | — | Build from base URL: `http://10.0.0.112:3300/{workspace_slug}/projects/{pid}/issues/{sequence_id}` |
| `assignee_id` | `assignees[0]` | UUID → String | Plane uses array; take first assignee. Empty array → `nil` |
| `blocked_by` | _none_ | — | Plane has no native blocking relation. See §9 workaround |
| `labels` | `labels` | [UUID] → [String] | Requires `?expand=labels` to resolve UUIDs to label names/IDs |
| `assigned_to_worker` | `assignees[0]` | Same as `assignee_id` | Symphony-specific concept; map to primary assignee |
| `created_at` | `created_at` | ISO 8601 String | Direct mapping |
| `updated_at` | `updated_at` | ISO 8601 String | Direct mapping |

**Expansions required:** Always request `?expand=state,assignees,labels` on list/get endpoints to avoid N+1 fetches for state names, assignee details, and label names.

---

## 4. State Group Mapping

Symphony distinguishes "active" vs "terminal" states. Plane.so uses state groups that map naturally:

| Symphony Category | Plane.so State Group | Examples |
|---|---|---|
| Active (in-progress) | `backlog` | Backlog |
| Active (in-progress) | `unstarted` | Todo, Planned |
| Active (in-progress) | `started` | In Progress, In Review, Testing |
| Terminal (done) | `completed` | Done, Closed, Merged |
| Terminal (done) | `cancelled` | Cancelled, Duplicate, Won't Do |

**Adapter logic for `fetch_issues_by_states`:**

1. Symphony caller passes state UUIDs (fetched previously from Plane).
2. Adapter constructs filter: `?state=<uuid1>&state=<uuid2>...`
3. To fetch "all active issues", adapter fetches all states with `group` in `["backlog", "unstarted", "started"]`, collects their UUIDs, then queries with those UUIDs.

**State caching recommendation:** Fetch and cache the full state list at adapter startup. Plane states are per-project and rarely change. Re-fetch on 404 or explicit refresh.

---

## 5. Priority Mapping

Linear uses integer priority 0–4. Plane.so uses string enum values.

| Linear Priority | Linear Label | Plane.so Priority |
|---|---|---|
| 0 | No priority | `none` |
| 1 | Urgent | `urgent` |
| 2 | High | `high` |
| 3 | Medium | `medium` |
| 4 | Low | `low` |

**Adapter conversion (Elixir):**

```elixir
defp linear_to_plane_priority(0), do: "none"
defp linear_to_plane_priority(1), do: "urgent"
defp linear_to_plane_priority(2), do: "high"
defp linear_to_plane_priority(3), do: "medium"
defp linear_to_plane_priority(4), do: "low"

defp plane_to_linear_priority("none"), do: 0
defp plane_to_linear_priority("urgent"), do: 1
defp plane_to_linear_priority("high"), do: 2
defp plane_to_linear_priority("medium"), do: 3
defp plane_to_linear_priority("low"), do: 4
```

---

## 6. Authentication Differences

| Aspect | Linear | Plane.so |
|---|---|---|
| Header | `Authorization: Bearer <api_key>` | `X-API-Key: <api_key>` |
| Key location | Header | Header |
| Key format | `lin_api_...` | Custom; generated in Plane admin → API Tokens |
| Token type | Personal API key | Workspace-level API key |

**Adapter implementation:**

```elixir
defp headers(config) do
  [
    {"X-API-Key", config.api_key},
    {"Content-Type", "application/json"}
  ]
end
```

No Bearer prefix. The key is placed directly as the `X-API-Key` header value.

---

## 7. Pagination Strategy

Plane.so uses cursor-based pagination for list endpoints.

**Request parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `per_page` | integer | 20 | Items per page (max not documented; recommend 50) |
| `cursor` | string | — | Opaque cursor from previous response |

**Response fields:**

| Field | Type | Description |
|---|---|---|
| `results` | array | Current page of items |
| `next_cursor` | string \| null | Cursor for next page; `null` if last page |
| `prev_cursor` | string \| null | Cursor for previous page |
| `total_results` | integer | Total count across all pages |

**Adapter pagination loop:**

```elixir
def fetch_all_work_items(config, acc \\ [], cursor \\ nil) do
  params = [per_page: 50]
  params = if cursor, do: [{:cursor, cursor} | params], else: params

  case get(config, "/work-items/", params) do
    {:ok, %{"results" => results, "next_cursor" => next, "total_results" => total}} ->
      acc = acc ++ results

      if next do
        fetch_all_work_items(config, acc, next)
      else
        {:ok, acc}
      end

    {:error, reason} ->
      {:error, reason}
  end
end
```

**Rate limit consideration:** At 60 req/min and 50 items/page, maximum throughput is ~3,000 work items/minute. For projects exceeding this, implement a request queue with 1-second spacing (60/min ceiling).

---

## 8. Gap Analysis

| # | Gap | Impact | Severity |
|---|---|---|---|
| G1 | No native `blocked_by` relation | `blocked_by` field always returns `[]` | **High** — core Symphony feature for dependency tracking |
| G2 | No `identifier` field (must compute from `sequence_id`) | Adapter must build display ID; no single query-by-identifier field | **Medium** — workaround exists via search endpoint |
| G3 | No `branch_name` field | `branch_name` must be computed convention | **Low** — convention-based naming is acceptable |
| G4 | No direct URL field | Must construct URLs manually | **Low** — deterministic construction |
| G5 | States are UUIDs, not strings | Cannot pass state names to `update_issue_state`; must resolve names to UUIDs | **Medium** — requires state cache |
| G6 | `assignees` is an array, not a single ID | `assignee_id` semantics differ; Plane supports multiple assignees | **Low** — take first assignee |
| G7 | No GraphQL search (REST search only) | `fetch_candidate_issues` search less flexible than Linear's GraphQL | **Medium** — REST search endpoint covers basic use |
| G8 | `description_html` instead of plain `description` | HTML parsing may be needed for rich text; `description_stripped` loses formatting | **Low** — `description_stripped` adequate for agent consumption |
| G9 | No webhook event for `state_changed` (self-hosted limitation) | Real-time state change detection requires polling | **Medium** — poll at interval or check on `fetch_candidate_issues` |
| G10 | `fetch_issues_by_states` requires UUIDs, not names | Callers that pass state names must first resolve to UUIDs | **Medium** — adapter resolves internally |

---

## 9. Workarounds for Gaps

### G1: `blocked_by` — No Native Blocking Relation

**Option A: Custom Property (Recommended)**

Create a custom "Blocked By" property on Plane work items:

1. In Plane admin, add a custom property of type "Relation" pointing to other work items in the same project.
2. The adapter reads this property via `?expand=properties` or the properties endpoint.
3. Map the value to Symphony's `blocked_by` field.

**Limitation:** Plane custom properties may not support multi-relation natively. May need a comma-separated UUID text property.

**Option B: Label Convention**

Use labels prefixed `blocked-by:` (e.g., `blocked-by:BODY-12`). The adapter:
- Scans labels for `blocked-by:` prefix
- Extracts the referenced identifier
- Populates `blocked_by` with the list

```elixir
defp extract_blocked_by(labels) do
  labels
  |> Enum.filter(&String.starts_with?(&1, "blocked-by:"))
  |> Enum.map(&String.replace_prefix(&1, "blocked-by:", ""))
end
```

**Limitation:** Circular dependencies not enforceable. Labels are strings, not typed relations.

**Option C: Skip (Minimal Viable Adapter)**

Return `[]` for `blocked_by` always. Document as unsupported. Acceptable for initial integration where dependency tracking is not critical.

**Recommendation:** Start with Option C for MVP. Migrate to Option A once custom property support is validated on the self-hosted instance.

### G2: Identifier Construction

```elixir
defp build_identifier(work_item, project_identifier) do
  "#{project_identifier}-#{work_item["sequence_id"]}"
end
```

To look up by identifier (e.g., `BODY-42`), parse the sequence_id and use:

```
GET /api/v1/workspaces/{ws}/projects/{pid}/work-items/?sequence_id=42
```

Or use the search endpoint:

```
GET /api/v1/workspaces/{ws}/projects/{pid}/work-items/search/?query=BODY-42
```

### G3 & G4: Branch Name and URL Construction

```elixir
defp build_branch_name(identifier) do
  String.downcase(identifier)
end

defp build_url(config, sequence_id) do
  "#{config.base_url}/#{config.workspace_slug}/projects/#{config.project_id}/issues/#{sequence_id}"
end
```

### G5: State Name → UUID Resolution

Maintain a cached map of state name → UUID:

```elixir
defp resolve_state_uuid(config, state_name, state_cache) do
  case Map.get(state_cache, state_name) do
    nil -> {:error, {:state_not_found, state_name}}
    uuid -> {:ok, uuid}
  end
end

defp load_state_cache(config) do
  case get(config, "/states/") do
    {:ok, %{"results" => states}} ->
      state_map = Map.new(states, fn s -> {s["name"], s["id"]} end)
      group_map = Map.new(states, fn s -> {s["id"], s["group"]} end)
      {:ok, %{by_name: state_map, by_id: group_map}}
    {:error, reason} ->
      {:error, reason}
  end
end
```

### G6: Single Assignee from Array

```elixir
defp primary_assignee(%{"assignees" => [first | _]}), do: first
defp primary_assignee(%{"assignees" => []}), do: nil
defp primary_assignee(_), do: nil
```

### G9: Polling for State Changes

```elixir
# Poll every 30 seconds for changed work items
defp poll_state_changes(config, last_poll_timestamp) do
  params = [expand: "state", per_page: 50]

  case get(config, "/work-items/", params) do
    {:ok, %{"results" => items}} ->
      changed = Enum.filter(items, fn item ->
        item["updated_at"] > last_poll_timestamp
      end)
      {:ok, changed}
    {:error, reason} ->
      {:error, reason}
  end
end
```

### G10: Accept State Names or UUIDs in `fetch_issues_by_states`

```elixir
def fetch_issues_by_states(config, state_refs) do
  state_cache = config.state_cache

  uuids =
    state_refs
    |> Enum.map(fn ref ->
      if uuid?(ref), do: ref, else: Map.get(state_cache.by_name, ref, ref)
    end)
    |> Enum.filter(&uuid?/1)

  query_params = Enum.map(uuids, fn uuid -> {:state, uuid} end)
  get(config, "/work-items/", [expand: "state,assignees,labels"] ++ query_params)
end
```

---

## 10. Self-Hosted Specifics

| Configuration | Value |
|---|---|
| Base URL | `http://10.0.0.112:3300/api/v1/` |
| Protocol | HTTP (no TLS on internal network) |
| Auth header | `X-API-Key: <key>` |
| Rate limit | 60 requests/minute |
| Workspace slug | Configured at adapter init (e.g., `"body-bridge"`) |
| Project ID | Configured at adapter init (UUID from Plane) |
| Project identifier | Configured at adapter init (e.g., `"BODY"` — used for `identifier` construction) |

**Adapter configuration struct:**

```elixir
%{
  base_url: "http://10.0.0.112:3300/api/v1/",
  api_key: System.get_env("PLANE_API_KEY"),
  workspace_slug: "body-bridge",
  project_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  project_identifier: "BODY",
  state_cache: %{by_name: %{}, by_id: %{}}
}
```

**URL construction examples:**

| Resource | Full URL |
|---|---|
| List work items | `http://10.0.0.112:3300/api/v1/workspaces/body-bridge/projects/{pid}/work-items/` |
| Get state list | `http://10.0.0.112:3300/api/v1/workspaces/body-bridge/projects/{pid}/states/` |
| Create comment | `http://10.0.0.112:3300/api/v1/workspaces/body-bridge/projects/{pid}/work-items/{wi}/comments/` |
| Update work item | `http://10.0.0.112:3300/api/v1/workspaces/body-bridge/projects/{pid}/work-items/{wi}/` |

**Self-hosted considerations:**

- No TLS — ensure the adapter runs within the same trusted network.
- API key is managed in Plane's admin panel at `http://10.0.0.112:3300/api-tokens/`.
- Version pinning — self-hosted Plane version should be documented. API shape may differ between Plane versions. Current mapping targets Plane.so v0.25+ (work-items API).
- If the Plane instance is restarted, the adapter should handle connection errors gracefully with retry logic.

---

## 11. Example API Calls for Each Tracker Callback

### 11.1 `fetch_candidate_issues()`

Fetch all work items that could be assigned to workers. Uses expand to inline state, assignees, and labels.

```http
GET http://10.0.0.112:3300/api/v1/workspaces/body-bridge/projects/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/work-items/?expand=state,assignees,labels&per_page=50
X-API-Key: plane_api_xxxxxxxxxxxxxxxx
```

**Response (abbreviated):**

```json
{
  "results": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "Implement login flow",
      "description_stripped": "Add OAuth2 login with Google provider",
      "description_html": "<p>Add OAuth2 login with Google provider</p>",
      "priority": "high",
      "sequence_id": 42,
      "state": {
        "id": "11111111-2222-3333-4444-555555555555",
        "name": "In Progress",
        "group": "started",
        "color": "#F59E0B"
      },
      "assignees": [
        {
          "id": "99999999-8888-7777-6666-555555555555",
          "display_name": "Alice"
        }
      ],
      "labels": [
        {
          "id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          "name": "backend"
        }
      ],
      "project": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "workspace": "body-bridge",
      "parent": null,
      "start_date": null,
      "target_date": "2026-06-15",
      "completed_at": null,
      "is_draft": false,
      "created_at": "2026-05-20T10:30:00Z",
      "updated_at": "2026-06-01T14:22:00Z"
    }
  ],
  "next_cursor": "50:1:0",
  "prev_cursor": null,
  "total_results": 127
}
```

**Normalization to Symphony Issue:**

```elixir
%{
  id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  identifier: "BODY-42",
  title: "Implement login flow",
  description: "Add OAuth2 login with Google provider",
  priority: 2,                        # "high" → 2 (Linear scale)
  state: "In Progress",               # state.name
  branch_name: "body-42",             # computed
  url: "http://10.0.0.112:3300/body-bridge/projects/aaa.../issues/42",
  assignee_id: "99999999-8888-7777-6666-555555555555",
  blocked_by: [],                     # unsupported (G1)
  labels: ["backend"],
  assigned_to_worker: "99999999-8888-7777-6666-555555555555",
  created_at: "2026-05-20T10:30:00Z",
  updated_at: "2026-06-01T14:22:00Z"
}
```

---

### 11.2 `fetch_issues_by_states(["In Progress", "In Review"])`

Resolve state names to UUIDs using cache, then query with state filters.

**Step 1 — Resolve names to UUIDs:**

```elixir
state_cache = %{
  "In Progress" => "11111111-2222-3333-4444-555555555555",
  "In Review"   => "22222222-3333-4444-5555-666666666666",
  "Todo"        => "33333333-4444-5555-6666-777777777777"
}
```

**Step 2 — API call:**

```http
GET http://10.0.0.112:3300/api/v1/workspaces/body-bridge/projects/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/work-items/?expand=state,assignees,labels&state=11111111-2222-3333-4444-555555555555&state=22222222-3333-4444-5555-666666666666&per_page=50
X-API-Key: plane_api_xxxxxxxxxxxxxxxx
```

> **Note:** If Plane does not support repeated `state` params for OR filtering, fall back to one request per state and merge results client-side.

**Alternative — Fetch all, filter client-side:**

```http
GET http://10.0.0.112:3300/api/v1/workspaces/body-bridge/projects/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/work-items/?expand=state,assignees,labels&per_page=50
X-API-Key: plane_api_xxxxxxxxxxxxxxxx
```

Then filter:

```elixir
active_groups = ~w(backlog unstarted started)
filtered = Enum.filter(results, fn item ->
  item["state"]["group"] in active_groups
end)
```

---

### 11.3 `fetch_issue_states_by_ids(["11111111-2222-3333-4444-555555555555"])`

**Option A — Fetch individual states:**

```http
GET http://10.0.0.112:3300/api/v1/workspaces/body-bridge/projects/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/states/11111111-2222-3333-4444-555555555555/
X-API-Key: plane_api_xxxxxxxxxxxxxxxx
```

**Response:**

```json
{
  "id": "11111111-2222-3333-4444-555555555555",
  "name": "In Progress",
  "description": "Work has started",
  "color": "#F59E0B",
  "group": "started",
  "sequence": 2,
  "default": false,
  "project": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "workspace": "body-bridge"
}
```

**Option B — Fetch all states, filter by IDs:**

```http
GET http://10.0.0.112:3300/api/v1/workspaces/body-bridge/projects/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/states/?per_page=50
X-API-Key: plane_api_xxxxxxxxxxxxxxxx
```

```elixir
{:ok, %{"results" => all_states}} = response
target_ids = MapSet.new(requested_ids)
filtered = Enum.filter(all_states, fn s -> s["id"] in target_ids end)
```

---

### 11.4 `create_comment("f47ac10b-58cc-4372-a567-0e02b2c3d479", "Starting work on this issue.")`

```http
POST http://10.0.0.112:3300/api/v1/workspaces/body-bridge/projects/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/work-items/f47ac10b-58cc-4372-a567-0e02b2c3d479/comments/
X-API-Key: plane_api_xxxxxxxxxxxxxxxx
Content-Type: application/json

{
  "comment_html": "<p>Starting work on this issue.</p>",
  "access": "INTERNAL"
}
```

**Response:**

```json
{
  "id": "cccccccc-dddd-eeee-ffff-000000000000",
  "comment_html": "<p>Starting work on this issue.</p>",
  "comment_stripped": "Starting work on this issue.",
  "access": "INTERNAL",
  "created_at": "2026-06-02T09:15:00Z",
  "updated_at": "2026-06-02T09:15:00Z",
  "created_by": "plane_api_xxxxxxxxxxxxxxxx",
  "issue": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "actor": "plane_api_xxxxxxxxxxxxxxxx"
}
```

> **Note:** Plane requires `comment_html` (HTML format). Wrap plain text in `<p>...</p>`. The `access` field defaults to `INTERNAL` but should be set explicitly.

---

### 11.5 `update_issue_state("f47ac10b-58cc-4372-a567-0e02b2c3d479", "33333333-4444-5555-6666-777777777777")`

Move work item from "In Progress" to "Done".

```http
PATCH http://10.0.0.112:3300/api/v1/workspaces/body-bridge/projects/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/work-items/f47ac10b-58cc-4372-a567-0e02b2c3d479/
X-API-Key: plane_api_xxxxxxxxxxxxxxxx
Content-Type: application/json

{
  "state": "33333333-4444-5555-6666-777777777777"
}
```

**Response:**

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Implement login flow",
  "state": "33333333-4444-5555-6666-777777777777",
  "priority": "high",
  "sequence_id": 42,
  "completed_at": "2026-06-02T09:20:00Z",
  "updated_at": "2026-06-02T09:20:00Z"
}
```

> **Note:** When the target state has `group: "completed"`, Plane auto-sets `completed_at`. When moving out of a completed state, Plane clears `completed_at`.

> **Important:** The `state_id` parameter in the Symphony callback must be a Plane UUID, not a state name. The adapter must resolve names to UUIDs using the state cache before making this call.

---

## Appendix A: Full Adapter Callback Implementations (Pseudocode)

### `fetch_candidate_issues/0`

```
1. GET /work-items/?expand=state,assignees,labels&per_page=50
2. Paginate through all pages (follow next_cursor)
3. For each work item, normalize to Symphony Issue struct:
   - identifier = "{project_identifier}-{sequence_id}"
   - branch_name = downcase(identifier)
   - url = "{base_url}/{workspace}/projects/{pid}/issues/{sequence_id}"
   - assignee_id = assignees[0].id or nil
   - blocked_by = [] (G1 workaround)
   - labels = map label.name
   - priority = plane_to_linear_priority(priority)
   - state = expanded_state.name
4. Return {:ok, [issue]}
```

### `fetch_issues_by_states/1`

```
1. Resolve each state_ref (name or UUID) to UUID via state_cache
2. For each UUID, GET /work-items/?state={uuid}&expand=state,assignees,labels&per_page=50
3. Paginate each request
4. Merge and deduplicate results by id
5. Normalize each work item to Symphony Issue struct
6. Return {:ok, [issue]}
```

### `fetch_issue_states_by_ids/1`

```
1. For each state_id in the list:
   a. If cached, return from cache
   b. If not cached, GET /states/{state_id}/
2. Normalize each state to a map with id, name, group
3. Return {:ok, [state_map]}
```

### `create_comment/2`

```
1. Wrap body text in <p> tags: comment_html = "<p>#{body}</p>"
2. POST /work-items/{issue_id}/comments/
   Body: {"comment_html": comment_html, "access": "INTERNAL"}
3. If 2xx response, return :ok
4. If error, return {:error, reason}
```

### `update_issue_state/2`

```
1. Validate issue_id is a valid UUID
2. Validate state_id is a valid UUID (resolve from name if needed)
3. PATCH /work-items/{issue_id}/
   Body: {"state": state_id}
4. If 2xx response, return :ok
5. If error, return {:error, reason}
```

---

## Appendix B: Error Handling Reference

| HTTP Status | Meaning | Adapter Action |
|---|---|---|
| 200 | Success | Parse response body |
| 201 | Created | Parse response body (for POST) |
| 204 | No Content | Return `:ok` (for DELETE) |
| 400 | Bad Request | Log body; return `{:error, {:bad_request, body}}` |
| 401 | Unauthorized | Check API key; return `{:error, :unauthorized}` |
| 403 | Forbidden | Check workspace/project access; return `{:error, :forbidden}` |
| 404 | Not Found | Work item/state/project missing; return `{:error, :not_found}` |
| 429 | Rate Limited | Read `Retry-After` header; sleep and retry |
| 500 | Server Error | Retry with exponential backoff (max 3 attempts) |
| 502/503 | Unavailable | Self-hosted may restart; retry after 5s |

**Retry strategy:**

```elixir
defp retry_request(fun, attempts \\ 0, max_attempts \\ 3)

defp retry_request(fun, attempts, max) when attempts >= max do
  {:error, :max_retries_exceeded}
end

defp retry_request(fun, attempts, max) do
  case fun.() do
    {:ok, _} = result -> result
    {:error, %{status: status}} when status in [429, 500, 502, 503] ->
      backoff = :math.pow(2, attempts) * 1000  # 1s, 2s, 4s
      Process.sleep(trunc(backoff))
      retry_request(fun, attempts + 1, max)
    {:error, _} = error -> error
  end
end
```

---

## Appendix C: Quick Reference Card

```
Base URL:    http://10.0.0.112:3300/api/v1/
Auth:        X-API-Key header
Rate limit:  60 req/min

Endpoints:
  List issues    GET    /workspaces/{ws}/projects/{pid}/work-items/
  Get issue      GET    /workspaces/{ws}/projects/{pid}/work-items/{wi}/
  Update issue   PATCH  /workspaces/{ws}/projects/{pid}/work-items/{wi}/
  Search issues  GET    /workspaces/{ws}/projects/{pid}/work-items/search/
  List states    GET    /workspaces/{ws}/projects/{pid}/states/
  Get state      GET    /workspaces/{ws}/projects/{pid}/states/{sid}/
  List comments  GET    /workspaces/{ws}/projects/{pid}/work-items/{wi}/comments/
  Create comment POST   /workspaces/{ws}/projects/{pid}/work-items/{wi}/comments/

Always expand:  ?expand=state,assignees,labels
Pagination:     ?per_page=50&cursor={next_cursor}

State groups:   backlog → unstarted → started → completed / cancelled
Priority:       none(0) → urgent(1) → high(2) → medium(3) → low(4)

Known gaps:
  G1  No blocked_by  → custom property or labels
  G2  No identifier  → compute from sequence_id
  G5  States = UUIDs → cache name↔UUID at startup
```
