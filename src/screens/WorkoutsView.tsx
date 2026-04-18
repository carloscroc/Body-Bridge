import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { UserWorkout, Workout } from '../types';
import { Calendar, Clock, Copy, Dumbbell, Edit3, Flame, Layers, MoreHorizontal, Play, Plus, Search, Trash2 } from 'lucide-react';
import TrainingArchitect from '../components/TrainingArchitect';
import CalendarPreviewModal from '../components/CalendarPreviewModal';
import PlanningBanner from '../components/PlanningBanner';
import PremiumHeader from '../components/PremiumHeader';
import PremiumSectionHeader from '../components/PremiumSectionHeader';
import WorkoutCard from '../components/WorkoutCard';
import { resolveHighEndWorkoutImage } from '../utils/imageResolver';

interface WorkoutsViewProps {
  onSelect: (w: Workout) => void;
  editWorkoutId?: string | null;
  onEditWorkoutConsumed?: () => void;
  calendarDateStr?: string | null;
  onCalendarAdded?: () => void;
  onGoToCalendar?: () => void;
}

const WorkoutsView: React.FC<WorkoutsViewProps> = ({
  onSelect,
  editWorkoutId,
  onEditWorkoutConsumed,
  calendarDateStr,
  onCalendarAdded,
  onGoToCalendar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchitect, setShowArchitect] = useState(false);
  const [editingTraining, setEditingTraining] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'preset' | 'custom'>('all');
  const [workoutToDelete, setWorkoutToDelete] = useState<UserWorkout | null>(null);
  const [actionWorkoutId, setActionWorkoutId] = useState<string | null>(null);
  const [previewWorkout, setPreviewWorkout] = useState<Workout | null>(null);

  const workoutsQuery = useQuery(api.workouts.getUserWorkouts);
  const removeWorkout = useMutation(api.workouts.remove);
  const createWorkout = useMutation(api.workouts.create);
  const programsQuery = useQuery(api.programs.getPrograms);
  const addToPlanMutation = useMutation(api.userPlans.addToPlan);

  const customWorkouts: UserWorkout[] = useMemo(() => {
    return (workoutsQuery || []).map((w: any) => ({
      ...w,
      id: w._id,
      intensity: w.intensity || 'Medium',
      totalDuration: w.duration || '0 min',
      estimatedKcal: w.kcal || 0,
    }));
  }, [workoutsQuery]);

  const isScheduling = Boolean(calendarDateStr);

  const pressRef = useRef<{ timer: number | null; pointerId: number; startX: number; startY: number } | null>(null);
  const suppressSelectRef = useRef<{ until: number } | null>(null);

  React.useEffect(() => {
    if (!editWorkoutId) return;
    const workout = customWorkouts.find(w => w.id === editWorkoutId);
    if (!workout) {
      onEditWorkoutConsumed?.();
      return;
    }
    setActiveTab('custom');
    setEditingTraining(workout);
    setShowArchitect(true);
    onEditWorkoutConsumed?.();
  }, [editWorkoutId, onEditWorkoutConsumed, customWorkouts]);

  const handleDeleteWorkout = async (workout: UserWorkout) => {
    await removeWorkout({ id: workout.id as Id<"savedWorkouts"> });
    setWorkoutToDelete(null);
  };

  const handleEditFromActions = () => {
    const actionWorkout = actionWorkoutId ? customWorkouts.find(w => w.id === actionWorkoutId) || null : null;
    if (!actionWorkout) return;
    setEditingTraining(actionWorkout);
    setShowArchitect(true);
    setActionWorkoutId(null);
  };

  const handleDuplicateFromActions = async () => {
    const actionWorkout = actionWorkoutId ? customWorkouts.find(w => w.id === actionWorkoutId) || null : null;
    if (!actionWorkout) return;
    await createWorkout({
      title: `${actionWorkout.title} (Copy)`,
      subtitle: actionWorkout.description,
      duration: actionWorkout.totalDuration,
      exercises: actionWorkout.exercises,
      completed: false,
      date: Date.now(),
    });
    setActionWorkoutId(null);
  };

  const handleDeleteFromActions = () => {
    const actionWorkout = actionWorkoutId ? customWorkouts.find(w => w.id === actionWorkoutId) || null : null;
    if (!actionWorkout) return;
    setWorkoutToDelete(actionWorkout);
    setActionWorkoutId(null);
  };

  const handleArchitectComplete = (training: any) => {
    setShowArchitect(false);
    setEditingTraining(null);
  };

  const openActions = (workoutId: string) => {
    setActionWorkoutId(workoutId);
  };

  const closeActions = () => {
    setActionWorkoutId(null);
  };

  const convertUserWorkout = (uw: UserWorkout): Workout => {
    const combined = [
      ...(uw.warmupExercises || []),
      ...uw.exercises,
      ...(uw.cooldownExercises || []),
    ];

    return {
      id: uw.id,
      title: uw.title,
      coach: 'You',
      duration: uw.totalDuration || '20 min',
      intensity: uw.intensity,
      kcal: uw.estimatedKcal || 200,
      image: uw.image,
      description: uw.description,
      focus: uw.focus,
      equipment: uw.equipment,
      coachNotes: uw.notes || 'Custom training session',
      exercises: combined.map(we => ({
        id: we.exerciseId,
        name: we.name,
        image: we.image,
        category: 'Custom',
        muscleGroup: we.muscleGroup,
        equipment: 'Various',
        difficulty: 'Medium',
        duration: we.duration,
        reps: we.reps
      })),
      isCustom: true,
      createdAt: uw.createdAt
    };
  };

  const convertProgramToWorkout = useCallback((program: any): Workout => {
    const exercises = (program.exercises || []).filter((e: any) => 'exerciseId' in e);
    const difficultyMap: Record<string, string> = { Advanced: 'Hard', Intermediate: 'Medium', Beginner: 'Easy' };
    const firstImage = exercises.find((e: any) => e.image)?.image;
    return {
      id: program._id,
      title: program.title,
      coach: 'Program',
      duration: `${Math.max(5, exercises.length * 5)} min`,
      intensity: (difficultyMap[program.difficulty] as any) || 'Medium',
      kcal: exercises.length * 25,
      image: program.coverImage || firstImage || resolveHighEndWorkoutImage(program.title) || '/placeholder-workout.jpg',
      description: program.content || '',
      focus: program.focus || [],
      equipment: program.equipment || [],
      coachNotes: program.coachNotes || '',
      exercises: exercises.map((e: any) => ({
        id: e.exerciseId,
        name: e.name,
        image: e.image,
        category: 'Program',
        muscleGroup: e.muscleGroup || 'Full Body',
        equipment: 'Various',
        difficulty: difficultyMap[program.difficulty] || 'Medium',
        duration: e.duration,
        reps: e.reps,
      })),
      isCustom: false,
    };
  }, []);

  const savedPrograms = useMemo(() => {
    if (!programsQuery) return [];
    return programsQuery.map(convertProgramToWorkout);
  }, [programsQuery, convertProgramToWorkout]);

  const allWorkouts = [
    ...savedPrograms,
    ...customWorkouts.map(convertUserWorkout)
  ];

  const filteredWorkouts = (activeTab === 'all' 
    ? allWorkouts 
    : activeTab === 'preset'
    ? savedPrograms
    : customWorkouts.map(convertUserWorkout)
  ).filter(w => 
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.coach.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const actionWorkout = actionWorkoutId ? customWorkouts.find(w => w.id === actionWorkoutId) || null : null;

  return (
    <div className="px-6 pt-12 pb-32 relative min-h-full">
      {/* Scheduling Banner */}
      {isScheduling ? (
        <PlanningBanner
          dateStr={calendarDateStr!}
          type="workout"
          onCancel={() => onGoToCalendar?.()}
        />
      ) : (
        <PremiumHeader 
          title="Workouts"
          subtitle="Training Programs"
          actions={
            <>
              <button
                type="button"
                onClick={() => onGoToCalendar?.()}
                className="w-11 h-11 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center press-scale shadow-sm transition-colors hover:bg-white/10"
                title="View Calendar"
              >
                <Calendar size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowArchitect(true)}
                className="w-11 h-11 rounded-full bg-white/[0.1] border border-white/20 flex items-center justify-center press-scale shadow-sm hover:bg-white/20 transition-all"
                title="Architect Training"
              >
                <Plus size={20} className="text-white" />
              </button>
            </>
          }
        />
      )}

      {/* High Contrast Search Bar */}
      <div className="relative mb-6 animate-silk-up" style={{ animationDelay: '0.05s' }}>
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50" size={16} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isScheduling ? 'Pick a workout to add to plan...' : 'Search programs...'}
          className="w-full h-14 bg-white/[0.12] border border-white/[0.2] rounded-[28px] pl-12 pr-6 text-[15px] font-medium focus:outline-none focus:bg-white/[0.18] transition-all placeholder:text-white/30 text-white shadow-inner"
        />
      </div>

      <PremiumSectionHeader title="Select Program" className="mb-4" />

      {/* Tab Filter */}
      <div className="flex gap-2 mb-8 animate-silk-up" style={{ animationDelay: '0.1s' }}>
        {[
          { id: 'all', label: 'All', count: allWorkouts.length },
          { id: 'preset', label: 'Preset', count: savedPrograms.length },
          { id: 'custom', label: 'My Blueprints', count: customWorkouts.length }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 h-10 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
              activeTab === tab.id 
                ? 'bg-white text-black border-white' 
                : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 ${activeTab === tab.id ? 'text-white/60' : 'text-white/20'}`}>
              ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {/* Saved Programs */}
      {savedPrograms.length > 0 && (
        <div className="mb-8 animate-silk-up" style={{ animationDelay: '0.12s' }}>
          <PremiumSectionHeader title="Saved Programs" className="mb-4" />
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {savedPrograms.map((pw, index) => (
              <WorkoutCard
                key={pw.id}
                workout={pw}
                onClick={() => onSelect(pw)}
                variant="compact"
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Workout Feed */}
      <div className="space-y-10 animate-silk-up" style={{ animationDelay: '0.15s' }}>
        {filteredWorkouts.length === 0 ? (
          <div className="text-center py-20">
            <Dumbbell size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-[16px] font-medium mb-2">No workouts found</p>
            <p className="text-white/20 text-[14px]">Try a different search or create a new blueprint</p>
          </div>
        ) : (
          filteredWorkouts.map((workout, index) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              index={index}
              onClick={() => {
                const suppress = suppressSelectRef.current;
                if (suppress && suppress.until > Date.now()) return;
                if (calendarDateStr) {
                  setPreviewWorkout(workout);
                  return;
                }
                onSelect(workout);
              }}
              onActionPress={() => openActions(workout.id)}
            />
          ))
        )}
      </div>

      {/* Unified Training Architect */}
      <TrainingArchitect
        isOpen={showArchitect}
        onClose={() => {
          setShowArchitect(false);
          setEditingTraining(null);
        }}
        onComplete={handleArchitectComplete}
        existingTraining={editingTraining}
        calendarDateStr={calendarDateStr}
        onCalendarAdded={onCalendarAdded}
      />

      {/* Schedule Preview Modal */}
      <CalendarPreviewModal
        isOpen={!!previewWorkout && isScheduling}
        item={previewWorkout!}
        type="workout"
        dateStr={calendarDateStr!}
        onClose={() => setPreviewWorkout(null)}
        onConfirm={async (data) => {
          if (previewWorkout && calendarDateStr) {
            await addToPlanMutation({
              item: previewWorkout,
              type: 'workout',
              scheduledDate: calendarDateStr,
              mealType: data.slot,
              notes: data.notes,
              scheduledTime: data.specificTime,
            });
            onCalendarAdded?.();
          }
          setPreviewWorkout(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      {workoutToDelete && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 max-w-sm w-full">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <Trash2 size={28} className="text-red-400" />
            </div>
            <h3 className="text-[20px] font-black text-white text-center mb-2">Delete Blueprint?</h3>
            <p className="text-white/40 text-[14px] text-center mb-8">
              Are you sure you want to delete "{workoutToDelete.title}"?
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setWorkoutToDelete(null)} className="flex-1 h-14 rounded-full bg-white/10 text-white font-bold text-[12px] uppercase tracking-[0.15em] press-scale">Cancel</button>
              <button type="button" onClick={() => handleDeleteWorkout(workoutToDelete)} className="flex-1 h-14 rounded-full bg-red-500 text-white font-bold text-[12px] uppercase tracking-[0.15em] press-scale">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Actions Bottom Sheet */}
      {actionWorkout && (
        <div className="fixed inset-0 z-[410] bg-black/70 backdrop-blur-sm flex items-end justify-center p-4 animate-in fade-in duration-200" onClick={closeActions}>
          <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-4">
              <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mb-4" />
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Blueprint Options</div>
              <div className="text-white text-[18px] font-extrabold tracking-tight mt-1 line-clamp-2">{actionWorkout.title}</div>
            </div>
            <div className="px-3 pb-3">
              <button type="button" onClick={handleEditFromActions} className="w-full h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 flex items-center gap-4 press-scale transition-all">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10"><Edit3 size={18} className="text-white" /></div>
                <div className="text-left"><div className="text-white font-extrabold text-[13px]">Edit blueprint</div></div>
              </button>
              <button type="button" onClick={handleDuplicateFromActions} className="w-full h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 flex items-center gap-4 press-scale transition-all mt-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10"><Copy size={18} className="text-white" /></div>
                <div className="text-left"><div className="text-white font-extrabold text-[13px]">Duplicate</div></div>
              </button>
              <button type="button" onClick={handleDeleteFromActions} className="w-full h-14 rounded-2xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 px-5 flex items-center gap-4 press-scale transition-all mt-3">
                <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center border border-red-500/20"><Trash2 size={18} className="text-red-200" /></div>
                <div className="text-left"><div className="text-red-100 font-extrabold text-[13px]">Delete blueprint</div></div>
              </button>
              <button type="button" onClick={closeActions} className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 px-5 flex items-center justify-center press-scale transition-all mt-3">
                <span className="text-white font-extrabold text-[12px] uppercase tracking-[0.15em]">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutsView;
