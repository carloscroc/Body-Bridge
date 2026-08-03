# Deployment Identity Verification — Final Check

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## CRITICAL CONSTRAINTS
- READ-ONLY — do NOT run mutations, convex deploy, convex dev, codegen
- Do NOT change environment files permanently
- Do NOT set environment variables permanently
- Do NOT reconnect to local Convex
- Do NOT access production intentionally
- Do NOT delete records
- Do NOT expose tokens, deploy keys, or admin secrets
- Do NOT assume commands exist — check help first

## OBJECTIVE

Confirm that deployment name `upbeat-chickadee-781` is exactly the authorized Body Bridge cloud development deployment.

## EXPECTED IDENTITY

- Team: `thebest-croc`
- Project: `Body Bridge Fitness`
- Deployment type: development
- Deployment name: `upbeat-chickadee-781`
- Deployment URL: `https://upbeat-chickadee-781.convex.cloud`

---

## ALLOWED INSPECTION

Use the installed Convex CLI's read-only deployment/project/status commands and help output.

Determine the safest supported command from Convex CLI 1.42.1.

**Potential references to check (verify with --help first):**
- Deployment listing or status
- Project metadata
- Deployment metadata
- Dashboard URL generation
- Authenticated CLI configuration

**You may also inspect repository configuration**, but must NOT expose secret values.

---

## EXECUTION STEPS

1. Check `npx convex --help` for available read-only commands
2. Check `npx convex deployment --help` for available subcommands
3. Check `npx convex project --help` if available
4. Run the appropriate read-only command to get deployment/project metadata
5. Verify all expected identity fields match

---

## REQUIRED REPORT

Return:
1. **Exact command or commands used** (with help verification steps)
2. **Exit codes**
3. **Deployment name**
4. **Deployment URL**
5. **Team slug**
6. **Project name or project slug**
7. **Deployment type:** development | production | preview | unknown
8. **Whether the command targeted any obsolete local deployment**
9. **Whether production was touched**
10. **Whether repository or external state changed**

---

## FINAL VERDICT (exactly one):

`DEPLOYMENT IDENTITY: PASS — upbeat-chickadee-781 IS AUTHORITATIVE DEVELOPMENT`

`DEPLOYMENT IDENTITY: FAIL — TARGET MISMATCH`

`DEPLOYMENT IDENTITY: INCONCLUSIVE — METADATA UNAVAILABLE`

---

## NEXT STEP (if PASS)

Continue Milestone 2B using the concrete deployment name:

```powershell
npx convex run <function> --deployment upbeat-chickadee-781
```

Prefer the explicit CLI flag over temporarily setting `CONVEX_DEPLOYMENT`, because the flag makes the selected target visible in each command.

**Do NOT use:** `dev/thebest-croc` (team slug, not deployment name)