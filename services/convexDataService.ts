import { convex } from "./convexClient";
import type {
  ConvexExercise,
  ConvexDifficulty,
  ExerciseSearchParams,
  ExerciseSearchResult,
} from "./convexTypes";
import type { Exercise } from "../types";

/**
 * Convex Data Service
 * Provides data access layer for Convex backend
 */

/**
 * Fetch exercises from Convex with filtering and pagination
 * @param params - Search parameters including query, category, muscle, difficulty, equipment, pagination
 * @returns Promise<ExerciseSearchResult>
 */
export async function fetchExercises(
  params: ExerciseSearchParams = {}
): Promise<ExerciseSearchResult> {
  try {
    const result = await convex.query.api.exercises.advancedSearch(params);

    // Convert Convex exercises to frontend Exercise format
    const exercises: Exercise[] = result.exercises.map((ex) => ({
      id: ex._id,
      name: ex.name,
      image: ex.imageUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
      category: ex.category,
      muscleGroup: ex.muscleGroup,
      agonistMuscles: [...ex.primaryMuscles, ...ex.secondaryMuscles],
      equipment: ex.equipment.join(", "),
      difficulty:
        ex.difficulty.charAt(0).toUpperCase() +
        ex.difficulty.slice(1),
      instructions: ex.instructions,
      duration: ex.duration || "0 min",
      reps: ex.reps || "10",
    }));

    return {
      exercises,
      status: result.status,
      cursor: result.cursor,
    };
  } catch (error) {
    console.error("Failed to fetch exercises from Convex:", error);
    // Fall back to empty result on error
    return {
      exercises: [],
      status: "Exhausted",
      cursor: null,
    };
  }
}

/**
 * Fetch categories from Convex
 * @returns Promise<string[]> - List of unique categories
 */
export async function fetchCategories(): Promise<string[]> {
  try {
    const categories = await convex.query.api.exercises.getCategories({});
    return categories;
  } catch (error) {
    console.error("Failed to fetch categories from Convex:", error);
    return ["Strength", "Cardio", "Flexibility"];
  }
}

/**
 * Fetch a single exercise by ID
 * @param id - Exercise ID
 * @returns Promise<Exercise | null>
 */
export async function fetchExerciseById(id: string): Promise<Exercise | null> {
  try {
    const exercises = await convex.query.api.exercises.advancedSearch({});
    const exercise = exercises.exercises.find((ex) => ex._id === id);

    if (!exercise) return null;

    return {
      id: exercise._id,
      name: exercise.name,
      image: exercise.imageUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
      category: exercise.category,
      muscleGroup: exercise.muscleGroup,
      agonistMuscles: [...exercise.primaryMuscles, ...exercise.secondaryMuscles],
      equipment: exercise.equipment.join(", "),
      difficulty:
        exercise.difficulty.charAt(0).toUpperCase() +
        exercise.difficulty.slice(1),
      instructions: exercise.instructions,
      duration: exercise.duration || "0 min",
      reps: exercise.reps || "10",
    };
  } catch (error) {
    console.error("Failed to fetch exercise from Convex:", error);
    return null;
  }
}

/**
 * Helper to normalize difficulty values
 * @param difficulty - Difficulty from any format
 * @returns Normalized ConvexDifficulty
 */
export function normalizeDifficulty(
  difficulty: string | undefined
): ConvexDifficulty {
  if (!difficulty) return "Intermediate";
  const normalized = difficulty.toLowerCase();
  if (normalized.startsWith("adv")) return "Advanced";
  if (normalized.startsWith("int")) return "Intermediate";
  if (normalized.startsWith("beg")) return "Beginner";
  return "Intermediate";
}
