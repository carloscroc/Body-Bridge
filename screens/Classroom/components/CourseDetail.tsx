
// screens/Classroom/components/CourseDetail.tsx
import React, { useState } from 'react';
import { ChevronLeft, Share2, MoreHorizontal, Play, Lock, CheckCircle2, Circle, Clock, Download, ChevronDown, ChevronUp, Bookmark } from 'lucide-react';
import { Course, Lesson } from '../types';

interface CourseDetailProps {
  course: Course;
  completedLessonIds: Record<string, boolean>;
  onBack: () => void;
  onSelectLesson: (lessonId: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onShare: () => void;
  relatedCourses: Course[];
}

export const CourseDetail: React.FC<CourseDetailProps> = ({
  course,
  completedLessonIds,
  onBack,
  onSelectLesson,
  isBookmarked,
  onToggleBookmark,
  onShare,
  relatedCourses
}) => {
  const [activePhaseId, setActivePhaseId] = useState<string>(course.phases[0].id);
  const [activeTab, setActiveTab] = useState<'Modules' | 'Reviews'>('Modules');

  // Calculate progress
  const allLessons = course.phases.flatMap(p => p.lessons);
  const completedCount = allLessons.filter(l => completedLessonIds[l.id]).length;
  const progressPct = Math.round((completedCount / allLessons.length) * 100);

  const nextLesson = allLessons.find(l => !completedLessonIds[l.id] && !l.locked);

  return (
    <div className="min-h-full bg-[#050505] animate-silk-up pb-32">
      {/* Header Image Area */}
      <div className="relative h-[35vh] w-full bg-zinc-900 overflow-hidden">
        <div className={`absolute inset-0 opacity-80 ${course.accentColor.replace('text-', 'bg-').replace('500', '900')}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        
        {/* Nav */}
        <div className="absolute top-0 left-0 w-full p-6 pt-12 flex justify-between items-center z-20">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10">
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-3">
              <button 
                onClick={onShare}
                className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={onToggleBookmark}
                className={`w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center transition-colors border border-white/10 ${
                  isBookmarked ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-white hover:bg-white/10'
                }`}
                aria-pressed={isBookmarked}
              >
                <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
              <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10">
                <MoreHorizontal size={18} />
              </button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 w-full p-6 z-10">
          <div className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 ${course.tagColor}`}>
            {course.tag}
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">
            {course.title}
          </h1>
          <p className="text-zinc-400 text-sm font-medium line-clamp-2 max-w-[90%] mb-6">
            {course.description}
          </p>

          <div className="flex gap-4 items-center">
             {nextLesson ? (
               <button 
                onClick={() => onSelectLesson(nextLesson.id)}
                className="h-12 px-6 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-transform"
               >
                 <Play size={16} fill="currentColor" /> {completedCount === 0 ? 'Start Course' : 'Resume'}
               </button>
             ) : (
                <button className="h-12 px-6 bg-emerald-500 text-black rounded-full text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                  <CheckCircle2 size={16} /> Completed
                </button>
             )}
             <div className="flex-1">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">
                   <span>{progressPct}% Complete</span>
                   <span>{completedCount}/{allLessons.length}</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-white transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-6">
        {/* Tabs */}
        <div className="flex gap-6 border-b border-white/10 mb-6 px-6">
           {['Modules', 'Reviews'].map((tab) => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 className={`pb-3 text-xs font-black uppercase tracking-widest relative ${
                    activeTab === tab ? 'text-white' : 'text-zinc-600'
                 }`}
               >
                 {tab}
                 {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full" />}
              </button>
           ))}
        </div>

        <div className="px-6 space-y-8">
        {activeTab === 'Modules' ? (
          <>
            {/* Roadmap / Phases */}
            <div className="space-y-6">
              {course.phases.map((phase, index) => (
                <div key={phase.id} className="relative">
                  {/* Phase Connector Line */}
                  {index !== course.phases.length - 1 && (
                     <div className="absolute left-[19px] top-12 bottom-0 w-[2px] bg-zinc-800" />
                  )}
                  
                  <div 
                    className="flex items-center gap-4 mb-4 cursor-pointer group"
                    onClick={() => setActivePhaseId(phase.id === activePhaseId ? '' : phase.id)}
                  >
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-black text-xs z-10 bg-[#050505] transition-colors ${
                      activePhaseId === phase.id ? 'border-white text-white' : 'border-zinc-800 text-zinc-600 group-hover:border-zinc-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold transition-colors ${activePhaseId === phase.id ? 'text-white' : 'text-zinc-500'}`}>
                        {phase.title}
                      </h3>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        {phase.lessons.length} Lessons • {phase.lessons.reduce((acc, l) => acc + (l.durationMin || 0), 0)} min
                      </div>
                    </div>
                    <div className="text-zinc-600">
                      {activePhaseId === phase.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* Lessons List */}
                  {activePhaseId === phase.id && (
                    <div className="space-y-3 pl-14 animate-in slide-in-from-top-2 duration-200">
                       {phase.lessons.map(lesson => {
                         const isLocked = lesson.locked;
                         const isCompleted = completedLessonIds[lesson.id];

                         return (
                           <button
                             key={lesson.id}
                             disabled={isLocked}
                             onClick={() => onSelectLesson(lesson.id)}
                             className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 group ${
                               isLocked 
                                 ? 'bg-transparent border-dashed border-zinc-800 opacity-60' 
                                 : 'bg-[#1c1c1e] border-white/5 hover:border-white/10 active:scale-[0.99]'
                             }`}
                           >
                             <div className={`mt-0.5 min-w-[20px] ${isCompleted ? 'text-emerald-500' : 'text-zinc-600'}`}>
                               {isLocked ? <Lock size={18} /> : isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                             </div>
                             <div className="flex-1">
                               <h4 className={`text-sm font-bold mb-1 leading-tight ${isLocked ? 'text-zinc-500' : 'text-white'}`}>
                                 {lesson.title}
                               </h4>
                               <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                 <span className="flex items-center gap-1"><Clock size={10} /> {lesson.durationMin}m</span>
                                 <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                 <span>{lesson.kind}</span>
                               </div>
                             </div>
                             {!isLocked && (
                               <div className="text-zinc-700 group-hover:text-white transition-colors">
                                 <Play size={16} fill="currentColor" />
                               </div>
                             )}
                           </button>
                         );
                       })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Downloads / Resources Section */}
            <div className="pt-8 border-t border-white/5">
               <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Course Resources</h3>
               <div className="grid grid-cols-2 gap-4">
                  <button className="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center gap-3 hover:bg-white/5 transition-colors group">
                     <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <Download size={18} />
                     </div>
                     <div className="text-xs font-bold text-zinc-300">Course PDF</div>
                     <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600">2.4 MB</div>
                  </button>
                  <button className="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center gap-3 hover:bg-white/5 transition-colors group">
                     <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <Download size={18} />
                     </div>
                     <div className="text-xs font-bold text-zinc-300">Spreadsheet</div>
                     <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600">14 KB</div>
                  </button>
               </div>
            </div>
          </>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex items-center gap-4 mb-8">
                <div className="text-5xl font-black text-white italic tracking-tighter">4.9</div>
                <div>
                   <div className="flex text-emerald-500 mb-1">
                      {[1,2,3,4,5].map(i => <CheckCircle2 key={i} size={16} fill="currentColor" />)}
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Based on 128 reviews</div>
                </div>
             </div>

             {[
               { user: 'Marcus T.', rating: 5, text: 'Absolutely game changing. The progression logic is flawless.', date: '2 days ago' },
               { user: 'Sarah K.', rating: 5, text: 'Finally a program that explains the WHY, not just the WHAT.', date: '1 week ago' },
               { user: 'David R.', rating: 4, text: 'Great content, but the advanced modules are no joke. Be prepared.', date: '2 weeks ago' }
             ].map((review, i) => (
               <div key={i} className="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                     <div className="font-bold text-white text-sm">{review.user}</div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{review.date}</div>
                  </div>
                  <div className="flex text-emerald-500 mb-2">
                     {[...Array(review.rating)].map((_, i) => <CheckCircle2 key={i} size={12} fill="currentColor" />)}
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">{review.text}</p>
               </div>
             ))}
          </div>
        )}

        {/* Related Courses */}
        <div className="pt-12 border-t border-white/5">
           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">You Might Also Like</h3>
           <div className="grid grid-cols-1 gap-4">
              {relatedCourses.map(related => (
                <div key={related.id} className="bg-[#1c1c1e] rounded-2xl border border-white/5 overflow-hidden flex group cursor-pointer hover:border-white/10 transition-colors">
                   <div className={`w-24 bg-zinc-800 ${related.accentColor.replace('text-', 'bg-').replace('500', '900')} opacity-80`} />
                   <div className="p-4 flex-1">
                      <div className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest mb-2 ${related.tagColor}`}>
                        {related.tag}
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{related.title}</h4>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        {related.phases.length} Modules
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
        </div>
      </div>
    </div>
  );
};
