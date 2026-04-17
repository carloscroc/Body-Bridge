import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { X, Plus, Dumbbell, Flame, Clock, ChevronDown, ChevronUp, Sparkles, Copy, Check } from 'lucide-react';
import { UserWorkout, WorkoutExercise } from '../types';
import ExercisePicker from './ExercisePicker';
import EditWorkoutExerciseModal from './EditWorkoutExerciseModal';

type Section = 'warmup' | 'main' | 'cooldown';

interface CreateWorkoutProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkoutCreated: (workout: UserWorkout) => void;
  existingWorkout?: UserWorkout | null;
  calendarDateStr?: string | null;
  onCalendarAdded?: () => void;
}

const INTENSITY_OPTIONS = ['Easy', 'Medium', 'Hard'] as const;
const FOCUS_OPTIONS = ['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Core', 'Upper Body', 'Lower Body', 'Full Body'];

const normalizeOrders = (list: WorkoutExercise[]) => list.map((e, idx) => ({ ...e, order: idx }));

const parseMinutes = (ex: WorkoutExercise): number => {
  if (ex.duration) {
    const s = ex.duration.trim().toLowerCase();
    if (s.includes(':')) {
      const [mStr, sStr] = s.split(':');
      const m = parseInt(mStr || '0', 10) || 0;
      const sec = parseInt(sStr || '0', 10) || 0;
      return m + sec / 60;
    }
    if (s.includes('min')) {
      const m = parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
      return m;
    }
    const sec = parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
    return (sec || 45) / 60;
  }
  const sets = ex.sets || 3;
  return sets * 0.75;
};

const CreateWorkout: React.FC<CreateWorkoutProps> = ({ isOpen, onClose, onWorkoutCreated, existingWorkout, calendarDateStr, onCalendarAdded }) => {
  const createWorkoutMutation = useMutation(api.workouts.create);
  const updateWorkoutMutation = useMutation(api.workouts.update);
  const addToPlanMutation = useMutation(api.userPlans.addToPlan);
  const exercisesQuery = useQuery(api.exercises.advancedSearch, {});

  const [title, setTitle] = useState(existingWorkout?.title || '');
  const [description, setDescription] = useState(existingWorkout?.description || '');
  const [intensity, setIntensity] = useState<'Easy' | 'Medium' | 'Hard'>(existingWorkout?.intensity || 'Medium');
  const [selectedFocus, setSelectedFocus] = useState<string[]>(existingWorkout?.focus || []);
  const [notes, setNotes] = useState(existingWorkout?.notes || '');
  
  const allAvailableExercises = exercisesQuery?.exercises || [];

  const [warmup, setWarmup] = useState<WorkoutExercise[]>(() => normalizeOrders(existingWorkout?.warmupExercises || []));
  const [main, setMain] = useState<WorkoutExercise[]>(() => normalizeOrders(existingWorkout?.exercises || []));
  const [cooldown, setCooldown] = useState<WorkoutExercise[]>(() => normalizeOrders(existingWorkout?.cooldownExercises || []));

  const listsRef = useRef<{ warmup: WorkoutExercise[]; main: WorkoutExercise[]; cooldown: WorkoutExercise[] }>({
    warmup: [],
    main: [],
    cooldown: [],
  });

  const [showIntensityDropdown, setShowIntensityDropdown] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSection, setPickerSection] = useState<Section>('main');

  const [editState, setEditState] = useState<{ section: Section; index: number } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [showSlotDropdown, setShowSlotDropdown] = useState(false);
  const [showConfirmAnimation, setShowConfirmAnimation] = useState(false);

  const itemRefs = useRef<Record<Section, Array<HTMLDivElement | null>>>({ warmup: [], main: [], cooldown: [] });
  const sectionRefs = useRef<Record<Section, HTMLDivElement | null>>({ warmup: null, main: null, cooldown: null });

  const [dragState, setDragState] = useState<{
    section: Section;
    index: number;
    pointerId: number;
    startedAt: number;
    startX: number;
    startY: number;
  } | null>(null);

  const pendingPressRef = useRef<{
    section: Section;
    index: number;
    pointerId: number;
    startX: number;
    startY: number;
    timer: number | null;
    cancelled: boolean;
  } | null>(null);

  const [dragGhost, setDragGhost] = useState<{
    x: number;
    y: number;
    width: number;
    offsetX: number;
    offsetY: number;
    ex: WorkoutExercise;
  } | null>(null);
  const ghostRafRef = useRef<number | null>(null);
  const dragRef = useRef(dragState);
  const dragItemRef = useRef<WorkoutExercise | null>(null);
  const suppressTapRef = useRef<{ pointerId: number; until: number } | null>(null);

  useEffect(() => {
    dragRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    listsRef.current = { warmup, main, cooldown };
  }, [warmup, main, cooldown]);

  const reorderInSection = (section: Section, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const mutate = (list: WorkoutExercise[]) => {
      const next = [...list];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return normalizeOrders(next);
    };

    if (section === 'warmup') setWarmup(prev => mutate(prev));
    else if (section === 'cooldown') setCooldown(prev => mutate(prev));
    else setMain(prev => mutate(prev));
  };

  const getList = (section: Section) => (section === 'warmup' ? warmup : section === 'cooldown' ? cooldown : main);
  const getListNow = (section: Section) =>
    section === 'warmup'
      ? listsRef.current.warmup
      : section === 'cooldown'
        ? listsRef.current.cooldown
        : listsRef.current.main;
  const setList = (section: Section, next: WorkoutExercise[]) => {
    if (section === 'warmup') setWarmup(next);
    else if (section === 'cooldown') setCooldown(next);
    else setMain(next);
  };

  const moveAcrossSections = (fromSection: Section, fromIndex: number, toSection: Section, toIndex: number) => {
    if (fromSection === toSection) {
      reorderInSection(fromSection, fromIndex, toIndex);
      return;
    }
    const fromList = [...getListNow(fromSection)];
    const toList = [...getListNow(toSection)];
    const [moved] = fromList.splice(fromIndex, 1);
    if (!moved) return;

    const insertAt = Math.max(0, Math.min(toIndex, toList.length));
    toList.splice(insertAt, 0, moved);

    setList(fromSection, normalizeOrders(fromList));
    setList(toSection, normalizeOrders(toList));
  };

  useEffect(() => {
    const computeInsertIndex = (
      section: Section,
      clientY: number,
      dragging: { section: Section; index: number } | null,
    ): number => {
      const refs = itemRefs.current[section];
      const skipIndex = dragging && dragging.section === section ? dragging.index : -1;

      const candidates: Array<{ el: HTMLDivElement; originalIndex: number }> = [];
      for (let i = 0; i < refs.length; i++) {
        const el = refs[i];
        if (!el) continue;
        if (i === skipIndex) continue;
        candidates.push({ el, originalIndex: i });
      }

      let idx = candidates.length;
      for (let i = 0; i < candidates.length; i++) {
        const rect = candidates[i].el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (clientY < mid) {
          idx = i;
          break;
        }
      }
      return idx;
    };

    const findOverSection = (clientY: number, fallback: Section): Section => {
      const sections: Section[] = ['warmup', 'main', 'cooldown'];
      for (const s of sections) {
        const container = sectionRefs.current[s];
        if (!container) continue;
        const rect = container.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) return s;
      }
      return fallback;
    };

    const setDrag = (next: typeof dragState) => {
      dragRef.current = next;
      setDragState(next);
    };

    const onMove = (e: PointerEvent) => {
      const pending = pendingPressRef.current;
      const d = dragRef.current;

      // Cancel pending long-press if user starts scrolling/moving
      if (pending && e.pointerId === pending.pointerId && !d) {
        const dx = Math.abs(e.clientX - pending.startX);
        const dy = Math.abs(e.clientY - pending.startY);
        if (dx + dy > 10) {
          pending.cancelled = true;
          if (pending.timer) window.clearTimeout(pending.timer);
          pendingPressRef.current = null;
        }
        return;
      }

      if (!d) return;
      if (e.pointerId !== d.pointerId) return;

      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        e.preventDefault();
      }

      // Update ghost position (throttled)
      if (ghostRafRef.current) cancelAnimationFrame(ghostRafRef.current);
      ghostRafRef.current = requestAnimationFrame(() => {
        const ex = dragItemRef.current;
        if (!ex) return;
        setDragGhost(prev => {
          if (!prev) return prev;
          return { ...prev, x: e.clientX, y: e.clientY, ex };
        });
      });

      const overSection = findOverSection(e.clientY, d.section);

      if (overSection === d.section) {
        const toIndex = computeInsertIndex(overSection, e.clientY, { section: d.section, index: d.index });
        if (toIndex !== d.index) {
          reorderInSection(overSection, d.index, toIndex);
          setDrag({ ...d, section: overSection, index: toIndex });
        }
        return;
      }

      const toIndex = computeInsertIndex(overSection, e.clientY, null);
      moveAcrossSections(d.section, d.index, overSection, toIndex);
      setDrag({ ...d, section: overSection, index: toIndex });
    };

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (e.pointerId !== d.pointerId) return;
      suppressTapRef.current = { pointerId: d.pointerId, until: Date.now() + 250 };
      setDrag(null);
      dragItemRef.current = null;
      setDragGhost(null);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Sync local state whenever modal opens or a different workout is selected for editing.
    if (existingWorkout) {
      setTitle(existingWorkout.title || '');
      setDescription(existingWorkout.description || '');
      setIntensity(existingWorkout.intensity || 'Medium');
      setSelectedFocus(existingWorkout.focus || []);
      setNotes(existingWorkout.notes || '');
      setWarmup(normalizeOrders(existingWorkout.warmupExercises || []));
      setMain(normalizeOrders(existingWorkout.exercises || []));
      setCooldown(normalizeOrders(existingWorkout.cooldownExercises || []));
    } else {
      setTitle('');
      setDescription('');
      setIntensity('Medium');
      setSelectedFocus([]);
      setNotes('');
      setWarmup([]);
      setMain([]);
      setCooldown([]);
    }

    setCurrentStep(1);
    setShowIntensityDropdown(false);
    setPickerOpen(false);
    setEditState(null);
  }, [isOpen, existingWorkout?.id]);

  const allExercises = useMemo(() => [...warmup, ...main, ...cooldown], [warmup, main, cooldown]);

  const equipment = useMemo(() => {
    const eq = new Set<string>();
    allExercises.forEach(e => {
      const src = allAvailableExercises.find((me: any) => me._id === e.exerciseId);
      if (!src?.equipment) return;
      const eqVal = Array.isArray(src.equipment) ? src.equipment[0] : String(src.equipment);
      if (eqVal.toLowerCase() === 'none') return;
      eq.add(eqVal);
    });
    return Array.from(eq);
  }, [allExercises, allAvailableExercises]);

  const totalDuration = useMemo(() => {
    const minutes = allExercises.reduce((acc, ex) => acc + parseMinutes(ex), 0);
    return `${Math.max(5, Math.round(minutes))} min`;
  }, [allExercises]);

  const estimatedKcal = useMemo(() => {
    const minutes = parseInt(totalDuration) || 20;
    const multiplier = intensity === 'Hard' ? 12 : intensity === 'Medium' ? 9 : 6;
    return Math.round(minutes * multiplier);
  }, [intensity, totalDuration]);

  const handleFocusToggle = (focus: string) => {
    setSelectedFocus(prev => (prev.includes(focus) ? prev.filter(f => f !== focus) : [...prev, focus]));
  };

  const openPicker = (section: Section) => {
    setPickerSection(section);
    setPickerOpen(true);
  };

  const addToSection = (section: Section, ex: WorkoutExercise) => {
    const withOrder = (list: WorkoutExercise[]) => normalizeOrders([...list, { ...ex, order: list.length }]);
    if (section === 'warmup') setWarmup(prev => withOrder(prev));
    else if (section === 'cooldown') setCooldown(prev => withOrder(prev));
    else setMain(prev => withOrder(prev));
  };

  const updateInSection = (section: Section, index: number, updated: WorkoutExercise) => {
    const mutate = (list: WorkoutExercise[]) => normalizeOrders(list.map((e, i) => (i === index ? updated : e)));
    if (section === 'warmup') setWarmup(prev => mutate(prev));
    else if (section === 'cooldown') setCooldown(prev => mutate(prev));
    else setMain(prev => mutate(prev));
  };

  const removeFromSection = (section: Section, index: number) => {
    const mutate = (list: WorkoutExercise[]) => normalizeOrders(list.filter((_, i) => i !== index));
    if (section === 'warmup') setWarmup(prev => mutate(prev));
    else if (section === 'cooldown') setCooldown(prev => mutate(prev));
    else setMain(prev => mutate(prev));
  };

  const moveInSection = (section: Section, index: number, dir: -1 | 1) => {
    const mutate = (list: WorkoutExercise[]) => {
      const next = [...list];
      const swapWith = index + dir;
      if (swapWith < 0 || swapWith >= next.length) return next;
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return normalizeOrders(next);
    };
    if (section === 'warmup') setWarmup(prev => mutate(prev));
    else if (section === 'cooldown') setCooldown(prev => mutate(prev));
    else setMain(prev => mutate(prev));
  };

  const canProceed = title.trim().length > 0;
  const isEditing = !!existingWorkout;

  const saveWorkout = async () => {
    if (!title.trim()) return;
    
    const workoutData = {
      title,
      subtitle: description,
      duration: totalDuration,
      exercises: allExercises,
      completed: false,
      date: Date.now(),
    };

    let savedWorkout: any;
    if (existingWorkout) {
      await updateWorkoutMutation({
        id: existingWorkout.id as any,
        ...workoutData,
      });
      savedWorkout = { ...existingWorkout, ...workoutData };
    } else {
      const id = await createWorkoutMutation(workoutData);
      savedWorkout = { ...workoutData, id };
    }

    // If in planning mode, add to plan immediately
    if (calendarDateStr) {
      setShowConfirmAnimation(true);
      setTimeout(async () => {
        await addToPlanMutation({
          item: savedWorkout,
          type: 'workout',
          scheduledDate: calendarDateStr!,
          mealType: selectedSlot,
        });
        onWorkoutCreated(savedWorkout);
        onCalendarAdded?.();
        onClose();
      }, 600);
      return;
    }

    onWorkoutCreated(savedWorkout);
    onClose();
  };

  const templates = [
    {
      id: 'full_body_starter',
      name: 'Full Body Starter',
      description: 'A clean, balanced session you can repeat weekly.',
      intensity: 'Medium' as const,
      focus: ['Full Body', 'Strength'],
      warmupIds: ['4'],
      mainIds: ['1', '2', '3'],
      cooldownIds: ['4'],
    },
    {
      id: 'power_punch',
      name: 'Power Punch',
      description: 'Boxing conditioning with a strength punch-in.',
      intensity: 'Hard' as const,
      focus: ['Cardio', 'Core', 'Full Body'],
      warmupIds: ['4'],
      mainIds: ['5', '2', '4'],
      cooldownIds: [],
    },
    {
      id: 'lower_strength',
      name: 'Lower Strength',
      description: 'Squat + hinge focus, simple and brutal.',
      intensity: 'Medium' as const,
      focus: ['Lower Body', 'Strength'],
      warmupIds: ['4'],
      mainIds: ['1', '3', '1'],
      cooldownIds: [],
    },
  ];

  const makeWorkoutExercise = (exerciseId: string, order: number): WorkoutExercise | null => {
    const src = allAvailableExercises.find((e: any) => e.libraryId === exerciseId);
    if (!src) return null;
    const hasDuration = !!src.duration;
    return {
      exerciseId: src._id,
      name: src.name,
      image: src.imageUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
      muscleGroup: src.muscleGroup,
      sets: hasDuration ? undefined : 3,
      reps: hasDuration ? undefined : (src.reps ? src.reps.toLowerCase() : '12 reps'),
      duration: hasDuration ? src.duration : undefined,
      restSeconds: 60,
      order,
    };
  };

  const applyTemplate = (tplId: string) => {
    const tpl = templates.find(t => t.id === tplId);
    if (!tpl) return;
    setTitle(tpl.name);
    setDescription(tpl.description);
    setIntensity(tpl.intensity);
    setSelectedFocus(tpl.focus);
    setNotes('');

    const warm = tpl.warmupIds
      .map((id, idx) => makeWorkoutExercise(id, idx))
      .filter((x): x is WorkoutExercise => !!x);
    const mainList = tpl.mainIds
      .map((id, idx) => makeWorkoutExercise(id, idx))
      .filter((x): x is WorkoutExercise => !!x);
    const cool = tpl.cooldownIds
      .map((id, idx) => makeWorkoutExercise(id, idx))
      .filter((x): x is WorkoutExercise => !!x);
    setWarmup(normalizeOrders(warm));
    setMain(normalizeOrders(mainList));
    setCooldown(normalizeOrders(cool));
  };

  const renderSection = (
    section: Section,
    label: string,
    list: WorkoutExercise[],
  ) => {
    const hasAny = list.length > 0;
    return (
      <div
        className="mb-6"
        data-section={section}
        ref={(el) => {
          sectionRefs.current[section] = el;
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{label}</span>
            <span className="text-[10px] text-white/20">({list.length})</span>
          </div>
          <button
            onClick={() => openPicker(section)}
            className="flex items-center gap-2 px-4 h-10 rounded-full bg-white/5 border border-white/10 press-scale hover:bg-white/10 transition-all"
          >
            <Plus size={16} className="text-white" />
            <span className="text-[11px] font-bold text-white">Add</span>
          </button>
        </div>

        {!hasAny ? (
          <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <Dumbbell size={18} className="text-white/20" />
              <div>
                <p className="text-white/50 text-[13px] font-semibold">Nothing here yet</p>
                <p className="text-white/20 text-[11px]">Tap Add to pick an exercise for this section.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((ex, idx) => (
              <div
                key={`${section}-${ex.exerciseId}-${idx}`}
                ref={(el) => {
                  itemRefs.current[section][idx] = el;
                }}
                onPointerDown={(e) => {
                  // Long-press to start drag; quick tap opens edit.
                  if (e.pointerType === 'mouse' && e.button !== 0) return;
                  // Ignore if interacting with the action column
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-actions]')) return;

                  const pointerId = e.pointerId;
                  const startX = e.clientX;
                  const startY = e.clientY;

                  const cardEl = e.currentTarget as HTMLElement;
                  const rect = cardEl.getBoundingClientRect();

                  const timer = window.setTimeout(() => {
                    const pending = pendingPressRef.current;
                    if (!pending || pending.cancelled) return;
                    if (pending.pointerId !== pointerId) return;

                    try {
                      cardEl.setPointerCapture(pointerId);
                    } catch {
                      // ignore
                    }

                    dragItemRef.current = ex;
                    suppressTapRef.current = { pointerId, until: Date.now() + 1500 };
                    const nextDrag = { section, index: idx, pointerId, startedAt: Date.now(), startX, startY };
                    dragRef.current = nextDrag;
                    setDragState(nextDrag);
                    setDragGhost({
                      x: startX,
                      y: startY,
                      width: rect.width,
                      offsetX: startX - rect.left,
                      offsetY: startY - rect.top,
                      ex,
                    });
                  }, 180);

                  pendingPressRef.current = {
                    section,
                    index: idx,
                    pointerId,
                    startX,
                    startY,
                    timer,
                    cancelled: false,
                  };
                }}
                onPointerUp={(e) => {
                  const pending = pendingPressRef.current;
                  if (!pending || pending.pointerId !== e.pointerId) return;

                  if (pending.timer) window.clearTimeout(pending.timer);
                  pendingPressRef.current = null;

                  const suppress = suppressTapRef.current;
                  if (suppress && suppress.pointerId === e.pointerId && suppress.until > Date.now()) {
                    return;
                  }

                  // If drag is not active, treat as tap → edit
                  const d = dragRef.current;
                  if (!d) {
                    setEditState({ section, index: idx });
                  }
                }}
                onPointerCancel={(e) => {
                  const pending = pendingPressRef.current;
                  if (!pending || pending.pointerId !== e.pointerId) return;
                  if (pending.timer) window.clearTimeout(pending.timer);
                  pendingPressRef.current = null;
                }}
                style={{ touchAction: dragState ? 'none' : 'pan-y' }}
                className={
                  'bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 transition-all ' +
                  (dragState?.section === section && dragState.index === idx
                    ? 'ring-2 ring-white/30 bg-white/10 opacity-30'
                    : 'press-scale')
                }
              >
                <img src={ex.image} alt={ex.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-bold text-white truncate">{ex.name}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {ex.duration ? (
                      <span className="text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded-lg">{ex.duration}</span>
                    ) : (
                      <>
                        <span className="text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded-lg">{ex.sets || 3} sets</span>
                        <span className="text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded-lg">{ex.reps || '12 reps'}</span>
                      </>
                    )}
                    <span className="text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded-lg">Rest {ex.restSeconds ?? 60}s</span>
                    <span className="text-[10px] text-white/20">Long-press to drag</span>
                  </div>
                </div>
                <div
                  className="flex flex-col gap-2"
                  data-actions
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => removeFromSection(section, idx)}
                    className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center press-scale"
                    aria-label="Remove"
                    title="Remove"
                  >
                    <X size={14} className="text-red-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const editingExercise = editState
    ? (editState.section === 'warmup'
        ? warmup[editState.index]
        : editState.section === 'cooldown'
          ? cooldown[editState.index]
          : main[editState.index])
    : null;

  if (!isOpen) return null;

  if (showConfirmAnimation) {
    return (
      <div className="fixed inset-0 z-[500] bg-black flex items-center justify-center animate-in fade-in duration-300">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 animate-silk-up">
            <Check size={40} className="text-green-400" />
          </div>
          <h3 className="text-[24px] font-black text-white mb-2 animate-silk-up" style={{ animationDelay: '0.1s' }}>
            Created & Planned!
          </h3>
          <p className="text-white/40 text-[14px] animate-silk-up" style={{ animationDelay: '0.2s' }}>
            Workout added to {calendarDateStr}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black animate-in fade-in duration-300">
      <div className="absolute top-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-10 bg-gradient-to-b from-black via-black/80 to-transparent">
        <button onClick={onClose} className="w-11 h-11 rounded-full bg-white/10 blur-surface flex items-center justify-center border border-white/10 press-scale">
          <X size={20} className="text-white" />
        </button>
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">{isEditing ? 'Edit Workout' : 'New Workout'}</span>
        <div className="w-11" />
      </div>

      <div className="h-full overflow-y-auto custom-scrollbar pt-24 pb-32 px-6">
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2].map(step => (
            <div key={step} className="flex items-center gap-2">
              <div className={'w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ' + (currentStep >= step ? 'bg-white text-black' : 'bg-white/10 text-white/40')}>
                {step}
              </div>
              {step === 1 && <div className={'w-12 h-0.5 ' + (currentStep >= 2 ? 'bg-white' : 'bg-white/10')} />}
            </div>
          ))}
        </div>

         {currentStep === 1 ? (
          <>
            {calendarDateStr && (
              <div className="mb-6">
                <div className="flex items-center gap-3 bg-blue-500/20 border border-blue-500/30 rounded-2xl p-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center">
                    <Clock size={16} className="text-blue-200" />
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-blue-200">Planning for</div>
                    <div className="text-[14px] font-bold text-white">{calendarDateStr}</div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">
                    Select Workout Time
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowSlotDropdown(!showSlotDropdown)}
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-3xl px-6 flex items-center justify-between press-scale"
                    >
                      <div className="flex items-center gap-3">
                        <Dumbbell size={18} className="text-white/80" />
                        <span className="text-[15px] font-bold text-white capitalize">{selectedSlot}</span>
                      </div>
                      {showSlotDropdown ? <ChevronUp size={18} className="text-white/40" /> : <ChevronDown size={18} className="text-white/40" />}
                    </button>

                    {showSlotDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-3xl overflow-hidden z-20">
                        {['morning', 'afternoon', 'evening'].map((slot) => (
                          <button
                            key={slot}
                            onClick={() => {
                              setSelectedSlot(slot as 'morning' | 'afternoon' | 'evening');
                              setShowSlotDropdown(false);
                            }}
                            className={`w-full h-14 px-6 flex items-center gap-3 press-scale border-b border-white/5 last:border-b-0 ${
                              selectedSlot === slot ? 'bg-white/10' : 'hover:bg-white/5'
                            }`}
                          >
                            <Dumbbell size={18} className="text-white/80" />
                            <span className="text-[15px] font-bold text-white capitalize">{slot}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Templates</label>
                <span className="text-[10px] text-white/20">Tap to prefill</span>
              </div>
              <div className="flex gap-3 overflow-x-auto custom-scrollbar -mx-6 px-6">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t.id)}
                    className="min-w-[240px] bg-white/5 border border-white/10 rounded-3xl p-5 text-left press-scale hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-white/30" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{t.intensity}</span>
                    </div>
                    <h4 className="text-[16px] font-extrabold text-white tracking-tight">{t.name}</h4>
                    <p className="text-[12px] text-white/30 mt-1 line-clamp-2">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">Workout Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Morning Power Circuit"
                className="w-full h-16 bg-white/5 border border-white/10 rounded-3xl px-6 text-[20px] font-bold text-white placeholder:text-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"
              />
            </div>

            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What makes this workout special?"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-[15px] font-medium text-white placeholder:text-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all resize-none"
              />
            </div>

            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">Intensity Level</label>
              <div className="relative">
                <button
                  onClick={() => setShowIntensityDropdown(!showIntensityDropdown)}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-3xl px-6 flex items-center justify-between press-scale"
                >
                  <div className="flex items-center gap-3">
                    <Flame size={18} className={intensity === 'Hard' ? 'text-red-400' : intensity === 'Medium' ? 'text-orange-400' : 'text-green-400'} />
                    <span className="text-[15px] font-bold text-white">{intensity}</span>
                  </div>
                  {showIntensityDropdown ? <ChevronUp size={18} className="text-white/40" /> : <ChevronDown size={18} className="text-white/40" />}
                </button>

                {showIntensityDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-3xl overflow-hidden z-20">
                    {INTENSITY_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => {
                          setIntensity(opt);
                          setShowIntensityDropdown(false);
                        }}
                        className={'w-full h-14 px-6 flex items-center gap-3 press-scale ' + (intensity === opt ? 'bg-white/10' : '')}
                      >
                        <Flame size={18} className={opt === 'Hard' ? 'text-red-400' : opt === 'Medium' ? 'text-orange-400' : 'text-green-400'} />
                        <span className="text-[15px] font-bold text-white">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">Focus Areas</label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_OPTIONS.map(focus => (
                  <button
                    key={focus}
                    onClick={() => handleFocusToggle(focus)}
                    className={'px-4 h-10 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ' + (selectedFocus.includes(focus) ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10')}
                  >
                    {focus}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Build Your Session</label>
                <span className="text-[10px] text-white/20">Long-press and drag to reorder</span>
              </div>
              <p className="text-white/30 text-[12px] mt-2">Warm-up first, main work second, cooldown last. Tap an exercise to edit sets/reps/time/rest.</p>
            </div>

            {renderSection('warmup', 'Warm-up', warmup)}
            {renderSection('main', 'Main', main)}
            {renderSection('cooldown', 'Cool-down', cooldown)}

            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">Personal Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your own tips, reminders, or notes..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-[14px] font-medium text-white placeholder:text-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all resize-none"
              />
            </div>

            {equipment.length > 0 && (
              <div className="mb-6">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-3">Equipment Needed</label>
                <div className="flex flex-wrap gap-2">
                  {equipment.map(eq => (
                    <span key={eq} className="px-3 py-1.5 bg-white/5 rounded-full text-[10px] text-white/70">{eq}</span>
                  ))}
                </div>
              </div>
            )}

            {allExercises.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Workout Preview</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <Clock size={18} className="text-white/40 mx-auto mb-2" />
                    <span className="text-[18px] font-bold text-white block">{totalDuration}</span>
                    <span className="text-[9px] text-white/30 uppercase tracking-wider">Duration</span>
                  </div>
                  <div className="text-center">
                    <Flame size={18} className="text-white/40 mx-auto mb-2" />
                    <span className="text-[18px] font-bold text-white block">{estimatedKcal}</span>
                    <span className="text-[9px] text-white/30 uppercase tracking-wider">Calories</span>
                  </div>
                  <div className="text-center">
                    <Dumbbell size={18} className="text-white/40 mx-auto mb-2" />
                    <span className="text-[18px] font-bold text-white block">{allExercises.length}</span>
                    <span className="text-[9px] text-white/30 uppercase tracking-wider">Exercises</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-28 px-6 flex items-center gap-4 bg-gradient-to-t from-black via-black/95 to-transparent">
        {currentStep === 2 && (
          <button onClick={() => setCurrentStep(1)} className="h-14 px-8 rounded-full bg-white/10 text-white font-bold text-[12px] uppercase tracking-[0.15em] press-scale">Back</button>
        )}
        <button
          onClick={currentStep === 1 ? () => setCurrentStep(2) : saveWorkout}
          disabled={!canProceed}
          className={'flex-1 h-14 rounded-full font-bold uppercase tracking-[0.15em] text-[12px] transition-all press-scale ' + (canProceed ? 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.1)]' : 'bg-white/10 text-white/30')}
        >
          {currentStep === 1 ? 'Continue' : isEditing ? 'Save Changes' : 'Create Workout'}
        </button>
      </div>

      <ExercisePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onExerciseAdd={(ex) => {
          addToSection(pickerSection, ex);
          setPickerOpen(false);
        }}
      />

      <EditWorkoutExerciseModal
        isOpen={!!editState}
        onClose={() => setEditState(null)}
        exercise={editingExercise}
        onSave={(updated) => {
          if (!editState) return;
          updateInSection(editState.section, editState.index, updated);
        }}
      />

      {dragGhost && (
        <div
          className="fixed z-[450] pointer-events-none"
          style={{
            left: Math.round(dragGhost.x - dragGhost.offsetX),
            top: Math.round(dragGhost.y - dragGhost.offsetY),
            width: Math.round(dragGhost.width),
          }}
        >
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center gap-3 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-sm">
            <img src={dragGhost.ex.image} alt={dragGhost.ex.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-white truncate">{dragGhost.ex.name}</div>
              <div className="text-[10px] text-white/40 mt-1">Move to reorder</div>
            </div>
          </div>
        </div>
      )}

      {showIntensityDropdown && <div className="fixed inset-0 z-[250]" onClick={() => setShowIntensityDropdown(false)} />}
    </div>
  );
};

export default CreateWorkout;
