# Device review — Premium billing UI (badge, locks, upgrade sheet)

Card t_2d5e190e · branch wt/t_2d5e190e · INERT frontend (no Helcim, no payments — every purchase action ends in a "coming soon" stub)

Run DEBUG on the Samsung: `flutter run -d RFCN201Q6BZ` from this worktree. Hot reload is safe; hot restart clears nothing durable. Nothing merges until this checklist passes on device.

## 1. Pro badge (home)
- [ ] Signed in on FREE: small terracotta "✦ PRO" pill top-right of the home header, next to the streak chip, both themes
- [ ] Tap → notch toast "Upgrade to unlock more" + upgrade sheet slides up
- [ ] The greeting/date never wrap or clip with the badge present (try a long display name in settings if possible)

## 2. Upgrade sheet (opened from any entry point)
- [ ] Title "Body Bridge Premium", subtitle, close button works (button, drag down, scrim tap)
- [ ] Monthly/Annual pill toggle flips visually; prices stay $10/$20 either way (annual is a visual placeholder by design)
- [ ] Basic card $10/mo, Advanced card $20/mo with brass "MOST POPULAR" tag overlapping the card top
- [ ] CTA "Continue on bodybridge.net" → swaps IN PLACE to the sage "Online checkout coming soon" strip; sheet stays open; no browser, no Play Store, nothing external opens
- [ ] "Enterprise — Contact Sales" → same coming-soon swap
- [ ] Fine print under everything: "Billing is handled securely on bodybridge.net — not through the Play Store."
- [ ] Sheet scrolls; no overflow at the smallest text-accessibility setting you use
- [ ] Repeat in BOTH themes (settings → theme)

## 3. Feature locks
- [ ] Progress tab (free): "Advanced analytics" locked card under the title — dimmed title/meta, padlock chip, mini bar chart, terracotta upsell line; whole card taps → upgrade sheet
- [ ] Routines → Templates (free): "Premium program — Hypertrophy Blocks" card at the bottom of the sheet with padlock overlay + "Unlock with Pro" pill; pill closes the templates sheet and opens the upgrade sheet
- [ ] Routines → "AI Routine" button (locked on free): dimmed + padlock, tap → toast + upgrade sheet
- [ ] FREE cap paths unchanged: create/duplicate a 4th routine → notch toast + upgrade sheet (previously it opened the old paywall screen)
- [ ] All existing template cards still apply normally, charts/history/community still fully usable — nothing free got dimmed or gated

## 4. Tier flips (billing v0 runbook: admin setActiveTier)
- [ ] Set account to BASIC, then refresh entitlements on device (re-open the app or trigger any account refresh — no reinstall): badge GONE; analytics lock row STILL visible (advanced analytics is Advanced-tier); premium program card STILL visible
- [ ] Set account to ADVANCED: badge GONE; analytics row GONE; premium program card GONE; AI Routine button now normal (not dimmed) and opens the AI plan screen
- [ ] Sign out: badge GONE; app still boots to the auth wall exactly as before

## 5. Regression sweep
- [ ] Start a workout, finish, save — unchanged
- [ ] Old full paywall screen still exists for anything that routes to `paywall` outside FeatureGate (none expected — flag it if you find one)
- [ ] No "Helcim", no checkout webview, no price other than $10/$20 anywhere in the app
