export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type ApiExercise = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest?: string;
  tempo?: string;
  videoUrl?: string;
  instructions: string[];
  equipment: string[];
  tags: string[];
  muscleGroup: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  difficulty: Difficulty;
  category?: string;
  overview?: string;
  imageUrl?: string;
  benefits?: string[];
  libraryId?: string;
};

type FitnessExerciseJson = {
  category?: unknown;
  name?: unknown;
  description?: unknown;
  equipment?: unknown;
  instructions?: unknown;
  primary_muscles?: unknown;
  secondary_muscles?: unknown;
  tempo?: unknown;
  images?: unknown;
  video?: unknown;
  video_embed?: unknown;
  tips?: unknown;
  aliases?: unknown;
};

type FitnessExercisesFile = {
  exercises?: unknown;
};

export type SearchParams = {
  query?: string;
  category?: string;
  muscle?: string;
  equipment?: string[];
  limit: number;
  cursor: string | null;
};

export type SearchResult = {
  exercises: ApiExercise[];
  status: "CanLoadMore" | "Exhausted";
  cursor: string | null;
};

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s.length > 0 ? s : undefined;
}

function titleCaseWord(value: string): string {
  const s = value.trim();
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeDifficulty(value: unknown): Difficulty {
  const s = String(value ?? "").trim().toLowerCase();
  if (s.startsWith("adv")) return "Advanced";
  if (s.startsWith("int")) return "Intermediate";
  if (s.startsWith("beg")) return "Beginner";
  return "Intermediate";
}

function mapFitnessExercise(row: FitnessExerciseJson): ApiExercise {
  const name = toOptionalString(row.name) ?? "(untitled)";
  const category = toOptionalString(row.category);
  const equipment = toStringArray(row.equipment);
  const instructions = toStringArray(row.instructions);

  const primaryMusclesRaw = toStringArray(row.primary_muscles);
  const secondaryMusclesRaw = toStringArray(row.secondary_muscles);
  const primaryMuscles = primaryMusclesRaw.map(titleCaseWord);
  const secondaryMuscles = secondaryMusclesRaw.map(titleCaseWord);
  const primary = primaryMuscles[0] ?? "General";

  const imageUrl = toStringArray(row.images)[0];
  const videoUrl = toOptionalString(row.video_embed) ?? toOptionalString(row.video);

  const id = `fitness-${slugify(name) || "exercise"}`;
  const overview = toOptionalString(row.description);

  const benefits = toStringArray(row.tips);

  return {
    id,
    name,
    sets: "3",
    reps: "10",
    rest: undefined,
    tempo: toOptionalString(row.tempo),
    videoUrl,
    instructions,
    equipment,
    tags: Array.from(new Set([category, ...equipment].filter(Boolean) as string[])),
    muscleGroup: primary,
    primaryMuscles,
    secondaryMuscles,
    difficulty: normalizeDifficulty((row as { difficulty?: unknown }).difficulty),
    category,
    overview,
    imageUrl,
    benefits: benefits.length > 0 ? benefits : undefined,
    libraryId: id,
  };
}

export function mapFitnessExercisesFromJson(data: unknown): ApiExercise[] {
  const parsed = data as FitnessExercisesFile;
  const rows = parsed.exercises;
  if (!Array.isArray(rows)) {
    throw new Error("Invalid fitness exercises JSON: expected { exercises: [] }");
  }
  return (rows as FitnessExerciseJson[]).map(mapFitnessExercise);
}

function includesInsensitive(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function searchApexExercises(all: ApiExercise[], params: SearchParams): SearchResult {
  const limit = Math.max(1, Math.min(100, Math.floor(params.limit)));
  const offset = params.cursor ? Number.parseInt(params.cursor, 10) : 0;
  const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;

  const query = params.query?.trim();
  const category = params.category?.trim();
  const muscle = params.muscle?.trim();
  const equipment = (params.equipment ?? []).map((e) => e.trim()).filter(Boolean);

  const filtered = all.filter((ex) => {
    if (category && category.toLowerCase() !== "all") {
      if (!ex.category || ex.category.toLowerCase() !== category.toLowerCase()) return false;
    }

    if (muscle && muscle.toLowerCase() !== "all") {
      const muscles = [ex.muscleGroup, ...ex.primaryMuscles, ...ex.secondaryMuscles]
        .filter(Boolean)
        .map((m) => m.toLowerCase());
      if (!muscles.includes(muscle.toLowerCase())) return false;
    }

    if (equipment.length > 0) {
      const equip = ex.equipment.map((e) => e.toLowerCase());
      const anyMatch = equipment.some((needle) => equip.includes(needle.toLowerCase()));
      if (!anyMatch) return false;
    }

    if (query && query.length > 0) {
      const hay = [ex.name, ex.overview ?? "", ...ex.tags, ...ex.equipment].join(" ");
      if (!includesInsensitive(hay, query)) return false;
    }

    return true;
  });

  // Stable default ordering for pagination.
  filtered.sort((a, b) => a.name.localeCompare(b.name));

  const page = filtered.slice(safeOffset, safeOffset + limit);
  const nextOffset = safeOffset + page.length;
  const status: SearchResult["status"] = nextOffset < filtered.length ? "CanLoadMore" : "Exhausted";
  const cursor = status === "CanLoadMore" ? String(nextOffset) : null;

  return { exercises: page, status, cursor };
}
