
// screens/Classroom/index.tsx
import React, { useState } from 'react';
import { useClassroomStore } from './store';
import { MOCK_COURSES, MOCK_LIVE_SESSIONS } from './data';
import { Dashboard } from './components/Dashboard';
import { Library } from './components/Library';
import { CourseDetail } from './components/CourseDetail';
import { LessonDetail } from './components/LessonDetail';
import { Saved } from './components/Saved';
import { LiveSessions } from './components/LiveSessions';
import { Toast } from '../../components/Toast';
import { LayoutDashboard, Library as LibraryIcon, Calendar, Bookmark } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'library', label: 'Library', icon: LibraryIcon },
  { id: 'live', label: 'Live', icon: Calendar },
  { id: 'saved', label: 'Saved', icon: Bookmark },
] as const;

type TabId = typeof TABS[number]['id'];

export const ClassroomRoot: React.FC = () => {
  const { progress, markLessonComplete, setLastOpened, toggleDownload, toggleBookmark, saveNote, toggleRSVP, toggleChecklistItem } = useClassroomStore();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };
  
  // Calculate level progress
  const xpPerLevel = 500;
  const currentLevelXp = progress.xp % xpPerLevel;
  const nextLevelProgress = currentLevelXp / xpPerLevel;
  
  // Navigation State
  // We manage a simple stack: Dashboard -> Course -> Lesson
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const handleOpenCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setLastOpened(courseId);
  };

  const handleOpenLesson = (courseId: string, lessonId: string) => {
    setSelectedCourseId(courseId); // Ensure course context is set
    setSelectedLessonId(lessonId);
    setLastOpened(courseId, lessonId);
  };

  const handleBackFromLesson = () => {
    setSelectedLessonId(null);
  };

  const handleBackFromCourse = () => {
    setSelectedCourseId(null);
  };

  // Views rendering logic
  if (selectedLessonId && selectedCourseId) {
    const course = MOCK_COURSES.find(c => c.id === selectedCourseId);
    // Find lesson in phases
    const lesson = course?.phases.flatMap(p => p.lessons).find(l => l.id === selectedLessonId);
    const allLessons = course?.phases.flatMap(p => p.lessons) || [];
    const currentIndex = allLessons.findIndex(l => l.id === selectedLessonId);
    const nextLesson = currentIndex >= 0 ? allLessons[currentIndex + 1] : undefined;
    
    if (lesson && course) {
      const getChecklistState = () => {
        const state: Record<number, boolean> = {};
        if (lesson.checklistItems) {
          lesson.checklistItems.forEach((_, idx) => {
            if (progress.checklistState[`${lesson.id}:${idx}`]) {
              state[idx] = true;
            }
          });
        }
        return state;
      };

      return (
        <LessonDetail 
          lesson={lesson}
          isCompleted={!!progress.completedLessonIds[lesson.id]}
          onBack={handleBackFromLesson}
          onComplete={(complete) => markLessonComplete(course.id, lesson.id, complete)}
          onNext={() => {
            if (!nextLesson) {
              handleBackFromLesson();
              return;
            }

            if (nextLesson.locked) {
              handleBackFromLesson();
              return;
            }

            handleOpenLesson(course.id, nextLesson.id);
          }}
          nextLessonTitle={nextLesson?.title}
          nextLessonLocked={!!nextLesson?.locked}
          isBookmarked={!!progress.bookmarks[`lesson:${lesson.id}`]}
          onToggleBookmark={() => toggleBookmark(`lesson:${lesson.id}`)}
          noteValue={progress.notes[lesson.id] || ''}
          onChangeNote={(value) => saveNote(lesson.id, value)}
          downloadedResourceIds={progress.downloadedResources}
          onToggleDownload={toggleDownload}
          checklistState={getChecklistState()}
          onToggleChecklistItem={(index) => toggleChecklistItem(lesson.id, index)}
          onShare={() => {
            navigator.clipboard.writeText(`https://forge.elite/course/${course.id}/lesson/${lesson.id}`);
            showToast('Link copied to clipboard!');
          }}
        />
      );
    }
  }

  if (selectedCourseId) {
    const course = MOCK_COURSES.find(c => c.id === selectedCourseId);
    if (course) {
      return (
        <CourseDetail 
          course={course}
          completedLessonIds={progress.completedLessonIds}
          onBack={handleBackFromCourse}
          onSelectLesson={(lessonId) => handleOpenLesson(course.id, lessonId)}
          isBookmarked={!!progress.bookmarks[`course:${course.id}`]}
          onToggleBookmark={() => toggleBookmark(`course:${course.id}`)}
          onShare={() => {
            navigator.clipboard.writeText(`https://forge.elite/course/${course.id}`);
            showToast('Link copied to clipboard!');
          }}
          relatedCourses={MOCK_COURSES.filter(c => c.id !== course.id).slice(0, 2)}
        />
      );
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            progress={progress}
            nextLevelProgress={nextLevelProgress}
            courses={MOCK_COURSES}
            liveSessions={MOCK_LIVE_SESSIONS}
            onContinueCourse={handleOpenCourse}
            onOpenLiveSession={(id) => {}}
          />
        );
      case 'library':
        return (
          <Library 
            courses={MOCK_COURSES}
            completedLessonIds={progress.completedLessonIds}
            onSelectCourse={handleOpenCourse}
            onSelectLesson={handleOpenLesson}
          />
        );
      case 'live':
        return (
          <LiveSessions 
            sessions={MOCK_LIVE_SESSIONS}
            rsvpSessionIds={progress.rsvpSessionIds}
            onToggleRSVP={toggleRSVP}
          />
        );
      case 'saved':
        return (
          <Saved 
            progress={progress}
            courses={MOCK_COURSES}
            onToggleDownload={toggleDownload}
            onToggleBookmark={toggleBookmark}
            onOpenCourse={handleOpenCourse}
            onOpenLesson={handleOpenLesson}
          />
        );
    }
  };

  return (
    <div className="min-h-full pb-24">
      <div className="p-6">
        <div className="mb-7">
          <div className="bg-white/[0.08] border border-white/[0.12] rounded-[22px] p-1 flex items-center gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 h-11 rounded-[18px] flex items-center justify-center gap-2 transition-all duration-200 ease-out ${
                    isActive ? 'bg-white/90 text-black shadow-lg scale-[1.02]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {renderTabContent()}
      </div>
      
      <Toast 
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};
