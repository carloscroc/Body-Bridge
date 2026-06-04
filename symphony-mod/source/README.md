# @servrox/symphony

[![npm version](https://img.shields.io/npm/v/@servrox/symphony.svg)](https://www.npmjs.com/package/@servrox/symphony)
[![Node.js >=24.11.1](https://img.shields.io/badge/node-%3E%3D24.11.1-339933)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Run a local Symphony daemon that turns Linear work queues into local Codex app-server sessions or
Codex cloud handoffs, with a bundled operations dashboard for live status, history, settings, token
usage, and retries.

```bash
pnpm dlx @servrox/symphony ./WORKFLOW.md
```

By default the CLI starts the daemon and serves the dashboard at `http://127.0.0.1:3210`.

> This is a Servrox implementation of the OpenAI Symphony service pattern. It is not an official
> OpenAI package.

## Dashboard

![Symphony dashboard overview](./docs/screenshots/dashboard-overview.png)

The dashboard is bundled into the npm package, so every install gets the same operator UI:

| View     | What it gives you                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Overview | Running/retrying/completed/delegated counts, live agent updates, Codex rate limits, token totals, and service configuration.   |
| History  | Searchable SQLite-backed timeline of service runs, metric samples, runtime events, intermediate updates, workers, and retries. |
| Settings | Theme controls, runtime model override, SQLite history toggle, snapshot retention, storage stats, and cleanup actions.         |

![Symphony history](./docs/screenshots/dashboard-history.png)

![Symphony settings](./docs/screenshots/dashboard-settings.png)

## Why Developers Use It

- Run multiple Codex workers from a Linear queue without wiring your own scheduler.
- Switch future dispatches between local Codex execution and Codex cloud from the workflow or
  dashboard.
- Keep each ticket in its own workspace with controlled retry/backoff behavior.
- Watch live agent progress instead of tailing logs or guessing whether a run is stuck.
- Track service-session and project-wide token totals, plus Codex account rate-limit updates.
- Persist local observability history in SQLite without adding a database service.
- Override agent mode and Codex model for new sessions from the dashboard when runtime overrides are
  enabled.
- Package the daemon and dashboard together behind one `symphony` command.

## Features

### Orchestration

- Linear tracker integration for candidate issue discovery.
- Configurable active and terminal state names.
- Per-issue workspace creation with sanitized paths.
- Max concurrent agents globally and by state.
- Exponential retry backoff for failed workers.
- Hook points for workspace lifecycle commands.

### Agent Runtime

- Launches `codex app-server` sessions per eligible issue.
- Can delegate eligible Linear issues to Codex cloud instead of running a local app-server by using
  `agent.mode: codex_cloud`. This uses the official Codex for Linear comment workflow, not the
  assignment-based delegation path.
- Captures session id, thread id, turns, intermediate updates, command output, file changes, and
  agent messages.
- Tracks input, output, and total token usage per running session and for the whole daemon lifetime.
- Records Codex account rate-limit notifications when the app-server emits them.
- Fast-merges `Merging` Linear issues when GitHub can verify the same-repo PR is open, mergeable,
  reviewed, and green for the Linear branch, then moves the issue to `Done`. The default
  `github.provider: auto` uses GitHub API calls when a token is available and falls back to GitHub
  CLI locally otherwise.
- Supports a base `codex.model` in `WORKFLOW.md` plus an optional dashboard-backed runtime override.
- Supports a base `agent.mode` in `WORKFLOW.md` plus an optional dashboard-backed runtime override
  for future dispatches.

### Observability

- Writes a validated JSON snapshot to `.symphony/state/snapshot.json` by default.
- Streams live dashboard changes with Server-Sent Events and falls back to polling.
- Enables SQLite history by default at `.symphony/state/history.sqlite`.
- Persists service runs, metric samples, runtime events, intermediate updates, and settings audit
  rows.
- Falls back to JSON-only mode when SQLite history is disabled.
- Renders Linear issue links and GitHub pull request URLs when they appear in snapshot or history
  text.

### Distribution

- Ships a `symphony` CLI binary.
- Bundles the standalone Next.js dashboard runtime into the npm package.
- Exports typed TypeScript primitives for configuration, workflows, orchestration, tracker clients,
  and runner integrations.
- Audits the npm tarball so private files such as `.env*`, `.npmrc`, `.symphony/**`, `WORKFLOW.md`,
  source/test files, build caches, logs, and common secret patterns are not published accidentally.

## Install

Use it without adding a dependency:

```bash
pnpm dlx @servrox/symphony ./WORKFLOW.md
```

Or install it into a repository:

```bash
pnpm add -D @servrox/symphony
pnpm exec symphony ./WORKFLOW.md
```

The same CLI also works through npm:

```bash
npx @servrox/symphony ./WORKFLOW.md
```

## Quickstart

Create `WORKFLOW.md` in the repository you want Symphony to operate:

```yaml
---
tracker:
  kind: linear
  api_key: $LINEAR_API_KEY
  project_slug: your-linear-project-slug
  active_states: "Todo, In Progress"
  terminal_states: "Done, Cancelled"
polling:
  interval_ms: 15000
agent:
  mode: local
  max_concurrent_agents: 2
codex:
  command: codex app-server --json
  model: gpt-5.5
codex_cloud:
  trigger: linear_comment
  mention: "@Codex"
  repository: owner/repo
github:
  provider: auto
  repository: owner/repo
  token:
    env: GITHUB_TOKEN
  preflight:
    enabled: true
    codex_cloud_failure: warn
  landing:
    mode: merge
    merge_method: merge
    delete_branch: true
observability:
  snapshot_max_events: 160
  history:
    enabled: true
    database_path: .symphony/state/history.sqlite
settings:
  runtime_overrides:
    enabled: true
---
Work on {{ issue.identifier }}: {{ issue.title }}.

Use the repository workflow contract, keep changes scoped, and open a PR when complete.
```

Then run:

```bash
export LINEAR_API_KEY=lin_...
export GITHUB_TOKEN=github_pat_... # optional; enables token-backed GitHub lifecycle handling
pnpm dlx @servrox/symphony ./WORKFLOW.md
```

Open `http://127.0.0.1:3210` to watch workers, updates, history, and settings.

## CLI

```bash
symphony ./WORKFLOW.md
symphony ./WORKFLOW.md --port 3210
symphony ./WORKFLOW.md --host 127.0.0.1
symphony ./WORKFLOW.md --no-ui
symphony ./WORKFLOW.md --ui-only
```

The CLI loads `.env`, `.env.local`, `.env.development`, and `.env.development.local` from the
execution directory before reading `WORKFLOW.md`. After those files are loaded, Symphony reads
runtime variables through a single `@t3-oss/env-core` schema. Empty string values are treated as
missing.

Workflow value fields such as `tracker.api_key` can use `$ENV_VAR` references, so
`api_key: $LINEAR_API_KEY` means "read the Linear API key from `LINEAR_API_KEY`." By contrast,
`github.token.env` is already the name of an environment variable, so write `env: GITHUB_TOKEN`
without a `$` prefix.

## Configuration Notes

| Setting                                | Default                          | Purpose                                                                         |
| -------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| `tracker.api_key`                      | none                             | Linear API key. Environment references such as `$LINEAR_API_KEY` are supported. |
| `tracker.project_slug`                 | none                             | Linear project slug used to discover work.                                      |
| `polling.interval_ms`                  | `30000`                          | How often the daemon refreshes tracker state.                                   |
| `agent.mode`                           | `local`                          | Runs workers locally with Codex app-server or delegates through Codex cloud.    |
| `agent.max_concurrent_agents`          | `10`                             | Global worker concurrency.                                                      |
| `codex_cloud.trigger`                  | `linear_comment`                 | Reserved trigger field; only Linear comment delegation is supported today.      |
| `codex_cloud.mention`                  | `@Codex`                         | Linear mention used to request a Codex cloud task.                              |
| `codex_cloud.repository`               | null                             | Optional `owner/repo` hint included in the Linear delegation comment.           |
| `github.provider`                      | `auto`                           | GitHub backend: `auto`, `token`, `gh`, or `disabled`.                           |
| `github.repository`                    | null                             | Optional `owner/repo` used for API preflight and same-repo PR landing.          |
| `github.token.env`                     | `GITHUB_TOKEN`                   | Environment variable used by the token backend.                                 |
| `github.preflight.enabled`             | `true`                           | Runs GitHub API diagnostics before Codex cloud handoff when possible.           |
| `github.preflight.codex_cloud_failure` | `warn`                           | Use `fail` to stop Codex cloud handoff when token preflight fails.              |
| `github.landing.mode`                  | `merge`                          | `merge`, `validate_only`, or `disabled` for `Merging` issue PR landing.         |
| `github.landing.merge_method`          | `merge`                          | Merge method used by API and `gh`: `merge`, `squash`, or `rebase`.              |
| `github.landing.delete_branch`         | `true`                           | Deletes the same-repo branch after a successful merge when supported.           |
| `codex.command`                        | `codex app-server --json`        | Command used to start a Codex app-server session.                               |
| `codex.model`                          | null                             | Base model captured for new sessions.                                           |
| `observability.snapshot_path`          | `.symphony/state/snapshot.json`  | JSON boundary read by the dashboard.                                            |
| `observability.snapshot_max_events`    | `160`                            | JSON snapshot retention for recent events and updates.                          |
| `observability.history.enabled`        | `true`                           | Enables durable local SQLite history.                                           |
| `observability.history.database_path`  | `.symphony/state/history.sqlite` | SQLite file for history, settings, and project token totals.                    |
| `settings.runtime_overrides.enabled`   | `false`                          | Allows dashboard overrides for `agent.mode` and `codex.model` future sessions.  |

Set `observability.history.enabled: false` or `SYMPHONY_HISTORY_ENABLED=0` to run in JSON-only mode.
Set `SYMPHONY_SNAPSHOT_PATH`, `SYMPHONY_HISTORY_DB_PATH`, or `SYMPHONY_WORKFLOW_PATH` when the
daemon and dashboard should share explicit paths.

## GitHub Lifecycle Backend

Symphony uses GitHub only for lifecycle checks around `Merging` issues and optional Codex cloud
preflight diagnostics. It does not create Codex cloud tasks through GitHub. Codex cloud delegation
still happens through the official Codex for Linear comment workflow.

`github.provider: auto` is the default. In that mode, Symphony uses the GitHub API backend when the
configured token environment variable is present, otherwise it falls back to the existing local
GitHub CLI path when a workspace exists. Use `github.provider: token` when a token is required,
`github.provider: gh` when a local operator intentionally wants CLI behavior, and
`github.provider: disabled` to turn GitHub lifecycle handling off.

The token backend uses GitHub REST and GraphQL calls to:

- find an open or already-merged same-repo PR for the Linear branch;
- read review state, mergeability, check runs, and legacy commit statuses;
- merge the PR with the configured merge method when every check is non-blocking;
- delete the same-repo branch after merge when `github.landing.delete_branch` is true;
- move the Linear issue to `Done` after a successful merge or when the PR is already merged.

The first implementation intentionally supports same-repo PRs only. Fork PRs, ambiguous branches,
draft PRs, merge conflicts, blocking reviews, pending checks, and failed checks are skipped before
any merge mutation. `github.landing.mode: validate_only` performs the same readiness checks without
merging or launching Codex.

Use a least-privilege GitHub token that can read the target repository, pull requests, review/check
state, commit statuses, and perform the merge/delete-branch actions you enable. Symphony never sends
that token to Codex cloud; it is used only by the local daemon process.

## Codex Cloud Linear Handoffs

Set `agent.mode: codex_cloud` when Symphony should delegate eligible Linear issues to Codex cloud
instead of starting a local `codex app-server` worker. Symphony implements the official Codex for
Linear comment workflow: it posts a Linear comment beginning with the configured `@Codex` mention,
adds a stable hidden Symphony marker to prevent duplicate handoffs, and records the local worker as
delegated after Linear accepts the comment.

Symphony does not currently assign issues to Codex or manage Linear triage rules that assign issues
to Codex. Those are separate Codex for Linear workflows. `codex_cloud.trigger` is reserved for
future trigger types and only `linear_comment` is supported today.

### Prerequisites

- Use a paid Codex-capable plan.
- For Enterprise workspaces, ask the ChatGPT workspace admin to enable Codex cloud tasks and the
  Codex for Linear connector.
- Connect GitHub in Codex and create a Codex environment for the repository.
- Install Codex for Linear from Codex connector settings.
- Link the Linear account by mentioning `@Codex` on a Linear issue once.
- Keep `LINEAR_API_KEY` available to Symphony so it can read issues and create delegation comments.

### Configuration

```yaml
agent:
  mode: codex_cloud
codex_cloud:
  trigger: linear_comment
  mention: "@Codex"
  repository: owner/repo
```

Set `codex_cloud.repository` when the issue context may not identify the right repository
unambiguously. Symphony includes that `owner/repo` hint in the `@Codex` comment so Codex can choose
the intended environment and repository.

When `github.preflight.enabled` is true and the token backend is usable, Symphony checks that the
configured GitHub token can access `github.repository` or `codex_cloud.repository` before posting
the Linear handoff comment. This is a local diagnostic only: it cannot prove that Codex cloud has the
right Codex environment, GitHub connector, or Linear identity. Leave
`github.preflight.codex_cloud_failure: warn` for best-effort diagnostics, or set it to `fail` when
missing local GitHub access should block delegation.

### After Delegation

Once the comment is created, Symphony's local role is complete for that issue. Progress updates,
task links, summaries, and pull-request creation live in Linear Activity and the Codex task link that
Codex posts back to the issue. The dashboard reports these as delegated handoffs, not completed local
work.

If Codex cannot find a connection, environment, or repository, it replies in Linear with the fix. Add
more context or reply in the thread with the desired repository/environment when the issue is
ambiguous. Codex receives the Linear issue content and your delegation comment, so review generated
answers and diffs before landing changes.

### Optional Linear MCP For Local Codex

Local Symphony mode passes the Linear issue content into the prompt and uses `LINEAR_API_KEY` for
Symphony's own tracker reads. If you also want a local Codex app, CLI, or IDE extension to query
Linear directly during a local run, configure the official Linear MCP server for Codex:

```bash
codex mcp add linear --url https://mcp.linear.app/mcp
```

Manual Codex configuration uses the same server URL:

```toml
[mcp_servers.linear]
url = "https://mcp.linear.app/mcp"
```

Then run `codex mcp login linear`. This MCP setup is optional and separate from
`agent.mode: codex_cloud`.

## Runtime Requirements

- Node.js `>=24.11.1`
- A compatible `codex app-server` command on `PATH`
- A configured `WORKFLOW.md`
- Linear credentials when running the daemon
- Codex for Linear setup when using `agent.mode: codex_cloud`

## Development

Inside this repository:

```bash
pnpm --filter @servrox/symphony test
pnpm dev:symphony
pnpm symphony:start
pnpm symphony:pack
```

`pnpm symphony:pack` builds the TypeScript runtime, builds and bundles the dashboard, runs the
package audit, and produces a local npm tarball.
