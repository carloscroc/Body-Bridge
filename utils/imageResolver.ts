const COVER_MAP: Record<string, string> = {
  chest: "1571019613454-1cb2f99b2d8b",
  back: "1605296867304-46d5465a13f1",
  legs: "1434608519344-49d77a699e1d",
  shoulders: "1532029837206-abbe2b7620e3",
  arms: "1581009146145-b5ef050c2e1e",
  abs: "1518310352947-660c4189798e",
  core: "1518310352947-660c4189798e",
  "full-body": "1517836357463-d25dfeac00ad",
  glutes: "1434608519344-49d77a699e1d",
  hamstrings: "1434608519344-49d77a699e1d",
  quadriceps: "1434608519344-49d77a699e1d",
  biceps: "1581009146145-b5ef050c2e1e",
  triceps: "1581009146145-b5ef050c2e1e",
  forearms: "1581009146145-b5ef050c2e1e",
  calves: "1434608519344-49d77a699e1d",
  strength: "1534438327276-14e5300c3a48",
  cardio: "1538805060514-97d9cc17730c",
  yoga: "1544367567-0f2fcb009e0b",
  hiit: "1517836357463-d25dfeac00ad",
  power: "1541534741688-6078c6bfb5c5",
  mobility: "1552196563-55cd4e45efb3",
  stretching: "1552196563-55cd4e45efb3",
  calisthenics: "1599058917212-d750089bc07e",
  plyometrics: "1517836357463-d25dfeac00ad",
  "olympic-weightlifting": "1541534741688-6078c6bfb5c5",
  strongman: "1541534741688-6078c6bfb5c5"
};

const GRANULAR_MAP: Record<string, string> = {
  // Biceps
  "bicep-dumbbell": "qZ-U9z4TQ6A",
  "bicep-barbell": "ZqdZECdJlRk",
  "bicep-machine": "ccCs-1fsvhc",
  "bicep-cable": "XTV9Obm14S0",
  
  // Triceps
  "tricep-dumbbell": "Dueawl5Q75s",
  "tricep-barbell": "m2z68_2BuyM",
  "tricep-machine": "ccCs-1fsvhc",
  "tricep-cable": "P1WKUiOl7xg",
  "tricep-pushdown": "P1WKUiOl7xg",

  // Chest
  "chest-barbell": "Dueawl5Q75s",
  "chest-dumbbell": "m2z68_2BuyM",
  "chest-machine": "ccCs-1fsvhc",
  "chest-fly": "Mzu7qcmP5tk",
  
  // Back
  "back-barbell": "0Rgef9seVpo",
  "back-dumbbell": "ss28TrQAKcQ",
  "back-machine": "P1WKUiOl7xg",
  "back-bodyweight": "wTWU_Rg2dWc",
  
  // Legs
  "leg-barbell": "YFeoyqrFsGA",
  "leg-dumbbell": "JVhQp5b8oY4",
  "leg-machine": "qbktVctZKL4",
  
  // Shoulders
  "shoulder-dumbbell": "qZ-U9z4TQ6A",
  "shoulder-barbell": "YFeoyqrFsGA",
  
  // Core/Abs
  "abs-bodyweight": "LBI7cgq3pbM",
  "abs-machine": "ccCs-1fsvhc",
};

const EXERCISE_MAP: Record<string, string> = {
  "bench press": "Dueawl5Q75s",
  "squat": "YFeoyqrFsGA",
  "deadlift": "1541534741688-6078c6bfb5c5",
  "lunge": "JVhQp5b8oY4",
  "plank": "LBI7cgq3pbM",
  "push up": "1599058917212-d750089bc07e",
  "pull up": "wTWU_Rg2dWc",
  "chin up": "wTWU_Rg2dWc",
  "lat pulldown": "P1WKUiOl7xg",
  "running": "1538805060514-97d9cc17730c",
  "cycling": "1517836357463-d25dfeac3438",
  "boxing": "1552072092-7f9b8d63efcb",
  "yoga": "1544367567-0f2fcb009e0b",
  "stretching": "1552196563-55cd4e45efb3",
  "stretch": "1552196563-55cd4e45efb3",
  "kettlebell": "1517133767324-2460383b4b2d",
  "wrist circle": "1552196563-55cd4e45efb3",
  "windmill": "LBI7cgq3pbM",
  "sprint": "1538805060514-97d9cc17730c",
  "stiff leg": "0Rgef9seVpo",
  "hammer curl": "qZ-U9z4TQ6A",
  "lateral raise": "qZ-U9z4TQ6A",
  "tricep pushdown": "P1WKUiOl7xg",
  "leg press": "qbktVctZKL4",
  "calf raise": "qbktVctZKL4"
};

const DEFAULT_ID = "1534438327276-14e5300c3a48";

function getEquipment(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("dumbbell") || n.includes("db") || n.includes("dumbell")) return "dumbbell";
  if (n.includes("barbell") || n.includes("bb")) return "barbell";
  if (n.includes("machine") || n.includes("lever") || n.includes("seated") || n.includes("smith")) return "machine";
  if (n.includes("cable")) return "cable";
  if (n.includes("kettlebell") || n.includes("kb")) return "kettlebell";
  if (n.includes("band")) return "cable";
  return "bodyweight";
}

export function resolveHighEndExerciseImage(exercise: any): string {
  // Pass through non-empty http(s) URLs that are not placeholders
  const trimAndPass = (u?: string) => {
    if (!u) return false;
    const s = u.trim();
    if (s.length === 0) return false;
    if (!(s.startsWith("http://") || s.startsWith("https://"))) return false;
    if (s.includes(DEFAULT_ID)) return false;
    return true;
  };
  // Prefer exercise.image when it passes criteria
  if (trimAndPass(exercise.image)) {
    return exercise.image!.trim();
  }
  // Then exercise.imageUrl
  if (trimAndPass(exercise.imageUrl)) {
    return exercise.imageUrl!.trim();
  }

  const name = (exercise.name || "").toLowerCase();
  const muscle = (exercise.muscleGroup || "").toLowerCase();
  const equipment = getEquipment(name);

  // 1. Try Exact Exercise Keyword Match
  for (const [keyword, id] of Object.entries(EXERCISE_MAP)) {
    if (name.includes(keyword)) {
      return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=800`;
    }
  }

  // 2. Try Muscle + Equipment Match
  const muscleKey = muscle.includes("bicep") ? "biceps" : 
                    muscle.includes("tricep") ? "triceps" :
                    muscle.includes("chest") ? "chest" :
                    muscle.includes("back") ? "back" :
                    muscle.includes("leg") ? "legs" :
                    muscle.includes("shoulder") ? "shoulders" :
                    muscle.includes("abs") || muscle.includes("core") ? "abs" : "";
  
  if (muscleKey) {
    const combinedKey = `${muscleKey}-${equipment}`;
    if (GRANULAR_MAP[combinedKey]) {
      return `https://images.unsplash.com/photo-${GRANULAR_MAP[combinedKey]}?auto=format&fit=crop&q=80&w=800`;
    }
  }

  // 3. Fallback to Muscle Group or Category from COVER_MAP
  let id = COVER_MAP[muscle] || COVER_MAP[exercise.category?.toLowerCase() || ""];

  if (!id) {
    if (muscle.includes("chest") || muscle.includes("pect")) id = COVER_MAP.chest;
    else if (muscle.includes("back") || muscle.includes("lat") || muscle.includes("trap")) id = COVER_MAP.back;
    else if (muscle.includes("leg") || muscle.includes("quad") || muscle.includes("glute") || muscle.includes("ham") || muscle.includes("calf") || muscle.includes("thigh")) id = COVER_MAP.legs;
    else if (muscle.includes("arm") || muscle.includes("bicep") || muscle.includes("tricep") || muscle.includes("forearm")) id = COVER_MAP.arms;
    else if (muscle.includes("shoulder") || muscle.includes("delt")) id = COVER_MAP.shoulders;
    else if (muscle.includes("abs") || muscle.includes("core") || muscle.includes("oblique")) id = COVER_MAP.core;
  }

  id = id || DEFAULT_ID;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=800`;
}

export function resolveHighEndWorkoutImage(title: string): string {
  const t = title.toLowerCase();
  
  // Try Exercise Keywords first
  for (const [keyword, id] of Object.entries(EXERCISE_MAP)) {
    if (t.includes(keyword)) {
      return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=1200`;
    }
  }

  let id = DEFAULT_ID;
  if (t.includes("punch") || t.includes("box")) id = "1552072092-7f9b8d63efcb";
  else if (t.includes("thigh") || t.includes("leg") || t.includes("squat")) id = "1434608519344-49d77a699e1d";
  else if (t.includes("core") || t.includes("abs")) id = "1518310352947-660c4189798e";
  else if (t.includes("yoga") || t.includes("flow")) id = "1544367567-0f2fcb009e0b";
  else if (t.includes("run") || t.includes("cardio")) id = "1538805060514-97d9cc17730c";
  
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=1200`;
}
