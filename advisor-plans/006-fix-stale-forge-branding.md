# Plan 006: Replace stale "Forge" branding with "Body Bridge"

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1043760..HEAD -- src/screens/AuthScreen.tsx src/screens/SettingsView.tsx src/screens/WorkoutDetail.tsx tests/auth_full_flow.spec.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a1043760`, 2026-06-18

## Why this matters

The app was rebranded from "Forge Fitness" to "Body Bridge Fitness" (commit `61ef47a9`), but four user-visible text strings still reference the old name:

1. The landing page hero heading says "FORGE" — this is the first thing a new user sees
2. The tagline says "Industrial Grade Fitness" — this is the Forge-era motto
3. The Settings screen footer says "Forge Fitness Operating System"
4. The WorkoutDetail screen shows "FORGE ELITE PLAN"
5. The Playwright test checks for "FORGE" in the landing heading, which will break after the fix

These inconsistencies confuse the brand identity and signal incomplete migration to users.

## Current state

Four source files have stale "Forge" references:

**`src/screens/AuthScreen.tsx:104-106`**:
```typescript
className="editorial-title text-7xl md:text-8xl text-white italic uppercase tracking-tighter"
>
  FORGE
</motion.h1>
```

**`src/screens/AuthScreen.tsx:114-115`**:
```typescript
className="font-fraunces italic text-xl text-white/40"
>
  Industrial Grade Fitness
</motion.p>
```

**`src/screens/SettingsView.tsx:874`**:
```typescript
<p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Forge Fitness Operating System</p>
```

**`src/screens/WorkoutDetail.tsx:456`**:
```typescript
<span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/35 leading-none">FORGE ELITE PLAN</span>
```

**`tests/auth_full_flow.spec.ts:15`**:
```typescript
await expect(page.locator('h1')).toContainText('FORGE', { timeout: 15000 });
```

**Convention**: The new brand is defined in `src/config/app.config.ts`:
```typescript
export const APP_CONFIG = {
  displayName: 'Body Bridge Fitness',
  shortName: 'BodyBridge',
  // ...
} as const;
```

The app's auth timeout screen (in `src/App.tsx:447-448`) already uses "Body Bridge" correctly.

## Commands you will need

| Purpose      | Command                                          | Expected on success           |
|--------------|--------------------------------------------------|-------------------------------|
| Build        | `npm run build`                                  | exit 0                        |
| Grep for old name | `grep -rn "FORGE\|Forge Fitness\|Industrial Grade" src/ tests/` | no matches (except app.config.ts comments or unrelated) |

## Scope

**In scope**:
- `src/screens/AuthScreen.tsx` — replace "FORGE" heading and "Industrial Grade Fitness" tagline
- `src/screens/SettingsView.tsx` — replace "Forge Fitness Operating System"
- `src/screens/WorkoutDetail.tsx` — replace "FORGE ELITE PLAN"
- `tests/auth_full_flow.spec.ts` — update the text assertion

**Out of scope**:
- `src/config/app.config.ts` — already correct
- `src/App.tsx` — already uses "Body Bridge" (e.g., line 447-448)
- Any CSS class names or component names that happen to contain "forge" (those are implementation details, not user-visible text)
- Variable names like `devForceSettings` — these are internal code, not user-facing

## Git workflow

- Branch: `advisor/006-fix-stale-forge-branding`
- Commit message style: `fix: replace remaining "Forge" branding with "Body Bridge"`

## Steps

### Step 1: AuthScreen.tsx — replace hero heading and tagline

Change line 106 from:
```typescript
FORGE
```
to:
```typescript
BODY BRIDGE
```

Change line 115 from:
```typescript
Industrial Grade Fitness
```
to:
```typescript
Bridge The Gap
```

(The tagline "Bridge The Gap" fits the Body Bridge brand metaphor. If the owner prefers a different tagline, this is the line to change — but "Industrial Grade Fitness" is definitely wrong post-rebrand.)

**Verify**: `npm run build` exits 0.

### Step 2: SettingsView.tsx — replace footer text

Change line 874 from:
```typescript
Forge Fitness Operating System
```
to:
```typescript
Body Bridge Fitness Operating System
```

**Verify**: `npm run build` exits 0.

### Step 3: WorkoutDetail.tsx — replace plan label

Change line 456 from:
```typescript
FORGE ELITE PLAN
```
to:
```typescript
BODY BRIDGE ELITE PLAN
```

**Verify**: `npm run build` exits 0.

### Step 4: auth_full_flow.spec.ts — update test assertion

Change line 15 from:
```typescript
await expect(page.locator('h1')).toContainText('FORGE', { timeout: 15000 });
```
to:
```typescript
await expect(page.locator('h1')).toContainText('BODY BRIDGE', { timeout: 15000 });
```

**Verify**: `npm run build` exits 0.

### Step 5: Final grep to confirm no remaining stale references

```bash
grep -rn "FORGE\|Forge Fitness\|Industrial Grade" src/ tests/ --include="*.tsx" --include="*.ts"
```

Expected: no matches (or only matches in non-user-visible code like variable names or comments that reference the old brand for historical context).

**Verify**: empty output or only internal-code references (not UI strings).

## Test plan

Manual verification:
1. Start the app (`npm run dev`)
2. Navigate to the landing page — verify the hero heading says "BODY BRIDGE", not "FORGE"
3. Verify the tagline says "Bridge The Gap", not "Industrial Grade Fitness"
4. Navigate to Settings — verify the footer says "Body Bridge Fitness Operating System"
5. Open a workout detail — verify the plan label says "BODY BRIDGE ELITE PLAN"

E2E test:
- The `auth_full_flow.spec.ts` test should now look for "BODY BRIDGE" instead of "FORGE"

## Done criteria

- [ ] `grep -rn "FORGE" src/screens/AuthScreen.tsx src/screens/SettingsView.tsx src/screens/WorkoutDetail.tsx` returns no matches
- [ ] `grep -rn "Industrial Grade" src/` returns no matches
- [ ] `npm run build` exits 0
- [ ] `tests/auth_full_flow.spec.ts` checks for "BODY BRIDGE" instead of "FORGE"
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the cited locations doesn't match the excerpts above.
- You find additional "Forge" references that are in variable/function names (not UI text) — report them but don't change them without clarification.
- A step's verification fails twice.

## Maintenance notes

- The `app.config.ts` file is the canonical source for the app name. If a future "settings" or "branding" system renders the display name from config, these hardcoded strings can be replaced with a reference to `APP_CONFIG.displayName`.
- If the "Bridge The Gap" tagline is not desired, the owner should substitute their preferred tagline. The point is that "Industrial Grade Fitness" references a retired brand.
