import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Dumbbell, Clock, ChevronRight } from 'lucide-react';
import { Exercise, UserWorkout, WorkoutExercise } from '../types';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

interface AddToWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  onGoToWorkout?: (workoutId: string) => void;
}

const AddToWorkoutModal: React.FC<AddToWorkoutModalProps> = ({ 
  isOpen, 
  onClose, 
  exercise,
  onGoToWorkout
}) => {
  const workouts = useQuery(api.workouts.getUserWorkouts) || [];
  const updateWorkoutMutation = useMutation(api.workouts.update);
  const createWorkoutMutation = useMutation(api.workouts.create);

  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [addedToWorkoutName, setAddedToWorkoutName] = useState('');
  const [addedToWorkoutId, setAddedToWorkoutId] = useState<string | null>(null);

  // Exercise configuration
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('10');
  const [useDuration, setUseDuration] = useState(false);
  const [duration, setDuration] = useState('45s');
  const [restSeconds, setRestSeconds] = useState(60);
  const [placement, setPlacement] = useState<'warmup' | 'main' | 'cooldown'>('main');

  useEffect(() => {
    if (isOpen) {
      setSelectedWorkoutId(null);
      setJustAdded(false);
      setAddedToWorkoutId(null);
      if (exercise?.duration) {
        setUseDuration(true);
        setDuration(exercise.duration);
      } else if (exercise?.reps) {
        setUseDuration(false);
        setReps(exercise.reps.replace(/[^0-9]/g, ''));
      }
    }
  }, [isOpen, exercise]);

  if (!isOpen || !exercise) return null;

  const handleAddToWorkout = async () => {
    if (!selectedWorkoutId) return;

    const selectedWorkout = workouts.find((w: any) => w._id === selectedWorkoutId);
    const existingExercises = selectedWorkout?.exercises || [];
    
    const workoutExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      name: exercise.name,
      image: exercise.image,
      muscleGroup: exercise.muscleGroup,
      sets: useDuration ? undefined : sets,
      reps: useDuration ? undefined : `${reps} reps`,
      duration: useDuration ? duration : undefined,
      restSeconds,
      order: existingExercises.length
    };

    await updateWorkoutMutation({
      id: selectedWorkoutId as any,
      exercises: [...existingExercises, workoutExercise]
    });

    setAddedToWorkoutName(selectedWorkout?.title || 'Workout');
    setAddedToWorkoutId(selectedWorkoutId);
    setJustAdded(true);
  };

  const handleCreateQuickWorkout = async () => {
    const workoutExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      name: exercise.name,
      image: exercise.image,
      muscleGroup: exercise.muscleGroup,
      sets: useDuration ? undefined : sets,
      reps: useDuration ? undefined : `${reps} reps`,
      duration: useDuration ? duration : undefined,
      restSeconds,
      order: 0
    };

    const newId = await createWorkoutMutation({
      title: `${exercise.name} Workout`,
      subtitle: `Quick workout featuring ${exercise.name}`,
      duration: useDuration ? '5 min' : '10 min',
      exercises: [workoutExercise],
      completed: false,
      date: Date.now(),
    });

    setAddedToWorkoutName(`${exercise.name} Workout`);
    setAddedToWorkoutId(newId);
    setJustAdded(true);
  };

  if (justAdded) {
    return (
      <div className="fixed inset-0 z-[400] bg-black flex items-center justify-center animate-in fade-in duration-300">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-green-400" />
          </div>
          <h3 className="text-[24px] font-black text-white mb-2">Added!</h3>
          <p className="text-white/40 text-[14px]">Exercise added to "{addedToWorkoutName}"</p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <button onClick={() => onClose()} className="h-12 px-7 rounded-full bg-white/10 text-white font-bold text-[11px] uppercase tracking-widest press-scale">Continue</button>
            <button onClick={() => { if (addedToWorkoutId && onGoToWorkout) onGoToWorkout(addedToWorkoutId); onClose(); }} className="h-12 px-7 rounded-full bg-white text-black font-bold text-[11px] uppercase tracking-widest press-scale">Go to workout</button>
          </div>
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
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Add Exercise to Workout</span>
        <div className="w-11" />
      </div>

      <div className="h-full overflow-y-auto custom-scrollbar pt-24 pb-40 px-6">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mb-8 flex items-center gap-4">
          <img src={exercise.image} alt={exercise.name} className="w-20 h-20 rounded-2xl object-cover" />
          <div>
            <h3 className="text-[18px] font-bold text-white mb-1">{exercise.name}</h3>
            <p className="text-[12px] text-white/40">{exercise.muscleGroup} • {exercise.difficulty}</p>
          </div>
        </div>

        <div className="mb-8">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-4">Configure Exercise</label>
          <div className="flex gap-2 mb-6">
            <button onClick={() => setUseDuration(false)} className={`flex-1 h-12 rounded-2xl text-[12px] font-bold uppercase transition-all border ${!useDuration ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10'}`}>Sets × Reps</button>
            <button onClick={() => setUseDuration(true)} className={`flex-1 h-12 rounded-2xl text-[12px] font-bold uppercase transition-all border ${useDuration ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10'}`}>Duration</button>
          </div>
        </div>

        <button onClick={handleCreateQuickWorkout} className="w-full bg-white/5 border border-white/10 border-dashed rounded-3xl p-5 mb-6 flex items-center gap-4 press-scale hover:bg-white/[0.08] transition-all">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><Plus size={24} className="text-white" /></div>
          <div className="text-left">
            <h4 className="text-[15px] font-bold text-white">Create Workout with This Exercise</h4>
            <p className="text-[12px] text-white/40">Creates a new workout and adds this as the first item</p>
          </div>
          <ChevronRight size={20} className="text-white/20 ml-auto" />
        </button>

        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-4">Add to Existing Workout</label>
          <div className="space-y-3">
            {workouts.map((workout: any) => (
              <button key={workout._id} onClick={() => setSelectedWorkoutId(workout._id)} className={`w-full bg-white/5 border rounded-3xl p-4 flex items-center gap-4 press-scale transition-all text-left ${selectedWorkoutId === workout._id ? 'border-white bg-white/10' : 'border-white/10 hover:bg-white/[0.08]'}`}>
                <img src={workout.image} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-bold text-white truncate mb-1">{workout.title}</h4>
                  <div className="text-[11px] text-white/40">{workout.exercises.length} exercises</div>
                </div>
                {selectedWorkoutId === workout._id && <Check size={14} className="text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-28 px-6 flex items-center bg-gradient-to-t from-black via-black/95 to-transparent">
        <button onClick={handleAddToWorkout} disabled={!selectedWorkoutId} className={`w-full h-14 rounded-full font-bold uppercase text-[12px] transition-all press-scale ${selectedWorkoutId ? 'bg-white text-black shadow-lg' : 'bg-white/10 text-white/30'}`}>Add to Workout</button>
      </div>
    </div>
  );
};

export default AddToWorkoutModal;
