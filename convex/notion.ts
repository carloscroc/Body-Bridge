"use node";

import { action, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { readFileSync } from "fs";
import { join } from "path";

export const syncNotionExerciseLibrary = action({
  args: {},
  handler: async (ctx: ActionCtx) => {
    // Read the prepared Notion data from filesystem (runs at action runtime, not import time)
    const notionData = JSON.parse(
      readFileSync(join(process.cwd(), ".hermes/notion-with-videos.json"), "utf8")
    ) as {
      notionPageId: string;
      notionUrl: string;
      title: string;
      videoUrl: string;
      bodyRegion?: string[];
      equipment?: string[];
      musclesUsed?: string[];
      movementGoal?: string;
      movementType?: string;
      level?: string[];
      source?: string;
      instructions?: string;
      videoDescription?: string;
      otherNames?: string[];
      status?: string;
      clientGoal?: string[];
      location?: string;
      visualsComplete?: string;
      coverPhoto?: string[];
      dateAdded?: string;
    }[];

    // Call the internal mutation with the notion data directly
    const result = await ctx.runMutation(api.notionInternal.syncNotionExerciseLibraryInternal, {
      notionData: notionData,
    });

    return result as { created: number; updated: number; errors: string[] };
  },
});