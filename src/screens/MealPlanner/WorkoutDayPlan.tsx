import React from 'react';
import { PlanItem, Workout, UserWorkout } from '../../types';
import { Plus, CheckCircle2, Trash2, ChevronRight, Dumbbell, Clock, Flame } from 'lucide-react';

export type WorkoutSlotType = 'morning' | 'afternoon' | 'evening';

interface WorkoutDayPlanProps {
  date: Date;
  items: PlanItem[];
  onAddWorkout: (slot: WorkoutSlotType) => void;
  onRemoveItem: (id: string) => void;
  onToggleItem: (id: string) => void;
  onWorkoutClick: (workout: Workout | UserWorkout) => void;
}

const WORKOUT_SLOTS: { type: WorkoutSlotType; label: string; time: string }[] = [
  { type: 'morning', label: 'Morning Session', time: '05:00 - 12:00' },
  { type: 'afternoon', label: 'Afternoon Session', time: '12:00 - 17:00' },
  { type: 'evening', label: 'Evening Session', time: '17:00 - 22:00' },
];

const WorkoutDayPlan: React.FC<WorkoutDayPlanProps> = ({ 
  items, 
  onAddWorkout, 
  onRemoveItem, 
  onToggleItem,
  onWorkoutClick
}) => {
  
  // Helper to categorize workouts into slots based on arbitrary logic or saved time
  // Since we don't save exact time yet, we can filter by 'mealType' field if we reuse it 
  // or add a new 'slot' field. For now, let's reuse 'mealType' property in PlanItem 
  // but interpret it as our slot types, or just fallback to 'morning' if undefined.
  const getItemsForSlot = (slot: WorkoutSlotType) => {
    return items.filter(item => {
      // Cast the mealType string to check compatibility or use a new field
      // For now we assume we'll save the slot info in the same field or scheduledTime
      return (item.mealType as string) === slot;
    });
  };

  const renderWorkoutSlot = (type: WorkoutSlotType, label: string, time: string) => {
    const slotItems = getItemsForSlot(type);
    
    return (
      <div key={type} className="mb-6 animate-silk-up">
        <div className="flex justify-between items-end mb-3 px-2">
          <div>
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">{label}</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{time}</p>
          </div>
          <button 
            onClick={() => onAddWorkout(type)}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all"
          >
            <Plus size={14} />
          </button>
        </div>

        {slotItems.length === 0 ? (
          <div 
            onClick={() => onAddWorkout(type)}
            className="h-28 border border-dashed border-white/10 rounded-[24px] flex flex-col items-center justify-center gap-3 group cursor-pointer hover:bg-white/[0.02] hover:border-white/20 transition-all active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white/60 group-hover:scale-110 transition-all">
              <Plus size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400">
              Plan Training
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {slotItems.map(item => {
              const workout = item.item as (Workout | UserWorkout);
              return (
                <div 
                  key={item.id}
                  className={`relative group bg-zinc-900/40 border border-white/5 rounded-[28px] p-1 pr-4 flex items-center gap-3 overflow-hidden transition-all ${
                    item.completed ? 'opacity-50 grayscale' : 'opacity-100'
                  }`}
                >
                  {/* Image */}
                  <div 
                    onClick={() => onWorkoutClick(workout)}
                    className="w-20 h-20 rounded-[24px] overflow-hidden cursor-pointer"
                  >
                    <img src={workout.image} className="w-full h-full object-cover" alt={workout.title} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 py-2">
                    <h4 className="text-[14px] font-bold text-white truncate italic uppercase tracking-tight leading-none mb-1">
                      {workout.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10} /> {(workout as any).totalDuration || (workout as Workout).duration || '20 min'}
                      </span>
                      <span className="w-0.5 h-0.5 bg-zinc-600 rounded-full" />
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <Flame size={10} /> {(workout as any).estimatedKcal || (workout as Workout).kcal || 0} kcal
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => onToggleItem(item.id)}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                        item.completed 
                          ? 'bg-blue-500 border-blue-500 text-black' 
                          : 'bg-transparent border-white/10 text-white/20 hover:border-white/40 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 size={14} />
                    </button>
                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="w-8 h-8 rounded-full bg-transparent border border-white/5 flex items-center justify-center text-white/10 hover:text-red-500 hover:border-red-500/30 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Calculate totals
  const totalDuration = items.reduce((acc, item) => {
    const w = item.item as Workout;
    const minutes = parseInt(w.duration) || 0;
    return acc + minutes;
  }, 0);

  const totalKcal = items.reduce((acc, item) => {
    const w = item.item as Workout;
    return acc + (w.kcal || 0);
  }, 0);

  return (
    <div className="pb-32">
      {WORKOUT_SLOTS.map(t => renderWorkoutSlot(t.type, t.label, t.time))}
      
      {/* Daily Summary Card */}
      <div className="mt-8 bg-zinc-900 rounded-[32px] p-6 border border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-white/50">Training Load</h3>
          <ChevronRight size={16} className="text-white/20" />
        </div>
        <div className="flex justify-between gap-4">
          <div className="text-center">
            <div className="text-2xl font-black text-white italic">{items.length}</div>
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Sessions</div>
          </div>
          <div className="w-px bg-white/5" />
          <div className="text-center">
            <div className="text-2xl font-black text-blue-500 italic">{totalDuration}</div>
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Minutes</div>
          </div>
          <div className="w-px bg-white/5" />
          <div className="text-center">
            <div className="text-2xl font-black text-orange-500 italic">{totalKcal}</div>
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Kcal Burn</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutDayPlan;
