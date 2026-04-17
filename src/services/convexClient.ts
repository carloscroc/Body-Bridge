import { ConvexClient } from "convex/browser";

// Convex client pointing to apex-trainer-ai's deployment
export const convex = new ConvexClient(
  import.meta.env.VITE_CONVEX_URL || import.meta.env.CONVEX_DEPLOYMENT!,
);

// Debugging: log which Convex URL/deployment the client is using at runtime
try {
  // eslint-disable-next-line no-console
  console.log("[convexClient] Convex client initialized with:", import.meta.env.VITE_CONVEX_URL || import.meta.env.CONVEX_DEPLOYMENT);
} catch (e) {
  // ignore in non-browser environments
}

// Note: other modules should import generated api types from convex/_generated/api
// The Convex client object is exported as `convex` for use (convex.query, convex.mutation, ...)
