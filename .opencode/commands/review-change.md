---
description: Pre-flight self-review of a git diff against the repo's AGENTS.md rules. NOT a final approval — that is the reviewer's job.
---

You are doing a **pre-flight self-review** for the diff in this working copy. The Hermes orchestrator launched you so the worker (or Carlos) can catch obvious unsafe issues before handing off to the `reviewer` profile. **This is NOT a final approval.** Only the `reviewer` profile can ship / revise / escalate.

## Task brief from CEO (pass through $ARGUMENTS)

```
$ARGUMENTS
```

## Required workflow

1. **Read `AGENTS.md` of this repo first.** Extract the rules it states.
2. **Inspect the diff**: `git diff --stat HEAD` and `git diff HEAD` (or similar) to understand the scope.
3. **For each `AGENTS.md` rule, run a quick check** against the diff. If you don't know, mark "unknown" — don't guess pass.
4. **Specifically check the forbidden-actions list** in `AGENTS.md` (release signing, secret edits, applicationId changes, etc.). Diff scope review.
5. **Write the report to the path specified in the `$REPORT_PATH` environment variable** as a pre-review report. The Hermes `reviewer` profile will use it as one input; it does not replace the reviewer's verdict.
6. **Stop at "pre-review complete — handing to reviewer."**

## What this command is NOT

- It is NOT a final approval.
- It does NOT replace the reviewer's cross-check against the original goal.
- It does NOT modify files.

## Pre-review report shape

```
# Pre-Review Report (NOT final approval)

Date:
Run:
Diff scope:           <N> files, +<X> / -<Y> lines
Intent (from task):   <quoted>
Intent match:         yes | partial | no
Smallest safe change: yes | no | unknown

## AGENTS.md Compliance
- rule: ...
  status: pass | fail | unknown
  evidence: <file:line or observation>

## Forbidden Areas Touched
- <list, or "none">

## Unsafe Changes
- <list, or "none">

## Risks
- <list>

## Validation Status
- ran: yes | no
- result: pass | fail | unknown

## Recommended Action
  ship       — looks ready for human reviewer (still requires reviewer)
  revise     — fix these items before reviewer
  escalate   — touched forbidden area, escalate to Carlos now
```

## Done-when checklist

- [ ] AGENTS.md read
- [ ] Diff scope reviewed (`git diff --stat`)
- [ ] Each AGENTS.md rule has a verdict
- [ ] No edits made
- [ ] Report explicitly says "Not a final approval" in its header
- [ ] Report ends with: `Status: pre-review complete — handing to reviewer`
