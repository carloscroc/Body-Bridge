import React from 'react';
import { CalendarEvent, groupEventsByDate } from './calendarUtils';
import { Workout, Meal } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ListViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectWorkout: (workout: Workout) => void;
  onSelectMeal: (meal: Meal) => void;
  onDateSelect: (date: Date) => void;
  onAddWorkout: () => void;
  onAddMeal: () => void;
}

const ListView: React.FC<ListViewProps> = ({
  events,
  selectedDate,
  onSelectWorkout,
  onSelectMeal,
  onDateSelect,
}) => {
  // Generate 3 days: yesterday, today, tomorrow
  const days: Date[] = [];
  for (let i = -1; i <= 1; i++) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  
  const grouped = groupEventsByDate(events);
  const today = new Date();
  
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const DayColumn: React.FC<{ date: Date; isCenter: boolean }> = ({ date, isCenter }) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayEvents = grouped.get(dateStr) || [];
    const dayName = isToday(date) ? 'TODAY' : date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNum = date.getDate();
    
    return (
      <div 
        className={`
          flex-1 min-w-0 rounded-[24px] overflow-hidden transition-all
          ${isCenter ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/[0.03]'}
        `}
      >
        {/* Day Header */}
        <button
          onClick={() => onDateSelect(date)}
          className={`
            w-full py-4 text-center
            ${isCenter ? 'bg-white/5' : ''}
          `}
        >
          <div className={`
            text-[10px] font-black uppercase tracking-[0.2em] mb-1
            ${isCenter ? 'text-blue-400' : 'text-white/40'}
          `}>
            {dayName}
          </div>
          <div className={`
            text-[32px] font-black leading-none
            ${isCenter ? 'text-white' : 'text-white/50'}
          `}>
            {dayNum}
          </div>
          {isCenter && (
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mx-auto mt-2" />
          )}
        </button>
        
        {/* Events */}
        <div className="p-2 space-y-2 min-h-[300px]">
          {dayEvents.length === 0 ? (
            <div className="h-full flex items-center justify-center py-12">
              <p className="text-[11px] text-white/20 uppercase tracking-wider font-bold">REST</p>
            </div>
          ) : (
            dayEvents.map(event => {
              const isWorkout = event.type === 'workout';
              return (
                <div
                  key={event.id}
                  onClick={() => isWorkout ? onSelectWorkout(event.data as Workout) : onSelectMeal(event.data as Meal)}
                  className={`
                    p-3 rounded-[16px] cursor-pointer press-scale transition-all
                    ${isWorkout 
                      ? 'bg-zinc-800/80 border-l-2 border-zinc-600' 
                      : 'bg-[#0f2a1d] border-l-2 border-emerald-500'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{isWorkout ? '💪' : '🍽️'}</span>
                    <span className="text-[11px] font-bold text-white/50">{event.time}</span>
                  </div>
                  <p className="text-[12px] font-bold text-white truncate leading-tight">
                    {event.title}
                  </p>
                  {event.calories && (
                    <p className="text-[10px] text-white/30 mt-1">
                      {event.calories} kcal
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Navigation Hint */}
      <div className="flex items-center justify-between mb-4 px-2">
        <ChevronLeft size={18} className="text-white/20" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
          Swipe between days
        </span>
        <ChevronRight size={18} className="text-white/20" />
      </div>
      
      {/* 3 Day Grid */}
      <div className="flex gap-2">
        {days.map((day, index) => (
          <DayColumn 
            key={day.toISOString()} 
            date={day} 
            isCenter={index === 1}
          />
        ))}
      </div>
    </div>
  );
};

export default ListView;
