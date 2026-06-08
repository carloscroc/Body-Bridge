# Agent Idle Detection

```yaml
slug: agent-idle-detection
label: WARNING
confidence: 0.7
times_observed: 3
first_seen: 2026-06-04
last_seen: 2026-06-04
evidence_source: multiple_runs
status: active
related_issues: [BB-2, BB-3, BB-4]
```

## Rule

If the OpenCode agent process is idle for more than 5 minutes (no stdout/stderr output), it is likely stuck. The watchdog timer MUST kill the process after the configured timeout (default 30 minutes).

### Indicators of stuck agent
- No output for 5+ minutes
- Repeated identical warnings in daemon.log
- Process CPU usage near 0% for extended period

### Required action
- Kill the child process after timeout_minutes (30 min default)
- Move issue to Backlog state
- Log timeout event to LoopAny trace
