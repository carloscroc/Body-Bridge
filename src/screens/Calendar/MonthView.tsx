import React from 'react';
import { CalendarEvent, groupEventsByDate, getDaysInMonth, isSameDay } from './calendarUtils';
import { Workout, Meal } from '../../types';

interface MonthViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectWorkout: (workout: Workout) => void;
  onSelectMeal: (meal: Meal) => void;
  onDateSelect: (date: Date) => void;
  onAddWorkout: () => void;
  onAddMeal: () => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  events,
  selectedDate,
  onSelectWorkout,
  onSelectMeal,
  onDateSelect,
}) => {
  const grouped = groupEventsByDate(events);
  const today = new Date();
  const days = getDaysInMonth(selectedDate);
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Get selected day events
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const selectedDayEvents = grouped.get(selectedDateStr) || [];

  return (
    <div className="animate-fade-in">
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {dayNames.map(day => (
          <div key={day} className="text-center py-2">
            <span className="text-[12px] font-black text-white/30">{day}</span>
          </div>
        ))}
      </div>
      
      {/* Month Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          const dateStr = day.toISOString().split('T')[0];
          const dayEvents = grouped.get(dateStr) || [];
          const workoutCount = dayEvents.filter(e => e.type === 'workout').length;
          const mealCount = dayEvents.filter(e => e.type === 'meal').length;
          const hasEvents = dayEvents.length > 0;
          const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isSameDay(day, today);
          
          return (
            <button
              key={index}
              onClick={() => onDateSelect(day)}
              className={`
                aspect-square rounded-[16px] p-1 flex flex-col items-center justify-center transition-all relative
                ${!isCurrentMonth ? 'opacity-25' : ''}
                ${isSelected 
                  ? 'bg-white text-black ring-2 ring-white/50' 
                  : hasEvents && isCurrentMonth
                  ? 'bg-[#8B5A2B]/40 text-white'
                  : isTodayDate
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'hover:bg-white/5 text-white/70'
                }
              `}
            >
              {/* Day Number */}
              <span className={`
                text-[15px] font-bold
                ${isSelected ? 'text-black' : ''}
                ${isTodayDate && !isSelected ? 'text-blue-400' : ''}
              `}>
                {day.getDate()}
              </span>
              
              {/* Event Dots */}
              {hasEvents && isCurrentMonth && (
                <div className="flex gap-0.5 mt-1">
                  {workoutCount > 0 && (
                    <div className={`
                      w-1.5 h-1.5 rounded-full
                      ${isSelected ? 'bg-orange-500' : 'bg-emerald-400'}
                    `} />
                  )}
                  {mealCount > 0 && (
                    <div className={`
                      w-1.5 h-1.5 rounded-full
                      ${isSelected ? 'bg-emerald-500' : 'bg-emerald-400/70'}
                    `} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Selected Day Bottom Sheet */}
      {selectedDayEvents.length > 0 && (
        <div className="mt-6 p-5 rounded-[28px] bg-zinc-900/80 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-bold text-white">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            <span className="text-[13px] text-white/40">
              {selectedDayEvents.length} events
            </span>
          </div>
          
          <div className="space-y-2">
            {selectedDayEvents.map(event => {
              const isWorkout = event.type === 'workout';
              return (
                <div
                  key={event.id}
                  onClick={() => isWorkout ? onSelectWorkout(event.data as Workout) : onSelectMeal(event.data as Meal)}
                  className="flex items-center gap-4 p-3 rounded-[20px] bg-white/5 cursor-pointer press-scale hover:bg-white/10 transition-all"
                >
                  {/* Icon */}
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center text-lg
                    ${isWorkout 
                      ? 'bg-zinc-800' 
                      : 'bg-emerald-500/20'
                    }
                  `}>
                    {isWorkout ? '💪' : '🍽️'}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-white truncate">{event.title}</p>
                    <p className="text-[11px] text-white/40">{event.time}</p>
                  </div>
                  
                  {/* Calories */}
                  {event.calories && (
                    <span className="text-[13px] font-bold text-white/30">
                      {event.calories}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthView;
