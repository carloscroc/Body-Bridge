import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Dumbbell, Target, Clock, Zap, Info, Plus } from 'lucide-react';
import { Exercise } from '../types';
import VideoPlayer from './VideoPlayer';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  onAddToWorkout?: (exercise: Exercise) => void;
}

const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, onClose, onAddToWorkout }) => {
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-white/10 text-white/70 border-white/20';
    }
  }, []);

  const handleVideoPlay = useCallback(() => {
    setIsVideoPlaying(true);
  }, []);

  const handleVideoPause = useCallback(() => {
    setIsVideoPlaying(false);
  }, []);

  const handleAddToWorkout = useCallback(() => {
    if (exercise && onAddToWorkout) {
      onAddToWorkout(exercise);
      onClose();
    }
  }, [exercise, onAddToWorkout, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleVideoLoadStart = useCallback(() => {
    setIsVideoLoading(true);
  }, []);

  const handleVideoCanPlay = useCallback(() => {
    setIsVideoLoading(false);
  }, []);

  if (!exercise) return null;

  return (
    <AnimatePresence mode="wait">
      {exercise && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3
            }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[95vw] md:max-w-2xl md:max-h-[90vh] z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`exercise-title-${exercise.id}`}
          >
            <div className="h-full w-full bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
              {/* Header with close button */}
              <div className="relative flex-shrink-0">
                {/* Video or Image */}
                <div className="relative w-full aspect-video bg-black" role="region" aria-label="Exercise video or image">
                  {exercise.videoUrl ? (
                    <VideoPlayer
                      videoUrl={exercise.videoUrl}
                      className="w-full h-full object-cover"
                      onLoadStart={handleVideoLoadStart}
                      onCanPlay={handleVideoCanPlay}
                      onPlay={handleVideoPlay}
                      onPause={handleVideoPause}
                      autoPlay={false}
                      controls
                    />
                  ) : (
                    <>
                      {exercise.image && exercise.image !== '' ? (
                        <img
                          src={exercise.image}
                          alt={exercise.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <Dumbbell size={64} className="text-white/10" aria-hidden="true" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                    </>
                  )}

                  {/* Close button */}
                  <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/70 transition-all z-10"
                    aria-label="Close exercise details"
                  >
                    <X size={20} className="text-white" />
                  </button>

                  {/* Difficulty badge */}
                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${getDifficultyColor(exercise.difficulty)}`}
                    >
                      {exercise.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" tabIndex={0} aria-label="Exercise details">
                {/* Title */}
                <h2 id={`exercise-title-${exercise.id}`} className="text-2xl font-bold text-white mb-2">{exercise.name}</h2>
                
                {/* Metadata */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2 text-white/60">
                    <Target size={16} aria-hidden="true" />
                    <span className="text-sm">{exercise.bodyRegion}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Zap size={16} aria-hidden="true" />
                    <span className="text-sm">{exercise.category}</span>
                  </div>
                  {exercise.duration && exercise.duration !== '0 min' && (
                    <div className="flex items-center gap-2 text-white/60">
                      <Clock size={16} aria-hidden="true" />
                      <span className="text-sm">{exercise.duration}</span>
                    </div>
                  )}
                </div>

                {/* Equipment */}
                {exercise.equipment && exercise.equipment !== '' && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Dumbbell size={16} className="text-white/80" aria-hidden="true" />
                      <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                        Equipment
                      </span>
                    </div>
                    <p className="text-sm text-white/60 pl-6">{exercise.equipment}</p>
                  </div>
                )}

                {/* Instructions */}
                {exercise.instructions && exercise.instructions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Info size={16} className="text-white/80" aria-hidden="true" />
                      <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                        Instructions
                      </span>
                    </div>
                    <ol className="space-y-3 pl-6">
                      {exercise.instructions.map((instruction, index) => (
                        <li
                          key={index}
                          className="flex gap-3 text-sm text-white/70 leading-relaxed"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/80 mt-0.5">
                            {index + 1}
                          </span>
                          <span className="flex-1">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Reps and Sets */}
                {(exercise.reps || exercise.sets) && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex flex-wrap gap-4">
                      {exercise.reps && (
                        <div className="flex items-center gap-2 text-white/60">
                          <span className="text-xs font-black uppercase tracking-wider">Reps:</span>
                          <span className="text-sm font-semibold">{exercise.reps}</span>
                        </div>
                      )}
                      {exercise.sets && (
                        <div className="flex items-center gap-2 text-white/60">
                          <span className="text-xs font-black uppercase tracking-wider">Sets:</span>
                          <span className="text-sm font-semibold">{exercise.sets}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Add to Workout Button */}
                {onAddToWorkout && (
                  <div className="mt-6">
                    <button
                      onClick={handleAddToWorkout}
                      className="w-full h-12 rounded-2xl bg-white text-black font-bold text-sm uppercase tracking-wider hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-[0_10px_40px_rgba(255,255,255,0.2)]"
                      aria-label={`Add ${exercise.name} to workout`}
                    >
                      <Plus size={18} strokeWidth={3} aria-hidden="true" />
                      Add to Workout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExerciseDetailModal;