import React, { useState, useMemo } from 'react';
import { Meal } from '../types';
import { Calendar, Search, Clock, Flame, ChevronRight } from 'lucide-react';
import CalendarPreviewModal from '../components/CalendarPreviewModal';
import PlanningBanner from '../components/PlanningBanner';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

interface MealsViewProps {
  onSelect: (m: Meal) => void;
  calendarDateStr?: string | null;
  onCalendarAdded?: () => void;
  onGoToCalendar?: () => void;
}

const CATEGORIES = ['All', 'High Protein', 'Vegan', 'Gluten Free', 'Quick'];

const MacroBadge: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex flex-col items-start gap-0.5">
    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">{label}</span>
    <div className="flex items-center gap-1.5">
      <div className={`w-0.5 h-3 rounded-full ${color} opacity-80`} />
      <span className="text-[12px] font-black text-white tracking-tighter">{value}<span className="text-[8px] ml-0.5 text-white/30 font-bold">G</span></span>
    </div>
  </div>
);

const MealCard: React.FC<{ meal: Meal; onClick: () => void; index: number; isFeatured?: boolean }> = ({ meal, onClick, index, isFeatured }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.05, 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1] 
      }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`group relative w-full ${isFeatured ? 'h-[340px]' : 'h-[280px]'} rounded-[40px] overflow-hidden cursor-pointer glass-card inner-stroke shadow-xl transition-all duration-500`}
    >
      {/* Background Image Layer */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <motion.img
          src={meal.image}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[8s] ease-out group-hover:scale-105"
          alt={meal.title}
          style={{ filter: 'brightness(0.95)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/10 to-transparent" />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-700" />
      </div>

      {/* Header Info */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
        <div className="flex gap-1.5">
          {meal.tags.map(tag => (
            <div key={tag} className="px-3 py-1.5 bg-black/30 blur-surface rounded-full border border-white/5 shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white/90">{tag}</span>
            </div>
          ))}
        </div>
        
        {/* Calorie Badge: More compact */}
        <div className="relative group/kcal">
          <div className="absolute inset-0 bg-white rounded-full blur-md opacity-0 group-hover/kcal:opacity-10 transition-opacity" />
          <div className="w-14 h-14 rounded-full bg-white text-black flex flex-col items-center justify-center shadow-lg border-2 border-white/20 relative z-10 transition-transform group-hover:rotate-[10deg] duration-500">
            <span className="text-[15px] font-black leading-none tracking-tighter">{meal.calories}</span>
            <span className="text-[7px] font-black uppercase tracking-widest mt-0.5 opacity-40">Kcal</span>
          </div>
        </div>
      </div>

      {/* Featured Indicator */}
      {isFeatured && (
        <div className="absolute top-1/2 -left-10 -translate-y-1/2 -rotate-90 origin-center">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 whitespace-nowrap">Chef's Choice</span>
        </div>
      )}

      {/* Content Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-20 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end gap-4">
            <div className="flex-1">
              <h3 className={`editorial-title ${isFeatured ? 'text-3xl' : 'text-2xl'} text-white leading-[0.95] tracking-tight group-hover:text-white transition-colors line-clamp-2`}>
                {meal.title}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300 shadow-lg shrink-0">
              <ChevronRight size={18} strokeWidth={2.5} />
            </div>
          </div>

          <div className="h-px w-full bg-white/5" />

          <div className="flex justify-between items-end">
            <div className="flex gap-6">
              <MacroBadge label="Protein" value={meal.protein} color="bg-blue-400" />
              <MacroBadge label="Carbs" value={meal.carbs} color="bg-emerald-400" />
              <MacroBadge label="Fats" value={meal.fats} color="bg-orange-400" />
            </div>
            
            <div className="flex items-center gap-1.5 text-white/30">
              <Clock size={12} className="text-white/40" />
              <span className="text-[10px] font-black uppercase tracking-[0.15em]">{meal.prepTime}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MealsView: React.FC<MealsViewProps> = ({ onSelect, calendarDateStr, onCalendarAdded, onGoToCalendar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [previewMeal, setPreviewMeal] = useState<Meal | null>(null);
  const addToPlanMutation = useMutation(api.userPlans.addToPlan);
  const mealsQuery = useQuery(api.meals.getMeals);

  const isScheduling = Boolean(calendarDateStr);

  const allMeals = useMemo(() => {
    return (mealsQuery || []).map((m: any) => ({
      id: m._id,
      title: m.title,
      image: m.image || '/placeholder-meal.jpg',
      description: m.description || '',
      calories: m.calories || 0,
      protein: m.macros?.p || 0,
      carbs: m.macros?.c || 0,
      fats: m.macros?.f || 0,
      prepTime: '15 min',
      tags: m.type ? [m.type] : [],
    }));
  }, [mealsQuery]);

  const filteredMeals = useMemo(() => {
    return allMeals.filter(meal => {
      const matchesSearch = meal.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || 
                             meal.tags.some(tag => tag.toLowerCase() === activeCategory.toLowerCase()) ||
                             (activeCategory === 'Quick' && parseInt(meal.prepTime) <= 20);
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, allMeals]);

  return (
    <div className="px-5 pt-14 pb-32 relative min-h-screen bg-[#050505] overflow-x-hidden">
      {/* Header Section */}
      <AnimatePresence mode="wait">
        {!isScheduling ? (
          <motion.div 
            key="normal-header"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="mb-8 relative"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="editorial-title text-5xl text-white leading-[0.9] tracking-tight">
                  Fuel <span className="editorial-serif italic text-white/30 lowercase tracking-normal font-light">your</span><br />
                  Potential
                </h2>
              </div>
              <div className="flex gap-2 self-start">
                <button
                  onClick={() => onGoToCalendar?.()}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center press-scale hover:bg-white/10 transition-all"
                  title="View Calendar"
                >
                  <Calendar size={18} className="text-white/60" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <PlanningBanner
            dateStr={calendarDateStr!}
            type="meal"
            onCancel={() => onGoToCalendar?.()}
          />
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="sticky top-0 z-[100] bg-[#050505]/95 backdrop-blur-md py-4 -mx-5 px-5 mb-6 border-b border-white/5">
        <div className="relative mb-4 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/50 transition-colors" size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isScheduling ? 'Pick a meal to add to plan...' : 'Search for Fuel...'}
            className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-[20px] pl-12 pr-4 text-[15px] font-medium focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all placeholder:text-white/20 text-white"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar no-scrollbar scroll-smooth">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-[16px] text-[11px] font-bold uppercase tracking-[0.1em] transition-all duration-300 whitespace-nowrap ${
                activeCategory === cat 
                ? 'bg-white text-black shadow-lg scale-[1.02]' 
                : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Meal Feed */}
      <div className="space-y-6 mt-6">
        {filteredMeals.length > 0 ? (
          filteredMeals.map((meal, idx) => (
            <MealCard 
              key={meal.id} 
              meal={meal} 
              index={idx}
              isFeatured={idx === 0 && searchQuery === '' && activeCategory === 'All'}
              onClick={() => {
                if (calendarDateStr) {
                  setPreviewMeal(meal);
                  return;
                }
                onSelect(meal);
              }}
            />
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 opacity-20">
              <Flame size={32} />
            </div>
            <p className="text-lg font-black text-white/30 uppercase tracking-tighter italic">Out of Fuel</p>
            <button 
              onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
              className="mt-6 text-white font-black uppercase tracking-[0.2em] text-[9px] bg-white/10 px-6 py-3 rounded-full border border-white/5 hover:bg-white hover:text-black transition-all"
            >
              Reset Calendar
            </button>
          </div>
        )}
      </div>

      <CalendarPreviewModal
        isOpen={!!previewMeal && isScheduling}
        item={previewMeal!}
        type="meal"
        dateStr={calendarDateStr!}
        onClose={() => setPreviewMeal(null)}
        onConfirm={async (data) => {
          if (previewMeal && calendarDateStr) {
            await addToPlanMutation({
              item: previewMeal,
              type: 'meal',
              scheduledDate: calendarDateStr,
              mealType: data.slot,
              notes: data.notes,
              scheduledTime: data.specificTime
            });
            onCalendarAdded?.();
          }
          setPreviewMeal(null);
        }}
      />
    </div>
  );
};

export default MealsView;