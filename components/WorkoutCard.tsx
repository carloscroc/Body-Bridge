import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame, Play, MoreHorizontal, Layers } from 'lucide-react';
import { Workout } from '../types';

interface WorkoutCardProps {
  workout: Workout;
  onClick: () => void;
  onActionPress?: (e: React.MouseEvent) => void;
  variant?: 'compact' | 'featured';
  index?: number;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onClick,
  onActionPress,
  variant = 'featured',
  index = 0
}) => {
  const isCompact = variant === 'compact';

  const intensityColors = {
    Hard: 'bg-red-500/20 border-red-500/30 text-red-200',
    Medium: 'bg-orange-500/20 border-orange-500/30 text-orange-200',
    Easy: 'bg-green-500/20 border-green-500/30 text-green-200'
  };

  if (isCompact) {
    return (
      <motion.button
        onClick={onClick}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        whileTap={{ scale: 0.96 }}
        className="flex-shrink-0 w-44 rounded-[32px] overflow-hidden border border-white/10 bg-white/5 text-left group"
      >
        <div className="h-28 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center relative overflow-hidden">
          {workout.image && workout.image !== '/placeholder-workout.jpg' ? (
            <img 
              src={workout.image} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              alt={workout.title} 
            />
          ) : (
            <Layers size={28} className="text-white/30" />
          )}
          
          {/* Subtle overlay for compact variant to match featured style */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Small intensity dot/indicator for compact cards */}
          <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
            workout.intensity === 'Hard' ? 'bg-red-500' :
            workout.intensity === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
          } shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
        </div>
        
        <div className="p-4">
          <div className="text-[13px] font-black text-white tracking-tight line-clamp-1 group-hover:text-white/90 transition-colors uppercase">
            {workout.title}
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-[9px] font-black text-white/40 flex items-center gap-1 uppercase tracking-wider">
              <Play size={10} className="text-white/20" /> {workout.exercises.length} exercises
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-white/40 flex items-center gap-1 uppercase tracking-wider">
                <Clock size={10} className="text-white/20" /> {workout.duration}
              </span>
              <span className="text-[9px] font-black text-white/40 flex items-center gap-1 uppercase tracking-wider">
                <Flame size={10} className="text-white/20" /> {workout.kcal} kcal
              </span>
            </div>
          </div>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="group active:scale-[0.98] transition-all relative cursor-pointer"
    >
      <div className="relative h-72 rounded-[44px] overflow-hidden mb-4 shadow-2xl border border-white/10 bg-zinc-900/20">
        <img 
          src={workout.image} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2.5s] ease-out" 
          alt={workout.title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20 opacity-60" />

        {/* Badges container */}
        <div className="absolute top-6 right-6 flex gap-2 z-10">
          {workout.isCustom && (
            <div className="px-3 py-1.5 bg-white/20 blur-surface rounded-full text-[9px] font-black uppercase tracking-widest border border-white/30 text-white shadow-xl">
              CUSTOM
            </div>
          )}
          <div className={`px-4 py-2 blur-surface rounded-full text-[10px] font-black uppercase tracking-widest border shadow-xl ${intensityColors[workout.intensity] || intensityColors.Medium}`}>
            {workout.intensity}
          </div>
        </div>

        {/* More Actions button for Custom workouts */}
        {workout.isCustom && onActionPress && (
          <div className="absolute top-6 left-6 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onActionPress(e);
              }}
              className="w-10 h-10 rounded-full blur-surface flex items-center justify-center border border-white/10 bg-black/20 text-white press-scale hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        )}

        {/* Bottom Content */}
        <div className="absolute bottom-10 left-10 right-10">
          <div className="flex gap-6 mb-4">
            <div className="flex items-center gap-2 text-[11px] text-white font-black uppercase tracking-widest drop-shadow-lg opacity-80">
              <Clock size={14} strokeWidth={3} className="text-white" /> {workout.duration}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white font-black uppercase tracking-widest drop-shadow-lg opacity-80">
              <Flame size={14} strokeWidth={3} className="text-white" /> {workout.kcal} Kcal
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white font-black uppercase tracking-widest drop-shadow-lg opacity-80">
              <Play size={14} strokeWidth={3} className="text-white" /> {workout.exercises.length} Exercises
            </div>
          </div>
          <h3 className="text-[28px] font-extrabold tracking-tight leading-[1.05] text-white drop-shadow-2xl">
            {workout.title}
          </h3>
        </div>
      </div>
    </motion.div>
  );
};

export default WorkoutCard;
