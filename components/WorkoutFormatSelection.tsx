import React from 'react';
import { Play, CheckCircle, ChevronRight } from 'lucide-react';
import { Workout } from '../types';

type Props = {
  workout: Workout;
  onSelect: (format: 'follow_along' | 'user_paced') => void;
};

export default function WorkoutFormatSelection({ workout, onSelect }: Props) {
  return (
    <section className="w-full py-12 px-4 animate-silk-up pb-32">
      <div className="max-w-2xl mx-auto">
        <h2 className="editorial-title text-xl font-black text-white tracking-tighter text-center mb-6">
          SELECT FORMAT
        </h2>
        
        <div className="flex flex-col gap-4">
          {/* Card 1: Synced Coaching */}
          <button
            onClick={() => onSelect('follow_along')}
            aria-label="Start Synced Coaching workout"
            className="w-full rounded-[40px] border border-white/10 bg-[#050505]/60 backdrop-blur-xl text-left hover:bg-[#121212]/80 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] press-scale overflow-hidden group"
          >
            <div className="h-32 w-full overflow-hidden relative">
              {workout.exercises[0]?.image && (
                <img 
                  src={workout.exercises[0].image}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
                />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-md flex items-center justify-center border border-indigo-500/30">
                  <Play className="h-8 w-8 text-indigo-400" fill="currentColor" />
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="editorial-title text-[24px] font-black text-white tracking-tight mb-3">
                Synced Coaching
              </h3>
              <p className="text-white/60 text-[14px] font-medium leading-relaxed">
                Follow the professional rhythm. Let the trainer guide your every movement with precision and energy.
              </p>
            </div>
            
            <div className="px-4 pb-4 pt-0">
              <span className="inline-flex items-center px-5 py-2.5 rounded-full bg-white text-black font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors press-scale text-[12px]">
                Start Session
                <ChevronRight className="ml-2 h-4 w-4" />
              </span>
            </div>
          </button>
          
          {/* Card 2: Freestyle Track */}
          <button
            onClick={() => onSelect('user_paced')}
            aria-label="Start Freestyle Track workout"
            className="w-full rounded-[40px] border border-white/10 bg-[#050505]/60 backdrop-blur-xl text-left hover:bg-[#121212]/80 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] press-scale overflow-hidden group"
          >
            <div className="h-32 w-full overflow-hidden relative">
              {workout.exercises[0]?.image && (
                <img 
                  src={workout.exercises[0].image}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
                />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-md flex items-center justify-center border border-emerald-500/30">
                  <Play className="h-8 w-8 text-emerald-400" fill="currentColor" />
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="editorial-title text-[24px] font-black text-white tracking-tight mb-3">
                Freestyle Track
              </h3>
              <p className="text-white/60 text-[14px] font-medium leading-relaxed">
                Your pace, your rules. Complete exercises at your speed and track your personal journey to fitness.
              </p>
            </div>
            
            <div className="px-4 pb-4 pt-0">
              <span className="inline-flex items-center px-5 py-2.5 rounded-full bg-white text-black font-black uppercase tracking-widest hover:bg-emerald-50 transition-colors press-scale text-[12px]">
                Start Session
                <ChevronRight className="ml-2 h-4 w-4" />
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
