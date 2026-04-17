import React, { useState, useMemo } from 'react';
import { Workout, Meal } from '../types';
import { ChevronDown, Dumbbell, Utensils, CheckCircle2, Circle, Trash2, Clock } from 'lucide-react';
import PremiumHeader from '../components/PremiumHeader';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

interface TodayViewProps {
  onSelectWorkout: (workout: Workout) => void;
  onSelectMeal: (meal: Meal) => void;
  onNavigateToWorkouts: () => void;
  onNavigateToMeals: () => void;
  onGoToRecipes: () => void;
}

const TodayView: React.FC<TodayViewProps> = ({
  onSelectWorkout,
  onSelectMeal,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());
  
  const dateStr = selectedDate.toISOString().split('T')[0];
  const planItems = useQuery(api.userPlans.getDailyPlan, { date: dateStr });
  const toggleStatus = useMutation(api.userPlans.togglePlanItemStatus);
  const removeItem = useMutation(api.userPlans.removeFromPlan);

  const handleToggleBlock = (block: string) => {
    const newCollapsed = new Set(collapsedBlocks);
    if (newCollapsed.has(block)) {
      newCollapsed.delete(block);
    } else {
      newCollapsed.add(block);
    }
    setCollapsedBlocks(newCollapsed);
  };

  const timeBlocks = [
    { id: 'morning', label: 'Morning', timeRange: '05:00 - 11:59', icon: '🌅', color: 'text-amber-400' },
    { id: 'afternoon', label: 'Afternoon', timeRange: '12:00 - 16:59', icon: '🌞', color: 'text-orange-400' },
    { id: 'evening', label: 'Evening', timeRange: '17:00 - 23:59', icon: '🌆', color: 'text-purple-400' },
    { id: 'night', label: 'Night', timeRange: '00:00 - 04:59', icon: '🌙', color: 'text-blue-400' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#050505]">
      <div className="px-6 pt-12 pb-4">
        <PremiumHeader 
          title="Today"
          subtitle={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          actions={
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-5 h-11 rounded-full bg-white/10 text-white text-[11px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 press-scale"
            >
              Today
            </button>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pb-20 space-y-6">
          {timeBlocks.map((block, index) => {
            const isCollapsed = collapsedBlocks.has(block.id);
            const filteredItems = planItems?.filter((item: any) => item.mealType === block.id) || [];
            
            return (
              <div key={block.id} style={{ animationDelay: `${index * 0.05}s` }}>
                <button
                  onClick={() => handleToggleBlock(block.id)}
                  className="w-full flex items-center justify-between py-3 mb-2 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{block.icon}</span>
                    <h3 className={`text-[16px] font-black uppercase tracking-[0.2em] ${block.color}`}>
                      {block.label}
                    </h3>
                    <span className="text-[12px] font-bold text-white/40">
                      {block.timeRange}
                    </span>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`text-white/30 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`}
                  />
                </button>

                {!isCollapsed && (
                  <div className="space-y-3">
                    {planItems === undefined ? (
                      <div className="h-20 animate-pulse bg-white/5 rounded-2xl" />
                    ) : filteredItems.length === 0 ? (
                      <div className="border border-white/5 bg-white/[0.02] rounded-2xl p-6 text-center">
                        <p className="text-white/20 text-[12px] font-medium italic">No {block.label.toLowerCase()} activities</p>
                      </div>
                    ) : (
                      filteredItems.map((planItem: any) => (
                        <div 
                          key={planItem._id}
                          className={`group relative bg-zinc-900/30 border ${planItem.completed ? 'border-green-500/20' : 'border-white/5'} rounded-2xl p-4 hover:border-blue-500/30 transition-all duration-300`}
                        >
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => toggleStatus({ id: planItem._id })}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${planItem.completed ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/20 hover:text-white'}`}
                            >
                              {planItem.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                            </button>

                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => planItem.type === 'workout' ? onSelectWorkout(planItem.item) : onSelectMeal(planItem.item)}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-[15px] font-bold ${planItem.completed ? 'text-white/40 line-through' : 'text-white'}`}>
                                  {planItem.item.title || planItem.item.name}
                                </span>
                                {planItem.type === 'workout' ? <Dumbbell size={12} className="text-blue-400" /> : <Utensils size={12} className="text-orange-400" />}
                              </div>
                              {planItem.scheduledTime && (
                                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                  <Clock size={10} /> {planItem.scheduledTime}
                                </div>
                              )}
                            </div>

                            <button 
                              onClick={() => removeItem({ id: planItem._id })}
                              className="w-8 h-8 rounded-lg bg-red-500/0 hover:bg-red-500/10 text-white/0 group-hover:text-red-400 transition-all flex items-center justify-center"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TodayView;
