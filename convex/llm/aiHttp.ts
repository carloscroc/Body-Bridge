import type { LLMEnv, LLMProviderId } from "./config";
import { resolveProviderConfig } from "./config";
import { mapUpstreamError } from "./errors";
import type { LLMProviderConfig } from "./config";
import { buildChatCompletionsRequest } from "./openaiCompat";

type ChatHistoryItem = { role: "user" | "model"; text: string };

export type AIHttpRequest =
  | { kind: "generateExercise"; providerId?: LLMProviderId; prompt: string }
  | {
      kind: "trainerChat";
      providerId?: LLMProviderId;
      chatHistory: ChatHistoryItem[];
      userMessage: string;
    }
  | {
      kind: "refineExerciseChat";
      providerId?: LLMProviderId;
      currentExercise: unknown;
      chatHistory: ChatHistoryItem[];
      userMessage: string;
    }
  | {
      kind: "refineProgramChat";
      providerId?: LLMProviderId;
      currentProgram: string;
      chatHistory: ChatHistoryItem[];
      userMessage: string;
      selectedContext?: string;
    }
  | {
      kind: "trainerCalendarChat";
      providerId?: LLMProviderId;
      chatHistory: ChatHistoryItem[];
      userMessage: string;
      systemPrompt?: string;
      allExercises?: any[];
      calendarEvents?: any[];
    }
  | {
      kind: "generateQuickReply";
      providerId?: LLMProviderId;
      messageHistory: string[];
      lastMessage: string;
    };

export type AIHttpSuccess =
  | { kind: "generateExercise"; exercise: unknown | null }
  | { kind: "trainerChat"; text: string }
  | { kind: "refineExerciseChat"; text: string; updates?: unknown }
  | { kind: "refineProgramChat"; text: string; toolCalls?: Array<{ name: string; args: unknown }> }
  | { kind: "trainerCalendarChat"; text: string; toolCalls?: Array<{ name: string; args: unknown }> }
  | { kind: "generateQuickReply"; text: string };

export type AIHttpErrorCode = "API_KEY_MISSING" | "CONFIG_INVALID" | "API_KEY_INVALID" | "RATE_LIMIT" | "UPSTREAM" | "BAD_REQUEST";

export type AIHttpError = {
  code: AIHttpErrorCode;
  message: string;
  providerId?: LLMProviderId;
};

export type AIHttpResponse = { ok: true; data: AIHttpSuccess } | { ok: false; error: AIHttpError };

const PROVIDERS: ReadonlyArray<LLMProviderId> = ["openrouter", "zai", "openai"] as const;

function isProviderId(value: unknown): value is LLMProviderId {
  return typeof value === "string" && (PROVIDERS as ReadonlyArray<string>).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function parseChatHistory(value: unknown): ChatHistoryItem[] | null {
  if (!Array.isArray(value)) return null;
  const out: ChatHistoryItem[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const role = item.role;
    const text = item.text;
    if (role !== "user" && role !== "model") return null;
    if (typeof text !== "string") return null;
    out.push({ role, text });
  }
  return out;
}

function parseProviderId(value: unknown): LLMProviderId | undefined {
  if (value === undefined) return undefined;
  return isProviderId(value) ? value : undefined;
}

function parseAIRequest(body: unknown): AIHttpRequest | null {
  if (!isRecord(body)) return null;
  const kind = body.kind;
  if (typeof kind !== "string") return null;

  if (kind === "generateExercise") {
    const prompt = getString(body.prompt);
    if (!prompt) return null;
    return { kind, prompt, providerId: parseProviderId(body.providerId) };
  }

  if (kind === "generateQuickReply") {
    const lastMessage = getString(body.lastMessage);
    const history = Array.isArray(body.messageHistory) ? body.messageHistory.map(String) : null;
    if (!lastMessage || !history) return null;
    return { kind, lastMessage, messageHistory: history, providerId: parseProviderId(body.providerId) };
  }

  if (kind === "trainerChat") {
    const userMessage = getString(body.userMessage);
    const chatHistory = parseChatHistory(body.chatHistory);
    if (!userMessage || !chatHistory) return null;
    return {
      kind,
      providerId: parseProviderId(body.providerId),
      chatHistory,
      userMessage,
    };
  }

  if (kind === "refineExerciseChat") {
    const userMessage = getString(body.userMessage);
    const chatHistory = parseChatHistory(body.chatHistory);
    if (!userMessage || !chatHistory) return null;
    return {
      kind,
      providerId: parseProviderId(body.providerId),
      currentExercise: (body as Record<string, unknown>).currentExercise,
      chatHistory,
      userMessage,
    };
  }

  if (kind === "refineProgramChat") {
    const currentProgram = typeof body.currentProgram === "string" ? body.currentProgram : "";
    const userMessage = getString(body.userMessage);
    const chatHistory = parseChatHistory(body.chatHistory);
    if (!userMessage || !chatHistory) return null;
    return {
      kind,
      providerId: parseProviderId(body.providerId),
      currentProgram,
      chatHistory,
      userMessage,
      selectedContext: getOptionalString(body.selectedContext),
    };
  }

  if (kind === "trainerCalendarChat") {
    const userMessage = getString(body.userMessage);
    const chatHistory = parseChatHistory(body.chatHistory);
    if (!userMessage || !chatHistory) return null;
    return {
      kind,
      providerId: parseProviderId(body.providerId),
      chatHistory,
      userMessage,
      systemPrompt: getOptionalString(body.systemPrompt),
      allExercises: Array.isArray(body.allExercises) ? body.allExercises : undefined,
      calendarEvents: Array.isArray(body.calendarEvents) ? body.calendarEvents : undefined,
    };
  }

  return null;
}

function extractJsonFromText(text: string): unknown | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;

  // Prefer fenced code blocks.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/u);
  const candidate = fenced?.[1]?.trim() ?? null;
  if (candidate) {
    try {
      return JSON.parse(candidate);
    } catch {
      // fallthrough
    }
  }

  // Fallback: attempt to parse the first {...} block.
  const brace = trimmed.match(/\{[\s\S]*\}/u);
  if (brace?.[0]) {
    try {
      return JSON.parse(brace[0]);
    } catch {
      return null;
    }
  }

  return null;
}

type OpenAIChatCompletion = {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: Array<{
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
  }>;
};

async function callOpenAICompatible(
  cfg: LLMProviderConfig,
  payload: Record<string, unknown>,
): Promise<OpenAIChatCompletion> {
  const req = buildChatCompletionsRequest(cfg, payload as never);
  const res = await fetch(req.url, req.init);
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    const mapped = mapUpstreamError({ status: res.status, bodyText });
    const error: AIHttpError = {
      code: mapped.code,
      message: mapped.message,
    };
    const err = new Error(JSON.stringify(error));
    (err as { _aiHttpStatus?: number })._aiHttpStatus = mapped.status;
    throw err;
  }

  const json: unknown = await res.json();
  return (json ?? {}) as OpenAIChatCompletion;
}

function getText(resp: OpenAIChatCompletion): string {
  const first = resp.choices?.[0]?.message;
  return (first?.content ?? "") || "";
}

function getToolCalls(resp: OpenAIChatCompletion): Array<{ name: string; args: unknown }> {
  const toolCalls = resp.choices?.[0]?.message?.tool_calls;
  if (!toolCalls || !Array.isArray(toolCalls)) return [];

  const parsed: Array<{ name: string; args: unknown }> = [];
  for (const tc of toolCalls) {
    const name = tc.function?.name;
    const rawArgs = tc.function?.arguments;
    if (!name || typeof name !== "string") continue;
    if (!rawArgs || typeof rawArgs !== "string") continue;
    try {
      parsed.push({ name, args: JSON.parse(rawArgs) as unknown });
    } catch {
      // ignore parse failures
    }
  }
  return parsed;
}

function resolveProviderIdFromEnv(env: LLMEnv): LLMProviderId {
  const raw = env.LLM_DEFAULT_PROVIDER?.trim();
  if (raw && isProviderId(raw)) return raw;
  return "zai";
}

export async function executeAIHttpRequest(env: LLMEnv, body: unknown): Promise<AIHttpResponse> {
  const req = parseAIRequest(body);
  if (!req) {
    return { ok: false, error: { code: "BAD_REQUEST", message: "Invalid request shape." } };
  }

  const mockEnabledRaw = env.LLM_MOCK?.trim().toLowerCase();
  const mockEnabled = mockEnabledRaw === "1" || mockEnabledRaw === "true";
  if (mockEnabled) {
    if (req.kind === "generateExercise") {
      return {
        ok: true,
        data: {
          kind: "generateExercise",
          exercise: {
            name: "Goblet Squat",
            muscleGroup: "Legs",
            difficulty: "Beginner",
            instructions: [
              "Hold a dumbbell or kettlebell at chest height.",
              "Sit hips back and down, keeping your chest tall.",
              "Drive through mid-foot to stand."
            ],
            equipment: ["dumbbell"],
            sets: "3",
            reps: "10",
            videoUrl: null,
            tags: ["strength", "squat"],
          },
        },
      };
    }

    if (req.kind === "generateQuickReply") {
      return {
        ok: true,
        data: {
          kind: "generateQuickReply",
          text: "Hello! Quick question: how did the last session feel (RPE 1-10)?",
        },
      };
    }

    if (req.kind === "trainerChat") {
      return {
        ok: true,
        data: {
          kind: "trainerChat",
          text: "Hey! What are you training today, and what equipment do you have available?",
        },
      };
    }

    if (req.kind === "refineExerciseChat") {
      return {
        ok: true,
        data: {
          kind: "refineExerciseChat",
          text: "Got it. Tell me what you want to change (sets/reps/rest/tempo/instructions), and I'll update the card.",
          updates: undefined,
        },
      };
    }

    if (req.kind === "refineProgramChat") {
      return {
        ok: true,
        data: {
          kind: "refineProgramChat",
          text: "Understood. What is the primary goal (strength, hypertrophy, conditioning), and how many days/week can they train?",
          toolCalls: [],
        },
      };
    }

    if (req.kind === "trainerCalendarChat") {
      return {
        ok: true,
        data: {
          kind: "trainerCalendarChat",
          text: "I've added your Volleyball Vertical Jump program to your plan! Check the calendar to see the specific workouts.",
          toolCalls: [
            {
              name: "batch_create_calendar_events",
              args: {
                events: [
                  { title: "Volleyball Jump Power", date: Date.now(), eventType: "workout", exercises: [{ name: "Box Jumps", sets: "3", reps: "10" }] }
                ]
              }
            }
          ],
        },
      };
    }
  }

  const providerId = req.providerId ?? resolveProviderIdFromEnv(env);
  if (!isProviderId(providerId)) {
    return { ok: false, error: { code: "BAD_REQUEST", message: "Invalid providerId." } };
  }

  const cfgResult = resolveProviderConfig(providerId, env);
  if (cfgResult.ok === false) {
    return {
      ok: false,
      error: {
        code: cfgResult.error.code,
        message: cfgResult.error.message,
        providerId: cfgResult.error.providerId,
      },
    };
  }

  const cfg = cfgResult.config;

  try {
    if (req.kind === "generateExercise") {
      const instruction = `Create a new exercise based on this description: "${req.prompt}".\nReturn a JSON object with fields: name, muscleGroup, difficulty (Beginner/Intermediate/Advanced), instructions (array of strings), equipment (array of strings), sets (string), reps (string), videoUrl (string or null), tags (array of strings).`;
      const resp = await callOpenAICompatible(cfg, {
        messages: [
          { role: "system", content: "You are an expert fitness librarian. You must respond with valid JSON only." },
          { role: "user", content: instruction },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const text = getText(resp);
      const parsed = extractJsonFromText(text) ?? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      })();
      return { ok: true, data: { kind: "generateExercise", exercise: parsed } };
    }

    if (req.kind === "trainerChat") {
      const systemInstruction =
        "You are Apex AI, a pragmatic assistant for a personal trainer. " +
        "Help with coaching, client communication, workout programming, exercise technique, and habit adherence. " +
        "Be concise, actionable, and safety-aware. If asked for medical advice, recommend a qualified professional.";

      const messages = [
        { role: "system", content: systemInstruction },
        ...req.chatHistory.map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.text })),
        { role: "user", content: req.userMessage },
      ];

      const resp = await callOpenAICompatible(cfg, {
        messages,
        temperature: 0.4,
        max_tokens: 500,
      });

      return { ok: true, data: { kind: "trainerChat", text: getText(resp).trim() } };
    }

    if (req.kind === "generateQuickReply") {
      const history = req.messageHistory && req.messageHistory.length > 0 ? req.messageHistory.join("\n") : "";
      const prompt = `You are a helpful personal trainer assistant.\nHistory:\n${history}\nUser: ${req.lastMessage}\n\nDraft a short, professional, encouraging reply (<= 50 words).`;
      const resp = await callOpenAICompatible(cfg, {
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 150,
      });
      return { ok: true, data: { kind: "generateQuickReply", text: getText(resp).trim() } };
    }

    if (req.kind === "refineExerciseChat") {
      const systemInstruction = `You are an expert fitness librarian. You are helping a trainer edit an exercise card.\n\nCurrent Exercise Data:\n${JSON.stringify(req.currentExercise, null, 2)}\n\nIf the trainer asks to change something, include the updated exercise fields in your response as a JSON block or using the update_exercise_form tool if available.`;

      const messages = [
        { role: "system", content: systemInstruction },
        ...req.chatHistory.map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.text })),
        { role: "user", content: req.userMessage },
      ];

      const tools = [
        {
          type: "function",
          function: {
            name: "update_exercise_form",
            description: "Update fields in the exercise form.",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                muscleGroup: { type: "string" },
                difficulty: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] },
                instructions: { type: "array", items: { type: "string" } },
                equipment: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
                sets: { type: "string" },
                reps: { type: "string" },
                tempo: { type: "string" },
                rest: { type: "string" },
                primaryMuscles: { type: "array", items: { type: "string" } },
                secondaryMuscles: { type: "array", items: { type: "string" } },
                videoUrl: { type: "string" },
              },
            },
          },
        },
      ];

      const resp = await callOpenAICompatible(cfg, {
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.3,
      });

      const text = getText(resp);
      const toolCalls = getToolCalls(resp);
      const fromTool = toolCalls.find((t) => t.name === "update_exercise_form")?.args;
      const updates = fromTool ?? extractJsonFromText(text) ?? undefined;

      return { ok: true, data: { kind: "refineExerciseChat", text, updates } };
    }

    if (req.kind === "refineProgramChat") {
      const contextInstruction = req.selectedContext ? `Refining part: "${req.selectedContext}".` : "Refining entire program.";
      const systemInstruction = `You are a fitness program architect.\n\nCurrent Program:\n${req.currentProgram || "(Empty)"}\n\nContext: ${contextInstruction}\nGoal: Update program or discuss changes.\nIf updating, provide the FULL markdown content via the update_program tool.`;

      const messages = [
        { role: "system", content: systemInstruction },
        ...req.chatHistory.map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.text })),
        { role: "user", content: req.userMessage },
      ];

      const tools = [
        {
          type: "function",
          function: {
            name: "update_program",
            description: "Update the workout program content.",
            parameters: {
              type: "object",
              properties: {
                content: { type: "string" },
                title: { type: "string" },
              },
              required: ["content"],
            },
          },
        },
      ];

      const resp = await callOpenAICompatible(cfg, {
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.3,
      });

      const text = getText(resp);
      const toolCalls = getToolCalls(resp);

      // Fallback: JSON block in the text.
      let mergedCalls = toolCalls;
      if (mergedCalls.length === 0) {
        const json = extractJsonFromText(text);
        const update = (json && typeof json === "object" && "update_program" in (json as Record<string, unknown>))
          ? (json as Record<string, unknown>).update_program
          : json;
        if (update) mergedCalls = [{ name: "update_program", args: update }];
      }

      return { ok: true, data: { kind: "refineProgramChat", text, toolCalls: mergedCalls } };
    }

    if (req.kind === "trainerCalendarChat") {
      const systemInstruction = req.systemPrompt || "You are Apex AI, a pragmatic assistant for a personal trainer. Help with coaching, workout planning, exercise programming, and calendar management. You have access to the exercise library and calendar events.";
      const messages = [
        { role: "system", content: systemInstruction },
        ...req.chatHistory.map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.text })),
        { role: "user", content: req.userMessage },
      ];

      const tools = [
        {
          type: "function",
          function: {
            name: "list_exercises",
            description: "List all available exercises in the library",
            parameters: {
              type: "object",
              properties: {
                filter: { type: "string", description: "Optional filter (e.g., 'chest', 'legs', 'push')" },
              },
            },
          },
        },
        {
          type: "function",
          function: {
            name: "check_exercise_exists",
            description: "Check if an exercise exists in the library",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Exercise name to check" },
              },
              required: ["name"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "create_exercise",
            description: "Create a new exercise in the library",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                muscleGroup: { type: "string" },
                difficulty: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] },
                equipment: { type: "array", items: { type: "string" } },
                sets: { type: "string" },
                reps: { type: "string" },
                instructions: { type: "array", items: { type: "string" } },
                category: { type: "string" },
              },
              required: ["name", "muscleGroup", "difficulty"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "create_calendar_event",
            description: "Create a calendar event with exercises",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                start: { type: "string" },
                end: { type: "string" },
                programType: { type: "string", enum: ["Workout A", "Workout B", "Cardio", "Yoga", "Rest", "Flexibility"] },
                exercises: { type: "array", items: { type: "object" } },
                duration: { type: "number" },
                intensity: { type: "string", enum: ["Easy", "Medium", "Hard", "Extreme"] },
              },
              required: ["title", "start", "end", "programType"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "update_calendar_event",
            description: "Update an existing calendar event",
            parameters: {
              type: "object",
              properties: {
                eventId: { type: "string", description: "Calendar event ID to update" },
                title: { type: "string" },
                start: { type: "string" },
                end: { type: "string" },
                exercises: { type: "array", items: { type: "object" } },
              },
              required: ["eventId"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "delete_calendar_event",
            description: "Delete a calendar event",
            parameters: {
              type: "object",
              properties: {
                eventId: { type: "string", description: "Calendar event ID to delete" },
              },
              required: ["eventId"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "batch_create_calendar_events",
            description: "Create multiple calendar events at once",
            parameters: {
              type: "object",
              properties: {
                events: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      date: { type: "number", description: "Timestamp in milliseconds" },
                      eventType: { type: "string", enum: ["workout", "meal", "rest", "other"] },
                      exercises: { type: "array", items: { type: "object" } },
                      description: { type: "string" },
                    },
                    required: ["title", "date", "eventType"],
                  },
                },
              },
              required: ["events"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "list_calendar_events",
            description: "List calendar events for a date range",
            parameters: {
              type: "object",
              properties: {
                start: { type: "string", description: "ISO date string" },
                end: { type: "string", description: "ISO date string" },
              },
              required: ["start", "end"],
            },
          },
        },
      ];

      const resp = await callOpenAICompatible(cfg, {
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.3,
      });

      const text = getText(resp);
      const toolCalls = getToolCalls(resp);

      return { ok: true, data: { kind: "trainerCalendarChat", text, toolCalls } };
    }

    return { ok: false, error: { code: "BAD_REQUEST", message: "Unsupported request kind." } };
  } catch (e) {
    if (e instanceof Error) {
      try {
        const parsed = JSON.parse(e.message) as AIHttpError;
        if (parsed && typeof parsed === "object" && typeof parsed.code === "string") {
          return { ok: false, error: parsed };
        }
      } catch {
        // ignore
      }
    }

    return { ok: false, error: { code: "UPSTREAM", message: e instanceof Error ? e.message : "AI request failed." } };
  }
}

// Convex Internal Action for AI requests
import { internalAction } from "../_generated/server";
import { v } from "convex/values";

export const executeAIAction = internalAction({
  args: {
    kind: v.string(),
    providerId: v.optional(v.string()),
    chatHistory: v.optional(v.array(v.object({ role: v.string(), text: v.string() }))),
    userMessage: v.string(),
    systemPrompt: v.optional(v.string()),
    allExercises: v.optional(v.array(v.any())),
    calendarEvents: v.optional(v.array(v.any())),
    currentExercise: v.optional(v.any()),
    currentProgram: v.optional(v.string()),
    selectedContext: v.optional(v.string()),
    messageHistory: v.optional(v.array(v.string())),
    lastMessage: v.optional(v.string()),
    prompt: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ ok: v.literal(true), data: v.any() }),
    v.object({ ok: v.literal(false), error: v.any() })
  ),
  handler: async (ctx, args) => {
    return await executeAIHttpRequest(process.env as any, args);
  },
});
