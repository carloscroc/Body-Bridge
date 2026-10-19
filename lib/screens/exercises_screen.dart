import 'dart:async';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../catalog/exercise_catalog.dart';
import '../catalog/trainer_exercises.dart';
import '../l10n/l10n.dart';
import '../models/exercise.dart';
import '../services/media_store.dart';
import '../constants/billing.dart';
import '../state/fit_state.dart';
import '../state/trainer_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/exercise_media.dart';
import '../widgets/glass.dart';
import '../widgets/premium_gate.dart';
import '../widgets/svg_icon.dart';
import '../widgets/trainer_exercise_media.dart';
import '../widgets/trainer_kit.dart';
import '../widgets/ui_kit.dart';
import 'trainer/lock_overlay.dart';

class ExercisesScreen extends StatefulWidget {
  const ExercisesScreen({super.key});
  @override
  State<ExercisesScreen> createState() => _ExercisesScreenState();
}

class _ExercisesScreenState extends State<ExercisesScreen> {
  late final TextEditingController _c = TextEditingController(text: fit.exSearch);
  bool _lockShown = false;
  final ScrollController _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    unawaited(trainer.ensureLoaded());
  }

  @override
  void dispose() {
    _c.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final list = fit.exercisesFiltered;

    return SafeArea(
      bottom: false,
      child: TrainerBannerOverlay(
        child: Stack(
          children: [
            CustomScrollView(
              controller: _scroll,
              slivers: [
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _ExercisesHeaderDelegate(this, gc),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 110),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, i) {
                        if (list.isEmpty) return _empty(gc);
                        final ex = list[i];
                        final first = i == 0 || list[i - 1].primary != ex.primary;
                        final last = i == list.length - 1 || list[i + 1].primary != ex.primary;
                        final all = fit.exSource == 'all';
                        String? banner;
                        if (all) {
                          if (i == 0) {
                            banner = fit.isTrainerSourced(ex.id)
                                ? t.sectionTrainerLibrary
                                : t.sectionFreeLibrary;
                          } else if (!fit.isTrainerSourced(ex.id) &&
                              fit.isTrainerSourced(list[i - 1].id)) {
                            banner = t.sectionFreeLibrary;
                          }
                        }
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (first) ...[
                              SizedBox(height: i == 0 ? 2 : 22),
                              if (!all)
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(4, 0, 0, 8),
                                  child: Text(
                                    _sectionLabel(ex).toUpperCase(),
                                    style: AppTheme.f(
                                      10.5,
                                      weight: FontWeight.w700,
                                      color: gc.textTertiary,
                                      letterSpacing: 1.3,
                                    ),
                                  ),
                                )
                              else if (banner != null)
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(4, 0, 0, 8),
                                  child: Text(
                                    banner.toUpperCase(),
                                    style: AppTheme.f(
                                      10.5,
                                      weight: FontWeight.w700,
                                      color: gc.textSecondary,
                                      letterSpacing: 1.3,
                                    ),
                                  ),
                                ),
                            ],
                            _row(gc, ex, first: first, last: last),
                          ],
                        );
                      },
                      childCount: list.isEmpty ? 1 : list.length,
                    ),
                  ),
                ),
              ],
            ),
            TrainerLockOverlay(visible: _lockShown, onDismiss: () => setState(() => _lockShown = false)),
          ],
        ),
      ),
    );
  }

  int get _activeFilters =>
      (fit.activePlaceId.isEmpty ? 0 : 1) +
      (fit.exMuscleFilter == null ? 0 : 1) +
      (fit.exEquipmentFilter == null ? 0 : 1) +
      (fit.exDifficultyFilter == null ? 0 : 1);

  void _clearAll() {
    _c.clear();
    fit.clearExFilters();
  }

  void _onSourceChipTap(String id) {
    if (id == 'all' || id == 'free') {
      setState(() => fit.setExSource(id));
      return;
    }
    if (!context.can(kCapCustomExercises)) {
      setState(() => _lockShown = true);
      showTrainerUpsellSheet(context).whenComplete(() {
        if (mounted) setState(() => _lockShown = false);
      });
      return;
    }
    setState(() => fit.setExSource(id));
  }

  String _sectionLabel(Exercise ex) =>
      fit.exSource == 'free' ? muscleLabel(ex.primary) : exerciseSectionLabel(ex);

  // Dockable pinned-header metrics (contract t_a9afb1b7): the delegate
  // extents cover the whole header at progress 0 and everything but the
  // title row once docked.
  static const double _headerMaxExtent = 210;
  static const double _headerMinExtent = 160;

  Widget _headerContent(BuildContext context, GymColors gc, double progress) {
    final advanced = context.can(kCapCustomExercises);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Title row collapses and fades as the header docks.
          ClipRect(
            child: Align(
              alignment: Alignment.topCenter,
              heightFactor: 1 - progress,
              child: Opacity(
                opacity: 1 - progress,
                child: Row(
                  children: [
                    Expanded(child: ScreenTitle(t.exercises)),
                    // FREE limit: custom exercises (trainer_features) are hidden
                    // entirely for tiers without the capability.
                    if (advanced) ...[
                      RoundAction(
                        size: 38,
                        label: t.newExercise,
                        onTap: () => showCreateExerciseSheet(context),
                        child: Icon(PhosphorIconsRegular.plus, size: 17, color: gc.text),
                      ),
                      const SizedBox(width: 10),
                    ],
                    const ExercisesCoachDisc(),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SearchField(controller: _c, hint: t.searchExercises, onChanged: fit.setExSearch),
          const SizedBox(height: 10),
          _sourceChips(context, gc),
          const SizedBox(height: 10),
          _quickChips(context, gc),
        ],
      ),
    );
  }

  /// Quiet source chips (contract t_a9afb1b7): All/Free/Trainer/Custom with
  /// true per-tier counts; gated taps open the lock UX and keep the source.
  Widget _sourceChips(BuildContext context, GymColors gc) {
    final source = fit.exSource;
    final dark = Theme.of(context).brightness == Brightness.dark;
    final counts = {
      'all': fit.allExercises.length + trainerExercises.length + assignedExercises.length,
      'free': fit.allExercises.length,
      'trainer': trainerExercises.length,
      'custom': assignedExercises.length,
    };
    final chips = [
      ('all', t.sourceAll, 'chip-all'),
      ('free', t.sourceFree, 'chip-free'),
      ('trainer', t.sourceTrainer, 'chip-trainer'),
      ('custom', t.sourceCustom, 'chip-custom'),
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final (id, label, chipKey) in chips) ...[
            GestureDetector(
              key: ValueKey(chipKey),
              behavior: HitTestBehavior.opaque,
              onTap: () => _onSourceChipTap(id),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: source == id ? gc.accent : Colors.transparent,
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  '$label ${counts[id] ?? 0}',
                  style: AppTheme.f(
                    12.5,
                    weight: source == id ? FontWeight.w700 : FontWeight.w500,
                    color: source == id ? (dark ? gc.pageBg : gc.onEmber) : gc.textSecondary,
                  ),
                ),
              ),
            ),
            if (id != 'custom') const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }

  Widget _quickChips(BuildContext context, GymColors gc) {
    final active = _activeFilters;
    final anyOn = active > 0 || fit.exNoGearOnly || fit.exFavouritesOnly;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          Pill(
            label: active > 0 ? '${t.filters} · $active' : t.filters,
            bg: active > 0 ? gc.ember : gc.bgRaised2,
            fg: active > 0 ? gc.onEmber : gc.textSecondary,
            onTap: () => showExerciseFilters(context, onClear: _c.clear),
            hPad: 14,
            vPad: 7,
            fontSize: 12.5,
          ),
          const SizedBox(width: 8),
          Pill(
            label: fit.favouriteCount > 0 ? '${t.favouritesOnly} · ${fit.favouriteCount}' : t.favouritesOnly,
            bg: fit.exFavouritesOnly ? gc.ember : gc.bgRaised2,
            fg: fit.exFavouritesOnly ? gc.onEmber : gc.textSecondary,
            onTap: fit.toggleFavouritesFilter,
            hPad: 14,
            vPad: 7,
            fontSize: 12.5,
          ),
          const SizedBox(width: 8),
          Pill(
            label: t.noGearOnly,
            bg: fit.exNoGearOnly ? gc.ember : gc.bgRaised2,
            fg: fit.exNoGearOnly ? gc.onEmber : gc.textSecondary,
            onTap: fit.toggleNoGearFilter,
            hPad: 14,
            vPad: 7,
            fontSize: 12.5,
          ),
          if (anyOn) ...[
            const SizedBox(width: 8),
            Pill(
              label: t.clearFilters,
              bg: Colors.transparent,
              fg: gc.accent,
              onTap: _clearAll,
              hPad: 10,
              vPad: 7,
              fontSize: 12.5,
            ),
          ],
        ],
      ),
    );
  }

  Widget _empty(GymColors gc) {
    final noFavs = fit.exFavouritesOnly && fit.favouriteCount == 0;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
      child: Column(
        children: [
          if (noFavs)
            _star(gc, false)
          else
            SvgPathIcon(
              const [
                IconPath('M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0', strokeWidth: 1.5),
                IconPath('M21 21l-4.35-4.35', strokeWidth: 1.5),
              ],
              size: 40,
              color: gc.textTertiary,
            ),
          const SizedBox(height: 10),
          Text(
            noFavs ? t.noFavouritesYet : t.noExercisesFound,
            style: AppTheme.f(15.5, weight: FontWeight.w700, color: gc.text),
          ),
          const SizedBox(height: 4),
          Text(
            noFavs ? t.noFavouritesHint : t.noExercisesHint,
            textAlign: TextAlign.center,
            style: AppTheme.f(13, weight: FontWeight.w500, color: gc.textSecondary),
          ),
          const SizedBox(height: 16),
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: _clearAll,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Text(
                t.clearFilters,
                style: AppTheme.f(13, weight: FontWeight.w600, color: gc.accent),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _row(GymColors gc, Exercise ex, {required bool first, required bool last}) {
    final fav = fit.favorites[ex.id] ?? false;
    // Trainer-sourced rows (tr-/as-) stay locked until entitlement
    // (exercises-trainer.html); user customs (c…) are never locked.
    final locked = !context.can(kCapCustomExercises) && fit.isTrainerSourced(ex.id);
    return Container(
      decoration: BoxDecoration(
        color: gc.bgRaised,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(first ? 20 : 0),
          bottom: Radius.circular(last ? 20 : 0),
        ),
      ),
      child: Column(
        children: [
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () {
              if (locked) {
                setState(() => _lockShown = true);
                showTrainerUpsellSheet(context).whenComplete(() {
                  if (mounted) setState(() => _lockShown = false);
                });
                return;
              }
              fit.openExercise(ex.id);
            },
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 9, 6, 9),
              child: Row(
                children: [
                  SizedBox(
                    width: 52,
                    child: fit.isTrainerSourced(ex.id)
                        ? TrainerExerciseMedia(ex: ex, height: 52, radius: 15)
                        : ExerciseMedia(ex: ex, height: 52, radius: 15, bordered: false),
                  ),
                  const SizedBox(width: 13),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                exerciseName(ex),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppTheme.f(14.5, weight: FontWeight.w600, color: gc.text),
                              ),
                            ),
                            if (fit.isTrainerSourced(ex.id)) ...[
                              const SizedBox(width: 5),
                              // Locked rows carry the brass LOCKED chip instead
                              // of the ADVANCED badge (exercises-trainer.html).
                              if (locked)
                                _lockChip(gc)
                              else
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: gc.textTertiary.withValues(alpha: 0.16),
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                  child: Text(
                                    t.advancedBadge,
                                    style: AppTheme.f(
                                      7.5,
                                      weight: FontWeight.w800,
                                      color: gc.textSecondary,
                                      letterSpacing: 0.2,
                                    ),
                                  ),
                                ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${t.equipment(ex.equipment)} · ${t.difficulty(ex.difficulty)}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTheme.f(12, weight: FontWeight.w500, color: gc.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => fit.toggleFavorite(ex.id),
                    child: Padding(padding: const EdgeInsets.all(10), child: _star(gc, fav)),
                  ),
                ],
              ),
            ),
          ),
          if (!last)
            Container(
              margin: const EdgeInsets.only(left: 77),
              height: 1,
              color: gc.border.withValues(alpha: 0.55),
            ),
        ],
      ),
    );
  }

  /// LOCKED pill for gated source rows (exercises-trainer.html): brass tint,
  /// padlock glyph + uppercase label, 22px tall.
  Widget _lockChip(GymColors gc) {
    return Container(
      height: 22,
      padding: const EdgeInsets.symmetric(horizontal: 9),
      decoration: BoxDecoration(
        color: gc.brass.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(PhosphorIconsRegular.lockSimple, size: 11, color: gc.brass),
          const SizedBox(width: 5),
          Text(
            t.srcLocked,
            style: AppTheme.f(9,
                weight: FontWeight.w800, color: gc.brass, letterSpacing: 1),
          ),
        ],
      ),
    );
  }

  Widget _star(GymColors gc, bool fav) {
    return SizedBox(
      width: 18,
      height: 18,
      child: Stack(
        children: [
          if (fav)
            SvgPathIcon(
              const [
                IconPath(
                  'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01z',
                  fill: true,
                ),
              ],
              size: 18,
              color: gc.accent,
            ),
          SvgPathIcon(Ic.star, size: 18, color: fav ? gc.accent : gc.textTertiary),
        ],
      ),
    );
  }
}

/// Dockable pinned header (contract t_a9afb1b7): opaque bg, title row
/// collapses/fades with shrinkOffset, lock scrim hangs below the header's
/// current bottom edge while the lock UX is up.
class _ExercisesHeaderDelegate extends SliverPersistentHeaderDelegate {
  _ExercisesHeaderDelegate(this.state, this.gc);

  final _ExercisesScreenState state;
  final GymColors gc;

  @override
  double get maxExtent => _ExercisesScreenState._headerMaxExtent;

  @override
  double get minExtent => _ExercisesScreenState._headerMinExtent;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final range = maxExtent - minExtent;
    final progress = range <= 0 ? 0.0 : (shrinkOffset / range).clamp(0.0, 1.0).toDouble();
    return Stack(
      clipBehavior: Clip.none,
      children: [
        ColoredBox(
          color: gc.bg,
          child: state._headerContent(context, gc, progress),
        ),
        // Scrim starts at the header's current bottom edge and runs past the
        // list (Clip.none lets it overflow the header box).
        Positioned(
          top: maxExtent - shrinkOffset,
          left: 0,
          right: 0,
          height: 4000,
          child: TrainerLockScrim(visible: state._lockShown),
        ),
      ],
    );
  }

  @override
  bool shouldRebuild(covariant _ExercisesHeaderDelegate oldDelegate) => true;
}

class _FilterChipData {
  _FilterChipData(this.label, this.active, this.onTap);
  final String label;
  final bool active;
  final VoidCallback onTap;
}

void showCreateExerciseSheet(BuildContext context, {void Function(String id)? onCreated, Exercise? editing}) {
  final gc = context.gc;
  final nameCtrl = TextEditingController(text: editing?.name ?? '');
  final stepsCtrl = TextEditingController(text: editing?.steps.join('\n') ?? '');
  String muscle = editing?.primary ?? kMuscles.first.id;
  String equipment = editing?.equipment ?? kEquipment.first;
  String difficulty = editing?.difficulty ?? kDifficulties.first;
  String mode = editing?.mode ?? '';
  bool advanced = false;
  String? mediaPath;
  bool busy = false;
  showAppSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: gc.bgRaised,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (sheetCtx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(sheetCtx).viewInsets.bottom),
      child: StatefulBuilder(
        builder: (sheetCtx, setSheet) {
          final mediaIsVideo = mediaPath != null && MediaStore.isVideo(mediaPath!);
          Future<void> pickMedia() async {
            try {
              final res = await FilePicker.platform.pickFiles(type: FileType.media);
              final path = res?.files.single.path;
              if (path != null) setSheet(() => mediaPath = path);
            } catch (_) {}
          }

          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    titleCase(editing == null ? t.newExercise : t.editExercise),
                    style: AppTheme.f(19, weight: FontWeight.w800, color: gc.text),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: nameCtrl,
                    autofocus: editing == null,
                    style: AppTheme.f(15, weight: FontWeight.w500, color: gc.text),
                    cursorColor: gc.accent,
                    textCapitalization: TextCapitalization.words,
                    decoration: InputDecoration(
                      hintText: t.exerciseName,
                      hintStyle: AppTheme.f(15, weight: FontWeight.w500, color: gc.textTertiary),
                      filled: true,
                      fillColor: gc.bgRaised2,
                      contentPadding: const EdgeInsets.all(14),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(color: gc.border),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(color: gc.accent),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _filterLabel(gc, t.muscleFilter),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final m in kMuscles)
                        Pill(
                          label: t.muscle(m.id),
                          bg: muscle == m.id ? gc.ember : gc.bgRaised2,
                          fg: muscle == m.id ? gc.onEmber : gc.textSecondary,
                          onTap: () => setSheet(() => muscle = m.id),
                          vPad: 7,
                          fontSize: 12,
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _filterLabel(gc, t.equipmentLabel),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final e in kEquipment)
                        Pill(
                          label: t.equipment(e),
                          bg: equipment == e ? gc.ember : gc.bgRaised2,
                          fg: equipment == e ? gc.onEmber : gc.textSecondary,
                          onTap: () => setSheet(() => equipment = e),
                          vPad: 7,
                          fontSize: 12,
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _filterLabel(gc, t.levelFilter),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final d in kDifficulties)
                        Pill(
                          label: t.difficulty(d),
                          bg: difficulty == d ? gc.ember : gc.bgRaised2,
                          fg: difficulty == d ? gc.onEmber : gc.textSecondary,
                          onTap: () => setSheet(() => difficulty = d),
                          vPad: 7,
                          fontSize: 12,
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _filterLabel(gc, t.exerciseTypeLabel),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final (id, label) in [
                        ('', t.typeReps),
                        ('time', t.typeTime),
                        ('cardio', t.typeCardio),
                      ])
                        Pill(
                          label: label,
                          bg: mode == id ? gc.ember : gc.bgRaised2,
                          fg: mode == id ? gc.onEmber : gc.textSecondary,
                          onTap: () => setSheet(() => mode = id),
                          vPad: 7,
                          fontSize: 12,
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _filterLabel(gc, t.howToLabel),
                  const SizedBox(height: 8),
                  TextField(
                    controller: stepsCtrl,
                    minLines: 3,
                    maxLines: 8,
                    keyboardType: TextInputType.multiline,
                    textCapitalization: TextCapitalization.sentences,
                    style: AppTheme.f(14, weight: FontWeight.w500, color: gc.text, height: 1.45),
                    cursorColor: gc.accent,
                    decoration: InputDecoration(
                      hintText: t.howToHint,
                      hintStyle: AppTheme.f(14, weight: FontWeight.w500, color: gc.textTertiary),
                      filled: true,
                      fillColor: gc.bgRaised2,
                      contentPadding: const EdgeInsets.all(14),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(color: gc.border),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(color: gc.accent),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (editing == null)
                    GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => setSheet(() => advanced = !advanced),
                      child: Row(
                        children: [
                          Icon(
                            advanced ? PhosphorIconsRegular.caretDown : PhosphorIconsRegular.caretRight,
                            size: 16,
                            color: gc.textSecondary,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            t.advanced,
                            style: AppTheme.f(
                              11,
                              weight: FontWeight.w700,
                              color: gc.textSecondary,
                              letterSpacing: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (advanced) ...[
                    const SizedBox(height: 12),
                    _filterLabel(gc, t.demoMedia),
                    const SizedBox(height: 8),
                    if (mediaPath == null)
                      GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: pickMedia,
                        child: Container(
                          height: 120,
                          decoration: BoxDecoration(
                            color: gc.bgRaised2,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: gc.border),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(PhosphorIconsRegular.uploadSimple, size: 26, color: gc.textSecondary),
                              const SizedBox(height: 8),
                              Text(
                                t.addMedia,
                                style: AppTheme.f(13.5, weight: FontWeight.w600, color: gc.textSecondary),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                t.mediaHint,
                                style: AppTheme.f(11.5, weight: FontWeight.w500, color: gc.textTertiary),
                              ),
                            ],
                          ),
                        ),
                      )
                    else
                      Stack(
                        children: [
                          Container(
                            height: 160,
                            decoration: BoxDecoration(
                              color: gc.bgRaised2,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: gc.border),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: mediaIsVideo
                                ? Center(
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(PhosphorIconsFill.playCircle, size: 40, color: gc.textSecondary),
                                        const SizedBox(height: 6),
                                        Text(
                                          t.videoSelected,
                                          style: AppTheme.f(
                                            12,
                                            weight: FontWeight.w500,
                                            color: gc.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  )
                                : Center(
                                    child: Image.file(
                                      File(mediaPath!),
                                      fit: BoxFit.contain,
                                      alignment: Alignment.center,
                                    ),
                                  ),
                          ),
                          Positioned(
                            top: 8,
                            right: 8,
                            child: GestureDetector(
                              onTap: () => setSheet(() => mediaPath = null),
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: gc.bg.withValues(alpha: 0.8),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(PhosphorIconsRegular.x, size: 14, color: gc.text),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 8,
                            right: 8,
                            child: GestureDetector(
                              onTap: pickMedia,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: gc.bg.withValues(alpha: 0.8),
                                  borderRadius: BorderRadius.circular(100),
                                ),
                                child: Text(
                                  t.changeMedia,
                                  style: AppTheme.f(11.5, weight: FontWeight.w600, color: gc.text),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                  ],
                  const SizedBox(height: 20),
                  PrimaryButton(
                    label: editing == null ? t.addExercise : t.saveChanges,
                    onTap: () async {
                      if (busy || nameCtrl.text.trim().isEmpty) return;
                      busy = true;
                      final steps = stepsCtrl.text.split('\n');
                      if (editing != null) {
                        fit.updateCustomExercise(
                          editing.id,
                          name: nameCtrl.text,
                          primary: muscle,
                          equipment: equipment,
                          difficulty: difficulty,
                          steps: steps,
                          mode: mode,
                        );
                        Navigator.pop(sheetCtx);
                        return;
                      }
                      final id = fit.addCustomExercise(
                        name: nameCtrl.text,
                        primary: muscle,
                        equipment: equipment,
                        difficulty: difficulty,
                        steps: steps,
                        mode: mode,
                      );
                      if (mediaPath != null) {
                        await fit.attachExerciseMedia(id, mediaPath!);
                      }
                      if (!sheetCtx.mounted) return;
                      Navigator.pop(sheetCtx);
                      if (onCreated != null) {
                        onCreated(id);
                      } else {
                        fit.openExercise(id);
                      }
                    },
                  ),
                ],
              ),
            ),
          );
        },
      ),
    ),
  );
}

void _clearFilters(VoidCallback? onClear) {
  fit.clearExFilters();
  onClear?.call();
}

void showExerciseFilters(BuildContext context, {VoidCallback? onClear}) {
  final gc = context.gc;
  showAppSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (sheet) => StatefulBuilder(
      builder: (sheet, setSheet) => Container(
        padding: sheetPad(sheet),
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(sheet).height * 0.85),
        decoration: BoxDecoration(
          color: gc.bgRaised,
          border: Border.all(color: gc.border),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SheetHandle(),
              const SizedBox(height: 18),
              Text(
                titleCase(t.filters),
                textAlign: TextAlign.center,
                style: AppTheme.f(19, weight: FontWeight.w800, color: gc.text),
              ),
              const SizedBox(height: 18),
              _filterLabel(gc, t.placeFilterLabel),
              const SizedBox(height: 8),
              _chipRow(
                [
                  _FilterChipData(
                    t.placeAll,
                    fit.activePlaceId.isEmpty,
                    () => setSheet(() => fit.setActivePlace('')),
                  ),
                  for (final place in fit.places)
                    _FilterChipData(
                      place.name,
                      fit.activePlaceId == place.id,
                      () => setSheet(() => fit.setActivePlace(place.id)),
                    ),
                  _FilterChipData(fit.places.isEmpty ? t.placeNew : '+', false, () {
                    Navigator.pop(sheet);
                    fit.goPlaces();
                  }),
                ],
                gc,
                hPad: 14,
                vPad: 8,
                fontSize: 13,
              ),
              const SizedBox(height: 16),
              _filterLabel(gc, t.muscleFilter),
              const SizedBox(height: 8),
              _chipRow(
                [
                  for (final id in kFilterMuscles)
                    _FilterChipData(
                      muscleLabel(id),
                      fit.exMuscleFilter == id,
                      () => setSheet(() => fit.setMuscleFilter(id)),
                    ),
                ],
                gc,
                hPad: 14,
                vPad: 8,
                fontSize: 13,
              ),
              const SizedBox(height: 16),
              _filterLabel(gc, t.equipmentLabel),
              const SizedBox(height: 8),
              _chipRow(
                [
                  _FilterChipData(t.noGearOnly, fit.exNoGearOnly, () => setSheet(fit.toggleNoGearFilter)),
                  for (final e in kFilterEquipment)
                    _FilterChipData(
                      t.equipment(e),
                      fit.exEquipmentFilter == e,
                      () => setSheet(() => fit.setEquipmentFilter(e)),
                    ),
                ],
                gc,
                hPad: 12,
                vPad: 6,
                fontSize: 12,
              ),
              const SizedBox(height: 16),
              _filterLabel(gc, t.levelFilter),
              const SizedBox(height: 8),
              _chipRow(
                [
                  for (final d in kDifficulties)
                    _FilterChipData(
                      t.difficulty(d),
                      fit.exDifficultyFilter == d,
                      () => setSheet(() => fit.setDifficultyFilter(d)),
                    ),
                ],
                gc,
                hPad: 12,
                vPad: 6,
                fontSize: 12,
              ),
              const SizedBox(height: 22),
              PrimaryButton(
                label: t.libraryCount(fit.exercisesFiltered.length),
                onTap: () => Navigator.pop(sheet),
              ),
              const SizedBox(height: 6),
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => setSheet(() => _clearFilters(onClear)),
                child: Container(
                  height: 44,
                  alignment: Alignment.center,
                  child: Text(
                    t.clearFilters,
                    style: AppTheme.f(13, weight: FontWeight.w600, color: gc.accent),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

Widget _filterLabel(GymColors gc, String label) => Text(
  label.toUpperCase(),
  style: AppTheme.f(10.5, weight: FontWeight.w700, color: gc.textTertiary, letterSpacing: 1.3),
);

Widget _chipRow(
  List<_FilterChipData> chips,
  GymColors gc, {
  required double hPad,
  required double vPad,
  required double fontSize,
}) {
  return SingleChildScrollView(
    scrollDirection: Axis.horizontal,
    child: Row(
      children: [
        for (int i = 0; i < chips.length; i++) ...[
          Pill(
            label: chips[i].label,
            bg: chips[i].active ? gc.ember : gc.bgRaised2,
            fg: chips[i].active ? gc.onEmber : gc.textSecondary,
            onTap: chips[i].onTap,
            hPad: hPad,
            vPad: vPad,
            fontSize: fontSize,
          ),
          if (i < chips.length - 1) const SizedBox(width: 8),
        ],
      ],
    ),
  );
}
