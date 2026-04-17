
import React, { useState } from 'react';
import { X, Clock, Flame, Utensils, ArrowLeft, Check, Calendar, ChevronRight, Zap, Play } from 'lucide-react';
import { Meal } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

interface MealDetailProps {
  meal: Meal;
  onBack: (goToCalendar?: boolean) => void;
}

const MealDetail: React.FC<MealDetailProps> = ({ meal, onBack }) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [justAdded, setJustAdded] = useState(false);
  const addToPlanMutation = useMutation(api.userPlans.addToPlan);

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleAddToPlan = async () => {
    await addToPlanMutation({
      item: meal,
      type: 'meal',
      scheduledDate: new Date().toISOString().split('T')[0],
    });
    setJustAdded(true);
  };

  if (justAdded) {
    return (
      <div className="fixed inset-0 z-[400] bg-[#050505] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          className="w-full max-w-sm px-8 text-center"
        >
          <div className="w-24 h-24 rounded-[32px] bg-white text-black flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-3">
            <Check size={48} strokeWidth={3} />
          </div>
          
          <h3 className="editorial-title text-6xl text-white mb-4">Confirmed</h3>
          <p className="text-white/40 text-[16px] leading-relaxed mb-12 font-medium">
            <span className="text-white font-bold">{meal.title}</span> has been synchronized with your nutritional plan.
          </p>
          
          <div className="flex flex-col gap-4">
            <button
              onClick={() => onBack(false)}
              className="h-16 w-full rounded-3xl bg-white text-black font-black text-[13px] uppercase tracking-[0.2em] press-scale shadow-2xl hover:bg-zinc-200 transition-colors"
            >
              Back to Catalog
            </button>
            
            <button
              onClick={() => onBack(true)}
              className="h-16 w-full rounded-3xl bg-white/5 border border-white/10 text-white font-bold text-[13px] uppercase tracking-[0.2em] press-scale flex items-center justify-center gap-3 hover:bg-white/10 transition-colors group"
            >
              <Calendar size={18} className="text-white/40 group-hover:text-white transition-colors" />
              View Calendar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative h-screen w-full bg-[#050505] flex flex-col overflow-hidden"
    >
      {/* Hero Header */}
      <div className="h-[35vh] w-full relative">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          src={meal.image} 
          className="w-full h-full object-cover" 
          alt={meal.title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
        
        <div className="absolute top-12 left-6 right-6 flex justify-between items-center">
          <button 
            onClick={() => onBack(false)}
            className="w-12 h-12 rounded-2xl bg-black/40 blur-surface flex items-center justify-center border border-white/10 text-white press-scale"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="px-4 py-2 bg-black/40 blur-surface rounded-full border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{meal.prepTime}</span>
          </div>
        </div>

        <div className="absolute bottom-16 md:bottom-10 left-6 md:left-8 right-6 md:right-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex gap-2 mb-4">
               {meal.tags.map(tag => (
                 <span key={tag} className="px-3 py-1.5 bg-white/10 blur-surface border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/90">
                   {tag}
                 </span>
               ))}
            </div>
            <h1 className="editorial-title text-4xl sm:text-5xl md:text-6xl text-white leading-tight sm:leading-[0.98] md:leading-[0.9] break-words">{meal.title}</h1>
          </motion.div>
        </div>
      </div>

      {/* Content Scrollable */}
      <div className="flex-1 bg-[#050505] px-8 pt-4 overflow-y-auto custom-scrollbar no-scrollbar pb-40">
        {/* Macros Highlight */}
        <div className="flex justify-between items-center mb-12 py-8 border-y border-white/5">
          <div className="text-center">
            <div className="text-2xl font-black text-white">{meal.calories}</div>
            <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Kcal</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-black text-white">{meal.protein}g</div>
            <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Protein</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-black text-white">{meal.carbs}g</div>
            <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Carbs</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-black text-white">{meal.fats}g</div>
            <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Fats</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Ingredients */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Utensils size={18} className="text-white/30" />
              <h3 className="text-xl font-bold tracking-tight">Ingredients</h3>
              <span className="text-white/20 text-xs font-medium ml-auto">{meal.ingredients?.length || 0} items</span>
            </div>
            <ul className="space-y-4">
              {(meal.ingredients || []).map((item, idx) => (
                <motion.li 
                  key={idx} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  onClick={() => toggleIngredient(idx)}
                  className={`flex items-center gap-5 p-4 rounded-[24px] cursor-pointer transition-all duration-500 border ${
                    checkedIngredients[idx] 
                    ? 'bg-transparent border-white/5 opacity-40' 
                    : 'bg-white/[0.03] border-white/[0.05] hover:border-white/20'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-500 ${
                    checkedIngredients[idx] 
                      ? 'bg-white border-white' 
                      : 'bg-transparent border-white/10 group-hover:border-white/30'
                  }`}>
                    {checkedIngredients[idx] && <Check size={16} className="text-black" strokeWidth={4} />}
                  </div>
                  <span className={`text-[16px] font-semibold tracking-tight transition-all duration-500 ${
                    checkedIngredients[idx] ? 'line-through decoration-white/40 text-white/40' : 'text-white/80'
                  }`}>
                    {item}
                  </span>
                </motion.li>
              ))}
            </ul>
          </section>

          {/* Instructions */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Zap size={18} className="text-white/30" />
              <h3 className="text-xl font-bold tracking-tight">Instructions</h3>
            </div>
            <div className="space-y-10">
              {(meal.instructions || []).map((step, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  className="flex gap-6 relative"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white text-black text-[13px] font-black flex items-center justify-center z-10 shadow-xl shrink-0">
                      {idx + 1}
                    </div>
                    {idx < (meal.instructions?.length || 0) - 1 && (
                      <div className="w-[2px] flex-1 bg-gradient-to-b from-white/20 to-transparent my-2" />
                    )}
                  </div>
                  <p className="text-white/60 text-[16px] leading-relaxed font-medium pt-0.5">
                    {step}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pt-12 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pointer-events-none">
        <button 
          onClick={handleAddToPlan}
          className="w-full h-18 bg-white text-black font-black text-[15px] uppercase tracking-[0.2em] rounded-[32px] shadow-[0_20px_60px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all pointer-events-auto flex items-center justify-center gap-3 group"
        >
          Add to Daily Plan
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

export default MealDetail;
