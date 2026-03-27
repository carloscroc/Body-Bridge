
// screens/Classroom/components/Dashboard.tsx
import React from 'react';
import { Play, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { Course, LiveSession, UserProgress } from '../types';
import { ProfileHeader } from './ProfileHeader';
import { AchievementsList } from './AchievementsList';
import { ProgressAnalytics } from './ProgressAnalytics';

interface DashboardProps {
  progress: UserProgress;
  nextLevelProgress: number;
  courses: Course[];
  liveSessions: LiveSession[];
  onContinueCourse: (courseId: string) => void;
  onOpenLiveSession: (sessionId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  progress,
  nextLevelProgress,
  courses,
  liveSessions,
  onContinueCourse,
  onOpenLiveSession
}) => {
  const lastOpenedCourse = courses.find(c => c.id === progress.lastOpenedCourseId);
  const nextUpLive = liveSessions[0];

  return (
    <div className="space-y-8 animate-silk-up">
      {/* Profile Header */}
      <ProfileHeader progress={progress} nextLevelProgress={nextLevelProgress} />

      {/* Achievements */}
      <AchievementsList 
        unlockedIds={progress.unlockedAchievements} 
        totalLessonsCompleted={Object.keys(progress.completedLessonIds).length} 
      />

      {/* Progress Analytics */}
      <ProgressAnalytics progress={progress} courses={courses} />

      {/* Weekly Goal Progress */}
      <div className="bg-[#0B0B0C] rounded-[24px] p-5 border border-white/[0.10] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp size={80} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">Weekly Target</div>
              <div className="text-2xl font-black text-white italic tracking-tight">
                {progress.weeklyGoal.current} <span className="text-zinc-500 text-lg">/ {progress.weeklyGoal.target} lessons</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-xs border-[3px] border-[#0B0B0C]">
              {Math.round((progress.weeklyGoal.current / progress.weeklyGoal.target) * 100)}%
            </div>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden w-full">
            <div
              className="h-full bg-blue-500 transition-all duration-1000 ease-out"
              style={{ width: `${(progress.weeklyGoal.current / progress.weeklyGoal.target) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Continue Learning Rail */}
      {lastOpenedCourse && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-white italic tracking-tight">Continue Learning</h3>
          </div>
          <button
            onClick={() => onContinueCourse(lastOpenedCourse.id)}
            className="w-full bg-white rounded-[28px] p-5 flex items-center gap-5 shadow-xl active:scale-[0.98] transition-transform duration-200 text-left group"
          >
            <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center flex-shrink-0 relative overflow-hidden">
              <div className={`absolute inset-0 ${lastOpenedCourse.accentColor} opacity-20`} />
              <Play size={24} fill="currentColor" className="relative z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[9px] font-semibold uppercase tracking-wide mb-1 ${lastOpenedCourse.tagColor.split(' ')[0]} text-transparent bg-clip-text`}>
                Resume {lastOpenedCourse.title}
              </div>
              <div className="text-lg font-extrabold text-black leading-tight truncate group-hover:underline decoration-2 underline-offset-2">
                {lastOpenedCourse.title}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-20 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${lastOpenedCourse.accentColor}`}
                    style={{ width: `${progress.courseProgress[lastOpenedCourse.id] || 0}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-zinc-500">{progress.courseProgress[lastOpenedCourse.id] || 0}% complete</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-black/40">
              <ChevronRight size={18} />
            </div>
          </button>
        </div>
      )}

      {/* Live Sessions */}
      {nextUpLive && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-white italic tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live upcoming
            </h3>
            <button onClick={() => onOpenLiveSession(nextUpLive.id)} className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide hover:text-white">View Sessions</button>
          </div>
          <div className="bg-[#0B0B0C] rounded-[28px] p-1 border border-white/[0.10]">
            <div className="bg-zinc-900/50 rounded-[24px] p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-semibold uppercase tracking-wide border border-red-500/20">
                  {new Date(nextUpLive.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border border-[#0B0B0C] bg-zinc-700" />
                  ))}
                  <div className="w-6 h-6 rounded-full border border-[#0B0B0C] bg-zinc-800 flex items-center justify-center text-[8px] font-semibold text-zinc-400">
                    +{nextUpLive.attendeeCount}
                  </div>
                </div>
              </div>
              <h4 className="text-lg font-bold text-white mb-1">{nextUpLive.title}</h4>
              <p className="text-xs text-zinc-400 font-medium mb-4">with {nextUpLive.instructor} • {nextUpLive.topic}</p>

              <button className="w-full h-10 bg-white text-black rounded-xl text-[11px] font-bold uppercase tracking-wide shadow-lg active:scale-95 transition-transform duration-200 flex items-center justify-center gap-2">
                <Calendar size={14} /> RSVP Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
