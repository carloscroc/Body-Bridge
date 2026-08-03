import { resolveHighEndWorkoutImage } from "../../src/utils/imageResolver";
import { writeFileSync } from "fs";
import { join } from "path";

const titles = [
  "Push Pull Legs",
  "Upper Lower Split",
  "Full Body HIIT",
  "Beginner Yoga",
  "Strength Training",
];

const results: { title: string; url: string }[] = titles.map((t) => {
  const url = resolveHighEndWorkoutImage(t);
  return { title: t, url };
});

console.log(JSON.stringify(results, null, 2));

try {
  const outDir = join(process.cwd(), ".sisyphus/evidence");
  // Ensure directory exists (best-effort)
  const fs = require('fs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const filePath = join(outDir, "task-5-program-titles.json");
  writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`Wrote evidence to ${filePath}`);
} catch (err) {
  console.error("Failed to write evidence:", err);
}
