import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../../l10n/l10n.dart';
import '../../services/community_repo.dart';
import '../../state/account_gate.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_theme.dart';
import '../../widgets/ui_kit.dart';
import 'community_feed.dart';

class CommunityComposerScreen extends StatefulWidget {
  const CommunityComposerScreen({super.key, this.editing});

  final CommunityPost? editing;

  @override
  State<CommunityComposerScreen> createState() => _CommunityComposerScreenState();
}

class _CommunityComposerScreenState extends State<CommunityComposerScreen> {
  late PostKind _mode = widget.editing?.kind ?? PostKind.progress;
  late final TextEditingController _caption =
      TextEditingController(text: widget.editing?.caption ?? '');
  final TextEditingController _context = TextEditingController();
  final FocusNode _focus = FocusNode();
  late final List<MediaPlaceholder> _staged = widget.editing == null
      ? <MediaPlaceholder>[]
      : List.of(widget.editing!.media);

  @override
  void dispose() {
    _caption.dispose();
    _context.dispose();
    _focus.dispose();
    super.dispose();
  }

  String get _text => _mode == PostKind.workout ? _context.text.trim() : _caption.text.trim();

  bool get _canPost {
    if (widget.editing != null) return _caption.text.trim().isNotEmpty;
    final text = _text;
    if (_mode == PostKind.workout) return text.isNotEmpty;
    return text.isNotEmpty;
  }

  void _submit() {
    if (!_canPost) return;
    final repo = CommunityRepo();
    final snapshot = AccountGate.instance.snapshot;
    if (widget.editing != null) {
      repo.editPost(widget.editing!.id, _caption.text.trim());
    } else if (_mode == PostKind.workout) {
      repo.createPost(
        kind: PostKind.workout,
        caption: _context.text.trim(),
        authorName: communityDisplayName(snapshot.email),
        authorInitials: communityInitials(snapshot.email),
        workout: repo.todaysSession,
      );
    } else {
      repo.createPost(
        kind: PostKind.progress,
        caption: _caption.text.trim(),
        authorName: communityDisplayName(snapshot.email),
        authorInitials: communityInitials(snapshot.email),
        media: List.of(_staged),
      );
    }
    Navigator.of(context).pop();
  }

  Widget _addTile(GymColors gc) => Container(
        decoration: BoxDecoration(
          color: gc.bgRaised2,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: gc.border),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(PhosphorIconsRegular.plus, size: 18, color: gc.textSecondary),
            const SizedBox(height: 6),
            Text(
              t.addPhotoTile,
              style: AppTheme.f(10.5, weight: FontWeight.w700, color: gc.textSecondary),
            ),
          ],
        ),
      );

  Widget _field({required TextEditingController controller, required String hint}) {
    final gc = context.gc;
    return AnimatedBuilder(
      animation: _focus,
      builder: (context, _) {
        final focused = _focus.hasFocus;
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          constraints: const BoxConstraints(minHeight: 96),
          decoration: BoxDecoration(
            color: gc.bgRaised,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: focused ? gc.accent : gc.border, width: focused ? 1.6 : 1),
          ),
          child: TextField(
            controller: controller,
            focusNode: _focus,
            maxLines: null,
            minLines: 3,
            style: AppTheme.s(13, weight: FontWeight.w500, color: gc.text, height: 1.4),
            decoration: InputDecoration(
              isCollapsed: true,
              border: InputBorder.none,
              hintText: hint,
              hintStyle: AppTheme.s(13, weight: FontWeight.w500, color: gc.textTertiary, height: 1.4),
            ),
          ),
        );
      },
    );
  }

  List<Widget> get _progressBody {
    final gc = context.gc;
    return [
      Text(
        t.progressPhotosCount(_staged.length),
        style: AppTheme.f(10.5, weight: FontWeight.w800, color: gc.textTertiary, letterSpacing: 2),
      ),
      const SizedBox(height: 10),
      Row(
        children: [
          for (var i = 0; i < _staged.length; i++) ...[
            if (i > 0) const SizedBox(width: 6),
            Expanded(child: AspectRatio(aspectRatio: 1, child: PlaceholderTile(sage: _staged[i].sage))),
          ],
          if (_staged.length < 4) ...[
            if (_staged.isNotEmpty) const SizedBox(width: 6),
            Expanded(
              child: AspectRatio(
                aspectRatio: 1,
                child: Opacity(opacity: 0.4, child: _addTile(gc)),
              ),
            ),
          ],
        ],
      ),
      const SizedBox(height: 10),
      Align(
        alignment: Alignment.centerLeft,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: gc.bgRaised2,
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: gc.border),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(PhosphorIconsRegular.info, size: 12, color: gc.textTertiary),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  t.photoPickerPending,
                  style: AppTheme.f(10.5, weight: FontWeight.w700, color: gc.textTertiary),
                ),
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 16),
      _field(controller: _caption, hint: t.captionHint),
      const SizedBox(height: 10),
      Row(
        children: [
          Icon(PhosphorIconsRegular.lockKey, size: 12, color: gc.textTertiary),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              t.photosPrivate,
              style: AppTheme.s(11, weight: FontWeight.w500, color: gc.textTertiary),
            ),
          ),
        ],
      ),
    ];
  }

  List<Widget> get _workoutBody {
    final gc = context.gc;
    final session = CommunityRepo().todaysSession;
    return [
      SoftCard(
        radius: 16,
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    t.sessionPreview,
                    style: AppTheme.f(10.5, weight: FontWeight.w800, color: gc.textTertiary, letterSpacing: 2),
                  ),
                ),
                Icon(PhosphorIconsRegular.arrowsClockwise, size: 14, color: gc.textTertiary),
              ],
            ),
            const SizedBox(height: 8),
            Text(session.title, style: AppTheme.f(16, weight: FontWeight.w800, color: gc.text)),
            const SizedBox(height: 2),
            Text(
              t.autoFilled,
              style: AppTheme.s(11, weight: FontWeight.w500, color: gc.textTertiary),
            ),
            const SizedBox(height: 6),
            Text(
              t.workoutStats(session.minutes, session.sets, formatCommunityVolume(session.volumeKg)),
              style: AppTheme.s(11.5, weight: FontWeight.w600, color: gc.textSecondary),
            ),
            const SizedBox(height: 10),
            Divider(height: 1, thickness: 1, color: gc.border),
            const SizedBox(height: 10),
            WorkoutRows(workout: session),
          ],
        ),
      ),
      const SizedBox(height: 16),
      _field(controller: _context, hint: t.contextHint),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final editing = widget.editing != null;
    return Scaffold(
      backgroundColor: gc.pageBg,
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            Positioned.fill(
              child: ListView(
                padding: EdgeInsets.fromLTRB(20, 14, 20, 100),
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      RoundAction(
                        onTap: () => Navigator.of(context).maybePop(),
                        child: Icon(PhosphorIconsRegular.x, size: 16, color: gc.text),
                      ),
                      Text(
                        t.newPostTitle,
                        style: AppTheme.f(17, weight: FontWeight.w800, color: gc.text),
                      ),
                      const SizedBox(width: 44),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (!editing)
                    Center(
                      child: CommunitySeg(
                        options: [
                          SegOption(
                            t.modeProgress,
                            _mode == PostKind.progress,
                            () => setState(() => _mode = PostKind.progress),
                          ),
                          SegOption(
                            t.modeWorkout,
                            _mode == PostKind.workout,
                            () => setState(() => _mode = PostKind.workout),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 14),
                  if (editing || _mode == PostKind.progress) ..._progressBody else ..._workoutBody,
                ],
              ),
            ),
            Positioned(
              left: 20,
              right: 20,
              bottom: 12 + MediaQuery.paddingOf(context).bottom,
              child: AnimatedBuilder(
                animation: Listenable.merge([_caption, _context]),
                builder: (context, _) {
                  final enabled = _canPost;
                  return Pressable(
                    onTap: enabled ? _submit : null,
                    child: Container(
                      height: 54,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: enabled ? gc.ember : gc.bgRaised2,
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        t.postToCommunity,
                        style: AppTheme.f(
                          15,
                          weight: FontWeight.w800,
                          color: enabled ? gc.onEmber : gc.textTertiary,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
