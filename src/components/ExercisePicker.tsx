import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Exercise, WorkoutExercise } from '../types';
import { Search, X, Dumbbell, Loader2 } from 'lucide-react';
import { PremiumExerciseGrid } from './PremiumExerciseCard';
import ExerciseDetailModal from './ExerciseDetailModal';
import { resolveHighEndExerciseImage } from '../utils/imageResolver';

interface ExercisePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseAdd: (exercise: WorkoutExercise) => void;
}

const CATEGORIES = ['All', 'Strength', 'Cardio', 'HIIT', 'Power', 'Yoga'];
const INITIAL_LIMIT = 20;
const LOAD_MORE_LIMIT = 24;

/** Map a Convex exercise document to the client Exercise type. */
function mapExercise(ex: any): Exercise {
  const baseEx: Exercise = {
    id: ex._id,
    name: ex.name,
    image: ex.imageUrl || '',
    category: ex.category,
    bodyRegion: ex.bodyRegion, // Renamed from muscleGroup for clarity
    agonistMuscles: [
      ...(ex.primaryMuscles || []),
      ...(ex.secondaryMuscles || []),
    ],
    equipment: Array.isArray(ex.equipment)
      ? ex.equipment.join(', ')
      : String(ex.equipment || ''),
    difficulty: ex.difficulty,
    instructions: ex.instructions || [],
    duration: ex.duration || undefined,
    reps: ex.reps || '10',
    videoUrl: ex.videoUrl,
  };
  baseEx.image = resolveHighEndExerciseImage(baseEx);
  return baseEx;
}

const ExercisePicker: React.FC<ExercisePickerProps> = ({ 
  isOpen, 
  onClose, 
  onExerciseAdd 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [modalExercise, setModalExercise] = useState<Exercise | null>(null);

  // --- Pagination state ---
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [accumulated, setAccumulated] = useState<Exercise[]>([]);
  const [paginationStatus, setPaginationStatus] = useState<'CanLoadMore' | 'Exhausted'>('CanLoadMore');
  const [currentLimit, setCurrentLimit] = useState(INITIAL_LIMIT);

  // Derive query args
  const categoryFilter = activeCategory === 'All' ? undefined : activeCategory;
  const queryArg = searchQuery.trim().length > 0 ? searchQuery.trim() : undefined;

  // Reset pagination when filters change
  useEffect(() => {
    setCursor(undefined);
    setAccumulated([]);
    setPaginationStatus('CanLoadMore');
    setCurrentLimit(INITIAL_LIMIT);
  }, [searchQuery, activeCategory]);

  // Fetch current page from backend
  const result = useQuery(
    api.trainerExercises.listExercisesForTrainer,
    isOpen
      ? {
          query: queryArg,
          category: categoryFilter,
          limit: currentLimit,
          cursor: cursor || undefined,
        }
      : 'skip'
  );

  const isLoading = result === undefined;

  // When result arrives, merge into accumulated
  useEffect(() => {
    if (!result) return;

    const mapped = (result.exercises ?? []).map(mapExercise);

    if (!cursor) {
      // First page — replace
      setAccumulated(mapped);
    } else {
      // Subsequent pages — append, dedup by id
      setAccumulated((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newItems = mapped.filter((e) => !existingIds.has(e.id));
        return [...prev, ...newItems];
      });
    }

    setPaginationStatus(
      result.status === 'Exhausted' ? 'Exhausted' : 'CanLoadMore'
    );
  }, [result, cursor]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (!result || paginationStatus === 'Exhausted' || isLoading) return;
    setCursor(result.cursor ?? undefined);
    setCurrentLimit(LOAD_MORE_LIMIT);
  }, [result, paginationStatus, isLoading]);

  // Use accumulated exercises for display (loaded from Convex backend)
  const exercises = useMemo(() => accumulated, [accumulated]);

  if (!isOpen) return null;

  const handleAddExercise = (exercise: Exercise) => {
    const hasDuration = !!exercise.duration;
    const reps = exercise.reps ? exercise.reps.toLowerCase() : '12 reps';
    const workoutExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      name: exercise.name,
      image: exercise.image,
      bodyRegion: exercise.bodyRegion, // Renamed from muscleGroup for clarity
      sets: hasDuration ? undefined : 3,
      reps: hasDuration ? undefined : reps,
      duration: hasDuration ? exercise.duration : undefined,
      restSeconds: 60,
      order: 0
    };
    onExerciseAdd(workoutExercise);
    setSelectedExercise(null);
    setModalExercise(null);
  };

  const showLoadMore = paginationStatus === 'CanLoadMore' && exercises.length > 0;

  return (
    <div className="fixed inset-0 z-[310] bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-6 pt-14 pb-4 flex items-center justify-between bg-gradient-to-b from-black via-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-bold text-white">Add Exercises</span>
            <span className="text-[10px] text-white/40">
              ({exercises.length} loaded{paginationStatus === 'CanLoadMore' ? '+' : ''})
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center press-scale"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="px-6 pb-4">
          {isLoading && accumulated.length === 0 && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">
                Backend Issue
              </p>
              <p className="text-[8px] text-amber-500/70 leading-tight">
                Showing local movements while we reconnect.
              </p>
            </div>
          )}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={14} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
              className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 text-[14px] font-medium focus:outline-none focus:bg-white/[0.08] transition-all placeholder:text-white/30 text-white"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto custom-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 h-9 rounded-full whitespace-nowrap text-[9px] font-black uppercase tracking-wider transition-all border flex-shrink-0 ${
                  activeCategory === cat 
                    ? 'bg-white text-black border-white' 
                    : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                }`}
              >
                {cat}
                {activeCategory === cat && (
                  <span className="ml-1.5 text-white/60">({exercises.length})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise Grid - Premium Interaction */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-32">
          {isLoading && exercises.length === 0 ? (
            <div className="text-center py-20">
              <Loader2 size={32} className="text-white/20 mx-auto mb-4 animate-spin" />
              <p className="text-white/40 text-[14px] font-medium">
                Loading exercises...
              </p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-20">
              <Dumbbell size={48} className="text-white/20 mx-auto mb-4" />
              <p className="text-white/40 text-[16px] font-medium mb-2">
                No exercises found
              </p>
              <p className="text-white/20 text-[14px]">
                Try a different search or category
              </p>
            </div>
          ) : (
            <>
              <PremiumExerciseGrid
                exercises={exercises}
                selectedId={selectedExercise?.id || null}
                onSelect={(exercise) => {
                  setSelectedExercise(exercise);
                  setModalExercise(exercise);
                }}
                onAdd={(exercise) => handleAddExercise(exercise)}
              />

              {/* Load More / Status */}
              <div className="flex justify-center py-8">
                {showLoadMore ? (
                  <button
                    onClick={handleLoadMore}
                    type="button"
                    disabled={isLoading}
                    className={`px-6 h-11 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
                      isLoading
                        ? 'bg-white/5 text-white/20 border-white/5 cursor-not-allowed'
                        : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/70 press-scale'
                    }`}
                  >
                    {isLoading && <Loader2 size={12} className="animate-spin" />}
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                ) : paginationStatus === 'Exhausted' && exercises.length > 0 ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                    All exercises loaded
                  </span>
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* Exercise Detail Modal */}
        {modalExercise && (
          <ExerciseDetailModal
            exercise={modalExercise}
            onClose={() => {
              setModalExercise(null);
              setSelectedExercise(null);
            }}
            onAddToWorkout={(exercise) => {
              handleAddExercise(exercise);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ExercisePicker;