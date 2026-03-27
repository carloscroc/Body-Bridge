import { test, expect } from "@playwright/test";

import { resolveHighEndExerciseImage } from "../utils/imageResolver";

test("passes through Convex storage URLs from exercise.image", () => {
  const ex: any = {
    name: "Bench Press",
    muscleGroup: "chest",
    image: "https://example.convex.cloud/api/storage/abc123",
  };

  expect(resolveHighEndExerciseImage(ex)).toBe(ex.image);
});

test("passes through arbitrary CDN URLs from exercise.imageUrl when image is empty", () => {
  const ex: any = {
    name: "Bench Press",
    muscleGroup: "chest",
    image: "",
    imageUrl: "https://cdn.example.com/x.jpg",
  };

  expect(resolveHighEndExerciseImage(ex)).toBe(ex.imageUrl);
});

test("does not pass through the default Unsplash placeholder", () => {
  const placeholder =
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800";

  const ex: any = {
    name: "Bench Press",
    muscleGroup: "chest",
    image: placeholder,
  };

  const result = resolveHighEndExerciseImage(ex);
  expect(result).not.toBe(placeholder);
  expect(result).not.toContain("1534438327276-14e5300c3a48");
  expect(result).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
});

test("empty and whitespace-only values fall back to Unsplash mapping", () => {
  const inputs = ["", "   "];
  for (const image of inputs) {
    const ex: any = {
      name: "Bench Press",
      muscleGroup: "chest",
      image,
    };

    const result = resolveHighEndExerciseImage(ex);
    expect(result).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
  }
});
