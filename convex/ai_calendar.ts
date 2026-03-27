"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { requireIdentity } from "./lib/auth";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * AI Chat with Calendar and Exercise Management Tools
 */

const AI_BOT_ID = "__ai__";

type ChatHistoryItem = { role: "user" | "model"; text: string };

export const sendTrainerCalendarChat = action({
  args: {
    message: v.string(),
    clientId: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    // Get the Convex user ID
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Find the profile of the current user (the coach)
    const coachProfile = await ctx.runQuery(api.tables.profiles.getProfileByUserId, {
      userId: userId,
    });
    if (!coachProfile) throw new Error("Coach profile not found");

    const userMessage = args.message.trim();
    if (!userMessage) return { reply: "" };

    // Store user message
    await ctx.runMutation(api.messages.sendMessage, {
      receiverId: AI_BOT_ID,
      content: userMessage,
    });

    // Get conversation history
    const recent = await ctx.runQuery(api.messages.getConversationTail, {
      otherId: AI_BOT_ID,
      limit: 30,
    });

    const chatHistory: ChatHistoryItem[] = (recent as Array<{ senderId: string; content: string }>).map((m) => ({
      role: m.senderId === AI_BOT_ID ? "model" : "user",
      text: m.content,
    }));

    const last = chatHistory[chatHistory.length - 1];
    const historyWithoutLast =
      last && last.role === "user" && last.text === userMessage ? chatHistory.slice(0, -1) : chatHistory;

    // Fetch exercises for context
    const allExercises = await ctx.runQuery(api.exercises.fetchExercises);
    // Fetch relationship and events if clientId provided
    let relationship = null;
    let calendarEvents: any[] = [];
    if (args.clientId) {
      relationship = await ctx.runQuery(api.tables.coachClientRelationships.getRelationship, {
        coachId: coachProfile._id,
        clientId: args.clientId,
      });

      if (relationship) {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).getTime();
        calendarEvents = await ctx.runQuery(api.calendar_api.listEvents, {
          relationshipId: relationship._id,
          start: startOfMonth,
          end: endOfMonth,
        });
      }
    }

    // AI Call
    const aiResult = await ctx.runAction(internal.llm.aiHttp.executeAIAction, {
      kind: "trainerCalendarChat",
      chatHistory: historyWithoutLast,
      userMessage,
      systemPrompt: `You are an expert trainer AI. You have access to the client's calendar in the database.
When the user asks to "implement" or "add to calendar", you MUST use the tools:
- create_calendar_event: for individual workouts
- batch_create_calendar_events: for multiple days or a whole program
- create_exercise: if a required exercise is missing from the library

IMPORTANT: Do not just say "Program updated". You must actually call the tools to write to the database.
The calendar is currently EMPTY until you call create_calendar_event.

Context:
- Today is ${new Date().toDateString()}
- Coach: ${coachProfile.fullName || coachProfile.email}
- Client Profile: ${args.clientId || "None selected"}
- Available Exercises: ${allExercises.map(e => e.name).join(", ")}
`,
      allExercises,
      calendarEvents,
    });

    if (aiResult.ok === false) {
      throw new Error(`${aiResult.error.code}: ${aiResult.error.message}`);
    }

    if (aiResult.data.kind !== "trainerCalendarChat") {
      throw new Error("AI returned unexpected response kind.");
    }

    // Process Tool Calls
    if (aiResult.data.toolCalls && aiResult.data.toolCalls.length > 0) {
      for (const call of aiResult.data.toolCalls) {
        const { name, args: toolArgs } = call;
        const anyArgs = toolArgs as any;

        if (name === "create_calendar_event" && relationship && args.clientId) {
          await ctx.runMutation(api.calendar_api.createEvent, {
            relationshipId: relationship._id,
            date: anyArgs.date || Date.now(),
            eventType: anyArgs.eventType || "workout",
            title: anyArgs.title,
            description: anyArgs.description,
            status: "scheduled",
            assignedBy: coachProfile._id,
            assignedTo: args.clientId,
            exercises: anyArgs.exercises,
          });
        } else if (name === "batch_create_calendar_events" && relationship && args.clientId) {
          for (const event of anyArgs.events) {
            await ctx.runMutation(api.calendar_api.createEvent, {
              relationshipId: relationship._id,
              date: event.date,
              eventType: event.eventType || "workout",
              title: event.title,
              description: event.description,
              status: "scheduled",
              assignedBy: coachProfile._id,
              assignedTo: args.clientId,
              exercises: event.exercises,
            });
          }
        } else if (name === "update_calendar_event") {
          await ctx.runMutation(api.calendar_api.updateEvent, {
            eventId: anyArgs.eventId,
            updates: anyArgs,
          });
        } else if (name === "delete_calendar_event") {
          await ctx.runMutation(api.calendar_api.deleteEvent, {
            eventId: anyArgs.eventId,
          });
        } else if (name === "create_exercise") {
          await ctx.runMutation(api.exercises.addExercise, {
            ...anyArgs,
            libraryId: anyArgs.libraryId || `ai-${Date.now()}`,
          });
        }
      }
    }

    const reply = (aiResult.data.text || "").trim();
    if (reply) {
      await ctx.runMutation(api.messages.insertAiReply, { content: reply });
    }

    return { reply };
  },
});
