import React, { useRef, useEffect } from 'react';
import { CalendarEvent, groupEventsByDate, getWeekStart, isSameDay } from './calendarUtils';
import { Workout, Meal } from '../../types';
import { Flame, Dumbbell, Utensils, Check, Circle, Play } from 'lucide-react';

interface WeekViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectWorkout: (workout: Workout) => void;
  onSelectMeal: (meal: Meal) => void;
  onDateSelect: (date: Date) => void;
  onAddWorkout: () => void;
  onAddMeal: () => void;
}

const WeekView: React.FC<WeekViewProps> = ({
  events,
  selectedDate,
  onSelectWorkout,
  onSelectMeal,
  onDateSelect,
}) => {
  const grouped = groupEventsByDate(events);
  const weekStart = getWeekStart(selectedDate);
  const today = new Date();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Generate 7 days starting from weekStart
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  const isTodayDate = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  // Find the currently selected day's events for detail view
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const selectedDayEvents = grouped.get(selectedDateStr) || [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Horizontal Day Strip */}
      <div className="overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
        <div className="flex gap-2 min-w-max">
          {days.map((day, index) => {
            const dateStr = day.toISOString().split('T')[0];
            const dayEvents = grouped.get(dateStr) || [];
            const workoutCount = dayEvents.filter(e => e.type === 'workout').length;
            const mealCount = dayEvents.filter(e => e.type === 'meal').length;
            const selected = isSelected(day);
            const isCurrentDay = isTodayDate(day);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateSelect(day)}
                className={`
                  w-[68px] h-[90px] rounded-[24px] flex flex-col items-center justify-center transition-all relative
                  ${selected 
                    ? 'bg-white text-black shadow-lg shadow-white/10 scale-105 z-10' 
                    : isCurrentDay
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/[0.03] text-white/40 hover:bg-white/[0.06]'
                  }
                `}
              >
                <span className={`
                  text-[10px] font-black uppercase tracking-wider mb-1
                  ${selected ? 'text-black/60' : ''}
                `}>
                  {dayNames[index]}
                </span>
                <span className={`
                  text-[24px] font-black leading-none mb-2
                  ${selected ? 'text-black' : ''}
                `}>
                  {day.getDate()}
                </span>
                
                {/* Event Dots */}
                <div className="flex gap-1">
                  {workoutCount > 0 && (
                    <div className={`
                      w-1.5 h-1.5 rounded-full
                      ${selected ? 'bg-orange-500' : 'bg-orange-400'}
                    `} />
                  )}
                  {mealCount > 0 && (
                    <div className={`
                      w-1.5 h-1.5 rounded-full
                      ${selected ? 'bg-emerald-500' : 'bg-emerald-400'}
                    `} />
                  )}
                </div>
                
                {/* Selection Indicator */}
                {selected && (
                  <div className="absolute -bottom-1 w-8 h-1 rounded-full bg-white/20 blur-md" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Selected Day Detail List */}
      <div>
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-3">
            <h3 className="text-[20px] font-black text-white tracking-tight">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </h3>
            {isTodayDate(selectedDate) && (
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 uppercase tracking-wider">
                Today
              </span>
            )}
          </div>
          <span className="text-[12px] font-bold text-white/30 bg-white/5 px-3 py-1 rounded-full">
            {selectedDayEvents.length} events
          </span>
        </div>
        
        {selectedDayEvents.length === 0 ? (
          <div className="py-20 text-center rounded-[32px] bg-white/[0.02] border border-white/[0.02]">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl opacity-50">💤</span>
            </div>
            <p className="text-[14px] font-medium text-white/40 mb-1">Rest Day</p>
            <p className="text-[12px] text-white/20">No activities planned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayEvents.map((event, i) => {
              const isWorkout = event.type === 'workout';
              return (
                <div
                  key={event.id}
                  onClick={() => isWorkout ? onSelectWorkout(event.data as Workout) : onSelectMeal(event.data as Meal)}
                  className="group relative rounded-[24px] overflow-hidden cursor-pointer press-scale transition-all animate-fade-in"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Card Background */}
                  <div className={`
                    absolute inset-0 
                    ${isWorkout 
                      ? 'bg-[#121212] border border-white/[0.08]' 
                      : 'bg-[#0a1f16] border border-emerald-500/10'
                    }
                  `} />
                  
                  {/* Left Accent */}
                  <div className={`
                    absolute left-0 top-0 bottom-0 w-1.5
                    ${isWorkout 
                      ? event.intensity === 'Hard' ? 'bg-red-500' 
                      : event.intensity === 'Medium' ? 'bg-orange-500'
                      : 'bg-green-500'
                      : 'bg-emerald-500'
                    }
                  `} />
                  
                  <div className="relative p-4 pl-5 flex items-center gap-4">
                    {/* Time Column */}
                    <div className="flex-shrink-0 w-[52px] text-center">
                      <div className="text-[15px] font-black text-white">{event.time}</div>
                      <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mt-0.5">
                        {parseInt(event.time.split(':')[0]) < 12 ? 'AM' : 'PM'}
                      </div>
                    </div>
                    
                    {/* Divider */}
                    <div className="w-px h-10 bg-white/10" />
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[15px] font-bold text-white truncate leading-tight mb-1.5">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-3">
                        {isWorkout ? (
                          <div className={`
                            flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full
                            ${event.intensity === 'Hard' ? 'bg-red-500/10 text-red-400' 
                            : event.intensity === 'Medium' ? 'bg-orange-500/10 text-orange-400'
                            : 'bg-green-500/10 text-green-400'}
                          `}>
                            <Dumbbell size={10} strokeWidth={3} />
                            <span className="uppercase tracking-wide">{event.intensity || 'Medium'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                            <Utensils size={10} strokeWidth={3} />
                            <span className="uppercase tracking-wide">Meal</span>
                          </div>
                        )}
                        
                        {event.calories && (
                          <div className="flex items-center gap-1 text-[11px] font-medium text-white/40">
                            <Flame size={10} />
                            {event.calories}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Action */}
                    <div className="flex-shrink-0 pl-2">
                      {isWorkout ? (
                        <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-lg shadow-white/10">
                          <Play size={16} fill="currentColor" />
                        </button>
                      ) : (
                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                          ${event.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 group-hover:border-white/40'}
                        `}>
                          {event.completed && <Check size={12} className="text-black" strokeWidth={4} />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeekView;
