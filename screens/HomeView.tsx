import React, { useState, useEffect, useMemo } from 'react';
import { Play, ChevronRight, CheckCircle2, Utensils, Settings as SettingsIcon } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../services/AuthContext';
import { MOCK_WORKOUTS, MOCK_MEALS } from '../constants';
import { Workout, Meal } from '../types';
import PremiumHeader from '../components/PremiumHeader';
import PremiumSectionHeader from '../components/PremiumSectionHeader';
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
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dailyPlan = useQuery(api.userPlans.getDailyPlan, { date: today }) || [];
  const togglePlanStatus = useMutation(api.userPlans.togglePlanItemStatus);

  const [profileName, setProfileName] = useState(user?.fullName || 'Member');
  const featuredWorkout = MOCK_WORKOUTS[0];

  useEffect(() => {
    setMounted(true);
    if (user?.fullName) {
      setProfileName(user.fullName);
    }
  }, [user]);

  const workoutsInPlan = dailyPlan.filter(item => item.type === 'workout');
  const mealsInPlan = dailyPlan.filter(item => item.type === 'meal');

  const heroWorkout = workoutsInPlan.length > 0 ? (workoutsInPlan[0].item as Workout) : featuredWorkout;
  const isHeroInPlan = workoutsInPlan.length > 0;
  const heroPlanId = isHeroInPlan ? workoutsInPlan[0]._id : null;

  const handleToggleComplete = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    await togglePlanStatus({ id });
  };

  if (!mounted) return null;

  return (
    <div className="px-6 pt-10 pb-32">
      <PremiumHeader
        title={`Hi, ${profileName}!`}
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        onNavigateToSettings={onNavigateToSettings}
        actions={<NotificationBell />}
      />

      {/* CORE TRAINING HERO */}
      <div className="mb-12 animate-silk-up" style={{ animationDelay: '0.05s' }}>
        <PremiumSectionHeader
          title="Today's Plan"
          rightElement={
            <button
              onClick={onOpenCalendar}
              className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center press-scale"
            >
              <CheckCircle2 size={20} className="text-white/40" aria-label="View calendar" />
            </button>
          }
        />

        <div className="px-1 mb-5 -mt-2">
          <p className="text-xl font-black text-white drop-shadow-lg tracking-tighter uppercase italic">Core Training</p>
        </div>

        <div
          onClick={() => onSelectWorkout(heroWorkout)}
          className="relative h-[400px] md:h-[480px] rounded-[56px] overflow-hidden press-scale shadow-2xl group border border-white/10"
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
              <button className="h-12 px-8 md:h-14 md:px-10 bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-full flex items-center gap-3 shadow-[0_10px_40px_rgba(255,255,255,0.2)] press-scale">
                <Play fill="black" size={14} aria-label="Start workout" />
                <Play fill="white" size={14} aria-label="Start workout" />
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
        </div>
      </div>

      {/* NUTRITION PLAN */}
      <div className="mb-12 animate-silk-up" style={{ animationDelay: '0.1s' }}>
        <PremiumSectionHeader
          title="Fuel & Recovery"
          rightElement={
            <button
              onClick={onNavigateToNutritionPlan}
              className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center press-scale"
            >
              <Utensils size={20} className="text-white/40" aria-label="Nutrition planning" />
            </button>
          }
        />

        <div className="px-1 mb-6 -mt-2">
          <p className="text-xl font-black text-white drop-shadow-lg tracking-tighter uppercase italic">Nutrition</p>
        </div>

        {mealsInPlan.length === 0 ? (
          <div
            onClick={onNavigateToNutritionPlan}
            className="relative h-56 bg-zinc-900/30 border border-white/5 border-dashed rounded-[44px] flex flex-col items-center justify-center gap-4 text-white/20 group press-scale"
          >
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
              <Utensils size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Establish Nutrition Plan</span>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 custom-scrollbar snap-x scroll-fade">
            {mealsInPlan.map((item) => (
              <div
                key={item._id}
                onClick={() => onSelectMeal(item.item as Meal)}
                className={`flex-shrink-0 w-[240px] snap-center relative aspect-[3/4] rounded-[44px] overflow-hidden press-scale group border border-white/10 shadow-xl transition-all duration-500 ${
                  item.completed ? 'opacity-40 grayscale blur-[1px]' : 'opacity-100'
                }`}
              >
                <img src={item.item.image} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" alt={item.item.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                <button
                  onClick={(e) => handleToggleComplete(e, item._id)}
                  className={`absolute top-6 right-6 w-10 h-10 rounded-full border flex items-center justify-center transition-all z-20 ${
                    item.completed
                      ? 'bg-white border-white'
                      : 'bg-black/20 blur-surface border-white/20'
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
              </div>
            ))}
            <div
              onClick={onOpenCalendar}
              className="flex-shrink-0 w-[180px] snap-center aspect-[3/4] rounded-[44px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 text-white/20 hover:text-white/40 transition-all group press-scale"
            >
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest text-center px-4">Full Plan<br />Details</span>
            </div>
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
          <button className="absolute bottom-7 right-7 w-12 h-12 bg-white/10 blur-surface border border-white/10 rounded-full flex items-center justify-center text-white shadow-xl">
            <Play fill="white" size={20} className="ml-0.5" aria-label="Play podcast" />
          </button>
        </div>
      </div>

      {/* Recommended Rails */}
      <div className="mb-12 animate-silk-up" style={{ animationDelay: '0.15s' }}>
        <PremiumSectionHeader
          title="Recommended"
          rightElement={<ChevronRight size={16} className="text-white/20" />}
        />
        <div className="flex gap-4 overflow-x-auto custom-scrollbar -mx-6 px-6 scroll-fade">
          {MOCK_MEALS.map((meal) => (
            <div
              key={meal.id}
              onClick={() => onSelectMeal(meal)}
              className="flex-shrink-0 w-60 group active:scale-[0.98] transition-all"
            >
              <div className="h-40 rounded-[32px] overflow-hidden mb-3 shadow-lg bg-zinc-900 border border-white/10">
                <img src={meal.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={meal.title} />
              </div>
              <h3 className="font-bold text-base leading-tight tracking-tight mb-1 text-white/90">{meal.title}</h3>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{meal.prepTime}</p>
            </div>
          ))}
          <div className="flex-shrink-0 w-4" />
        </div>
      </div>
    </div>
  );
};

export default HomeView;
