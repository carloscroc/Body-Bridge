# Windows/PowerShell Environment Constraints

```yaml
slug: windows-powershell
label: PROCEDURE
confidence: 0.9
times_observed: 4
first_seen: 2026-06-04
last_seen: 2026-06-04
evidence_source: multiple_runs
status: active
related_issues: [BB-2, BB-3, BB-4]
```

## Rule

This project runs on **Windows**. All shell commands MUST use PowerShell 7+ syntax.

### MUST DO
- Use `Remove-Item` instead of `rm` (rm is an alias but behaves differently)
- Use `Copy-Item` instead of `cp`
- Use `Test-Path` instead of `test -f`
- Use `Get-ChildItem` instead of `ls`
- Use `Set-Content` / `Out-File` for file writes
- Quote paths with spaces using double quotes
- Use `&&` for chain operators (PowerShell 7+)
- Use `$env:VAR` instead of `$VAR` for environment variables
- Use `;` for sequential commands where `&&` isn't appropriate

### MUST NOT DO
- Never use `chmod` (Windows ACLs are different)
- Never use `export VAR=value` (use `$env:VAR = "value"`)
- Never use Unix pipes like `2>/dev/null` (use `2>$null`)
- Never use `source` or `.` to source scripts (use `& ./script.ps1`)
- Never assume bash/zsh syntax works
- Never use `cat` for reading files — use `Get-Content` or dedicated tools
