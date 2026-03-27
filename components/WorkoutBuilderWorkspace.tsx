import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  X, Plus, Check, Dumbbell, Clock, ChevronRight, 
  Trash2, Play, Pause, Layers, Calendar, Edit2, 
  Flame, Zap, ChevronDown, ChevronUp, Save, Search, 
  ArrowRight, GripVertical, ChevronLeft
} from 'lucide-react';
import { Exercise, UserWorkout, WorkoutExercise, Workout, WorkoutFormat } from '../types';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import ExercisePicker from './ExercisePicker';
import EditWorkoutExerciseModal from './EditWorkoutExerciseModal';

interface WorkoutBuilderWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  onStartWorkout?: (workout: Workout) => void;
  onGoToCalendar?: () => void;
}

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

const WorkoutBuilderWorkspace: React.FC<WorkoutBuilderWorkspaceProps> = ({ 
  isOpen, 
  onClose, 
  exercise,
  onStartWorkout,
  onGoToCalendar
}) => {
  // --- CONVEX ---
  const workouts = useQuery(api.workouts.getUserWorkouts) || [];
  const createWorkoutMutation = useMutation(api.workouts.create);
  const updateWorkoutMutation = useMutation(api.workouts.update);
  const addToPlanMutation = useMutation(api.userPlans.addToPlan);

  // --- STATE ---
  const [activeWorkout, setActiveWorkout] = useState<UserWorkout | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<WorkoutFormat>(WorkoutFormat.USER_PACED);
  
  // Current exercise configuration
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('12');
  const [useDuration, setUseDuration] = useState(false);
  const [duration, setDuration] = useState('45s');
  const [restSeconds, setRestSeconds] = useState(60);
  const [placement, setPlacement] = useState<'warmup' | 'main' | 'cooldown'>('main');

  // UI States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editState, setEditState] = useState<{ section: 'warmup' | 'main' | 'cooldown'; index: number } | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddToast, setShowAddToast] = useState(false);
  const [summaryPulse, setSummaryPulse] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  // --- CALENDAR LOGIC ---
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  const daysInMonth = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const result = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let i = 1; i <= days; i++) result.push(new Date(year, month, i));
    return result;
  }, [calendarMonth]);

  const monthName = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));

  // --- INITIALIZATION ---
  useEffect(() => {
    if (isOpen) {
      setJustSaved(false);
      
      if (exercise?.duration) {
        setUseDuration(true);
        setDuration(exercise.duration);
      } else if (exercise?.reps) {
        setUseDuration(false);
        setReps(exercise.reps.replace(/[^0-9]/g, ''));
      }

      if (!activeWorkout) {
        const d = new Date().toISOString();
        const fresh: UserWorkout = {
          id: `draft_${Date.now()}`,
          title: 'NEW WORKOUT',
          description: 'Custom training routine',
          intensity: 'Medium',
          image: exercise?.image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
          format: WorkoutFormat.USER_PACED,
          focus: exercise ? [exercise.muscleGroup] : [],
          warmupExercises: [],
          exercises: [],
          cooldownExercises: [],
          equipment: exercise ? [exercise.equipment] : [],
          createdAt: d,
          updatedAt: d,
          totalDuration: '0 min',
          estimatedKcal: 0
        };
        setActiveWorkout(fresh);
        setTitleValue(fresh.title);
      }
    }
  }, [isOpen, exercise]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  // --- LOGIC ---
  const updateStats = (workout: UserWorkout) => {
    const totalEx = (workout.warmupExercises?.length || 0) + (workout.exercises.length) + (workout.cooldownExercises?.length || 0);
    workout.totalDuration = `${totalEx * 5} min`;
    workout.estimatedKcal = totalEx * 25;
    return workout;
  };

  const getCurrentExerciseAsWorkoutExercise = (): WorkoutExercise => ({
    exerciseId: exercise?.id || '',
    name: exercise?.name || '',
    image: exercise?.image || '',
    muscleGroup: exercise?.muscleGroup || '',
    sets: useDuration ? undefined : sets,
    reps: useDuration ? undefined : `${reps} reps`,
    duration: useDuration ? duration : undefined,
    restSeconds,
    order: 0,
    videoUrl: exercise?.videoUrl
  });

  const handleAddCurrentToActive = () => {
    if (!activeWorkout || !exercise) return;
    setIsAdding(true);
    setShowAddToast(true);

    const newEx = getCurrentExerciseAsWorkoutExercise();
    const updated = { ...activeWorkout };
    
    if (placement === 'warmup') updated.warmupExercises = [...(updated.warmupExercises || []), newEx];
    else if (placement === 'cooldown') updated.cooldownExercises = [...(updated.cooldownExercises || []), newEx];
    else updated.exercises = [...(updated.exercises || []), newEx];

    const combinedCount = (updated.warmupExercises?.length || 0) + updated.exercises.length + (updated.cooldownExercises?.length || 0);
    if (combinedCount === 1 && updated.title === 'NEW WORKOUT') {
      updated.title = `${exercise.name.toUpperCase()} WORKOUT`;
      setTitleValue(updated.title);
    }

    updated.format = selectedFormat;
    setActiveWorkout(updateStats(updated));

    setTimeout(() => {
      setIsAdding(false);
      summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSummaryPulse(true);
      setTimeout(() => setSummaryPulse(false), 900);
    }, 600);

    setTimeout(() => setShowAddToast(false), 1100);
  };

  const moveExercise = (section: 'warmup' | 'main' | 'cooldown', index: number, dir: -1 | 1) => {
    if (!activeWorkout) return;
    const updated = { ...activeWorkout };
    const getList = () => {
        if (section === 'warmup') return updated.warmupExercises || [];
        if (section === 'cooldown') return updated.cooldownExercises || [];
        return updated.exercises;
    };
    const setList = (newList: WorkoutExercise[]) => {
        if (section === 'warmup') updated.warmupExercises = newList;
        else if (section === 'cooldown') updated.cooldownExercises = newList;
        else updated.exercises = newList;
    };

    const list = [...getList()];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    list.forEach((ex, i) => { ex.order = i; });
    setList(list);
    setActiveWorkout(updated);
  };

  const handleRemoveExercise = (section: 'warmup' | 'main' | 'cooldown', index: number) => {
    if (!activeWorkout) return;
    const updated = { ...activeWorkout };
    if (section === 'warmup') updated.warmupExercises = (updated.warmupExercises || []).filter((_, i) => i !== index);
    else if (section === 'cooldown') updated.cooldownExercises = (updated.cooldownExercises || []).filter((_, i) => i !== index);
    else updated.exercises = updated.exercises.filter((_, i) => i !== index);
    setActiveWorkout(updateStats(updated));
  };

  const handleSaveWorkout = async () => {
    if (!activeWorkout) return;
    const workoutToSave = { ...activeWorkout };
    if (!workoutToSave.format) workoutToSave.format = selectedFormat;
    
    if (workoutToSave.id.startsWith('draft_')) {
      const newId = await createWorkoutMutation({
        title: workoutToSave.title,
        subtitle: workoutToSave.description,
        duration: workoutToSave.totalDuration,
        exercises: [...(workoutToSave.warmupExercises || []), ...workoutToSave.exercises, ...(workoutToSave.cooldownExercises || [])],
        completed: false,
        date: Date.now(),
      });
      setActiveWorkout({ ...workoutToSave, id: newId });
    } else {
      await updateWorkoutMutation({
        id: workoutToSave.id as any,
        title: workoutToSave.title,
        subtitle: workoutToSave.description,
        duration: workoutToSave.totalDuration,
        exercises: [...(workoutToSave.warmupExercises || []), ...workoutToSave.exercises, ...(workoutToSave.cooldownExercises || [])],
      });
    }

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleAddToPlan = async () => {
    if (!activeWorkout) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    let finalWorkout = { ...activeWorkout };
    const combinedCount = (finalWorkout.warmupExercises?.length || 0) + finalWorkout.exercises.length + (finalWorkout.cooldownExercises?.length || 0);
    
    if (combinedCount === 0 && exercise) {
        finalWorkout.exercises = [getCurrentExerciseAsWorkoutExercise()];
        finalWorkout = updateStats(finalWorkout);
    }

    await addToPlanMutation({
      item: finalWorkout,
      type: 'workout',
      scheduledDate: dateStr,
      mealType: 'morning',
    });
    setShowDatePicker(false);
    onGoToCalendar?.();
  };

  const handleStartNow = () => {
    if (!activeWorkout || !onStartWorkout) return;
    
    let combined = [...(activeWorkout.warmupExercises || []), ...activeWorkout.exercises, ...(activeWorkout.cooldownExercises || [])];
    
    if (combined.length === 0 && exercise) {
      combined = [getCurrentExerciseAsWorkoutExercise()];
    }

    if (combined.length === 0) return;

    const workoutForPlayer: Workout = {
      id: activeWorkout.id,
      title: activeWorkout.title,
      coach: 'You',
      duration: activeWorkout.totalDuration || '20 min',
      intensity: activeWorkout.intensity,
      kcal: activeWorkout.estimatedKcal || 200,
      image: activeWorkout.image,
      description: activeWorkout.description,
      focus: activeWorkout.focus,
      equipment: activeWorkout.equipment,
      coachNotes: activeWorkout.notes || '',
      exercises: combined.map(we => ({
        id: we.exerciseId, name: we.name, image: we.image, category: 'Custom',
        muscleGroup: we.muscleGroup, equipment: 'Various', difficulty: 'Medium',
        duration: we.duration, reps: we.reps, videoUrl: we.videoUrl
      })),
      isCustom: true
    };
    onStartWorkout(workoutForPlayer);
    onClose();
  };

  const selectExistingWorkout = (w: any) => {
    const mapped: UserWorkout = {
      ...w,
      id: w._id,
      warmupExercises: [],
      cooldownExercises: [],
      focus: w.focus || [],
      equipment: w.equipment || [],
      updatedAt: new Date(w._creationTime).toISOString(),
    };
    setActiveWorkout(mapped);
    setTitleValue(w.title);
  };

  const editingExercise = editState
    ? (editState.section === 'warmup' ? activeWorkout?.warmupExercises?.[editState.index]
        : editState.section === 'cooldown' ? activeWorkout?.cooldownExercises?.[editState.index]
        : activeWorkout?.exercises[editState.index])
    : null;

  if (!exercise) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="workout-builder"
          className="fixed inset-0 z-[400] bg-black flex flex-col overflow-hidden"
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 22, scale: 0.985 }}
          transition={{ duration: 0.55, ease: easeOutExpo }}
        >
      {/* 1. Header */}
      <div className="h-20 px-8 flex items-center justify-between z-10 bg-black/40 blur-surface border-b border-white/5 flex-shrink-0">
        <button onClick={onClose} className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center border border-white/10 press-scale">
          <X size={20} className="text-white/60" />
        </button>

        <div className="flex-1 px-8 text-center">
          {isEditingTitle ? (
            <input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={() => { setIsEditingTitle(false); if (activeWorkout) setActiveWorkout({ ...activeWorkout, title: titleValue }); }}
              className="bg-transparent text-white text-[18px] font-black tracking-tighter w-full text-center focus:outline-none uppercase italic"
            />
          ) : (
            <button onClick={() => setIsEditingTitle(true)} className="flex items-center justify-center gap-2 group mx-auto">
              <h1 className="text-[18px] font-black tracking-tighter text-white uppercase italic">{activeWorkout?.title || 'NEW WORKOUT'}</h1>
              <Edit2 size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
            </button>
          )}
          <div className="mt-2">
            <p className="text-[11px] text-white/40">Name of the workout</p>
          </div>
        </div>

        <button onClick={handleSaveWorkout} className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all press-scale ${justSaved ? 'bg-green-500 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/5 border-white/10 text-white/40'}`}>
          {justSaved ? <Check size={20} /> : <Save size={20} />}
        </button>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">

        {/* 2. Configure Exercise */}
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">1. Configure Exercise</span>
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {showAddToast && (
                  <motion.span
                    initial={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
                    transition={{ duration: 0.25, ease: easeOutExpo }}
                    className="text-[10px] font-black text-green-400 uppercase tracking-widest"
                  >
                    Added to stack
                  </motion.span>
                )}
              </AnimatePresence>
              <button 
                onClick={() => setPickerOpen(true)}
                className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors"
              >
                <Plus size={12} className="text-yellow-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Library</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-6 bg-white/[0.03] p-5 rounded-[32px] border border-white/5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img src={exercise.image} className="w-full h-full object-cover" alt={exercise.name} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight leading-none mb-2">{exercise.name}</h3>
              <p className="text-[11px] font-black uppercase tracking-widest text-white/30">{exercise.muscleGroup} • {exercise.difficulty}</p>
            </div>
          </div>

            <div className="space-y-8 mb-10">
            <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/5 shadow-inner relative overflow-hidden">
              {['Sets × Reps', 'Duration'].map((m, i) => {
                const active = useDuration === (i === 1);
                return (
                  <motion.button
                    key={m}
                    onClick={() => setUseDuration(i === 1)}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                    className={
                      'relative flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ' +
                      (active ? 'text-black' : 'text-white/40 hover:text-white/60')
                    }
                  >
                    {active && (
                      <motion.div
                        layoutId="wb-mode-pill"
                        className="absolute inset-0 bg-white rounded-xl shadow-lg"
                        transition={{ type: 'spring', stiffness: 600, damping: 38 }}
                      />
                    )}
                    <span className="relative z-10">{m}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-3 block">{useDuration ? 'TIME' : 'SETS'}</span>
                <div className="flex items-center justify-between gap-4">
                  <motion.button
                    onClick={() => setSets(Math.max(1, sets - 1))}
                    whileTap={{ scale: 0.92 }}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"
                  >
                    -
                  </motion.button>
                  <span className="text-2xl font-black text-white tabular-nums">{useDuration ? duration : sets}</span>
                  <motion.button
                    onClick={() => setSets(Math.min(10, sets + 1))}
                    whileTap={{ scale: 0.92 }}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"
                  >
                    +
                  </motion.button>
                </div>
              </div>
              {!useDuration && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-3 block">REPS</span>
                <div className="flex items-center justify-between gap-4">
                    <motion.button
                      onClick={() => setReps(Math.max(1, parseInt(reps) - 1).toString())}
                      whileTap={{ scale: 0.92 }}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"
                    >
                      -
                    </motion.button>
                    <span className="text-2xl font-black text-white tabular-nums">{reps}</span>
                    <motion.button
                      onClick={() => setReps((Math.min(50, parseInt(reps) + 1)).toString())}
                      whileTap={{ scale: 0.92 }}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"
                    >
                      +
                    </motion.button>
                </div>
              </div>
              )}
            </div>

            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-4 block">PLACEMENT</span>
              <div className="flex gap-2 bg-white/5 p-1.5 rounded-full border border-white/10 relative overflow-hidden">
                {(['warmup', 'main', 'cooldown'] as const).map(p => {
                  const active = placement === p;
                  return (
                    <motion.button
                      key={p}
                      onClick={() => setPlacement(p)}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                      className={
                        'relative flex-1 h-10 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ' +
                        (active ? 'border-white text-black' : 'border-transparent text-white/40 hover:text-white/60')
                      }
                    >
                      {active && (
                        <motion.div
                          layoutId="wb-placement-pill"
                          className="absolute inset-0 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.10)]"
                          transition={{ type: 'spring', stiffness: 650, damping: 42 }}
                        />
                      )}
                      <span className="relative z-10">{p}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <motion.button
              onClick={handleAddCurrentToActive}
              whileTap={{ scale: 0.98 }}
              className="w-full h-16 bg-white text-black rounded-[24px] font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl flex items-center justify-center gap-3 relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {isAdding ? (
                  <motion.span
                    key="added"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="inline-flex items-center gap-3"
                  >
                    <Check size={18} strokeWidth={3} />
                    Added
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="inline-flex items-center gap-3"
                  >
                    <Plus size={18} strokeWidth={3} />
                    Add to Workout
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* 3. Destination (Optional Add to Existing) */}
        <div className="px-8 pb-6">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => {
                const d = new Date().toISOString();
                setActiveWorkout({
                  id: `draft_${Date.now()}`, title: 'NEW WORKOUT', description: '', intensity: 'Medium', image: exercise.image, focus: [exercise.muscleGroup], warmupExercises: [], exercises: [], cooldownExercises: [], equipment: [exercise.equipment], createdAt: d, updatedAt: d, totalDuration: '0 min', estimatedKcal: 0
                });
                setTitleValue('NEW WORKOUT');
              }}
              className="flex items-center gap-2 hover:text-white transition-all press-scale group"
            >
              <div className="w-5 h-5 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 group-hover:bg-yellow-500/20">
                <Plus size={10} className="text-yellow-400" strokeWidth={3} />
              </div>
              <span className="text-white/40 uppercase tracking-[0.3em] text-[9px] font-black group-hover:text-white/80">Add to another workout</span>
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-4 -mx-8 px-8 custom-scrollbar">
            {workouts.map(w => (
              <button 
                key={w._id} 
                onClick={() => selectExistingWorkout(w)} 
                className={`flex-shrink-0 flex items-center gap-3 px-5 h-14 rounded-2xl border transition-all press-scale ${
                  activeWorkout?.id === w._id 
                    ? 'bg-white/10 border-white/40 shadow-xl ring-1 ring-white/10' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="text-left">
                  <p className="text-[12px] font-bold text-white leading-none mb-0.5">{w.title}</p>
                  <p className="text-[8px] font-black uppercase text-white/30 tracking-widest">{w.exercises.length} Exercises</p>
                </div>
                {activeWorkout?.id === w._id && <Check size={14} className="text-white ml-1" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Workout Summary */}
        <div ref={summaryRef} className="px-8 pb-32">
          <motion.div
            className="relative flex items-center justify-between mb-6"
            animate={{
              filter: summaryPulse ? 'drop-shadow(0 0 22px rgba(255,255,255,0.10))' : 'drop-shadow(0 0 0px rgba(255,255,255,0))',
            }}
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">3. Workout Summary</span>
              <button 
                onClick={() => setPickerOpen(true)}
                className="mt-2 flex items-center gap-2 text-white/60 hover:text-white transition-colors press-scale"
              >
                <Plus size={14} className="text-yellow-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Add More Exercises</span>
              </button>
            </div>
            <div className="flex gap-4">
               <div className="text-right"><span className="text-[7px] font-black text-white/20 uppercase tracking-widest block mb-0.5">TIME</span><span className="text-[12px] font-black text-white">{activeWorkout?.totalDuration || '0 min'}</span></div>
               <div className="text-right"><span className="text-[7px] font-black text-white/20 uppercase tracking-widest block mb-0.5">KCAL</span><span className="text-[12px] font-black text-white">{activeWorkout?.estimatedKcal || 0}</span></div>
            </div>
          </motion.div>
          
          <div className="space-y-12">
            {activeWorkout && (
              <>
                {renderStackSection('warmup', 'Warm-up', activeWorkout.warmupExercises, handleRemoveExercise, moveExercise, setEditState, () => setPickerOpen(true))}
                {renderStackSection('main', 'Main Movements', activeWorkout.exercises, handleRemoveExercise, moveExercise, setEditState, () => setPickerOpen(true))}
                {renderStackSection('cooldown', 'Cool-down', activeWorkout.cooldownExercises, handleRemoveExercise, moveExercise, setEditState, () => setPickerOpen(true))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 5. Footer Dock */}
      <motion.div
        className="h-40 px-8 flex items-center justify-between bg-gradient-to-t from-black via-black/95 to-transparent border-t border-white/5 z-20 flex-shrink-0 pb-10"
      >
        <motion.button
          onClick={() => setShowDatePicker(true)}
          whileTap={{ scale: 0.97 }}
          className="h-[60px] px-8 rounded-full border border-white/10 bg-white/5 text-white flex items-center gap-3 shadow-lg"
        >
          <Calendar size={18} className="text-white/40" />
          <span className="font-black uppercase tracking-[0.2em] text-[10px]">Add to Plan</span>
        </motion.button>

        <motion.button
          onClick={handleStartNow}
          whileTap={{ scale: 0.98 }}
          className="flex-1 ml-4 h-[60px] bg-white text-black rounded-full font-black uppercase tracking-[0.2em] text-[13px] shadow-[0_20px_50px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3"
        >
          <Play size={24} fill="currentColor" strokeWidth={3} /> 
          <span className="italic font-black italic-font tracking-tighter">START TRAINING</span>
        </motion.button>

      </motion.div>

      {/* Modals */}
      <ExercisePicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} onExerciseAdd={(ex) => { if (activeWorkout) { const updated = { ...activeWorkout }; updated.exercises = [...updated.exercises, { ...ex, order: updated.exercises.length, videoUrl: ex.videoUrl }]; setActiveWorkout(updateStats(updated)); } setPickerOpen(false); }} />
      <EditWorkoutExerciseModal isOpen={!!editState} onClose={() => setEditState(null)} exercise={editingExercise || null} onSave={(updatedEx) => { if (!activeWorkout || !editState) return; const updated = { ...activeWorkout }; if (editState.section === 'warmup') updated.warmupExercises = (updated.warmupExercises || []).map((ex, i) => i === editState.index ? updatedEx : ex); else if (editState.section === 'cooldown') updated.cooldownExercises = (updated.cooldownExercises || []).map((ex, i) => i === editState.index ? updatedEx : ex); else updated.exercises = updated.exercises.map((ex, i) => i === editState.index ? updatedEx : ex); setActiveWorkout(updateStats(updated)); }} />

      {showDatePicker && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowDatePicker(false)} />
          <div className="relative w-full max-w-sm bg-[#121212] border border-white/10 rounded-[48px] p-10 animate-silk-up overflow-hidden shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase italic text-center">Add to Plan</h3>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-[12px] font-black text-white uppercase tracking-widest">{monthName}</span>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center press-scale"><ChevronLeft size={20} /></button>
                  <button onClick={nextMonth} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center press-scale"><ChevronRight size={20} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[9px] font-black text-white/20 text-center py-2">{d}</div>)}
                {daysInMonth.map((date, i) => (
                  <div key={i} className="aspect-square flex items-center justify-center">
                    {date ? (
                      <button onClick={() => setSelectedDate(date)} className={`w-10 h-10 rounded-2xl text-[12px] font-bold transition-all ${selectedDate.toDateString() === date.toDateString() ? 'bg-white text-black shadow-lg scale-110' : 'text-white/40 hover:bg-white/5'}`}>{date.getDate()}</button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={handleAddToPlan} className="w-full h-16 bg-white text-black rounded-full font-black uppercase tracking-widest text-[12px] press-scale shadow-lg">Confirm for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</button>
          </div>
        </div>
      )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const renderStackSection = (id: 'warmup' | 'main' | 'cooldown', label: string, list: WorkoutExercise[] | undefined, onRemove: any, onMove: any, onEdit: any, onAdd: () => void) => {
    if (!list || (list.length === 0 && id !== 'main')) return null;
    return (
        <div className="mb-8 last:mb-0">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[9px] font-black text-white/15 uppercase tracking-[0.4em]">{label}</span>
                <div className="h-px flex-1 bg-white/5" />
            </div>
            {list && list.length > 0 ? (
                <motion.div layout className="space-y-3">
                    <AnimatePresence initial={false}>
                      {list.map((ex, idx) => (
                        <motion.div
                          layout
                          key={`${id}-${idx}`}
                          initial={{ opacity: 0, y: 10, scale: 0.99 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.99 }}
                          className="group flex items-center gap-4 p-4 rounded-[28px] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] transition-all"
                        >
                            <div className="flex flex-col gap-1 text-white/10 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={() => onMove(id, idx, -1)}
                                  className="press-scale"
                                  aria-label="Move up"
                                >
                                  <ChevronUp size={16} />
                                </button>
                                <button
                                  onClick={() => onMove(id, idx, 1)}
                                  className="press-scale"
                                  aria-label="Move down"
                                >
                                  <ChevronDown size={16} />
                                </button>
                            </div>
                            <img
                              src={ex.image}
                              className="w-12 h-12 rounded-xl object-cover cursor-pointer"
                              onClick={() => onEdit({ section: id, index: idx })}
                              alt=""
                            />
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit({ section: id, index: idx })}>
                                <h4 className="text-[13px] font-black text-white truncate uppercase italic leading-none">{ex.name}</h4>
                                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/20 mt-1.5">{ex.duration || `${ex.sets} × ${ex.reps}`}</p>
                            </div>
                            <button
                              onClick={() => onRemove(id, idx)}
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white/10 hover:text-red-500/50 hover:bg-red-500/10 transition-all"
                              aria-label="Remove exercise"
                            >
                              <Trash2 size={16} />
                            </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <button 
                  onClick={onAdd}
                  className="w-full h-28 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-white/10 transition-all"
                >
                  <Plus size={24} className="mb-2 opacity-20" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Add First Movement</span>
                </button>
            )}
        </div>
    );
};

export default WorkoutBuilderWorkspace;
