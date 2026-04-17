import { query, mutation } from "./_generated/server";

export const getProgress = query({
  args: {},
  handler: async () => {
    // Feature not yet implemented: classroomProgress table missing from schema
    return null;
  },
});

export const updateProgress = mutation({
  args: {},
  handler: async () => {
    // Feature not yet implemented: classroomProgress table missing from schema
    throw new Error("Classroom feature not yet implemented");
  },
});
