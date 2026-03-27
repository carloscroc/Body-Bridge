
// screens/Classroom/components/LessonDetail.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, CheckCircle2, MessageCircle, Share2, Download, Play, FileText, ChevronDown, Lock, Bookmark } from 'lucide-react';
import { Lesson } from '../types';
import VideoPlayer from '../../../components/VideoPlayer';
import { resolveVideoSource } from '../../../utils/videoSource';

interface LessonDetailProps {
  lesson: Lesson;
  isCompleted: boolean;
  onBack: () => void;
  onComplete: (completed: boolean) => void;
  onNext: () => void; // Go to next lesson
  nextLessonTitle?: string;
  nextLessonLocked?: boolean;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  noteValue: string;
  onChangeNote: (value: string) => void;
  downloadedResourceIds: Record<string, boolean>;
  onToggleDownload: (resourceId: string) => void;
  checklistState?: Record<number, boolean>;
  onToggleChecklistItem?: (index: number) => void;
  onShare: () => void;
}

export const LessonDetail: React.FC<LessonDetailProps> = ({
  lesson,
  isCompleted,
  onBack,
  onComplete,
  onNext,
  nextLessonTitle,
  nextLessonLocked,
  isBookmarked,
  onToggleBookmark,
  noteValue,
  onChangeNote,
  downloadedResourceIds,
  onToggleDownload,
  checklistState,
  onToggleChecklistItem,
  onShare
}) => {
  const tabs = useMemo(() => ['Overview', 'Notes', 'Q&A'] as const, []);
  type Tab = typeof tabs[number];
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  // Mock Q&A State
  const [questions, setQuestions] = useState([
    { id: 'q1', user: 'Alex Rivera', text: 'Should I do this before or after cardio?', date: '2h ago', reply: 'Always before. Prioritize skill acquisition when fresh.', replyAuthor: 'Coach Zaire' },
    { id: 'q2', user: 'Sarah K.', text: 'Can I swap the barbell for dumbbells if I have shoulder pain?', date: '1d ago', reply: null, replyAuthor: null }
  ]);
  const [isAsking, setIsAsking] = useState(false);
  const [questionText, setQuestionText] = useState('');

  const handlePostQuestion = () => {
    if (!questionText.trim()) return;
    setQuestions(prev => [{
      id: `q-${Date.now()}`,
      user: 'You',
      text: questionText,
      date: 'Just now',
      reply: null,
      replyAuthor: null
    }, ...prev]);
    setQuestionText('');
    setIsAsking(false);
  };

  const [noteDraft, setNoteDraft] = useState(noteValue);
  const isNoteDirty = noteDraft !== noteValue;

  useEffect(() => {
    setNoteDraft(noteValue);
  }, [noteValue]);

  useEffect(() => {
    if (activeTab !== 'Notes') return;
    if (!isNoteDirty) return;
    const t = window.setTimeout(() => {
      onChangeNote(noteDraft);
    }, 500);
    return () => window.clearTimeout(t);
  }, [activeTab, isNoteDirty, noteDraft, onChangeNote]);

  const resolvedVideo = useMemo(() => resolveVideoSource(lesson.videoUrl), [lesson.videoUrl]);
  const showVideo = lesson.kind === 'Video' && !!resolvedVideo;
  const isChecklist = lesson.kind === 'Checklist';
  const [videoMeta, setVideoMeta] = useState({ duration: 0, currentTime: 0 });
  const isFileVideo = resolvedVideo?.kind === 'file' || resolvedVideo?.kind === 'unknown';

  const checklistTotal = lesson.checklistItems?.length || 0;
  const checklistCompletedCount = checklistState ? Object.values(checklistState).filter(Boolean).length : 0;
  
  const progressPct = showVideo 
    ? (videoMeta.duration > 0 ? Math.min(100, Math.max(0, (videoMeta.currentTime / videoMeta.duration) * 100)) : 0)
    : isChecklist && checklistTotal > 0
      ? (checklistCompletedCount / checklistTotal) * 100
      : 0;

  return (
    <div className="min-h-full bg-[#050505] animate-silk-up flex flex-col pb-32">
      {/* Video Player Placeholder */}
      <div className="sticky top-0 w-full aspect-video bg-black z-20 flex flex-col relative group">
        <div className="absolute top-4 left-4 z-30">
           <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 transition-colors">
              <ChevronLeft size={24} />
           </button>
        </div>

        {showVideo ? (
          isFileVideo ? (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src={resolvedVideo?.url}
              controls
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => {
                const el = e.currentTarget;
                setVideoMeta(prev => ({ ...prev, duration: Number.isFinite(el.duration) ? el.duration : prev.duration }));
              }}
              onTimeUpdate={(e) => {
                const el = e.currentTarget;
                setVideoMeta(prev => ({ ...prev, currentTime: Number.isFinite(el.currentTime) ? el.currentTime : prev.currentTime }));
              }}
              onEnded={() => {
                if (!isCompleted) onComplete(true);
              }}
            />
          ) : (
            <VideoPlayer
              source={lesson.videoUrl}
              className="absolute inset-0 w-full h-full"
              controls
              playsInline
            />
          )
        ) : isChecklist ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900/50">
             <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600 mb-4">
                <CheckCircle2 size={40} />
             </div>
             <div className="text-zinc-500 font-black uppercase tracking-widest text-xs">Action Checklist</div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform cursor-pointer">
              <Play size={32} fill="currentColor" className="ml-1" />
            </div>
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="h-1 bg-white/20 w-full absolute bottom-0">
           <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="flex justify-between items-start mb-4">
           <h1 className="text-xl font-bold text-white leading-tight flex-1 mr-4">{lesson.title}</h1>
           <div className="flex items-center gap-3">
             <button 
               onClick={onShare}
               className="text-zinc-500 hover:text-white transition-colors" 
               aria-label="Share"
             >
               <Share2 size={20} />
             </button>
             <button
               onClick={onToggleBookmark}
               className={`transition-colors ${isBookmarked ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-500 hover:text-white'}`}
               aria-pressed={isBookmarked}
               aria-label={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
             >
               <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
             </button>
           </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3 mb-8">
           <button 
             onClick={() => onComplete(!isCompleted)}
             className={`flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
               isCompleted 
                 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                 : 'bg-white text-black shadow-lg'
             }`}
           >
             <CheckCircle2 size={16} /> {isCompleted ? 'Completed' : 'Mark Complete'}
           </button>
           <button className="h-12 w-12 rounded-xl bg-[#1c1c1e] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
             <Download size={20} />
           </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-white/10 mb-6">
           {tabs.map((tab) => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`pb-3 text-xs font-black uppercase tracking-widest relative ${
                    activeTab === tab ? 'text-white' : 'text-zinc-600'
                 }`}
               >
                 {tab}
                 {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full" />}
              </button>
           ))}
        </div>

        {/* Tab Content */}
         <div className="min-h-[200px]">
            {activeTab === 'Overview' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                 <div className="text-zinc-400 text-sm leading-relaxed">
                    {lesson.description}
                 </div>

                 {/* Checklist Items */}
                 {isChecklist && lesson.checklistItems && (
                    <div className="space-y-3 my-6">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Action Items</h3>
                      {lesson.checklistItems.map((item, index) => {
                        const isChecked = checklistState?.[index] || false;
                        return (
                          <button
                            key={index}
                            onClick={() => onToggleChecklistItem?.(index)}
                            className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group active:scale-[0.99] ${
                              isChecked 
                                ? 'bg-emerald-500/5 border-emerald-500/20' 
                                : 'bg-[#1c1c1e] border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                              isChecked 
                                ? 'bg-emerald-500 border-emerald-500 text-black scale-110' 
                                : 'bg-transparent border-zinc-600 text-transparent group-hover:border-zinc-400'
                            }`}>
                              <CheckCircle2 size={16} strokeWidth={3} />
                            </div>
                            <span className={`text-sm font-medium leading-relaxed transition-colors ${
                              isChecked ? 'text-zinc-500 line-through decoration-zinc-600' : 'text-zinc-200'
                            }`}>
                              {item}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                 )}

                 {/* Resources List */}
                 {lesson.resources && lesson.resources.length > 0 && (
                    <div className="space-y-3">
                       <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1">Attached Resources</h3>
                       {lesson.resources.map(res => {
                          const isDownloaded = downloadedResourceIds[res.id];
                          return (
                          <div key={res.id} className="flex items-center justify-between p-3 bg-[#1c1c1e] rounded-xl border border-white/5">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                                   <FileText size={16} />
                                </div>
                                <div>
                                   <div className="text-sm font-bold text-zinc-200">{res.title}</div>
                                   <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{res.type} • {res.size}</div>
                                </div>
                             </div>
                             <button 
                               onClick={() => onToggleDownload(res.id)}
                               className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                 isDownloaded ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                               }`}
                             >
                               {isDownloaded ? <CheckCircle2 size={16} /> : <Download size={16} />}
                             </button>
                          </div>
                       )})}
                    </div>
                 )}

                  {/* Up Next Teaser */}
                  <button
                    onClick={onNext}
                    disabled={!nextLessonTitle || nextLessonLocked}
                    className={`mt-8 w-full text-left p-4 rounded-2xl bg-gradient-to-r from-[#1c1c1e] to-black border transition-colors ${
                      !nextLessonTitle
                        ? 'border-white/5 opacity-60 cursor-default'
                        : nextLessonLocked
                          ? 'border-dashed border-zinc-800 opacity-70 cursor-not-allowed'
                          : 'border-white/5 hover:border-white/10 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">
                          {!nextLessonTitle ? 'Course Complete' : 'Up Next'}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            {nextLessonTitle || 'Nice work. You finished this course.'}
                          </span>
                          {nextLessonLocked && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                              <Lock size={12} /> Locked
                            </span>
                          )}
                        </div>
                      </div>
                      {nextLessonTitle && !nextLessonLocked && (
                        <ChevronDown size={16} className="-rotate-90 text-zinc-500" />
                      )}
                    </div>
                  </button>
               </div>
            )}
           
           {activeTab === 'Q&A' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                 {/* Ask Section */}
                 <div className="bg-[#1c1c1e] rounded-2xl border border-white/5 p-4">
                    {isAsking ? (
                      <div className="space-y-3">
                        <textarea 
                          autoFocus
                          placeholder="What's your question?"
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          className="w-full h-24 bg-black/30 rounded-xl border border-white/10 p-3 text-white text-sm outline-none resize-none placeholder:text-zinc-600"
                        />
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => setIsAsking(false)}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handlePostQuestion}
                            disabled={!questionText.trim()}
                            className={`px-4 py-2 rounded-lg text-xs font-bold bg-white text-black ${!questionText.trim() ? 'opacity-50' : 'hover:bg-zinc-200'}`}
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsAsking(true)}>
                         <div className="flex items-center gap-3 text-zinc-400">
                            <MessageCircle size={18} />
                            <span className="text-sm font-medium">Ask a question about this lesson...</span>
                         </div>
                         <div className="bg-white/10 p-1.5 rounded-lg text-zinc-400">
                            <ChevronDown size={16} />
                         </div>
                      </div>
                    )}
                 </div>

                 {/* Questions List */}
                 <div className="space-y-4">
                    {questions.map(q => (
                      <div key={q.id} className="group">
                         <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-500 border border-white/5">
                               {q.user.charAt(0)}
                            </div>
                            <div className="flex-1">
                               <div className="flex items-baseline justify-between mb-1">
                                  <span className="text-sm font-bold text-white">{q.user}</span>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{q.date}</span>
                               </div>
                               <p className="text-zinc-300 text-sm leading-relaxed mb-3">{q.text}</p>
                               
                               {q.reply && (
                                 <div className="ml-4 pl-4 border-l-2 border-emerald-500/20 py-1">
                                    <div className="flex items-center gap-2 mb-1">
                                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                                          <CheckCircle2 size={10} /> {q.replyAuthor}
                                       </span>
                                    </div>
                                    <p className="text-zinc-400 text-xs leading-relaxed">{q.reply}</p>
                                 </div>
                               )}
                            </div>
                         </div>
                         {/* Divider */}
                         <div className="h-px bg-white/[0.04] w-full mt-4 ml-11" />
                      </div>
                    ))}
                 </div>
              </div>
           )}

            {activeTab === 'Notes' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Field Notes</div>
                  <div className={`text-[10px] font-semibold uppercase tracking-widest ${isNoteDirty ? 'text-zinc-600' : 'text-emerald-500/80'}`}>
                    {isNoteDirty ? 'Saving...' : 'Saved'}
                  </div>
                </div>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  onBlur={() => {
                    if (noteDraft !== noteValue) onChangeNote(noteDraft);
                  }}
                  placeholder="Capture key takeaways, timestamps, or questions for the coach..."
                  className="w-full h-44 bg-white/[0.03] rounded-2xl border border-white/5 p-4 text-white text-sm outline-none focus:bg-white/[0.06] focus:border-white/20 resize-none placeholder:text-zinc-700 leading-relaxed"
                />
              </div>
            )}
         </div>
       </div>
     </div>
  );
};
