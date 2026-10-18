TASK: Repair + complete the Body Bridge Community feature on branch wt/community.
P0 (build restore) is ALREADY DONE and committed (dba2b41c) — do not redo it.
Your job is P1+P2: implement the gate, the 5 missing screens, feed fixes, l10n in all
16 locales, widget tests, and the capture harness. The approved mockups are BINDING.
Their contents are transcribed below — follow the transcription exactly; you may also
read the HTML sources listed under CONTEXT for exact colors/spacing tokens.
This contract supersedes OPENCODE_CONTRACT.md (which describes the first, rejected
attempt and carries a false dart-define-bypass premise).

WORKSPACE
C:/Users/thebe/.aa.StudioProjects/Body-Bridge/.worktrees/t_798cdc2d  (branch wt/community)
Flutter 3.41.9 at C:/Users/thebe/flutter/bin (call flutter.bat with absolute path).
Do NOT commit — the controller commits after verifying. Do NOT merge, push, or rebase.
Auth bypass via dart-define is NOT available on this branch (wt/auth-bypass is unmerged);
do not reference lib/dev/bypass_auth.dart — it does not exist here.

CONTEXT / APPROVED SPEC (binding transcriptions from the PNGs)
Mockup dir: C:/Users/thebe/AppData/Roaming/Open Design/namespaces/release-stable-win/data/projects/ffd160c8-8dea-49f8-acb5-bd7359edbf53/exports/
Text sources one level up: community-feed.html, community-members.html, DESIGN.md, BRIEF.md, DECISIONS.md.

[community-gate.png] FeatureLock over the blurred feed (feed visible, blurred, behind a
veil). Centered GateCard: padlock glyph in a circular chip; title "Community is part of
Basic"; body "Progress pics, workout logs, and people who get it."; primary pill CTA
"Unlock Community" (dark theme terracotta pill / light theme olive-ink pill); below it a
link-out row with link glyph "Continue on bodybridge.net"; ghost button "Not now".
NO prices, NO '$', NO 'per month' anywhere. Compose is disabled behind the gate. The
tab bar marks Community locked with a small padlock badge.

[community-feed.png] Header: small-caps eyebrow "BODY BRIDGE" (existing allowed literal),
title "Community", chat-bubble icon button top-right with a small count badge "2".
Segmented control: "Feed" (selected) | "Members". Post cards contain: initials avatar
circle, author name, small level-number badge next to the name, time-ago ("2h" etc.),
kind chip at top-right ("PROGRESS" or "WORKOUT"), a "..." options button (round-3: this
REPLACES any bottom share row — share lives in the options sheet), media placeholder
tile(s) labeled "PROGRESS PHOTO", caption text, and an action bar with ONLY like
(heart + count) and comment (bubble + count) — evenly split. Post 2 is a WORKOUT card:
inner summary tile with title "Push Day A", stats line "47 min · 16 sets · 6,140 kg
volume", exercise rows "Bench press 5×5 @ 82.5 kg" with a brass "PR" chip and "Incline
DB press 3×10 @ 28 kg"; caption below. Post 3 (Priya S.) has TWO side-by-side green
PROGRESS PHOTO placeholders. Seed 3+ posts matching this content in community_repo.dart.
Members tab: no approved PNG — build a simple member list from repo data (avatar
initials, name, level badge, trainer chip where applicable) using existing ui_kit /
app tokens. Feed empty state (from community-safety.png light side): centered inline
illustration (two abstract figures under a speech ring, drawn with Icons/phosphor
glyphs, no assets), "No posts yet", "Be the first to share your week.", olive pill
"Create first post".

[community-post-detail.png] No tab bar. 44px nav row: back chevron left, "..." right.
Post card: avatar, "Mara K.", "· 2h", "PROGRESS" chip; full-width media placeholder
(terracotta tile, person glyph, "PROGRESS PHOTO" pill bottom-left); caption "Week 8:
down 6 kg and my first strict pull-up. Slow negatives, three easy singles a day, no
hero sets. Six months of showing up is finally compounding."; action bar heart 24
(liked=terracotta), bubble 8, share 3 (share IS present in detail). Then "Comments 8":
comment = initials avatar, name, "· 1h", text "Eight weeks out and a strict pull-up is
fast. What actually changed?"; nested reply indented with "Mara K." + "OP" chip +
"· 58m", line "Replying to Priya S.", text "Grease the groove. Three easy singles a
day, none to failure.". Pinned bottom input pill "Add a comment..." + circular send
button (paper-plane glyph). Submitting appends to the local repo state (no network).
Rounded-20 cards, soft shadows, zero layout shift between themes.

[community-composer.png] Modal, no tab bar. Header "New post" + circular X close.
Segmented toggle "Progress" | "Workout". Progress mode: label "PROGRESS PHOTOS · 2 OF 4"
(n is staged count, max 4); two staged tiles (terracotta + sage, "PROGRESS PHOTO")
+ dashed-border "Add" tile with camera glyph; caption field, outlined when focused,
placeholder "Share your week — what changed, what you learned..."; helper line
"Photos stay private until you post."; CTA "Post to Community" pinned above the home
indicator. Workout mode: label "SESSION PREVIEW"; auto-filled summary card (title
"Push Day A", stats line as in feed, rows "Bench press 5×5 @ 82.5 kg" + PR chip,
"Incline DB press 3×10 @ 28 kg", "Cable fly 3×12 @ 15 kg"), note "Auto-filled from
today's session" with a refresh glyph; context field placeholder "Add context — how
did it feel?"; same CTA. VALIDATION: CTA enabled only when caption/context is
non-empty AND (progress mode has >=1 staged photo OR workout mode has a session);
otherwise disabled. Staging a photo = tapping Add increments the placeholder count
(no real camera). Posting appends to the local repo and closes the modal.

[community-post-options.png] Bottom sheet titled "Post options" with subtitle
"<author> · <KIND> · <time>". Another member's post rows: "Share post", "Save post",
"Copy post link" (slug shown right-aligned: bodybridge.net/p/wk8-pullup), "Hide post",
"Report post" (danger tint, separated). Your own post rows: "Edit post",
"Delete post…" (danger) — Hide/Report replaced by Edit/Delete; "Save post" toggles
to "Saved". Delete opens a confirm dialog: trash glyph, title "Delete this post?",
body "This removes the post, its photo, and its comments from Community. This can't
be undone.", ghost "Keep post" + danger "Delete". Hide shows a snackbar
"Post hidden · Undo". All actions are local repo mutations only.

[community-safety.png] Report sheet over a dimmed feed: title "Report post", line
"Your report is anonymous.", three reason rows with trailing chevrons: "Spam or scam",
"Harassment or hate", "Inappropriate photos", a danger pill row with flag glyph
"Report", and ghost "Cancel". Selecting a reason highlights it; "Report" disabled
until one is chosen. On submit: local-only snackbar "Report sent" and close.

[community-share.png] Share sheet over a dimmed detail: title "Share post", a
"Copy link" row with link glyph and slug "bodybridge.net/p/wk8-pullup" (tap =
Clipboard.setData + snackbar "Link copied"), four circular targets with labels
"Messages", "Mail", "Instagram", "More" (local no-ops), ghost "Cancel".

SCOPE (files you may create/modify — nothing else)
1. lib/screens/community/community_feed.dart — rewrite: header, Feed/Members tabs,
   cards per spec, "..." -> options sheet, empty state, gate decision.
2. lib/screens/community/community_gate.dart — FeatureLock + GateCard + locked-tab
   state exposure.
3. lib/screens/community/community_post_detail.dart
4. lib/screens/community/community_composer.dart
5. lib/screens/community/community_sheets.dart — post-options, report, and share
   bottom sheets (three sheets, one file is fine).
6. lib/services/community_repo.dart — extend the existing seed: post kinds,
   authors w/ level + trainer flag, time-ago, media placeholder counts/colors,
   workout summary (title, minutes, sets, volumeKg, exercise rows w/ PR flag),
   nested comments (OP flag), like/comment/share counts, members list, hidden/
   saved/reported state, addComment/addPost/removePost/toggleLike/toggleSave/hide
   local mutations. NO http/firebase/dio imports — pure in-memory.
7. lib/l10n/app_en.arb + ALL 15 other arb files — new community keys (list below)
   with REAL translations per locale (es, de, fr, it, ja, ko, nl, pl, pt, ru, tr,
   uk, ar, zh, zh_Hant). No English placeholders in non-en files. Then run
   `flutter gen-l10n` so the regenerated app_localizations*.dart files are on disk.
8. lib/app/app_shell.dart — ONLY a minimal additive padlock badge on the Community
   nav item when the gate is closed (a few lines inside _NavBar for the community
   entry). No other shell changes.
9. test/community_gate_test.dart — free tier sees gate (GateCard visible), basic AND
   advanced tiers reach the feed (post card visible). Install a fake AccountGate
   (pattern: test/real_gate_integration_test.dart) — do NOT use dart-define bypass.
10. test/community_composer_test.dart — validation: empty caption keeps CTA disabled;
    typing enables it; workout mode enables with context text; posting appends a post.
11. test/community_feed_test.dart — feed renders seeded posts (workout stats line
    "47 min · 16 sets · 6,140 kg volume" visible), options sheet opens from "...",
    empty repo shows "No posts yet".
12. test/captures/community_captures_test.dart — capture harness (see P2 below).

DO NOT
- Do NOT touch lib/constants/billing.dart, lib/state/account_gate.dart, pubspec.yaml,
  analysis_options.yaml, or any lib/ file outside the whitelist above.
- Do NOT restructure the global tab bar (the mockup's Home·Progress·Start·Exercises·
  Community round-3 nav is OUT OF SCOPE; the existing 5-tab bar stays).
- Do NOT add url_launcher usage anywhere except the gate CTA, following
  lib/screens/about_screen.dart:248 (launchUrl, LaunchMode.externalApplication,
  Uri.parse('https://bodybridge.net')). Wrap in try/catch; on failure show the
  gateLinkOut snackbar. url_launcher is already a dependency.
- Do NOT wire any real network, backend, firebase, or platform channels beyond
  url_launcher + Clipboard.
- Do NOT weaken or edit existing tests; do not edit test/i18n_test.dart.
- Do NOT use '$' or the words "per month" anywhere in community UI.
- Do NOT leave hardcoded user-visible strings in lib/screens/community/*.dart —
  every string goes through AppLocalizations. (test/i18n_test.dart scans
  lib/screens, lib/widgets, lib/app for `Text('...') / label: '...' /
  hintText: '...' / ScreenTitle('...') / title: '...'` literals and FAILS on them.
  Seeded content lives in lib/services/community_repo.dart, which is not scanned.)
- Do NOT use '—' placeholder stats anywhere; workout cards always render real numbers.

L10N KEYS (add to all 16 arb files; en values exactly as below; reuse existing keys
like cancel when they exist)
  communityTab: "Community"
  feedTab: "Feed"            membersTab: "Members"
  gateTitle: "Community is part of Basic"
  gateBody: "Progress pics, workout logs, and people who get it."
  gateCta: "Unlock Community"
  gateLinkOut: "Continue on bodybridge.net"
  gateNotNow: "Not now"
  optionsTitle: "Post options"
  sharePost: "Share post"    savePost: "Save post"    savedPost: "Saved"
  copyPostLink: "Copy post link"   hidePost: "Hide post"   reportPost: "Report post"
  editPost: "Edit post"      deletePost: "Delete post…"
  deleteConfirmTitle: "Delete this post?"
  deleteConfirmBody: "This removes the post, its photo, and its comments from Community. This can't be undone."
  keepPost: "Keep post"      deleteAction: "Delete"
  postHiddenSnackbar: "Post hidden · Undo"
  reportSheetTitle: "Report post"
  reportAnonymous: "Your report is anonymous."
  reportSpam: "Spam or scam"   reportHarassment: "Harassment or hate"
  reportInappropriate: "Inappropriate photos"   reportSubmit: "Report"
  reportSent: "Report sent"
  shareSheetTitle: "Share post"   copyLink: "Copy link"   linkCopied: "Link copied"
  shareMessages: "Messages"   shareMail: "Mail"   shareInstagram: "Instagram"
  shareMore: "More"
  newPostTitle: "New post"
  modeProgress: "Progress"   modeWorkout: "Workout"
  progressPhotosCount: "PROGRESS PHOTOS · {n} OF 4"  (int placeholder n)
  addPhotoTile: "Add"
  captionHint: "Share your week — what changed, what you learned..."
  photosPrivate: "Photos stay private until you post."
  sessionPreview: "SESSION PREVIEW"
  autoFilled: "Auto-filled from today's session"
  contextHint: "Add context — how did it feel?"
  postToCommunity: "Post to Community"
  commentsTitle: "Comments"
  commentCount: "{n, plural, =1{{n} comment} other{{n} comments}}"
  addCommentHint: "Add a comment..."
  replyingTo: "Replying to {name}"  (String placeholder name)
  opChip: "OP"
  noPostsTitle: "No posts yet"
  noPostsBody: "Be the first to share your week."
  createFirstPost: "Create first post"
  progressPhotoLabel: "PROGRESS PHOTO"
  progressChip: "PROGRESS"   workoutChip: "WORKOUT"   prChip: "PR"
  workoutStats: "{min} min · {sets} sets · {volume} kg volume"
    (int placeholders min, sets, volume)
  composeDisabledHint: "Unlock Community to post"
  inboxComingSoon: "Inbox is coming soon"
  plus hoursAgo/daysAgo-style {n} strings for time-ago if the app has no existing
  relative-time helper (grep lib/ for one first; reuse it if present).
Comment every new key with @key descriptions like the existing entries. Names may be
adjusted for existing app conventions (camelCase, no collisions with the ~1034 existing
keys — grep first), but the EN VALUES must match the strings above exactly.

IMPLEMENTATION RULES
- Follow existing app patterns: ui_kit widgets (ScreenTitle, Pressable, chips),
  app theme tokens (app_colors.dart, app_theme.dart), AnimatedBuilder on
  AccountGate.instance or the PremiumGate context extension for the tier check.
- Tier rule (community_gate.dart): AccountTier.basic/advanced/enterprise -> feed;
  free/signedOut -> gate. Do NOT add capability keys to billing.dart — decide
  locally on snapshot.tier.
- Gate screen: Stack -> feed content wrapped in a blur (ImageFiltered), veil,
  centered GateCard. A real blurred feed behind is preferred.
- Material 3 conventions the app already uses; rounded-20 cards; soft shadows.
- Every file you create passes flutter analyze with zero issues.
- Keep files focused; reuse a shared PostCard widget between feed and detail.
- Write clean, formatted Dart (page_width 110 per analysis_options).

P2 — CAPTURE HARNESS (test/captures/community_captures_test.dart)
- setUpAll: FontLoader for every assets/fonts/Nunito-*.ttf asset + the phosphor icon
  font (load from the phosphoricons_flutter package asset via rootBundle — resolve
  the actual asset path from the package) so text and icons render as real glyphs.
- Viewports: try `adb shell wm size` + `adb shell wm density` via Process.run; if a
  device answers compute logical dp = px / (density/160); else default 411x914.
  Capture at that viewport AND at 360x800.
- Capture: feed (basic tier), gate (free tier), composer (progress mode),
  post-detail — DARK and LIGHT each at the device viewport; feed + gate also at
  360x800 dark. Write PNGs to build/community_captures/ (gitignored):
  feed_dark.png, feed_light.png, feed_dark_360.png, gate_dark.png, gate_light.png,
  gate_dark_360.png, composer_dark.png, composer_light.png, post_detail_dark.png,
  post_detail_light.png.
- Gate the whole capture run behind --dart-define=BB_CAPTURES=1 (test body returns
  early, printing 'captures skipped' when the define is absent) so the normal suite
  stays fast — but it MUST run successfully once with the flag for evidence.

ACCEPTANCE CRITERIA (controller will verify independently)
A1. flutter analyze -> No issues found.
A2. flutter gen-l10n runs clean; every one of the 16 lib/l10n/app_*.arb contains
    all new community keys with real translations (spot-checked, not English
    copies except where the locale legitimately borrows).
A3. flutter test (full suite): ONLY known pre-existing failure allowed =
    smoke_test ShareKind.streak 6.4px overflow (pre-existing on main, fix 8fb8ea51
    unmerged). i18n_test MUST pass. New community tests pass.
A4. Gate: free -> GateCard visible (no prices/$/'per month'), CTA url is
    bodybridge.net, ghost "Not now"; basic/advanced -> feed reachable.
A5. All 6 screens/sheet groups exist and match the transcriptions: feed (tabs,
    level badges, PR chips, trainer chip, '...' options, 3+ posts incl. structured
    workout card, media placeholders), post-detail (nested OP reply, pinned input),
    composer (both modes + validation), options sheet (owner vs other variants +
    delete confirm), report sheet (3 reasons + disabled-until-selected), share
    sheet (copy link + 4 targets).
A6. Capture PNGs exist (>= 10 files) under build/community_captures/.
A7. No files outside the SCOPE whitelist were modified (git status proves it).

RETURN
Report: files created/changed with line counts, the l10n keys added per file,
how the tier check is wired, the exact local mutation entry points on
CommunityRepo, any deviations from this contract with reasons, and the full
list of divergences from the mockups (there MUST be some: tab bar restructure
out of scope, chat/inbox button is a stub, Members tab has no approved PNG).
