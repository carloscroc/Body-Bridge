import React, { useRef, useEffect } from 'react';

interface WeekStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const WeekStrip: React.FC<WeekStripProps> = ({ selectedDate, onSelectDate }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate 14 days centered on today (or selected date)
  // For simplicity, let's just generate a sliding window around the selected date
  const generateDays = () => {
    const days = [];
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - 3); // Start 3 days before
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = generateDays();

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getFullYear() === d2.getFullYear();

  const isToday = (d: Date) => isSameDay(d, new Date());

  return (
    <div className="flex justify-between items-center bg-black/40 p-2 rounded-[32px] border border-white/5 mb-8 overflow-x-auto no-scrollbar shadow-inner">
      {days.map((date, idx) => {
        const selected = isSameDay(date, selectedDate);
        const today = isToday(date);
        
        return (
          <button
            key={idx}
            onClick={() => onSelectDate(date)}
            className={`flex flex-col items-center justify-center w-12 h-16 rounded-[24px] transition-all duration-300 ${
              selected 
                ? 'bg-white text-black shadow-lg scale-105' 
                : 'text-zinc-500 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className={`text-[9px] font-black uppercase tracking-wider mb-1 ${selected ? 'text-black/60' : 'text-zinc-600'}`}>
              {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
            </span>
            <span className={`text-lg font-black ${selected ? 'text-black' : today ? 'text-white' : 'text-zinc-400'}`}>
              {date.getDate()}
            </span>
            {today && !selected && (
              <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default WeekStrip;
