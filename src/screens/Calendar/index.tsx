import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanItem, Workout, Meal } from '../../types';
import { ArrowLeft, Calendar, CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, List, Menu, Plus, X, Dumbbell, Utensils, Zap, Copy } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import ListView from './ListView';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';
import { ViewType, CalendarEvent, generateCalendarEvents } from './calendarUtils';
import CalendarPreviewModal from '../../components/CalendarPreviewModal';

interface CalendarViewProps {
  initialDate?: Date;
  onClose?: () => void;
  onSelectWorkout: (workout: Workout) => void;
  onSelectMeal: (meal: Meal) => void;
  onNavigateToWorkouts: () => void;
  onNavigateToMeals: () => void;
  onCalendarRequest: (kind: 'workout' | 'meal', date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  initialDate,
  onClose,
  onSelectWorkout,
  onSelectMeal,
  onNavigateToWorkouts,
  onNavigateToMeals,
  onCalendarRequest
}) => {
  const [currentView, setCurrentView] = useState<ViewType>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate ?? new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const dateRange = useMemo(() => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);
    if (currentView === 'week') {
      start.setDate(start.getDate() - start.getDay());
      end.setDate(end.getDate() + (6 - end.getDay()));
    } else if (currentView === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    }
    return { 
      start: start.toISOString().split('T')[0], 
      end: end.toISOString().split('T')[0] 
    };
  }, [selectedDate, currentView]);

  const planItemsRaw = useQuery(api.userPlans.getPlansInRange, { 
    startDate: dateRange.start, 
    endDate: dateRange.end 
  });
  
  const events = useMemo(() => generateCalendarEvents(planItemsRaw || []), [planItemsRaw]);
  const updateItem = useMutation(api.userPlans.updatePlanItem);
  const removeItem = useMutation(api.userPlans.removeFromPlan);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!onClose) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDrawerOpen && !isAddOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAddOpen, isDrawerOpen, onClose]);

  const handleViewChange = (newView: ViewType) => {
    if (newView === currentView) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView(newView);
      setIsTransitioning(false);
    }, 200);
  };

  const navigatePrevious = () => {
    const newDate = new Date(selectedDate);
    switch (currentView) {
      case 'list':
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    setSelectedDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(selectedDate);
    switch (currentView) {
      case 'list':
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'day', label: 'Day', icon: <Calendar size={16} /> },
    { id: 'list', label: 'List', icon: <List size={16} /> },
    { id: 'week', label: 'Week', icon: <CalendarDays size={16} /> },
    { id: 'month', label: 'Month', icon: <LayoutGrid size={16} /> },
  ];

  const onUpdatePlanItemForViews = async (id: string, updates: any) => {
    await updateItem({ id: id as Id<"userPlans">, updates });
  };

  const renderView = () => {
    const baseViewProps = {
      events,
      selectedDate,
      onSelectWorkout,
      onSelectMeal,
      onDateSelect: setSelectedDate,
      onAddWorkout: () => onCalendarRequest('workout', selectedDate),
      onAddMeal: () => onCalendarRequest('meal', selectedDate),
    };

    switch (currentView) {
      case 'list':
        return (
          <ListView
            events={events}
            selectedDate={selectedDate}
            onSelectWorkout={onSelectWorkout}
            onSelectMeal={onSelectMeal}
            onDateSelect={setSelectedDate}
            onAddWorkout={() => onCalendarRequest('workout', selectedDate)}
            onAddMeal={() => onCalendarRequest('meal', selectedDate)}
          />
        );
      case 'day':
        return <DayView {...baseViewProps} onUpdatePlanItem={onUpdatePlanItemForViews} onEditEvent={(event) => setEditingEvent(event)} />;
      case 'week':
        return <WeekView {...baseViewProps} />;
      case 'month':
        return <MonthView {...baseViewProps} />;
      default:
        return <DayView {...baseViewProps} onUpdatePlanItem={onUpdatePlanItemForViews} />;
    }
  };

  const getDateRangeDisplay = () => {
    switch (currentView) {
      case 'list':
      case 'day':
        return selectedDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        }).toUpperCase();
      case 'week':
      case 'month':
      default:
        return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050505]">
      {/* Add Sheet */}
      <AnimatePresence>
        {isAddOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="fixed inset-0 z-[460] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[465] bg-[#09090b] border-t border-white/10 rounded-t-[32px] overflow-hidden shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-[#09090b]">
                <div className="w-12 h-1.5 rounded-full bg-zinc-800" />
              </div>

              <div className="p-6 pt-2 pb-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-[24px] font-black tracking-tight text-white leading-none mb-1">Add to Calendar</h2>
                    <p className="text-[13px] text-white/40 font-medium">Select an activity to add to your plan</p>
                  </div>
                  <button
                    onClick={() => setIsAddOpen(false)}
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsAddOpen(false);
                      onCalendarRequest('workout', selectedDate);
                    }}
                    className="relative group h-40 rounded-[24px] bg-zinc-900 border border-white/5 overflow-hidden flex flex-col items-center justify-center gap-3"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <Dumbbell size={28} className="text-white" />
                    </div>
                    <span className="text-[14px] font-bold text-white uppercase tracking-wider">Workout</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsAddOpen(false);
                      onCalendarRequest('meal', selectedDate);
                    }}
                    className="relative group h-40 rounded-[24px] bg-zinc-900 border border-white/5 overflow-hidden flex flex-col items-center justify-center gap-3"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <Utensils size={28} className="text-white" />
                    </div>
                    <span className="text-[14px] font-bold text-white uppercase tracking-wider">Meal</span>
                  </motion.button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                   <button className="h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                      <Zap size={16} className="text-yellow-500" />
                      <span className="text-[12px] font-bold text-white/70">Quick Add</span>
                   </button>
                   <button className="h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                      <Copy size={16} className="text-blue-500" />
                      <span className="text-[12px] font-bold text-white/70">Copy Yesterday</span>
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Drawer */}
      <div className={`fixed inset-0 z-[450] ${isDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-200 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsDrawerOpen(false)}
        />

        <div
          className={`absolute inset-y-0 left-0 w-[320px] max-w-[88vw] bg-[#09090b] border-r border-white/10 shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Calendar options"
        >
          <div className="h-full flex flex-col">
            <div className="px-5 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Views</div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors press-scale"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5">
              <div className="space-y-2">
                {views.map((view) => {
                  const isActive = currentView === view.id;
                  return (
                    <button
                      key={view.id}
                      onClick={() => {
                        handleViewChange(view.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 h-12 px-4 rounded-2xl border transition-colors ${isActive ? 'bg-white text-black border-white shadow-lg' : 'bg-white/[0.03] text-white/70 border-white/10 hover:bg-white/[0.06] hover:text-white'}`}
                    >
                      <div className={`${isActive ? 'text-black' : 'text-white/60'}`}>{view.icon}</div>
                      <div className="text-[11px] font-black uppercase tracking-[0.22em]">{view.label}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-3">Library</div>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onNavigateToWorkouts();
                    }}
                    className="w-full h-12 rounded-2xl bg-white/[0.03] text-white/70 border border-white/10 hover:bg-white/[0.06] hover:text-white transition-colors text-[11px] font-black uppercase tracking-[0.22em] press-scale"
                  >
                    Workouts
                  </button>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onNavigateToMeals();
                    }}
                    className="w-full h-12 rounded-2xl bg-white/[0.03] text-white/70 border border-white/10 hover:bg-white/[0.06] hover:text-white transition-colors text-[11px] font-black uppercase tracking-[0.22em] press-scale"
                  >
                    Meals
                  </button>
                </div>
              </div>

              {onClose && (
                <div className="mt-8">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-3">Close</div>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onClose();
                    }}
                    className="w-full h-12 rounded-2xl bg-white/[0.03] text-white/70 border border-white/10 hover:bg-white/[0.06] hover:text-white transition-colors text-[11px] font-black uppercase tracking-[0.22em] press-scale"
                  >
                    Back to app
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-6">
          {onClose ? (
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors press-scale"
              aria-label="Back"
            >
              <ArrowLeft size={22} />
            </button>
          ) : (
            <div className="w-12" />
          )}

          <h1 className="text-[28px] font-black text-white tracking-tight italic uppercase">Calendar</h1>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors press-scale"
            aria-label="View settings"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-4">
          {/* Date Navigator */}
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40">
              {getDateRangeDisplay()}
            </div>
            
            <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
              <button
                onClick={navigatePrevious}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={16} className="text-white/70" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 h-8 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
              >
                Today
              </button>
              <button
                onClick={navigateNext}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={16} className="text-white/70" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area with Transition */}
        <div 
          className={`
            flex-1 overflow-y-auto px-5 pb-40 custom-scrollbar
            transition-all duration-200
            ${isTransitioning ? 'opacity-0 scale-[0.99]' : 'opacity-100 scale-100'}
          `}
        >
         {planItemsRaw === undefined ? (
           <div className="flex items-center justify-center h-64">
             <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
           </div>
         ) : (
           renderView()
         )}
       </div>

       {/* Floating Add (FAB) */}
       {onClose && (
         <button
           onClick={() => {
             if (isDrawerOpen || isAddOpen) return;
             setIsAddOpen(true);
           }}
           className={`fixed z-[470] w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_18px_60px_rgba(0,0,0,0.65)] press-scale transition-all hover:bg-white/90 ${
             isDrawerOpen || isAddOpen ? 'opacity-30 pointer-events-none' : 'opacity-100'
           }`}
           style={{
             right: 'calc(env(safe-area-inset-right, 0px) + 18px)',
             bottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)',
           }}
            aria-label="Add to calendar"
          >
           <Plus size={24} />
         </button>
       )}

       {/* Edit Modal */}
       {editingEvent && (
         <CalendarPreviewModal
           isOpen={!!editingEvent}
           item={editingEvent.data}
           type={editingEvent.type}
           dateStr={editingEvent.date}
           initialTime={editingEvent.time}
           initialNotes={editingEvent.notes}
           isEditing={true}
           onClose={() => setEditingEvent(null)}
           onViewDetails={() => {
             if (editingEvent.type === 'workout') onSelectWorkout(editingEvent.data as Workout);
             else onSelectMeal(editingEvent.data as Meal);
             setEditingEvent(null);
           }}
           onDelete={async () => {
              await removeItem({ id: editingEvent.id as Id<"userPlans"> });
             setEditingEvent(null);
           }}
           onConfirm={async (data) => {
              await updateItem({ 
                id: editingEvent.id as Id<"userPlans">,
               updates: {
                 scheduledTime: data.specificTime,
                 mealType: data.slot,
                 notes: data.notes,
               }
             });
             setEditingEvent(null);
           }}
         />
       )}
     </div>
  );
};

export default CalendarView;
