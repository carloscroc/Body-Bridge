import React, { useMemo } from 'react';
import { Clock, Calendar, TrendingUp, BarChart2, Activity } from 'lucide-react';
import { UserProgress, Course } from '../types';

interface ProgressAnalyticsProps {
  progress: UserProgress;
  courses: Course[];
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({ progress, courses }) => {
  // Calculate stats
  const stats = useMemo(() => {
    // 1. Total Minutes
    let totalMinutes = 0;
    let totalLessons = 0;
    let completedLessonsCount = 0;

    courses.forEach(course => {
      course.phases.forEach(phase => {
        phase.lessons.forEach(lesson => {
          totalLessons++;
          if (progress.completedLessonIds[lesson.id]) {
            totalMinutes += lesson.durationMin || 0;
            completedLessonsCount++;
          }
        });
      });
    });

    // 2. Completion %
    const completionPercentage = totalLessons > 0 
      ? Math.round((completedLessonsCount / totalLessons) * 100) 
      : 0;

    // 3. Avg/Day (Last 7 Days)
    const today = new Date();
    let last7DaysTotal = 0;
    const last7DaysData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = progress.activityLog?.[dateStr] || 0;
      last7DaysTotal += count;
      last7DaysData.push({ date: dateStr, count, dayName: d.toLocaleDateString('en-US', { weekday: 'short' }) });
    }

    const avgPerDay = (last7DaysTotal / 7).toFixed(1);

    return {
      totalMinutes,
      completionPercentage,
      avgPerDay,
      last7DaysData
    };
  }, [progress, courses]);

  return (
    <div className="space-y-6 animate-silk-up">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-black text-white italic tracking-tight flex items-center gap-2">
          <Activity size={16} className="text-emerald-500" />
          Analytics
        </h3>
        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Last 7 Days</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Clock size={20} className="text-emerald-500 mb-2" />
          <div className="text-2xl font-black text-white tracking-tight">{stats.totalMinutes}</div>
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Mins Learned</div>
        </div>

        <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <TrendingUp size={20} className="text-blue-500 mb-2" />
          <div className="text-2xl font-black text-white tracking-tight">{stats.avgPerDay}</div>
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Avg Lessons/Day</div>
        </div>

        <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <BarChart2 size={20} className="text-purple-500 mb-2" />
          <div className="text-2xl font-black text-white tracking-tight">{stats.completionPercentage}%</div>
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Completion</div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-[#1c1c1e] rounded-3xl p-6 border border-white/5 relative overflow-hidden">
        <div className="flex justify-between items-end h-24 gap-2">
          {stats.last7DaysData.map((day, index) => {
            // Calculate height percentage, max at 5 lessons for visual scaling
            const heightPercent = Math.min((day.count / 5) * 100, 100);
            const isToday = index === 6;
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
                <div className="w-full relative flex-1 flex items-end justify-center">
                  <div 
                    className={`w-full max-w-[12px] rounded-full transition-all duration-1000 ease-out ${
                      day.count > 0 
                        ? isToday ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-700 group-hover:bg-zinc-600'
                        : 'bg-zinc-800/50'
                    }`}
                    style={{ height: `${Math.max(heightPercent, 10)}%` }}
                  />
                  {day.count > 0 && (
                    <div className="absolute -top-6 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-1.5 py-0.5 rounded">
                      {day.count}
                    </div>
                  )}
                </div>
                <div className={`text-[9px] font-bold uppercase tracking-wider ${isToday ? 'text-white' : 'text-zinc-600'}`}>
                  {day.dayName}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
