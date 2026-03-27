import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserProgress } from './types';
import { MOCK_COURSES } from './data';

export const ACHIEVEMENTS_DATA = [
  { id: 'starter', title: 'Starter', description: 'Complete your first lesson', threshold: 1 },
  { id: 'consistent', title: 'Consistent', description: 'Complete 3 lessons', threshold: 3 },
  { id: 'athlete', title: 'Athlete', description: 'Complete 5 lessons', threshold: 5 },
  { id: 'scholar', title: 'Scholar', description: 'Complete 10 lessons', threshold: 10 },
];

const XP_PER_LESSON = 10;
const XP_TO_LEVEL_UP = 50;

const DEFAULT_PROGRESS: UserProgress = {
  completedLessonIds: {},
  courseProgress: {},
  bookmarks: {},
  notes: {},
  checklistState: {},
  rsvpSessionIds: {},
  downloadedResources: {},
  xp: 0,
  level: 1,
  unlockedAchievements: {},
  activityLog: {},
  weeklyGoal: {
    target: 3,
    current: 1,
    streakWeeks: 4,
  },
};

export const useClassroomStore = () => {
  const convexProgress = useQuery(api.classroom.getProgress);
  const saveProgressMutation = useMutation(api.classroom.updateProgress);

  const [localProgress, setLocalProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync from Convex when data arrives
  useEffect(() => {
    if (convexProgress !== undefined) {
      if (convexProgress) {
        setLocalProgress(convexProgress.progress as UserProgress);
      }
      setIsLoaded(true);
    }
  }, [convexProgress]);

  const progress = localProgress;

  // Save to Convex helper
  const saveToConvex = useCallback((updatedProgress: UserProgress) => {
    saveProgressMutation({ progress: updatedProgress }).catch(e => {
      console.error('Failed to save classroom progress to Convex', e);
    });
  }, [saveProgressMutation]);

  const setProgressState = useCallback((updater: (prev: UserProgress) => UserProgress) => {
    setLocalProgress(prev => {
      const next = updater(prev);
      saveToConvex(next);
      return next;
    });
  }, [saveToConvex]);

  const markLessonComplete = useCallback((courseId: string, lessonId: string, isComplete = true) => {
    setProgressState(prev => {
      const nextCompleted = { ...prev.completedLessonIds };
      if (isComplete) {
        nextCompleted[lessonId] = true;
      } else {
        delete nextCompleted[lessonId];
      }

      // Recalculate course progress
      const course = MOCK_COURSES.find(c => c.id === courseId);
      let newProgress = 0;
      if (course) {
        const totalLessons = course.phases.reduce((acc, p) => acc + p.lessons.length, 0);
        const completedInCourse = course.phases
          .flatMap(p => p.lessons)
          .filter(l => nextCompleted[l.id]).length;
        newProgress = Math.round((completedInCourse / totalLessons) * 100);
      }

      // Gamification Logic
      let nextXP = prev.xp;
      let nextLevel = prev.level;
      const nextUnlockedAchievements = { ...prev.unlockedAchievements };
      const nextActivityLog = { ...prev.activityLog };

      if (isComplete && !prev.completedLessonIds[lessonId]) {
        nextXP += XP_PER_LESSON;
        const today = new Date().toISOString().split('T')[0];
        nextActivityLog[today] = (nextActivityLog[today] || 0) + 1;
        const calculatedLevel = Math.floor(nextXP / XP_TO_LEVEL_UP) + 1;
        if (calculatedLevel > nextLevel) {
          nextLevel = calculatedLevel;
        }
        const completedCount = Object.keys(nextCompleted).length;
        ACHIEVEMENTS_DATA.forEach(achievement => {
          if (!nextUnlockedAchievements[achievement.id] && completedCount >= achievement.threshold) {
            nextUnlockedAchievements[achievement.id] = new Date().toISOString();
          }
        });
      }

      return {
        ...prev,
        completedLessonIds: nextCompleted,
        lastOpenedCourseId: courseId,
        lastOpenedLessonId: lessonId,
        courseProgress: {
          ...prev.courseProgress,
          [courseId]: newProgress
        },
        xp: nextXP,
        level: nextLevel,
        unlockedAchievements: nextUnlockedAchievements,
        activityLog: nextActivityLog,
        weeklyGoal: {
          ...prev.weeklyGoal,
          current: isComplete && !prev.completedLessonIds[lessonId] 
            ? Math.min(prev.weeklyGoal.current + 1, prev.weeklyGoal.target) 
            : prev.weeklyGoal.current
        }
      };
    });
  }, [setProgressState]);

  const toggleBookmark = useCallback((itemId: string) => {
    setProgressState(prev => {
      const nextBookmarks = { ...prev.bookmarks };
      if (nextBookmarks[itemId]) {
        delete nextBookmarks[itemId];
      } else {
        nextBookmarks[itemId] = true;
      }
      return { ...prev, bookmarks: nextBookmarks };
    });
  }, [setProgressState]);

  const toggleDownload = useCallback((resourceId: string) => {
    setProgressState(prev => {
      const nextDownloads = { ...prev.downloadedResources };
      if (nextDownloads[resourceId]) {
        delete nextDownloads[resourceId];
      } else {
        nextDownloads[resourceId] = true;
      }
      return { ...prev, downloadedResources: nextDownloads };
    });
  }, [setProgressState]);

  const setLastOpened = useCallback((courseId: string, lessonId?: string) => {
    setProgressState(prev => ({
      ...prev,
      lastOpenedCourseId: courseId,
      lastOpenedLessonId: lessonId || prev.lastOpenedLessonId
    }));
  }, [setProgressState]);

  const saveNote = useCallback((lessonId: string, content: string) => {
    setProgressState(prev => ({
      ...prev,
      notes: {
        ...prev.notes,
        [lessonId]: content
      }
    }));
  }, [setProgressState]);

  const toggleRSVP = useCallback((sessionId: string) => {
    setProgressState(prev => {
      const nextRSVP = { ...prev.rsvpSessionIds };
      if (nextRSVP[sessionId]) {
        delete nextRSVP[sessionId];
      } else {
        nextRSVP[sessionId] = true;
      }
      return { ...prev, rsvpSessionIds: nextRSVP };
    });
  }, [setProgressState]);

  const toggleChecklistItem = useCallback((lessonId: string, index: number) => {
    setProgressState(prev => {
      const key = `${lessonId}:${index}`;
      const nextState = { ...prev.checklistState };
      if (nextState[key]) {
        delete nextState[key];
      } else {
        nextState[key] = true;
      }
      return { ...prev, checklistState: nextState };
    });
  }, [setProgressState]);

  const nextLevelProgress = (progress.xp % XP_TO_LEVEL_UP) / XP_TO_LEVEL_UP * 100;

  return {
    progress,
    isLoaded,
    markLessonComplete,
    toggleBookmark,
    toggleDownload,
    toggleRSVP,
    toggleChecklistItem,
    setLastOpened,
    saveNote,
    nextLevelProgress
  };
};
