import React, { useState, useEffect, useMemo, memo } from 'react';
import { Play, ChevronRight, CheckCircle2, Utensils, Calendar as CalendarIcon, Flame, LayoutGrid, Clock } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../services/AuthContext';
import { MOCK_WORKOUTS, MOCK_MEALS } from '../constants';
import { Workout, Meal } from '../types';
import PremiumHeader from '../components/PremiumHeader';
import PremiumSectionHeader from '../components/PremiumSectionHeader';
import PremiumWeekStrip from '../components/PremiumWeekStrip';
import PremiumTimeline from '../components/PremiumTimeline';
import PremiumStreakCounter from '../components/PremiumStreakCounter';
import { CardSkeleton, MealCardSkeleton, TimelineSkeleton, StreakCounterSkeleton } from '../components/LoadingSkeleton';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

interface HomeViewProps {
  onSelectWorkout: (workout: Workout) => void;
  onSelectMeal: (meal: Meal) => void;
  onOpenCalendar: () => void;
  onNavigateToNutritionPlan: () => void;
  onNavigateToSettings: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({
  onSelectWorkout,
  onSelectMeal,
  onOpenCalendar,
  onNavigateToNutritionPlan,
  onNavigateToSettings,
}) => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // Load data with loading states
  const dailyPlan = useQuery(api.userPlans.getDailyPlan, { date: selectedDate });
  const togglePlanStatus = useMutation(api.userPlans.togglePlanItemStatus);
  const streakData = useQuery(api.userPlans.getStreak);
  
  // Get start and end of current week for event dots
  const weekRange = useMemo(() => {
    const currentDate = new Date(selectedDate);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0]
    };
  }, [selectedDate]);
  
  const weeklyPlans = useQuery(api.userPlans.getPlansInRange, { 
    startDate: weekRange.start, 
    endDate: weekRange.end 
  });
  
  // Loading states
  const isLoading = dailyPlan === undefined || streakData === undefined || weeklyPlans === undefined;
  const dailyPlanData = dailyPlan || [];
  const streakDataValue = streakData || { currentStreak: 0, longestStreak: 0 };
  const weeklyPlansData = weeklyPlans || [];
  
  // Process eventDays for the week strip
  const eventDays = useMemo(() => {
    const events: Record<string, { hasWorkout: boolean; hasMeal: boolean }> = {};
    
    weeklyPlansData.forEach(plan => {
      if (!events[plan.scheduledDate]) {
        events[plan.scheduledDate] = { hasWorkout: false, hasMeal: false };
      }
      
      if (plan.type === 'workout') {
        events[plan.scheduledDate].hasWorkout = true;
      } else if (plan.type === 'meal') {
        events[plan.scheduledDate].hasMeal = true;
      }
    });
    
    return events;
  }, [weeklyPlansData]);

  // Transform dailyPlan for timeline view
  const timelineEvents = useMemo(() => {
    return dailyPlanData.map((item) => {
      const workout = item.item as Workout;
      const meal = item.item as Meal;
      
      return {
        id: item._id,
        title: item.type === 'workout' ? workout.title : meal.title,
        type: item.type === 'workout' ? 'workout' : 'nutrition',
        startTime: item.scheduledTime || '09:00',
        endTime: item.scheduledEndTime || '10:00',
        completed: item.completed
      };
    });
  }, [dailyPlanData]);

  const [profileName, setProfileName] = useState(user?.fullName || 'Member');
  const featuredWorkout = MOCK_WORKOUTS[0];

  useEffect(() => {
    setMounted(true);
    if (user?.fullName) {
      setProfileName(user.fullName);
    }
  }, [user]);

  const workoutsInPlan = dailyPlanData.filter(item => item.type === 'workout');
  const mealsInPlan = dailyPlanData.filter(item => item.type === 'meal');

  const heroWorkout = workoutsInPlan.length > 0 ? (workoutsInPlan[0].item as Workout) : featuredWorkout;
  const isHeroInPlan = workoutsInPlan.length > 0;
  const heroPlanId = isHeroInPlan ? workoutsInPlan[0]._id : null;

  const handleToggleComplete = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    await togglePlanStatus({ id });
  };

  if (!mounted) return null;

  return (
    <div className="px-6 pt-10 pb-24">
      <PremiumHeader
        title={`Hi, ${profileName}!`}
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        onNavigateToSettings={onNavigateToSettings}
        actions={<NotificationBell />}
      />

      {/* Daily Progress */}
      <div className="mb-6 flex items-center justify-between px-1">
        {isLoading ? (
          <StreakCounterSkeleton />
        ) : (
          <PremiumStreakCounter
            currentStreak={streakDataValue.currentStreak}
            longestStreak={streakDataValue.longestStreak}
            className="flex-1"
          />
        )}
        <div className="flex items-center gap-2 ml-4">
          <Flame size={16} className="text-orange-400" />
          <span className="text-[11px] font-black uppercase tracking-widest text-white/60">
            {dailyPlanData.filter(item => item.completed).length}/{dailyPlanData.length} completed {selectedDate === today ? 'today' : 'on ' + selectedDate}
          </span>
        </div>
      </div>

      {/* Week Strip */}
      <PremiumWeekStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        eventDays={eventDays}
      />

      {/* CORE TRAINING HERO */}
      <div className="mb-12 animate-silk-up" style={{ animationDelay: '0.05s' }}>
        <PremiumSectionHeader
          title="Today's Plan"
          rightElement={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`w-11 h-11 rounded-full border flex items-center justify-center press-scale transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/[0.05] border-white/10'
                }`}
              >
                <LayoutGrid size={20} className={viewMode === 'grid' ? 'text-white' : 'text-white/40'} aria-label="Grid view" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`w-11 h-11 rounded-full border flex items-center justify-center press-scale transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/[0.05] border-white/10'
                }`}
              >
                <Clock size={20} className={viewMode === 'timeline' ? 'text-white' : 'text-white/40'} aria-label="Timeline view" />
              </button>
              <button
                type="button"
                onClick={onOpenCalendar}
                className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center press-scale"
              >
                <CalendarIcon size={20} className="text-white/40" aria-label="View calendar" />
              </button>
            </div>
          }
        />

        {viewMode === 'grid' ? (
          <>
            <button
              type="button"
              onClick={() => onSelectWorkout(heroWorkout)}
              className="relative h-[280px] md:h-[400px] rounded-[56px] overflow-hidden press-scale shadow-2xl group border border-white/10 w-full text-left"
            >
              <img src={heroWorkout.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s] ease-out" alt="Core Training" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

              <div className="absolute top-8 left-8">
                <div className="px-4 py-2 bg-black/40 blur-surface rounded-full border border-white/10 flex items-center gap-2.5 shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    {isHeroInPlan ? 'Planned Activity' : 'Trainer Suggestion'}
                  </span>
                </div>
              </div>

              {isHeroInPlan && (
                <button
                  type="button"
                  onClick={(e) => handleToggleComplete(e, heroPlanId)}
                  className={`absolute top-8 right-8 w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all z-20 ${
                    workoutsInPlan[0].completed
                      ? 'bg-white border-white shadow-[0_0_30px_rgba(255,255,255,0.4)]'
                      : 'bg-black/20 blur-surface border-white/30 text-white/40'
                  }`}
                >
                  <CheckCircle2 size={20} className={workoutsInPlan[0].completed ? 'text-black' : 'text-current'} />
                </button>
              )}

              <div className="absolute bottom-12 md:bottom-16 left-10 right-10">
                <h3 className="text-[28px] md:text-[36px] font-black leading-[0.95] tracking-tighter mb-8 text-white uppercase italic">
                  {heroWorkout.title}
                </h3>

                <div className="flex items-center justify-between">
                  <button type="button" className="h-12 px-8 md:h-14 md:px-10 bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-full flex items-center gap-3 shadow-[0_10px_40px_rgba(255,255,255,0.2)] press-scale">
                    <Play fill="black" size={14} />
                    Engage
                  </button>

                  <div className="flex gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[16px] md:text-[18px] font-black text-white drop-shadow-lg">{heroWorkout.duration}</span>
                      <span className="text-[8px] font-black uppercase text-white/60 tracking-widest">Time</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </>
        ) : (
          <div className="h-[600px] rounded-[40px] bg-zinc-900/30 border border-white/10 overflow-hidden">
            {isLoading ? (
              <TimelineSkeleton />
            ) : (
              <PremiumTimeline events={timelineEvents} selectedDate={new Date(selectedDate)} />
            )}
          </div>
        )}
      </div>

      {/* NUTRITION PLAN */}
      <div className="mb-12 animate-silk-up" style={{ animationDelay: '0.1s' }}>
        <PremiumSectionHeader
          title="Fuel & Recovery"
          rightElement={
            <button
              type="button"
              onClick={onNavigateToNutritionPlan}
              className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center press-scale"
            >
              <Utensils size={20} className="text-white/40" aria-label="Nutrition planning" />
            </button>
          }
        />

        {mealsInPlan.length === 0 ? (
          <button
            type="button"
            onClick={onNavigateToNutritionPlan}
            className="relative h-44 bg-zinc-900/20 border border-white/8 rounded-[36px] flex flex-col items-center justify-center gap-3 group press-scale w-full text-left"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-transform group-hover:scale-110">
              <Utensils size={20} className="text-white/30" />
            </div>
            <div className="text-center">
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Plan your nutrition</span>
              <span className="text-[10px] text-white/30 mt-1 block">Set meals to fuel your day</span>
            </div>
          </button>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 custom-scrollbar snap-x scroll-fade">
            {mealsInPlan.map((item) => (
              <button
                type="button"
                key={item._id}
                onClick={() => onSelectMeal(item.item as Meal)}
                className={`flex-shrink-0 w-[240px] snap-center relative aspect-[3/4] rounded-[44px] overflow-hidden press-scale group border border-white/10 shadow-xl transition-all duration-500 text-left ${
                  item.completed ? 'opacity-40 grayscale blur-[1px]' : 'opacity-100'
                }`}
              >
                 <img src={item.item.image} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" alt={item.item.title} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                 <button
                   type="button"
                   onClick={(e) => handleToggleComplete(e, item._id)}
                   className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
                     item.completed
                       ? 'bg-white border-white shadow-[0_0_30px_rgba(255,255,255,0.4)]'
                       : 'bg-black/20 blur-surface border-white/30 text-white/40'
                   }`}
                 >
                   {item.completed ? (
                     <CheckCircle2 size={20} className="text-black" />
                   ) : (
                     <div className="w-1 h-1 rounded-full bg-white/40" />
                   )}
                 </button>

                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-[16px] md:text-[18px] font-black leading-tight tracking-tight text-white mb-2 uppercase italic line-clamp-2">
                    {item.item.title}
                  </h3>
                  <div className="flex items-center text-[10px] font-black text-white drop-shadow-lg/50 uppercase tracking-widest">
                    <span>{(item.item as Meal).prepTime}</span>
                  </div>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={onOpenCalendar}
              className="flex-shrink-0 w-[180px] snap-center aspect-[3/4] rounded-[44px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 text-white/20 hover:text-white/40 transition-all group press-scale text-left"
            >
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest text-center px-4">Full Plan<br />Details</span>
            </button>
            <div className="flex-shrink-0 w-4" />
          </div>
        )}
      </div>

      {/* Daily Inspiration */}
      <div className="mb-10 animate-silk-up" style={{ animationDelay: '0.1s' }}>
        <PremiumSectionHeader title="Daily Inspiration" />
        <div className="relative h-60 rounded-[40px] overflow-hidden press-scale shadow-xl group border border-white/10">
          <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Podcast" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-7 left-7 right-24">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 block text-white/40">Podcast of the day</span>
            <h3 className="text-lg font-extrabold leading-tight tracking-tighter text-white">Unlock Endless Motivation With Your "Why"</h3>
          </div>
          <button type="button" className="absolute bottom-7 right-7 w-12 h-12 bg-white/10 blur-surface border border-white/10 rounded-full flex items-center justify-center text-white shadow-xl">
            <Play fill="white" size={20} className="ml-0.5" aria-label="Play podcast" />
          </button>
        </div>
      </div>

      {/* Recommended Rails */}
      <div className="mb-12 animate-silk-up" style={{ animationDelay: '0.15s' }}>
        <PremiumSectionHeader
          title="Recommended"
          rightElement={<button type="button"><ChevronRight size={16} className="text-white/20" /></button>}
        />
        <div className="flex gap-4 overflow-x-auto custom-scrollbar -mx-6 px-6 scroll-fade">
          {MOCK_MEALS.map((meal) => (
            <button
              type="button"
              key={meal.id}
              onClick={() => onSelectMeal(meal)}
              className="flex-shrink-0 w-60 group active:scale-[0.98] transition-all text-left"
            >
              <div className="h-40 rounded-[32px] overflow-hidden mb-3 shadow-lg bg-zinc-900 border border-white/10">
                <img src={meal.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={meal.title} />
              </div>
              <h3 className="font-bold text-base leading-tight tracking-tight mb-1 text-white/90">{meal.title}</h3>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{meal.prepTime}</p>
            </button>
          ))}
          <div className="flex-shrink-0 w-4" />
        </div>
      </div>
    </div>
  );
};

export default HomeView;
