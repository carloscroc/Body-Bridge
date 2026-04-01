import { defineConvexConfig } from "./convex";

export default defineConvexConfig({
  // This configures Convex to use the local deployment
  // and connects to the backend running on port 8443
  backend: "http://localhost:8443",
  deployment: "local"
});