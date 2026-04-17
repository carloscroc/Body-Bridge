/**
 * Convex type definitions aligned with apex-trainer-ai schema
 * These types map directly to the Convex database tables
 */

// Exercise difficulty from Convex schema
export type ConvexDifficulty = "Beginner" | "Intermediate" | "Advanced";

// Convex Exercise type (matches apex-trainer-ai exercises table)
export interface ConvexExercise {
  _id: string;
  libraryId: string;
  name: string;
  category: string;
  muscleGroup: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  overview: string;
  instructions: string[];
  benefits: string[];
  videoUrl?: string;
  imageUrl?: string;
  difficulty: ConvexDifficulty;
  sets: string;
  reps: string;
  tempo?: string;
  rest?: string;
  weight?: string;
  notes?: string;
  duration?: string;
  distance?: string;
  rpe?: number;
  power?: string;
  cadence?: string;
  heartRate?: string;
  load?: string;
  speed?: string;
  bpm?: number;
  calories?: number;
  metadata?: any;
  coachId?: string;
  createdAt?: number;
  _creationTime: number;
}

// Convex Profile type
export interface ConvexProfile {
  _id: string;
  userId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  authSource: "client" | "trainer";
  createdAt: number;
  updatedAt: number;
  _creationTime: number;
}

// Convex Workout type
export interface ConvexWorkout {
  _id: string;
  userId: string;
  title: string;
  subtitle?: string;
  duration?: string;
  exercises: any[];
  completed: boolean;
  date: number;
  createdAt: number;
  _creationTime: number;
}

// Convex Meal type
export interface ConvexMeal {
  _id: string;
  userId: string;
  title: string;
  type?: string;
  description?: string;
  image?: string;
  calories?: number;
  macros?: { p: number; c: number; f: number };
  completed: boolean;
  date: number;
  createdAt: number;
  _creationTime: number;
}

// Exercise search parameters (matching apex-trainer-ai API)
export interface ExerciseSearchParams {
  query?: string;
  category?: string;
  muscle?: string;
  difficulty?: ConvexDifficulty;
  equipment?: string[];
  limit?: number;
  cursor?: string | null;
  coachId?: string;
  onlyMyExercises?: boolean;
}

// Exercise search result (matching apex-trainer-ai API)
export interface ExerciseSearchResult {
  exercises: ConvexExercise[];
  status: "CanLoadMore" | "Exhausted";
  cursor: string | null;
}

import { resolveHighEndExerciseImage, resolveHighEndWorkoutImage } from "../utils/imageResolver";

// Convert Convex exercise to frontend Exercise type
export function toFrontendExercise(convexEx: ConvexExercise): import("../types").Exercise {
  const ex: any = {
    id: convexEx._id,
    name: convexEx.name,
    image: convexEx.imageUrl || "",
    category: convexEx.category,
    muscleGroup: convexEx.muscleGroup,
    agonistMuscles: [...convexEx.primaryMuscles, ...convexEx.secondaryMuscles],
    equipment: convexEx.equipment.join(", "),
    difficulty: convexEx.difficulty.charAt(0).toUpperCase() + convexEx.difficulty.slice(1),
    instructions: convexEx.instructions,
    duration: convexEx.duration || "0 min",
    reps: convexEx.reps || "10",
    videoUrl: convexEx.videoUrl,
  };
  ex.image = resolveHighEndExerciseImage(ex);
  return ex;
}

// Convert Convex workout to frontend UserWorkout type
export function toFrontendWorkout(convexWorkout: ConvexWorkout): import("../types").UserWorkout {
  return {
    id: convexWorkout._id,
    title: convexWorkout.title,
    description: convexWorkout.subtitle || "",
    intensity: "Medium",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
    focus: [],
    notes: "",
    exercises: [],
    equipment: [],
    createdAt: new Date(convexWorkout.createdAt).toISOString(),
    updatedAt: new Date(convexWorkout.createdAt).toISOString(),
  };
}
