import { defineConvexConfig } from "convex";

export default defineConvexConfig({
  // Local development configuration
  development: {
    deployment: "local",
    selfHosted: true,
  },
});
