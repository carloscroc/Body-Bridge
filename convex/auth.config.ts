import type { AuthConfig } from "convex/server";

const domain = process.env.CONVEX_SITE_URL;

if (!domain) {
  throw new Error("Missing CONVEX_SITE_URL; cannot configure Convex auth providers.");
}

export default {
  providers: [
    {
      // Convex Auth issues OIDC-compatible JWTs from CONVEX_SITE_URL.
      domain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
