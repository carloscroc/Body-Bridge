/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as aiChat from "../aiChat.js";
import type * as ai_calendar from "../ai_calendar.js";
import type * as all_notion_sync from "../all_notion_sync.js";
import type * as auth from "../auth.js";
import type * as auth_helpers from "../auth_helpers.js";
import type * as calendar_api from "../calendar_api.js";
import type * as classroom from "../classroom.js";
import type * as coach from "../coach.js";
import type * as dev_sync from "../dev_sync.js";
import type * as exercises from "../exercises.js";
import type * as functions_auth from "../functions/auth.js";
import type * as functions_recipes from "../functions/recipes.js";
import type * as http from "../http.js";
import type * as internal_adminAuthReset from "../internal/adminAuthReset.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_fitnessExercises from "../lib/fitnessExercises.js";
import type * as lib_sharedHelpers from "../lib/sharedHelpers.js";
import type * as llm_aiHttp from "../llm/aiHttp.js";
import type * as llm_config from "../llm/config.js";
import type * as llm_errors from "../llm/errors.js";
import type * as llm_openaiCompat from "../llm/openaiCompat.js";
import type * as meals from "../meals.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as notion from "../notion.js";
import type * as notionInternal from "../notionInternal.js";
import type * as profiles from "../profiles.js";
import type * as programs from "../programs.js";
import type * as progress from "../progress.js";
import type * as schema_calendar from "../schema_calendar.js";
import type * as schema_calendar_events from "../schema_calendar_events.js";
import type * as seed from "../seed.js";
import type * as services_notionService from "../services/notionService.js";
import type * as social from "../social.js";
import type * as stats from "../stats.js";
import type * as tables_coachClientRelationships from "../tables/coachClientRelationships.js";
import type * as tables_profiles from "../tables/profiles.js";
import type * as test_internal_harness from "../test_internal_harness.js";
import type * as trainerExercises from "../trainerExercises.js";
import type * as trainers from "../trainers.js";
import type * as userPlans from "../userPlans.js";
import type * as workouts from "../workouts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  aiChat: typeof aiChat;
  ai_calendar: typeof ai_calendar;
  all_notion_sync: typeof all_notion_sync;
  auth: typeof auth;
  auth_helpers: typeof auth_helpers;
  calendar_api: typeof calendar_api;
  classroom: typeof classroom;
  coach: typeof coach;
  dev_sync: typeof dev_sync;
  exercises: typeof exercises;
  "functions/auth": typeof functions_auth;
  "functions/recipes": typeof functions_recipes;
  http: typeof http;
  "internal/adminAuthReset": typeof internal_adminAuthReset;
  "lib/auth": typeof lib_auth;
  "lib/fitnessExercises": typeof lib_fitnessExercises;
  "lib/sharedHelpers": typeof lib_sharedHelpers;
  "llm/aiHttp": typeof llm_aiHttp;
  "llm/config": typeof llm_config;
  "llm/errors": typeof llm_errors;
  "llm/openaiCompat": typeof llm_openaiCompat;
  meals: typeof meals;
  messages: typeof messages;
  notifications: typeof notifications;
  notion: typeof notion;
  notionInternal: typeof notionInternal;
  profiles: typeof profiles;
  programs: typeof programs;
  progress: typeof progress;
  schema_calendar: typeof schema_calendar;
  schema_calendar_events: typeof schema_calendar_events;
  seed: typeof seed;
  "services/notionService": typeof services_notionService;
  social: typeof social;
  stats: typeof stats;
  "tables/coachClientRelationships": typeof tables_coachClientRelationships;
  "tables/profiles": typeof tables_profiles;
  test_internal_harness: typeof test_internal_harness;
  trainerExercises: typeof trainerExercises;
  trainers: typeof trainers;
  userPlans: typeof userPlans;
  workouts: typeof workouts;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
