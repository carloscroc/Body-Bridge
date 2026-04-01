import { httpRouter } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { httpAction } from "./_generated/server";

import { api } from "./_generated/api";
import { executeAIHttpRequest } from "./llm/aiHttp";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
} as const;

function optionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "cache-control": "no-store",
    },
  });
}

function jsonResponse(body: unknown, init?: { status?: number; extraHeaders?: Record<string, string> }): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init?.extraHeaders ?? {}),
    },
  });
}

function unauthorizedResponse(): Response {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      ...corsHeaders,
      "cache-control": "no-store",
    },
  });
}

type SearchResponse = {
  exercises: Array<Record<string, unknown> & { _id: string }>;
  status: "CanLoadMore" | "Exhausted";
  cursor: string | null;
};

function toExercisePayload(row: Record<string, unknown> & { _id: string }): Record<string, unknown> & { id: string } {
  return {
    ...row,
    id: row._id,
  };
}

http.route({
  path: "/api/exercises",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const allowUnauthenticated = process.env.VITE_DEV_AUTH === "true" || process.env.ALLOW_UNAUTHENTICATED_EXERCISES === "1";

    let userId: Awaited<ReturnType<typeof getAuthUserId>> = null;
    try {
      userId = await getAuthUserId(ctx);
    } catch (err) {
      if (!allowUnauthenticated) throw err;
      userId = null;
    }

    if (!userId && !allowUnauthenticated) return unauthorizedResponse();

    const url = new URL(req.url, "http://localhost");
    const limitRaw = url.searchParams.get("limit");
    const cursorRaw = url.searchParams.get("cursor");

    const query = url.searchParams.get("query") ?? undefined;
    const category = url.searchParams.get("category") ?? undefined;
    const muscle = url.searchParams.get("muscle") ?? undefined;
    const equipment = url.searchParams.getAll("equipment");
    const onlyMyExercises = url.searchParams.get("onlyMyExercises") === "true";

    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 25;
    const cursor = cursorRaw && cursorRaw.trim().length > 0 ? cursorRaw : null;

    const result = (await ctx.runQuery(api.exercises.advancedSearch, {
      query,
      category,
      muscle,
      equipment: equipment.length > 0 ? equipment : undefined,
      limit: Number.isFinite(limit) ? limit : 25,
      cursor: cursor ?? undefined,
      onlyMyExercises,
    })) as SearchResponse;

    const payload = {
      exercises: result.exercises.map(toExercisePayload),
      status: result.status,
      cursor: result.status === "CanLoadMore" ? result.cursor : null,
    };

    return jsonResponse(payload);
  }),
});

http.route({
  path: "/api/ai",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const allowUnauthenticated = process.env.VITE_DEV_AUTH === "true" || process.env.ALLOW_UNAUTHENTICATED_AI === "1";

    let userId: Awaited<ReturnType<typeof getAuthUserId>> = null;
    try {
      userId = await getAuthUserId(ctx);
    } catch (err) {
      if (!allowUnauthenticated) throw err;
      userId = null;
    }

    if (!userId && !allowUnauthenticated) return unauthorizedResponse();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ ok: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body." } }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return jsonResponse({ ok: false, error: { code: "BAD_REQUEST", message: "Request body must be an object." } }, { status: 400 });
    }

    const result = await executeAIHttpRequest(process.env, body as never);
    let status = 200;
    if (result.ok === false) {
      if (result.error.code === "BAD_REQUEST") status = 400;
      else if (result.error.code === "API_KEY_MISSING" || result.error.code === "CONFIG_INVALID") status = 400;
      else if (result.error.code === "API_KEY_INVALID") status = 401;
      else if (result.error.code === "RATE_LIMIT") status = 429;
      else status = 502;
    }
    return jsonResponse(result, { status });
  }),
});

http.route({
  path: "/api/ai",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return optionsResponse();
  }),
});

http.route({
  path: "/api/exercises",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return optionsResponse();
  }),
});

http.route({
  path: "/api/exercises/categories",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const allowUnauthenticated = process.env.VITE_DEV_AUTH === "true" || process.env.ALLOW_UNAUTHENTICATED_EXERCISES === "1";

    let userId: Awaited<ReturnType<typeof getAuthUserId>> = null;
    try {
      userId = await getAuthUserId(ctx);
    } catch (err) {
      if (!allowUnauthenticated) throw err;
      userId = null;
    }

    if (!userId && !allowUnauthenticated) return unauthorizedResponse();

    const categories = await ctx.runQuery(api.exercises.getCategories, {});
    return jsonResponse(categories);
  }),
});

http.route({
  path: "/api/exercises/categories",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return optionsResponse();
  }),
});

export default http;
