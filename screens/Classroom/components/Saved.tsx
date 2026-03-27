
// screens/Classroom/components/Saved.tsx
import React from 'react';
import { Bookmark, Download, FileText, Trash2, ChevronRight } from 'lucide-react';
import { UserProgress, Course } from '../types';

interface SavedProps {
  progress: UserProgress;
  courses: Course[];
  onToggleDownload: (resourceId: string) => void;
  onToggleBookmark: (itemId: string) => void;
  onOpenCourse: (courseId: string) => void;
  onOpenLesson: (courseId: string, lessonId: string) => void;
}

export const Saved: React.FC<SavedProps> = ({
  progress,
  courses,
  onToggleDownload,
  onToggleBookmark,
  onOpenCourse,
  onOpenLesson
}) => {
  const downloadedIds = Object.keys(progress.downloadedResources);

  const bookmarkedIds = Object.keys(progress.bookmarks).filter(id => !!progress.bookmarks[id]);
  const bookmarkedCourseIds = bookmarkedIds
    .filter(id => id.startsWith('course:'))
    .map(id => id.slice('course:'.length));
  const bookmarkedLessonIds = bookmarkedIds
    .filter(id => id.startsWith('lesson:'))
    .map(id => id.slice('lesson:'.length));

  const courseById = new Map(courses.map(c => [c.id, c] as const));
  const bookmarkedCourses = bookmarkedCourseIds
    .map(id => courseById.get(id))
    .filter((c): c is Course => !!c);

  const lessonIndex = new Map<string, { courseId: string; courseTitle: string; lessonTitle: string; kind: string }>();
  for (const c of courses) {
    for (const p of c.phases) {
      for (const l of p.lessons) {
        lessonIndex.set(l.id, { courseId: c.id, courseTitle: c.title, lessonTitle: l.title, kind: l.kind });
      }
    }
  }

  const bookmarkedLessons = bookmarkedLessonIds
    .map(id => ({ id, info: lessonIndex.get(id) }))
    .filter((x): x is { id: string; info: NonNullable<(typeof x)['info']> } => !!x.info);
  
  // Flatten all resources to find matches
  const allResources = courses.flatMap(c => 
    c.phases.flatMap(p => 
      p.lessons.flatMap(l => 
        (l.resources || []).map(r => ({ ...r, lessonTitle: l.title, courseTitle: c.title }))
      )
    )
  );

  const savedResources = allResources.filter(r => downloadedIds.includes(r.id));

  return (
    <div className="animate-silk-up space-y-10">
      {/* Bookmarks */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center text-white">
            <Bookmark size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Saved</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              {bookmarkedCourses.length + bookmarkedLessons.length} Bookmarks
            </p>
          </div>
        </div>

        {bookmarkedCourses.length === 0 && bookmarkedLessons.length === 0 ? (
          <div className="p-10 rounded-[32px] border border-white/5 bg-[#1c1c1e] text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 mx-auto flex items-center justify-center text-zinc-700 mb-4">
              <Bookmark size={24} />
            </div>
            <h3 className="text-white font-bold mb-2">No bookmarks yet</h3>
            <p className="text-zinc-500 text-sm max-w-[26ch] mx-auto">
              Save a course or lesson to keep it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarkedCourses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 bg-[#1c1c1e] rounded-2xl border border-white/5">
                <button
                  onClick={() => onOpenCourse(course.id)}
                  className="flex items-center gap-4 min-w-0 flex-1 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white flex-shrink-0">
                    <Bookmark size={18} fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest truncate">Course</div>
                    <div className="text-sm font-bold text-zinc-200 truncate">{course.title}</div>
                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest truncate">
                      {course.level} • {course.totalDurationMin} min
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-700 ml-auto" />
                </button>
                <button
                  onClick={() => onToggleBookmark(`course:${course.id}`)}
                  className="w-10 h-10 rounded-full hover:bg-red-500/10 hover:text-red-500 text-zinc-600 flex items-center justify-center transition-colors"
                  aria-label="Remove bookmark"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            {bookmarkedLessons.map(({ id, info }) => (
              <div key={id} className="flex items-center justify-between p-4 bg-[#1c1c1e] rounded-2xl border border-white/5">
                <button
                  onClick={() => onOpenLesson(info.courseId, id)}
                  className="flex items-center gap-4 min-w-0 flex-1 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <Bookmark size={18} fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest truncate">Lesson • {info.kind}</div>
                    <div className="text-sm font-bold text-zinc-200 truncate">{info.lessonTitle}</div>
                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest truncate">{info.courseTitle}</div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-700 ml-auto" />
                </button>
                <button
                  onClick={() => onToggleBookmark(`lesson:${id}`)}
                  className="w-10 h-10 rounded-full hover:bg-red-500/10 hover:text-red-500 text-zinc-600 flex items-center justify-center transition-colors"
                  aria-label="Remove bookmark"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Downloads */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center text-white">
            <Download size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white italic tracking-tighter uppercase">Downloads</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              {savedResources.length} Items Available Offline
            </p>
          </div>
        </div>

        {savedResources.length === 0 ? (
          <div className="p-8 rounded-[28px] border border-white/5 bg-[#1c1c1e] text-center">
            <div className="w-14 h-14 rounded-full bg-zinc-900 mx-auto flex items-center justify-center text-zinc-700 mb-4">
              <FileText size={20} />
            </div>
            <h3 className="text-white font-bold mb-2">No downloads</h3>
            <p className="text-zinc-500 text-sm max-w-[28ch] mx-auto">
              Download lesson resources to access them here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedResources.map(res => (
              <div key={res.id} className="flex items-center justify-between p-4 bg-[#1c1c1e] rounded-2xl border border-white/5 group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-zinc-200 truncate">{res.title}</div>
                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest truncate">
                      {res.courseTitle} • {res.size}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => onToggleDownload(res.id)}
                  className="w-10 h-10 rounded-full hover:bg-red-500/10 hover:text-red-500 text-zinc-600 flex items-center justify-center transition-colors"
                  aria-label="Remove download"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
