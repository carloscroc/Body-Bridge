import type { AuthConfig } from "convex/server";

const domain = process.env.CONVEX_SITE_URL;
if (!domain) {
  throw new Error("Missing CONVEX_SITE_URL; cannot configure Convex auth providers.");
}

export default {
  providers: [
    {
      // Convex Auth issues OIDC-compatible JWTs from CONVEX_SITE_URL.
      // This enables Convex auth helpers (for example getAuthUserId) to validate those tokens.
      domain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
