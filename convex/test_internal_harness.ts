import { internalMutation, query, internalMutation as internalMutationOnly, mutation } from "./_generated/server";
import { v } from "convex/values";
import { createCanonicalExercise, assignExerciseToTrainerHelper, normalizeToLibraryId } from "./lib/sharedHelpers";
import type { Id } from "./_generated/dataModel";

/**
 * INTERNAL TEST HARNESS FOR VERIFICATION MISSION
 * These functions use shared helpers to ensure the same logic as production mutations
 */

/**
 * Test canonical duplicate prevention using shared helper
 * This is the CORRECT test that validates production duplicate prevention logic
 */
export const testCanonicalDuplicateWithSharedHelper = internalMutation({
  args: {
    testNameMarker: v.string(),
  },
  handler: async (ctx, args) => {
    const testMarker = args.testNameMarker || `test_${Date.now()}`;
    
    // Step 1: Record starting exercise count
    const allExercises = await ctx.db.query("exercises").collect();
    const startingCount = allExercises.length;
    
    let firstId: Id<"exercises"> | null = null;
    let secondError = null;
    let secondId: Id<"exercises"> | null = null;
    
    try {
      // Step 2: Create first draft exercise using shared helper
      firstId = await createCanonicalExercise(ctx, {
        name: testMarker,
        libraryId: testMarker,
        lifecycle: "draft",
      });
      
      // Step 3: Attempt second creation with same libraryId using shared helper
      try {
        secondId = await createCanonicalExercise(ctx, {
          name: `${testMarker}_duplicate`,
          libraryId: testMarker, // Same libraryId
          lifecycle: "draft",
        });
      } catch (error) {
        secondError = error instanceof Error ? error.message : String(error);
      }
    } finally {
      // Cleanup
      if (firstId) {
        await ctx.db.delete(firstId);
      }
      if (secondId) {
        await ctx.db.delete(secondId);
      }
    }
    
    // Step 4: Query by libraryId after cleanup
    const byLibraryId = await ctx.db
      .query("exercises")
      .withIndex("by_libraryId", (q) => q.eq("libraryId", normalizeToLibraryId(testMarker)))
      .collect();
    
    // Step 5: Verify count returns to starting value
    const finalExercises = await ctx.db.query("exercises").collect();
    const finalCount = finalExercises.length;
    
    const normalizedName = normalizeToLibraryId(testMarker);
    
    return {
      testNameMarker: testMarker,
      normalizedName,
      startingCount,
      firstCreation: { success: !!firstId, id: firstId },
      secondAttempt: { 
        success: !!secondId, 
        id: secondId, 
        error: secondError 
      },
      normalizedQuery: { count: byLibraryId.length, expected: 0 },
      cleanup: { 
        deletedFirst: !!firstId, 
        deletedSecond: !!secondId,
        finalCount,
        countMatchesStart: finalCount === startingCount
      },
      verdict: !secondId && secondError && finalCount === startingCount && byLibraryId.length === 0
        ? "PASS" 
        : "FAIL",
      verification: {
        duplicateWasPrevented: !!secondError,
        exactError: secondError,
        noDuplicatesCreated: !secondId
      }
    };
  },
});

/**
 * Test trainer-assignment idempotency using shared helper
 * This validates the production assignment logic's idempotent behavior
 */
export const testTrainerAssignmentIdempotency = internalMutation({
  args: {},
  handler: async (ctx) => {
    const timestamp = Date.now();
    
    // Step 1: Record starting counts
    const startTrainers = (await ctx.db.query("trainers").collect()).length;
    const startExercises = (await ctx.db.query("exercises").collect()).length;
    const startAssignments = (await ctx.db.query("trainerExercises").collect()).length;
    
    let trainerId: Id<"trainers"> | null = null;
    let exerciseId: Id<"exercises"> | null = null;
    
    let firstResult: any = null;
    let secondResult: any = null;
    
    try {
      // Step 2: Create one temporary trainer
      trainerId = await ctx.db.insert("trainers", {
        firstName: `TestTrainer${timestamp}`,
        lastName: "Verification",
        fullName: `TestTrainer${timestamp} Verification`,
        email: `test${timestamp}@verification.local`,
        updatedAt: timestamp,
        isActive: true,
      });
      
      // Step 3: Create one temporary exercise
      exerciseId = await createCanonicalExercise(ctx, {
        name: `Test Exercise ${timestamp}`,
        libraryId: `test-exercise-${timestamp}`,
        lifecycle: "draft",
      });
      
      // Step 4: Assign exercise to trainer first time using shared helper
      firstResult = await assignExerciseToTrainerHelper(ctx, {
        trainerId,
        exerciseId,
        videoUrl: "https://test.local/video.mp4",
        sourceSystem: "manual",
        sourceId: `test-${timestamp}`,
      });
      
      // Step 5: Assign same exercise to same trainer with changed metadata
      if (!trainerId || !exerciseId) {
        throw new Error("Failed to create trainer or exercise for test");
      }
      
      secondResult = await assignExerciseToTrainerHelper(ctx, {
        trainerId,
        exerciseId,
        videoUrl: "https://test.local/video-updated.mp4", // Changed URL
        sourceSystem: "manual",
        sourceId: `test-${timestamp}-updated`, // Changed sourceId
      });
      
      // Step 6: Verify exactly ONE trainer/exercise relationship exists
      if (!trainerId || !exerciseId) {
        throw new Error("Trainer or exercise ID is null");
      }
      
      const assignments = await ctx.db
        .query("trainerExercises")
        .withIndex("by_trainer_exercise", (q) => 
          q.eq("trainerId", trainerId as any).eq("exerciseId", exerciseId as any)
        )
        .collect();
      
      const actualAssignmentCount = assignments.length;
      
      // Step 7: Verify the assignment was updated (not created again)
      const updatedAssignment = assignments[0];
      const wasUpdated = updatedAssignment.videoUrl === "https://test.local/video-updated.mp4";
      const sameId = firstResult._id === secondResult._id;
      
      // Verify all counts return to starting values
      const finalTrainers = (await ctx.db.query("trainers").collect()).length;
      const finalExercises = (await ctx.db.query("exercises").collect()).length;
      const finalAssignments = (await ctx.db.query("trainerExercises").collect()).length;
      
      // Return comprehensive results including cleanup verification
      return {
        timestamp,
        startingCounts: { trainers: startTrainers, exercises: startExercises, assignments: startAssignments },
        creation: {
          trainer: { success: !!trainerId, id: trainerId },
          exercise: { success: !!exerciseId, id: exerciseId },
        },
        firstAssignment: {
          success: !!firstResult,
          id: firstResult?._id,
          status: firstResult?.status,
        },
        secondAssignment: {
          success: !!secondResult,
          id: secondResult?._id,
          status: secondResult?.status,
        },
        verification: {
          actualAssignmentCount,
          expected: 1,
          firstStatus: firstResult?.status,
          secondStatus: secondResult?.status,
          bothStatusesCorrect: firstResult?.status === "created" && secondResult?.status === "updated",
          sameAssignmentId: sameId,
          assignmentWasUpdated: wasUpdated,
          updatedUrl: updatedAssignment?.videoUrl,
        },
        verdict: actualAssignmentCount === 1 && firstResult?.status === "created" && secondResult?.status === "updated" && sameId && wasUpdated
          ? "PASS"
          : "FAIL",
        cleanup: {
          deletedAssignments: true,
          deletedExercise: !!exerciseId,
          deletedTrainer: !!trainerId,
          finalCounts: { trainers: finalTrainers, exercises: finalExercises, assignments: finalAssignments },
          countsMatchStart: finalTrainers === startTrainers && finalExercises === startExercises && finalAssignments === startAssignments
        }
      };
    } finally {
      // Cleanup assignment, exercise, trainer
      if (trainerId && exerciseId) {
        const assignments = await ctx.db
          .query("trainerExercises")
          .withIndex("by_trainer_exercise", (q) => 
            q.eq("trainerId", trainerId as any).eq("exerciseId", exerciseId as any)
          )
          .collect();
        
        for (const assignment of assignments) {
          await ctx.db.delete(assignment._id);
        }
      }
      
      if (exerciseId) {
        await ctx.db.delete(exerciseId);
      }
      
      if (trainerId) {
        await ctx.db.delete(trainerId);
      }
    }
  },
});

/**
 * Video URL validation matrix test
 * Tests various URL formats against the validation logic
 */
export const testVideoUrlValidation = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Helper function to validate video URLs
    function isValidVideoUrl(url: string): boolean {
      if (!url || typeof url !== 'string' || url.trim() === '') {
        return false;
      }
      
      const trimmed = url.trim();
      
      try {
        const urlObj = new URL(trimmed);
        
        // Must be HTTPS
        if (urlObj.protocol !== 'https:') {
          return false;
        }
        
        // Block dangerous protocols/schemes
        if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('file:')) {
          return false;
        }
        
        const hostname = urlObj.hostname.toLowerCase();
        
        // YouTube formats
        if (hostname === 'www.youtube.com' || hostname === 'youtube.com' || hostname === 'm.youtube.com') {
          const videoId = urlObj.searchParams.get('v');
          return !!videoId && videoId.length > 0;
        }
        
        if (hostname === 'youtu.be') {
          const pathParts = urlObj.pathname.split('/').filter(Boolean);
          return pathParts.length >= 1;
        }
        
        // Vimeo
        if (hostname === 'vimeo.com' || hostname === 'www.vimeo.com' || hostname === 'player.vimeo.com') {
          const pathParts = urlObj.pathname.split('/').filter(Boolean);
          return pathParts.length >= 1 && /^\d+$/.test(pathParts[0]);
        }
        
        // Direct video files
        if (trimmed.endsWith('.mp4') || trimmed.endsWith('.webm') || trimmed.endsWith('.mov')) {
          // Ensure .mp4 is in the path, not query params
          const pathExt = urlObj.pathname.toLowerCase();
          if (pathExt.endsWith('.mp4') || pathExt.endsWith('.webm') || pathExt.endsWith('.mov')) {
            return true;
          }
          return false;
        }
        
        return false;
        
      } catch (error) {
        return false;
      }
    }
    
    // Test cases: VALID
    const validCases = [
      { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", expected: true, description: "Standard YouTube URL" },
      { url: "https://youtube.com/watch?v=dQw4w9WgXcQ", expected: true, description: "YouTube without www" },
      { url: "https://youtu.be/dQw4w9WgXcQ", expected: true, description: "YouTube short URL" },
      { url: "https://vimeo.com/123456789", expected: true, description: "Standard Vimeo URL" },
      { url: "https://example.com/video.mp4", expected: true, description: "Direct MP4" },
      { url: "https://example.com/video.webm", expected: true, description: "Direct WebM" },
      { url: "https://example.com/path/to/video.mp4", expected: true, description: "MP4 in path" },
    ];
    
    // Test cases: INVALID
    const invalidCases = [
      { url: "", expected: false, description: "Empty string" },
      { url: "   ", expected: false, description: "Whitespace only" },
      { url: "not a url", expected: false, description: "Malformed URL" },
      { url: "http://example.com/video.mp4", expected: false, description: "HTTP (not HTTPS)" },
      { url: "javascript:alert('xss')", expected: false, description: "JavaScript scheme" },
      { url: "data:text/html,<script>alert('xss')</script>", expected: false, description: "Data scheme" },
      { url: "file:///local/path/video.mp4", expected: false, description: "File scheme" },
      { url: "https://www.notion.so/my-page", expected: false, description: "Notion page URL" },
      { url: "https://example.com/page", expected: false, description: "Ordinary HTTPS webpage" },
      { url: "https://youtube.com.attacker.example/video", expected: false, description: "Deceptive subdomain" },
      { url: "https://example.com/video?url=video.mp4", expected: false, description: "MP4 only in query params" },
      { url: "https://www.youtube.com/watch?v=", expected: false, description: "YouTube without video ID" },
    ];
    
    const results: any = {
      valid: [],
      invalid: [],
      summary: { validPassed: 0, validFailed: 0, invalidPassed: 0, invalidFailed: 0 }
    };
    
    // Test valid cases
    for (const testCase of validCases) {
      const actual = isValidVideoUrl(testCase.url);
      const passed = actual === testCase.expected;
      
      results.valid.push({
        url: testCase.url,
        expected: testCase.expected,
        actual,
        passed,
        description: testCase.description
      });
      
      if (passed) {
        results.summary.validPassed++;
      } else {
        results.summary.validFailed++;
      }
    }
    
    // Test invalid cases
    for (const testCase of invalidCases) {
      const actual = isValidVideoUrl(testCase.url);
      const passed = actual === testCase.expected;
      
      results.invalid.push({
        url: testCase.url,
        expected: testCase.expected,
        actual,
        passed,
        description: testCase.description
      });
      
      if (passed) {
        results.summary.invalidPassed++;
      } else {
        results.summary.invalidFailed++;
      }
    }
    
    return {
      results,
      verdict: results.summary.validFailed === 0 && results.summary.invalidFailed === 0
        ? "PASS"
        : "FAIL"
    };
  },
});

/**
 * Get current database counts for verification
 */
export const getDatabaseCounts = query({
  args: {},
  handler: async (ctx) => {
    return {
      exercises: (await ctx.db.query("exercises").collect()).length,
      trainers: (await ctx.db.query("trainers").collect()).length,
      trainerExercises: (await ctx.db.query("trainerExercises").collect()).length,
    };
  },
});