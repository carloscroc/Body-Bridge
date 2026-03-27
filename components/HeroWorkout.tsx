import React from 'react';
import { Play, CheckCircle2, ChevronRight } from 'lucide-react';
import PremiumSectionHeader from './PremiumSectionHeader';
import { Workout } from '../types';

interface HeroWorkoutProps {
  workout: Workout;
  isInPlan: boolean;
  completed: boolean;
  planId: any;
  onSelect: (workout: Workout) => void;
  onToggleComplete: (e: React.MouseEvent, id: any) => void;
  onNavigateToTodayPlan: () => void;
  onKeyDown: (e: React.KeyboardEvent, action: () => void) => void;
  className?: string;
}

const HeroWorkout: React.FC<HeroWorkoutProps> = ({
  workout,
  isInPlan,
  completed,
  planId,
  onSelect,
  onToggleComplete,
  onNavigateToTodayPlan,
  onKeyDown,
  className = '',
}) => {
  // Empty state when no workout is available
  if (!workout) {
    return (
      <div className={`mb-12 animate-silk-up ${className}`} style={{ animationDelay: '0.05s' }}>
        <PremiumSectionHeader
          title="Today's Plan"
          rightElement={
            <button
              type="button"
              onClick={onNavigateToTodayPlan}
              className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center press-scale"
            >
              <ChevronRight size={20} className="text-white/40" aria-label="View plan details" />
            </button>
          }
        />

        <div className="px-1 mb-5 -mt-2">
          <p className="text-xl font-black text-white/40 drop-shadow-lg tracking-tighter uppercase italic">No Workout Planned</p>
        </div>

        {/* Empty State CTA */}
        <div className="w-full relative h-[400px] md:h-[480px] rounded-[56px] overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] flex items-center justify-center">
          <div className="text-center p-8">
            <Play size={64} className="text-white/20 mx-auto mb-6" />
            <h3 className="text-white/40 text-2xl font-black mb-4">No workout scheduled</h3>
            <p className="text-white/30 text-sm mb-6">Start your fitness journey today</p>
            <button
              type="button"
              onClick={onNavigateToTodayPlan}
              className="bg-emerald-500 hover:bg-emerald-600 rounded-xl px-8 py-3 transition-all press-scale"
            >
              <span className="text-white font-bold text-sm">Find a Workout</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-12 animate-silk-up ${className}`} style={{ animationDelay: '0.05s' }}>
      <PremiumSectionHeader
        title="Today's Plan"
        rightElement={
          <button
            type="button"
            onClick={onNavigateToTodayPlan}
            className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center press-scale"
          >
            <ChevronRight size={20} className="text-white/40" aria-label="View plan details" />
          </button>
        }
      />

      <div className="px-1 mb-5 -mt-2">
        <p className="text-xl font-black text-white drop-shadow-lg tracking-tighter uppercase italic">Core Training</p>
      </div>

      <button
        type="button"
        onClick={() => onSelect(workout)}
        onKeyDown={(e) => onKeyDown(e, () => onSelect(workout))}
        className="w-full relative h-[400px] md:h-[480px] rounded-[56px] overflow-hidden press-scale shadow-2xl group border border-white/10 text-left cursor-pointer"
      >
        <img src={workout.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s] ease-out" alt="Core Training" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        {/* Badge */}
        <div className="absolute top-8 left-8">
          <div className="px-4 py-2 bg-black/40 blur-surface rounded-full border border-white/10 flex items-center gap-2.5 shadow-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              {isInPlan ? 'Planned Activity' : 'Workout Suggestion'}
            </span>
          </div>
        </div>

        {/* Completion Toggle */}
        {isInPlan && (
          <div className="absolute top-8 right-8 z-20">
            <button
              type="button"
              onClick={(e) => onToggleComplete(e, planId)}
              className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
                completed
                  ? 'bg-white border-white shadow-[0_0_30px_rgba(255,255,255,0.4)]'
                  : 'bg-black/20 blur-surface border-white/30 text-white/40'
              }`}
            >
              <CheckCircle2 size={20} className={completed ? 'text-black' : 'text-current'} />
            </button>
          </div>
        )}

        {/* Bottom Content */}
        <div className="absolute bottom-12 md:bottom-16 left-10 right-10">
          <h3 className="text-[28px] md:text-[36px] font-black leading-[0.95] tracking-tighter mb-8 text-white uppercase italic">
            {workout.title}
          </h3>

          <div className="flex items-center justify-between">
            <div className="h-12 px-8 md:h-14 md:px-10 bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-full flex items-center gap-3 shadow-[0_10px_40px_rgba(255,255,255,0.2)]">
              <Play fill="black" size={14} aria-label="Start workout" />
              Engage
            </div>

            <div className="flex gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[16px] md:text-[18px] font-black text-white drop-shadow-lg">{workout.duration}</span>
                <span className="text-[8px] font-black uppercase text-white/60 tracking-widest">Time</span>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default HeroWorkout;
