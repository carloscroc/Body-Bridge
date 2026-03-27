
// screens/Classroom/components/Library.tsx
import React, { useState } from 'react';
import { Search, SlidersHorizontal, ChevronRight, Dumbbell, Clock, Lock, CheckCircle2, Play } from 'lucide-react';
import { Course, Lesson } from '../types';

interface LibraryProps {
  courses: Course[];
  completedLessonIds: Record<string, boolean>;
  onSelectCourse: (courseId: string) => void;
  onSelectLesson: (courseId: string, lessonId: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ 
  courses, 
  completedLessonIds, 
  onSelectCourse,
  onSelectLesson 
}) => {
  const [activeTab, setActiveTab] = useState<'Programs' | 'Lessons'>('Programs');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Beginner' | 'Advanced'>('All');

  // Filter logic
  const filteredCourses = courses.filter(c => {
    const matchesQuery = c.title.toLowerCase().includes(query.toLowerCase()) || 
                        c.tag.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'All' || c.level === filter;
    return matchesQuery && matchesFilter;
  });

  const allLessons = courses.flatMap(c => c.phases.flatMap(p => p.lessons.map(l => ({ ...l, course: c }))));
  const filteredLessons = allLessons.filter(l => {
    const matchesQuery = l.title.toLowerCase().includes(query.toLowerCase()) || 
                        l.course.title.toLowerCase().includes(query.toLowerCase());
    return matchesQuery;
  });

  return (
    <div className="space-y-6 animate-silk-up">
      {/* Search & Filter Bar */}
      <div className="sticky top-0 bg-[#050505]/90 backdrop-blur-sm z-10 py-3 -mx-2 px-2">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-[#0B0B0C] rounded-2xl h-12 flex items-center px-4 border border-white/[0.08]">
            <Search size={18} className="text-zinc-400 mr-3" />
            <input
              className="flex-1 bg-transparent text-white text-sm font-medium placeholder:text-zinc-500 outline-none"
              placeholder="Search library..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="w-12 h-12 rounded-2xl bg-[#0B0B0C] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors hover:border-white/[0.15]">
            <SlidersHorizontal size={20} />
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto custom-scrollbar pb-2">
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`h-8.5 px-4 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all duration-200 border ${
                filter === f
                  ? 'bg-white/10 text-white border-white/20'
                  : 'bg-transparent text-zinc-500 border-white/5 hover:border-white/10 hover:text-zinc-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.08] mb-6">
        {['Programs', 'Lessons'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 pb-3 text-xs font-semibold transition-colors relative ${
              activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {activeTab === 'Programs' ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredCourses.map(course => (
            <button
              key={course.id}
              onClick={() => onSelectCourse(course.id)}
              className="group text-left relative overflow-hidden rounded-[32px] bg-white aspect-[16/9] shadow-2xl active:scale-[0.98] transition-all duration-200 hover:shadow-3xl"
            >
              <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${course.tagColor}`}>
                    {course.tag}
                  </div>
                  <div className="text-black/40">
                    <Dumbbell size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-black italic tracking-tighter leading-none mb-2 mix-blend-multiply">
                    {course.title.split(' ').map((word, i) => (
                      <span key={i} className="block">{word}</span>
                    ))}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-black/60">
                    <Clock size={12} /> {course.totalDurationMin} min • {course.level}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/5">
                 {/* Progress would go here */}
              </div>

              {/* Decorative BG */}
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-gradient-to-br from-black/5 to-transparent rounded-full blur-2xl" />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLessons.map(lesson => {
            const isCompleted = completedLessonIds[lesson.id];
            const isLocked = lesson.locked;

            return (
              <button
                key={lesson.id}
                onClick={() => !isLocked && onSelectLesson(lesson.course.id, lesson.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left ${
                  isLocked
                    ? 'bg-white/[0.03] border-white/[0.08] opacity-60'
                    : 'bg-[#0B0B0C] border-white/[0.10] hover:border-white/[0.18] active:bg-white/[0.05]'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  isCompleted
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : isLocked
                      ? 'bg-white/5 border-white/5 text-zinc-600'
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : isLocked ? <Lock size={20} /> : <Play size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500 mb-0.5 truncate">
                    {lesson.course.title}
                  </div>
                  <div className="text-sm font-semibold text-white truncate mb-1">
                    {lesson.title}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-medium text-zinc-500">
                    <span className="flex items-center gap-1"><Clock size={10} /> {lesson.durationMin}m</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span>{lesson.kind}</span>
                  </div>
                </div>
                {!isLocked && <ChevronRight size={16} className="text-zinc-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
