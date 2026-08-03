# Mission 2 — Push Only to Authoritative Development

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## MODEL
zai-coding-plan/glm-5.2

## OBJECTIVE

Push ONLY the updated harness code to the `upbeat-chickadee-781` development deployment using the CLI-supported development mechanism.

Use:
```powershell
npx convex dev --once --env-file <temporary-env-file>
```

Or alternatively:
```powershell
npx convex run test_internal_harness:getDatabaseCounts --push --deployment upbeat-chickadee-781
```

## CRITICAL CONSTRAINTS

- Do NOT use `npx convex deploy`
- Do NOT expose secrets in the report
- Do NOT touch production
- Do NOT contact obsolete local Convex
- Target ONLY: `upbeat-chickadee-781`

## TEMPORARY ENV FILE

Create a temporary env file OUTSIDE the repository or in a temporary ignored location containing only the deployment selector required for `upbeat-chickadee-781`.

Do NOT copy or expose secrets into the report.

## PUSH COMMAND (Preferred)

Use `npx convex dev --once` which performs:
1. Typecheck
2. Codegen
3. Bundling
4. Single development push

Verify through CLI help first that the command targets the correct deployment.

## REPORT

Write to `.hermes/mission-2-report.md`:

1. Exact sanitized command
2. Exit code
3. Deployment name
4. Deployment URL
5. Files pushed
6. Typecheck result
7. Codegen result
8. Confirmation production and local Convex were untouched
9. Confirmation no secret was exposed