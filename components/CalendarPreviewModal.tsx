import React, { useEffect, useMemo, useState } from 'react';
import { X, Check, Clock, Flame, ChevronDown, ChevronUp, Calendar, Edit3, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Meal, MealType, Workout, WorkoutSlotType } from '../types';

interface CalendarPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { slot: MealType | WorkoutSlotType; notes?: string; specificTime?: string }) => void;
  onDelete?: () => void;
  onViewDetails?: () => void;
  item: Meal | Workout;
  type: 'meal' | 'workout';
  dateStr: string;
  initialTime?: string;
  initialNotes?: string;
  isEditing?: boolean;
}

const inferSlotFromTime = (type: 'meal' | 'workout', timeStr: string): MealType | WorkoutSlotType => {
  const hour = parseInt(timeStr.split(':')[0] || '0', 10) || 0;
  if (type === 'meal') {
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 17) return 'snack';
    return 'dinner';
  }
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const getDefaultTimeForType = (type: 'meal' | 'workout'): string => (type === 'meal' ? '12:00' : '09:00');

const CalendarPreviewModal: React.FC<CalendarPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onDelete,
  onViewDetails,
  item,
  type,
  dateStr,
  initialTime,
  initialNotes,
  isEditing,
}) => {
  const [showConfirmAnimation, setShowConfirmAnimation] = useState(false);
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [showNotes, setShowNotes] = useState(!!initialNotes);
  const [timeStr, setTimeStr] = useState(() => initialTime ?? getDefaultTimeForType(type));

  useEffect(() => {
    if (isOpen) {
      setNotes(initialNotes ?? '');
      setShowNotes(!!initialNotes);
      setTimeStr(initialTime ?? getDefaultTimeForType(type));
      setShowConfirmAnimation(false);
    }
  }, [isOpen, type, initialTime, initialNotes]);

  useEffect(() => {
    if (showConfirmAnimation) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showConfirmAnimation, onClose]);

  const inferredSlot = useMemo(() => inferSlotFromTime(type, timeStr), [type, timeStr]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setShowConfirmAnimation(true);
    setTimeout(() => {
      const slot = inferSlotFromTime(type, timeStr);
      onConfirm({
        slot,
        notes: notes || undefined,
        specificTime: timeStr,
      });
    }, 1200); 
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Remove this from your calendar?')) {
      onDelete();
    }
  };

  const renderWorkoutDetails = () => {
    const workout = item as Workout;
    return (
      <div className="space-y-4">
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-[11px] text-white font-black uppercase tracking-widest">
            <Clock size={14} strokeWidth={3} className="text-white/80" /> {workout.duration}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white font-black uppercase tracking-widest">
            <Flame size={14} strokeWidth={3} className="text-white/80" /> {workout.kcal} Kcal
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Exercises</h4>
          <div className="text-[12px] text-white/80">
            {workout.exercises.map((ex, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                {ex.name}
              </div>
            ))}
          </div>
        </div>
        {workout.description && (
          <p className="text-[13px] text-white/60 leading-relaxed">
            {workout.description}
          </p>
        )}
      </div>
    );
  };

  const renderMealDetails = () => {
    const meal = item as Meal;
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="text-2xl font-black text-white leading-none tracking-tighter">{meal.calories}</div>
          <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">Kcal</div>
        </div>
        <div className="flex gap-4 text-[10px] font-black text-white/40 uppercase tracking-[0.15em]">
          <span>• P: {meal.protein}G</span>
          <span>• C: {meal.carbs}G</span>
          <span>• F: {meal.fats}G</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {meal.tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/70 border border-white/10">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-[12px] text-white/50 leading-relaxed">
          {meal.prepTime} prep time
        </p>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[450] flex items-end sm:items-center justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />

          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="pointer-events-auto w-full h-full sm:h-[90vh] sm:max-w-md bg-[#09090b] sm:rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col"
          >
            {showConfirmAnimation ? (
              <div className="absolute inset-0 z-50 bg-[#09090b] flex items-center justify-center">
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200 }}
                    className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 border border-emerald-500/30"
                  >
                    <Check size={48} className="text-emerald-400" strokeWidth={3} />
                  </motion.div>
                  <motion.h3 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-[28px] font-black text-white mb-2 tracking-tight"
                  >
                    {isEditing ? 'Updated!' : 'Calendar Added!'}
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white/40 text-[15px] font-medium"
                  >
                    Changes saved to {dateStr}
                  </motion.p>
                </div>
              </div>
            ) : (
              <>
                <div className="absolute top-0 left-0 right-0 h-24 px-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
                    {isEditing ? 'Edit' : 'Add'} {type === 'meal' ? 'Meal' : 'Workout'}
                  </span>
                  {isEditing && onDelete ? (
                    <button
                      onClick={handleDelete}
                      className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <div className="w-10" />
                  )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="relative h-72 w-full">
                    <img
                      src={item.image}
                      className="w-full h-full object-cover"
                      alt={item.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                       <div className="flex items-center justify-between items-end">
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-3">
                             <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80">
                               {type}
                             </span>
                           </div>
                           <h3 className="text-[32px] font-black leading-[1] text-white tracking-tight mb-2">
                             {item.title}
                           </h3>
                         </div>
                         {onViewDetails && (
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               onViewDetails();
                             }}
                             className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                             title="View full details"
                           >
                             <ArrowRight size={20} />
                           </button>
                         )}
                       </div>
                    </div>
                  </div>

                  <div className="px-6 pb-32 space-y-8">
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Calendar size={18} className="text-white/60" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Adding to</div>
                        <div className="text-[15px] font-bold text-white">{dateStr}</div>
                      </div>
                    </div>

                    <div>
                       {type === 'workout' ? renderWorkoutDetails() : renderMealDetails()}
                    </div>

                    <div className="border-t border-white/10 pt-8">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Start Time</label>
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-[10px] font-bold text-blue-200 capitalize">
                          {inferredSlot}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                          <Clock size={20} className="text-white/60" />
                        </div>
                        <div className="relative flex-1">
                          <input
                            type="time"
                            step={900}
                            value={timeStr}
                            onChange={(e) => setTimeStr(e.target.value)}
                            className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-[16px] font-bold text-white focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => setShowNotes(!showNotes)}
                        className="mt-6 w-full flex items-center justify-between h-12 px-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 text-white/70">
                          <Edit3 size={16} className="text-white/40" />
                          <span className="text-[13px] font-bold">{notes ? 'Edit note' : 'Add instructions or notes'}</span>
                        </div>
                        {showNotes ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                      </button>

                      <AnimatePresence>
                        {showNotes && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3">
                              <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="E.g., Drop sets for bench press..."
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:bg-white/10 resize-none"
                                maxLength={200}
                              />
                              <div className="text-right text-[10px] text-white/20 mt-1">{notes.length}/200</div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent z-20">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirm}
                    className="w-full h-14 rounded-full bg-white text-black font-black uppercase tracking-[0.15em] text-[13px] shadow-[0_8px_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2"
                  >
                    {isEditing ? 'Update Calendar' : 'Confirm & Add'}
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CalendarPreviewModal;
