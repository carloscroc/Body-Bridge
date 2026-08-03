import dotenv from "dotenv";
import path from "node:path";

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

// Load environment in the required order: .env.local then .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export function getConvexUrl() {
  const url = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
  if (!url) {
    throw new Error(
      "Missing Convex URL. Set VITE_CONVEX_URL (preferred) or CONVEX_URL in your environment.",
    );
  }
  return url;
}

export function getAdminSecret() {
  const secret = process.env.ADMIN_SCRIPT_SECRET;
  if (!secret) {
    throw new Error(
      "Missing ADMIN_SCRIPT_SECRET. Set it locally and also in Convex env vars.",
    );
  }
  return secret;
}

export function getHttpClient() {
  return new ConvexHttpClient(getConvexUrl());
}

export async function fetchExercises() {
  const client = getHttpClient();
  return await client.query(api.exercises.list, {
    adminSecret: getAdminSecret(),
  });
}

export async function generateUploadUrl() {
  const client = getHttpClient();
  return await client.mutation(api.exercises.generateUploadUrl, {
    adminSecret: getAdminSecret(),
  });
}

export async function uploadToStorage(uploadUrl, bytes, contentType) {
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": contentType || "application/octet-stream",
    },
    body: bytes,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `uploadToStorage failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`,
    );
  }
  const data = await res.json();
  if (!data?.storageId) {
    throw new Error("uploadToStorage: missing storageId in response");
  }
  return data.storageId;
}

export async function getStorageUrl(storageId) {
  const client = getHttpClient();
  return await client.query(api.exercises.getUrl, { storageId });
}

export async function updateExerciseImageUrl(exerciseId, imageUrl) {
  const client = getHttpClient();
  return await client.mutation(api.exercises.updateExercise, {
    id: exerciseId,
    updates: { imageUrl },
    adminSecret: getAdminSecret(),
  });
}
