The Flutter project implements source tabs (Free/Trainer/Custom) with SegToggle and padlocked overlays for gated content.

## Implementation Strategy

Implement source tabs using SegToggle:
- New segment widget in lib/widgets/ui_kit.dart with trainer_features entitlements check
- Active segment fills with Ember color; segment color token in app_colors.dart (GymColors.segmentActive)
- Click handler toggles view, animates active state, reads current tab from state
- Components: _SegToggle (– horizontal pill with active background, rounded track, item text), SegItem (flex + padding + active styles)

Integrate new tabs into exercises_screen.dart:
- Source tabs inserted under search field after SegmentTitle
- Tab logic: Free visible to all users; Trainer and Custom gate-checked via entitlements_service.getEntitlement('trainer_features')
- Onboarding hooks: visible for non-free users; still usable if entitlements granted
- Existing UI reused: SearchField, QuickChips, list sections, same styling palette
- State propagates via library_state.dart currentSource tab (Free/Trainer/Custom) for page view and scroll position

Lock overlay for Trainer & Custom when gated (entitlements missing):
- Reusable premium_gate.dart (currently 1,710 chars), copy generic dismissable glass panel with lock + list of benefits
- Position: absolute fill on screen, with scrim backdrop, ghost rows, soft lock circle, title/sub, benefit bullets, CTA "Unlock Premium"
- Benefits list: "Full trainer video library", "Exercises assigned personally by your coach", "New coach sessions every month"
- Follow locked overlay from upsell-locks.html: consistent lock-panel specs (accent border, accent text, rounded, subtle shadow)
- Portal: tap on Trainer/Custom tabs when gated opens this overlay (existing paywall flow through lib/screens/paywall_screen.dart)

Cosmetic theme and language:
- Theme tokens: GymColors.segmentActive Ember -> dark 0A0A0A, light 3B4835 (mirroring app_colors.dart)
- UI kit: seg styles (SegToggle) use --bgRaised2 track, segment height 40px, rounded 100px, 3px padding, item padding 7px 4px
- Same search field (48px), chip pills (12.5px w600), list row structure (52px thumb + row lines), bottom nav (_NavBar) unchanged
- L10n: use existing i18n strings for Free/Trainer/Custom tab labels in lib/l10n/app_en.arb (search keys: freeTab, trainerTab, customTab)

Testing:
- For Free: Free tab active, Trainer/Custom grayed out (padlock)
- For Advanced: all tabs visible, selecting Trainer opens session rows (coach identity strip, category chips, etc.), Custom opens assigned rows (coach note, due dates)
- Gated UI: on Trainer/Custom tap when entitlements missing, overlay displays; clicking CTA navigates to paywall_screen.dart
- Verify visual matches the provided HTML designs (structural pattern, styling tokens, component layout)
- No changes to existing exercise detail flow (Screen 3), routine builder (Screen 4), library view, etc.

Deliverable files:
- lib/widgets/ui_kit.dart (new _SegToggle component)
- lib/screens/exercises_screen.dart (source tabs insertion, logic)
- lib/state/library_state.dart (source tab propagation)
- Updated lib/theme/app_colors.dart (segmentActive tokens)
- Updated lib/l10n/app_en.arb (tab label keys)

Implementation phases:
1. Review existing code to understand current patterns for entitlements gating, segment components, list sections
2. Create new _SegToggle component and add segmentActive theme tokens
3. Insert tab UI into exercises_screen.dart and implement gating logic
4. Hook library_state to propagate tab state
5. Add new i18n keys for tab labels
6. Verify integration matches HTML designs and working logic across user entitlement scenarios

Entry points for the changes:
- Exercises screen (lib/screens/exercises_screen.dart) lines: after search field, before list
- UI kit (lib/widgets/ui_kit.dart) for reusable component
- State layer (lib/state/library_state.dart) for tab state synchronization
- Theme (lib/theme/app_colors.dart) for active segment colors
- Language (lib/l10n/app_en.arb) for translatable tab labels

Edge Cases:
- No entitlements: show Free tab active, Trainer/Custom padlocked, clicking locks opens paywall overlay
- Has entitlements: all three tabs visible, each tab switches content (rows/views) without paywall
- Light/Dark themes: ensure segmentActive and inactive colors adapt per theme tokens
- Language: translations loaded via MaterialLocalizations, ensure tab labels don't overflow and remain accessible (high contrast)
- Existing library/router: preserve existing behavior of exercises detail (Screen 3) when any row is tapped
- Keep plus-btn hidden for Free and Custom (existing hidden pattern without trainer_features)
- No functional changes to existing paywalls (Screen 5) or premium gate flows