import React from 'react';
import { PlanItem, MealType } from '../../types';
import { Meal } from '../../types';
import { Plus, CheckCircle2, Trash2, ChevronRight, Utensils } from 'lucide-react';

interface DayPlanProps {
  date: Date;
  items: PlanItem[];
  onAddMeal: (type: MealType) => void;
  onRemoveItem: (id: string) => void;
  onToggleItem: (id: string) => void;
  onMealClick: (meal: Meal) => void;
}

const MEAL_TYPES: { type: MealType; label: string; time: string }[] = [
  { type: 'breakfast', label: 'Breakfast', time: '07:00 - 10:00' },
  { type: 'lunch', label: 'Lunch', time: '12:00 - 14:00' },
  { type: 'snack', label: 'Snack', time: 'Anytime' },
  { type: 'dinner', label: 'Dinner', time: '18:00 - 21:00' },
];

const DayPlan: React.FC<DayPlanProps> = ({ 
  items, 
  onAddMeal, 
  onRemoveItem, 
  onToggleItem,
  onMealClick
}) => {
  
  const getItemsForType = (type: MealType) => {
    return items.filter(item => item.mealType === type);
  };

  const renderMealSlot = (type: MealType, label: string, time: string) => {
    const slotItems = getItemsForType(type);
    
    return (
      <div key={type} className="mb-6 animate-silk-up">
        <div className="flex justify-between items-end mb-3 px-2">
          <div>
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">{label}</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{time}</p>
          </div>
          <button 
            onClick={() => onAddMeal(type)}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all"
          >
            <Plus size={14} />
          </button>
        </div>

        {slotItems.length === 0 ? (
          <div 
            onClick={() => onAddMeal(type)}
            className="h-28 border border-dashed border-white/10 rounded-[24px] flex flex-col items-center justify-center gap-3 group cursor-pointer hover:bg-white/[0.02] hover:border-white/20 transition-all active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white/60 group-hover:scale-110 transition-all">
              <Plus size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400">
              Add {label}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {slotItems.map(item => (
              <div 
                key={item.id}
                className={`relative group bg-zinc-900/40 border border-white/5 rounded-[28px] p-1 pr-4 flex items-center gap-3 overflow-hidden transition-all ${
                  item.completed ? 'opacity-50 grayscale' : 'opacity-100'
                }`}
              >
                {/* Image */}
                <div 
                  onClick={() => onMealClick(item.item as Meal)}
                  className="w-20 h-20 rounded-[24px] overflow-hidden cursor-pointer"
                >
                  <img src={item.item.image} className="w-full h-full object-cover" alt={item.item.title} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 py-2">
                  <h4 className="text-[14px] font-bold text-white truncate italic uppercase tracking-tight leading-none mb-1">
                    {item.item.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                      {(item.item as Meal).calories} kcal
                    </span>
                    <span className="w-0.5 h-0.5 bg-zinc-600 rounded-full" />
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                      {(item.item as Meal).protein}g Pro
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => onToggleItem(item.id)}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                      item.completed 
                        ? 'bg-emerald-500 border-emerald-500 text-black' 
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
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-32">
      {MEAL_TYPES.map(t => renderMealSlot(t.type, t.label, t.time))}
      
      {/* Daily Summary Card */}
      <div className="mt-8 bg-zinc-900 rounded-[32px] p-6 border border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-white/50">Daily Targets</h3>
          <ChevronRight size={16} className="text-white/20" />
        </div>
        <div className="flex justify-between gap-4">
          <div className="text-center">
            <div className="text-2xl font-black text-white italic">1850</div>
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Calories</div>
          </div>
          <div className="w-px bg-white/5" />
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-500 italic">140</div>
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Protein</div>
          </div>
          <div className="w-px bg-white/5" />
          <div className="text-center">
            <div className="text-2xl font-black text-blue-500 italic">120</div>
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Carbs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayPlan;
