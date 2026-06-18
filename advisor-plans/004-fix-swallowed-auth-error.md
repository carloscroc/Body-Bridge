# Plan 004: Fix swallowed auth error in App.tsx

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1043760..HEAD -- src/App.tsx`
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

In `src/App.tsx:474-475`, the `onAuth` callback's catch block is completely empty:

```typescript
} catch (err) {
}
```

This means that when a login or signup fails (wrong password, account not found, network error, Convex unreachable), the user sees no feedback at all — the form just goes back to its idle state with no error message. The `AuthScreen` component has an `authError` state and a red error banner, but the error is never populated because it's swallowed here.

## Current state

`src/App.tsx` lines 459-475:
```typescript
onAuth={async (data) => {
  setSignupData({ name: data.name, email: data.email });
  localStorage.removeItem('app_logged_out');
  try {
    const loggedInUser = await login({
      email: data.email,
      password: data.password,
      name: data.name,
      flow: data.method === 'login' ? 'signIn' : 'signUp',
    });
    if (loggedInUser?.onboardingComplete) {
      setAuthView('authenticated');
    } else {
      setAuthView('onboarding');
    }
  } catch (err) {
  }
}}
```

The `AuthScreen` component's `handleSubmit` (in `src/screens/AuthScreen.tsx:55-77`) already sets `authError` state from the caught error — BUT only if `onAuth` re-throws. Currently it doesn't, so `handleSubmit` sees a successful call. The error is lost.

**Convention**: The `AuthScreen` component's error handling pattern (lines 67-76 of AuthScreen.tsx) expects `onAuth` to throw so it can catch and display the error:

```typescript
try {
  await onAuth({ name, email, password, method: mode as 'login' | 'signup' });
} catch (err: any) {
  console.error('Auth submit error:', err);
  const errorMessage = err?.message || 'Authentication failed. Please try again.';
  setAuthError(errorMessage);
} finally {
  setIsLoading(false);
}
```

## Commands you will need

| Purpose      | Command                                          | Expected on success           |
|--------------|--------------------------------------------------|-------------------------------|
| Build        | `npm run build`                                  | exit 0                        |

## Scope

**In scope**:
- `src/App.tsx` — fix the empty catch block at line 474-475

**Out of scope**:
- `src/screens/AuthScreen.tsx` — no changes needed; its error handling is correct
- `src/services/AuthContext.tsx` — no changes needed; the `login` function already throws errors

## Git workflow

- Branch: `advisor/004-fix-swallowed-auth-error`
- Commit message style: `fix: propagate auth errors to AuthScreen instead of swallowing them`

## Steps

### Step 1: Re-throw the auth error

Replace the empty catch block in `src/App.tsx`:

```typescript
// Before (current):
} catch (err) {
}

// After:
} catch (err) {
  throw err;
}
```

This allows the error to propagate to `AuthScreen.handleSubmit`, which already has the correct catch-and-display logic.

**Verify**: `npm run build` exits 0.

### Step 2: Verify the error flow end-to-end

In `src/App.tsx`, the `onAuth` callback now re-throws. The `AuthScreen.handleSubmit` (lines 55-77) will catch it and call `setAuthError(errorMessage)`, displaying the red error banner with the message from `AuthContext.login` (e.g., "Incorrect password", "No account found for this email").

**Verify**: The `AuthScreen` component's error banner flow is intact:
- Line 202-208 of `AuthScreen.tsx` renders the `authError` state in a red banner.
- The `handleSubmit` function (line 67-76) catches re-thrown errors and calls `setAuthError`.

No code changes needed in `AuthScreen.tsx` — just confirm the existing error display code is still there.

## Test plan

Manual test:
1. Start the app (`npm run dev`)
2. Go to the login form
3. Enter a non-existent email and any password
4. Click "Sign In"
5. **Expected**: A red error banner appears saying "No account found for this email. Please sign up first."
6. Enter an existing email with a wrong password
7. Click "Sign In"
8. **Expected**: A red error banner appears saying "Incorrect password. Please try again."

Previously, both of these would show no feedback at all (the form would silently go back to idle).

## Done criteria

- [ ] The catch block in `App.tsx`'s `onAuth` callback re-throws the error
- [ ] `npm run build` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at `src/App.tsx:474-475` doesn't match the empty catch block described above.
- `src/screens/AuthScreen.tsx` no longer has the `try/catch` around `await onAuth(...)`.
- A step's verification fails twice.

## Maintenance notes

- The `AuthContext.login` function already handles the error message formatting ("Incorrect password", "No account found"). This plan just ensures those messages reach the user.
- If a global error boundary or toast system is added later, the re-throw can be replaced with a dispatch to that system instead.
