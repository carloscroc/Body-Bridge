import React, { useMemo } from 'react';

interface PremiumWeekStripProps {
  selectedDate: string; // ISO date string YYYY-MM-DD
  onSelectDate: (date: string) => void;
  className?: string;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const PremiumWeekStrip: React.FC<PremiumWeekStripProps> = ({
  selectedDate,
  onSelectDate,
  className = '',
}) => {
  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        label: DAY_LABELS[i],
        date: d.getDate(),
        iso: d.toISOString().split('T')[0],
      };
    });
  }, []);

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className={`mb-8 animate-silk-up ${className}`}>
      <div className="flex justify-between gap-1 px-1 overflow-x-auto scrollbar-hide">
        {weekDays.map((day) => {
          const isSelected = day.iso === selectedDate;
          const isToday = day.iso === todayIso;

          return (
            <button
              key={day.iso}
              type="button"
              onClick={() => onSelectDate(day.iso)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[20px] transition-all press-scale ${
                isSelected
                  ? 'bg-white shadow-[0_4px_24px_rgba(255,255,255,0.15)]'
                  : 'bg-white/[0.03] border border-white/[0.06]'
              }`}
            >
              <span
                className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                  isSelected ? 'text-black/50' : 'text-white/30'
                }`}
              >
                {day.label}
              </span>
              <span
                className={`text-[18px] font-black tracking-tight ${
                  isSelected ? 'text-black' : 'text-white/70'
                }`}
              >
                {day.date}
              </span>
              {isToday && !isSelected && (
                <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
              )}
              {isToday && isSelected && (
                <div className="w-1 h-1 rounded-full bg-black/40" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PremiumWeekStrip;
