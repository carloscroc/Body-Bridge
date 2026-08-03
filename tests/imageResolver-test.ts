import { resolveHighEndWorkoutImage } from "../src/utils/imageResolver";

// Simple test harness for resolveHighEndWorkoutImage
const titles: string[] = [
  "Push Pull Legs",
  "Upper Lower Split",
  "Full Body HIIT",
  "Beginner Yoga",
  "Strength Training",
  "Unknown Title XYZ"
];

for (const t of titles) {
  const url = resolveHighEndWorkoutImage(t);
  console.log(`${t} => ${url}`);
}
