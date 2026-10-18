import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../../l10n/l10n.dart';
import '../../services/community_repo.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass.dart';
import '../../widgets/ui_kit.dart';
import 'community_gate.dart';

void showPostOptionsSheet(
  BuildContext context, {
  required CommunityPost post,
  VoidCallback? onEdit,
}) {
  showAppSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _PostOptionsSheet(post: post, onEdit: onEdit),
  );
}

class _SheetRow extends StatelessWidget {
  const _SheetRow({
    required this.label,
    required this.icon,
    required this.onTap,
    this.trailing,
    this.danger = false,
    this.selected = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final Widget? trailing;
  final bool danger;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final tone = danger ? gc.danger : (selected ? gc.accent : gc.text);
    return Pressable(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 50),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: selected ? gc.accentSoft : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, size: 17, color: tone),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label, style: AppTheme.f(13.5, weight: FontWeight.w700, color: tone)),
            ),
            ?trailing,
          ],
        ),
      ),
    );
  }
}

class _SheetPanel extends StatelessWidget {
  const _SheetPanel({required this.title, this.subtitle, required this.children, this.footer});

  final String title;
  final String? subtitle;
  final List<Widget> children;
  final Widget? footer;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Container(
      decoration: BoxDecoration(
        color: gc.pageBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: sheetPad(context),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SheetHandle(color: gc.border),
          const SizedBox(height: 10),
          SheetTitle(title, subtitle: subtitle),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: gc.bgRaised2, borderRadius: BorderRadius.circular(18)),
            child: Column(children: children),
          ),
          if (footer != null) ...[
            const SizedBox(height: 16),
            footer!,
          ],
        ],
      ),
    );
  }
}

class _PostOptionsSheet extends StatelessWidget {
  const _PostOptionsSheet({required this.post, this.onEdit});

  final CommunityPost post;
  final VoidCallback? onEdit;

  void _confirmDelete(BuildContext context) {
    final repo = CommunityRepo();
    showAppDialog<void>(
      context: context,
      builder: (dialogContext) {
        final gc = dialogContext.gc;
        return Dialog(
          backgroundColor: gc.bgRaised,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: gc.danger.withValues(alpha: 0.14),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(PhosphorIconsRegular.trash, size: 20, color: gc.danger),
                ),
                const SizedBox(height: 14),
                Text(
                  t.deleteConfirmTitle,
                  textAlign: TextAlign.center,
                  style: AppTheme.f(17, weight: FontWeight.w800, color: gc.text),
                ),
                const SizedBox(height: 8),
                Text(
                  t.deleteConfirmBody,
                  textAlign: TextAlign.center,
                  style: AppTheme.s(13, weight: FontWeight.w500, color: gc.textSecondary),
                ),
                const SizedBox(height: 18),
                Pressable(
                  onTap: () => Navigator.of(dialogContext).pop(),
                  child: Container(
                    height: 46,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: gc.bgRaised2,
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      t.keepPost,
                      style: AppTheme.f(14, weight: FontWeight.w800, color: gc.textSecondary),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Pressable(
                  onTap: () {
                    repo.removePost(post.id);
                    Navigator.of(dialogContext).pop();
                    Navigator.of(context).pop();
                  },
                  child: Container(
                    height: 46,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: gc.danger,
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      t.deleteAction,
                      style: AppTheme.f(14, weight: FontWeight.w800, color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final repo = CommunityRepo();
    return _SheetPanel(
      title: t.optionsTitle,
      children: [
        _SheetRow(
          icon: PhosphorIconsRegular.shareNetwork,
          label: t.sharePost,
          onTap: () {
            Navigator.of(context).pop();
            showShareSheet(context, link: '$kCommunityUrl/p/${post.slug}');
          },
        ),
        _SheetRow(
          icon: post.saved ? PhosphorIconsFill.bookmarkSimple : PhosphorIconsRegular.bookmarkSimple,
          label: t.savePost,
          selected: post.saved,
          onTap: () {
            final messenger = ScaffoldMessenger.of(context);
            final wasSaved = post.saved;
            repo.toggleSave(post.id);
            Navigator.of(context).pop();
            if (!wasSaved) {
              messenger
                ..hideCurrentSnackBar()
                ..showSnackBar(SnackBar(content: Text(t.savedPost)));
            }
          },
        ),
        _SheetRow(
          icon: PhosphorIconsRegular.link,
          label: t.copyPostLink,
          onTap: () {
            final messenger = ScaffoldMessenger.of(context);
            Clipboard.setData(ClipboardData(text: '$kCommunityUrl/p/${post.slug}'));
            Navigator.of(context).pop();
            messenger
              ..hideCurrentSnackBar()
              ..showSnackBar(SnackBar(content: Text(t.linkCopied)));
          },
          trailing: Text(
            'bodybridge.net/p/${post.slug}',
            style: AppTheme.f(10.5, weight: FontWeight.w700, color: gc.textTertiary),
          ),
        ),
        _SheetRow(
          icon: PhosphorIconsRegular.eyeSlash,
          label: t.hidePost,
          onTap: () {
            final messenger = ScaffoldMessenger.of(context);
            repo.hidePost(post.id);
            Navigator.of(context).pop();
            messenger
              ..hideCurrentSnackBar()
              ..showSnackBar(SnackBar(
                content: Text(t.postHiddenSnackbar),
                action: SnackBarAction(
                  label: t.undo,
                  onPressed: () => repo.unhidePost(post.id),
                ),
              ));
          },
        ),
        if (post.isOwn) ...[
          _SheetRow(
            icon: PhosphorIconsRegular.pencilSimple,
            label: t.editPost,
            onTap: () {
              Navigator.of(context).pop();
              onEdit?.call();
            },
          ),
          _SheetRow(
            icon: PhosphorIconsRegular.trash,
            label: t.deletePost,
            danger: true,
            onTap: () => _confirmDelete(context),
          ),
        ] else
          _SheetRow(
            icon: PhosphorIconsRegular.flag,
            label: t.reportPost,
            danger: true,
            onTap: () {
              Navigator.of(context).pop();
              showReportSheet(context, post: post);
            },
          ),
      ],
    );
  }
}

void showReportSheet(BuildContext context, {required CommunityPost post}) {
  showAppSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _ReportSheet(post: post),
  );
}

class _ReportSheet extends StatefulWidget {
  const _ReportSheet({required this.post});

  final CommunityPost post;

  @override
  State<_ReportSheet> createState() => _ReportSheetState();
}

class _ReportSheetState extends State<_ReportSheet> {
  int? _reason;

  void _submit() {
    final reason = _reason;
    if (reason == null) return;
    final messenger = ScaffoldMessenger.of(context);
    CommunityRepo().reportPost(widget.post.id);
    Navigator.of(context).pop();
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(t.reportSent)));
  }

  Widget _cta(GymColors gc) {
    final enabled = _reason != null;
    return Pressable(
      onTap: enabled ? _submit : null,
      child: Container(
        height: 54,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: enabled ? gc.danger : gc.bgRaised2,
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(
          t.reportSubmit,
          style: AppTheme.f(
            15,
            weight: FontWeight.w800,
            color: enabled ? Colors.white : gc.textTertiary,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return _SheetPanel(
      title: t.reportSheetTitle,
      subtitle: t.reportAnonymous,
      footer: _cta(gc),
      children: [
        for (var i = 0; i < 3; i++)
          _SheetRow(
            icon: PhosphorIconsRegular.flag,
            label: [
              t.reportSpam,
              t.reportHarassment,
              t.reportInappropriate,
            ][i],
            selected: _reason == i,
            onTap: () => setState(() => _reason = i),
          ),
      ],
    );
  }
}

void showShareSheet(BuildContext context, {String? link}) {
  showAppSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _ShareSheet(link: link ?? kCommunityUrl),
  );
}

class _ShareSheet extends StatelessWidget {
  const _ShareSheet({required this.link});

  final String link;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return _SheetPanel(
      title: t.shareSheetTitle,
      footer: Row(
        children: [
          for (final (icon, label) in [
            (PhosphorIconsRegular.chatCircle, t.shareMessages),
            (PhosphorIconsRegular.envelopeSimple, t.shareMail),
            (PhosphorIconsRegular.instagramLogo, t.shareInstagram),
            (PhosphorIconsRegular.dotsThree, t.shareMore),
          ])
            Expanded(
              child: Column(
                children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      color: gc.bgRaised,
                      shape: BoxShape.circle,
                      border: Border.all(color: gc.border),
                    ),
                    child: Icon(icon, size: 20, color: gc.text),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    label,
                    textAlign: TextAlign.center,
                    style: AppTheme.f(11, weight: FontWeight.w700, color: gc.textSecondary),
                  ),
                ],
              ),
            ),
        ],
      ),
      children: [
        _SheetRow(
          icon: PhosphorIconsRegular.link,
          label: t.copyLink,
          onTap: () {
            final messenger = ScaffoldMessenger.of(context);
            Clipboard.setData(ClipboardData(text: link));
            Navigator.of(context).pop();
            messenger
              ..hideCurrentSnackBar()
              ..showSnackBar(SnackBar(content: Text(t.linkCopied)));
          },
        ),
      ],
    );
  }
}
