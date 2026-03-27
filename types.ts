export enum Tab {
  HOME = 'Home',
  EXERCISES = 'Exercises',
  WORKOUTS = 'Workouts',
  MEALS = 'Meals',
  CALENDAR = 'Calendar',
  COMMUNITY = 'Community',
  MEMBERS = 'Members',
  SETTINGS = 'Settings'
}

export type Theme = 'dark' | 'light' | 'system';
export type UnitWeight = 'lb' | 'kg';
export type UnitHeight = 'cm' | 'ft';
export type UnitDistance = 'mi' | 'km';

export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';
export type TrainingGoal = 'Fat Loss' | 'Strength' | 'Hypertrophy' | 'Performance' | 'Mobility';
export type ProfileVisibility = 'Private' | 'Members' | 'Public';

export interface TrainingProfile {
  goal: TrainingGoal;
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number;
  equipmentAccess: string[];
  injuries: string;
  preferredWorkoutTime: string;
}

export interface UnitSettings {
  weight: UnitWeight;
  height: UnitHeight;
  distance: UnitDistance;
}

export interface IntegrationSettings {
  appleHealth: boolean;
  googleFit: boolean;
  calendarSync: boolean;
}

export interface NotificationPreferences {
  workoutReminders: boolean;
  workoutReminderTime: string;
  mealPrepAlerts: boolean;
  communityUpdates: boolean;
  coachMessages: boolean;
}

export interface PrivacySettings {
  visibility: ProfileVisibility;
  shareStats: boolean;
  showOnlineStatus: boolean;
}

export interface UserGoals {
  targetWeight: number;
  dailyCalories: number;
  weeklyWorkouts: number;
}

export interface Subscription {
  plan: 'Free' | 'Pro' | 'Elite';
  status: 'active' | 'cancelled' | 'expired';
  renewalDate: string;
}

export interface UserSettings {
  theme: Theme;
  units: UnitSettings;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  training: TrainingProfile;
  integrations: IntegrationSettings;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'Admin' | 'Coach' | 'Member';
  joinedDate: string;
  lastActive: string;
  status: 'online' | 'offline' | 'training';
  bio: string;
  location?: string;
  stats: {
    workoutsCompleted: number;
    streakDays: number;
    weightLiftedKg: number;
  };
  goals: string[];
  badges: string[];
  settings?: UserSettings;
  subscription?: Subscription;
}

export interface Exercise {
  id: string;
  name: string;
  image: string;
  category: string;
  muscleGroup: string;
  agonistMuscles?: string[];
  equipment: string;
  difficulty: string;
  instructions?: string[];
  duration?: string;
  reps?: string;
  videoUrl?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  image: string;
  muscleGroup: string;
  sets?: number;
  reps?: string;
  duration?: string;
  restSeconds?: number;
  order: number;
  videoUrl?: string;
}

export type WorkoutSlotType = 'morning' | 'afternoon' | 'evening';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export enum WorkoutFormat {
  USER_PACED = 'user_paced'
}

export interface Workout {
  id: string;
  title: string;
  coach: string;
  duration: string;
  intensity: 'Easy' | 'Medium' | 'Hard';
  kcal: number;
  image: string;
  description: string;
  focus: string[];
  exercises: Exercise[];
  equipment: string[];
  coachNotes: string;
  isCustom?: boolean;
  createdAt?: string;
  format?: WorkoutFormat;
}

export interface UserWorkout {
  id: string;
  title: string;
  description: string;
  intensity: 'Easy' | 'Medium' | 'Hard';
  image: string;
  focus: string[];
  notes?: string;
  warmupExercises?: WorkoutExercise[];
  exercises: WorkoutExercise[];
  cooldownExercises?: WorkoutExercise[];
  equipment: string[];
  createdAt: string;
  updatedAt: string;
  format?: WorkoutFormat;
  totalDuration?: string;
  estimatedKcal?: number;
}

export interface Meal {
  id: string;
  title: string;
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTime: string;
  tags: string[];
  ingredients?: string[];
  instructions?: string[];
  servings?: number;
}

export type PlanItemType = 'meal' | 'workout';

export interface PlanItem {
  id: string;
  type: PlanItemType;
  item: Meal | Workout | UserWorkout;
  scheduledDate: string;
  scheduledTime?: string;
  // Legacy field name; used as a generic slot identifier for both meals and workouts.
  mealType?: MealType | WorkoutSlotType;
  notes?: string;
  completed: boolean;
}

export interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  time: string;
}

export type CommunityPostTag = 'PR' | 'Done' | 'Meal' | 'Ask' | 'Wins' | 'Form Check';

export type CommunityPostAttachmentKind = 'image';

export interface CommunityPostAttachment {
  id: string;
  kind: CommunityPostAttachmentKind;
  dataUrl: string;
  mime?: string;
  name?: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  title: string;
  body: string;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt?: string;
  tag: CommunityPostTag;
  attachments?: CommunityPostAttachment[];
  isCustom?: boolean;
}

export interface CommunityComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface SearchResult {
  text: string;
  links: Array<{
    web?: { uri: string; title: string };
    maps?: { uri: string; title: string };
  }>;
}

export type AchievementId = 'starter' | 'consistent' | 'athlete' | 'elite' | 'master' | 'social' | 'scholar';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string; // Emoji or Lucide icon name
  xpReward: number;
  condition: string; // Human readable condition
  unlockedAt?: string;
}

export interface UserLevel {
  currentLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  totalXp: number;
  title: string;
}
