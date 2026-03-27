
// screens/Classroom/types.ts

export type ResourceType = 'PDF' | 'Spreadsheet' | 'Link' | 'VideoFile';

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  url: string; // Fake URL for demo
  size?: string; // e.g. "2.4 MB"
}

export type LessonKind = 'Video' | 'Checklist' | 'Live' | 'Article' | 'Quiz';

export interface Lesson {
  id: string;
  title: string;
  kind: LessonKind;
  durationMin?: number;
  description: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  locked?: boolean;
  resources?: Resource[];
  checklistItems?: string[]; // Array of checklist item texts
  prerequisites?: string[]; // IDs of lessons that must be completed first
}

export interface Phase {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tag: string; // e.g. "LITE", "PRO", "FOUNDATION"
  tagColor: string; // Tailwind class e.g. "bg-yellow-400 text-black"
  accentColor: string; // Tailwind class e.g. "bg-blue-500"
  imageUrl?: string;
  phases: Phase[];
  author: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  totalDurationMin: number;
}

export interface LiveSession {
  id: string;
  title: string;
  instructor: string;
  startTime: string; // ISO string
  durationMin: number;
  topic: string;
  attendeeCount: number;
  isRsvp?: boolean;
}

export interface UserProgress {
  completedLessonIds: Record<string, boolean>; // lessonId -> true
  lastOpenedCourseId?: string;
  lastOpenedLessonId?: string;
  courseProgress: Record<string, number>; // courseId -> percentage (0-100)
  bookmarks: Record<string, boolean>; // itemId -> true
  notes: Record<string, string>; // lessonId -> note content
  checklistState: Record<string, boolean>; // lessonId:itemIndex -> true
  rsvpSessionIds: Record<string, boolean>; // sessionId -> true
  downloadedResources: Record<string, boolean>; // resourceId -> true (simulated)
  
  // Gamification
  xp: number;
  level: number;
  unlockedAchievements: Record<string, string>; // achievementId -> date string
  activityLog: Record<string, number>; // date string YYYY-MM-DD -> lessons count
  
  weeklyGoal: {
    target: number; // lessons per week
    current: number;
    streakWeeks: number;
  };
}
