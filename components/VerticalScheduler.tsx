import React from 'react';
import { CheckCircle2, Dumbbell, UtensilsCrossed, Clock } from 'lucide-react';
import PremiumSectionHeader from './PremiumSectionHeader';
import { Workout, Meal } from '../types';

interface ScheduleItem {
  _id: any;
  type: 'workout' | 'meal';
  item: Workout | Meal;
  completed: boolean;
}

interface VerticalSchedulerProps {
  items: ScheduleItem[];
  onSelectWorkout: (workout: Workout) => void;
  onSelectMeal: (meal: Meal) => void;
  onToggleComplete: (e: React.MouseEvent, id: any) => void;
  onKeyDown: (e: React.KeyboardEvent, action: () => void) => void;
  className?: string;
}

const SLOT_LABELS: Record<string, string> = {
  workout: 'Training',
  meal: 'Nutrition',
};

const VerticalScheduler: React.FC<VerticalSchedulerProps> = ({
  items,
  onSelectWorkout,
  onSelectMeal,
  onToggleComplete,
  onKeyDown,
  className = '',
}) => {
  if (items.length === 0) {
    return (
      <div className={`mb-12 animate-silk-up ${className}`} style={{ animationDelay: '0.12s' }}>
        <PremiumSectionHeader title="Schedule" />

        <div className="pl-8">
          {/* Empty State CTA */}
          <div className="bg-white/[0.04] rounded-[28px] border border-white/10 p-8 text-center">
            <p className="text-white/40 text-sm mb-4">No workouts scheduled today</p>
            <button
              type="button"
              className="bg-emerald-500 hover:bg-emerald-600 rounded-xl px-6 py-3 transition-all press-scale"
            >
              <span className="text-white font-bold text-sm">Schedule Workout</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-12 animate-silk-up ${className}`} style={{ animationDelay: '0.12s' }}>
      <PremiumSectionHeader title="Schedule" />

      <div className="relative pl-8">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/10" />

        <div className="flex flex-col gap-4">
          {items.map((item, index) => {
            const isWorkout = item.type === 'workout';
            const title = item.item.title;
            const subtitle = isWorkout
              ? (item.item as Workout).duration
              : (item.item as Meal).prepTime;

            const handleClick = () => {
              if (isWorkout) {
                onSelectWorkout(item.item as Workout);
              } else {
                onSelectMeal(item.item as Meal);
              }
            };

            return (
              <div key={item._id} className="relative">
                {/* Timeline dot */}
                <div
                  className={`absolute -left-8 top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                    item.completed
                      ? 'bg-white border-white shadow-[0_0_16px_rgba(255,255,255,0.3)]'
                      : 'bg-zinc-900 border-white/20'
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle2 size={12} className="text-black" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  )}
                </div>

                {/* Card */}
                <button
                  type="button"
                  onClick={handleClick}
                  onKeyDown={(e) => onKeyDown(e, handleClick)}
                  className={`w-full flex items-center gap-4 p-4 rounded-[28px] border transition-all press-scale text-left ${
                    item.completed
                      ? 'bg-white/[0.02] border-white/5 opacity-50'
                      : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.06]'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      isWorkout
                        ? 'bg-blue-500/10 border border-blue-500/20'
                        : 'bg-emerald-500/10 border border-emerald-500/20'
                    }`}
                  >
                    {isWorkout ? (
                      <Dumbbell size={18} className="text-blue-400" />
                    ) : (
                      <UtensilsCrossed size={18} className="text-emerald-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 block mb-1">
                      {SLOT_LABELS[item.type] || item.type}
                    </span>
                    <h4
                      className={`text-[14px] font-bold tracking-tight leading-snug text-white truncate ${
                        item.completed ? 'line-through text-white/40' : ''
                      }`}
                    >
                      {title}
                    </h4>
                    {subtitle && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock size={10} className="text-white/30" />
                        <span className="text-[10px] font-bold text-white/40">{subtitle}</span>
                      </div>
                    )}
                  </div>

                  {/* Complete toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(e, item._id);
                    }}
                    className={`flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                      item.completed
                        ? 'bg-white border-white'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                    aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {item.completed ? (
                      <CheckCircle2 size={16} className="text-black" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    )}
                  </button>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VerticalScheduler;
