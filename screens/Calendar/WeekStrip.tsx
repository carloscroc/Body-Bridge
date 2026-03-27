import React, { useMemo } from 'react';
import { CalendarEvent } from './calendarUtils';
import { motion } from 'framer-motion';

interface WeekStripProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
}

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const toDateStr = (d: Date) => d.toISOString().split('T')[0];

const getWeekStartMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  // JS: 0=Sun..6=Sat. Convert so Monday=0..Sunday=6
  const mondayIndex = (day + 6) % 7;
  d.setDate(d.getDate() - mondayIndex);
  return d;
};

const WeekStrip: React.FC<WeekStripProps> = ({ selectedDate, events, onSelectDate }) => {
  const days = useMemo(() => {
    const start = getWeekStartMonday(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const countsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      map.set(e.date, (map.get(e.date) || 0) + 1);
    }
    return map;
  }, [events]);

  const today = new Date();

  return (
    <div className="rounded-[32px] bg-white/[0.03] border border-white/10 p-2 relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
        {days.map((d) => {
          const selected = isSameDay(d, selectedDate);
          const isToday = isSameDay(d, today);
          const count = countsByDate.get(toDateStr(d)) || 0;
          const weekday = d.toLocaleDateString('en-US', { weekday: 'narrow' });
          const dayNum = d.getDate();

          return (
            <button
              key={d.toISOString()}
              onClick={() => onSelectDate(d)}
              className="relative w-[44px] h-[72px] flex flex-col items-center justify-center press-scale z-10"
              aria-label={`Select ${d.toDateString()}`}
            >
              {selected && (
                <motion.div
                  layoutId="weekStripHighlight"
                  className="absolute inset-0 bg-white rounded-[24px] shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                />
              )}

              <div className={`relative z-10 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-200 ${selected ? 'text-black/60' : 'text-white/30'}`}>
                {weekday}
              </div>
              
              <div className={`relative z-10 mt-1 text-[18px] font-black tracking-tight transition-colors duration-200 ${selected ? 'text-black' : isToday ? 'text-white' : 'text-white/70'}`}>
                {dayNum}
              </div>
              
              <div className="relative z-10 mt-1.5 h-1.5 flex items-center justify-center gap-1">
                {count > 0 ? (
                  <div className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-black' : 'bg-white/40'}`} />
                ) : isToday ? (
                   <div className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-black/30' : 'bg-emerald-500'}`} />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeekStrip;
