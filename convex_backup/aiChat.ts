"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { requireIdentity } from "./lib/auth";
import { executeAIHttpRequest } from "./llm/aiHttp";


const AI_BOT_ID = "__ai__";

const providerIdValidator = v.optional(v.union(v.literal("openrouter"), v.literal("zai"), v.literal("openai")));

type ChatHistoryItem = { role: "user" | "model"; text: string };

export const sendTrainerChatMessage = action({
  args: {
    message: v.string(),
    providerId: providerIdValidator,
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const userMessage = args.message.trim();
    if (!userMessage) return { reply: "" };

    await ctx.runMutation(api.messages.sendMessage, {
      receiverId: AI_BOT_ID,
      content: userMessage,
    });

    const recent = await ctx.runQuery(api.messages.getConversationTail, {
      otherId: AI_BOT_ID,
      limit: 30,
    });

    const chatHistory: ChatHistoryItem[] = (recent as Array<{ senderId: string; content: string }>).map((m) => ({
      role: m.senderId === AI_BOT_ID ? "model" : "user",
      text: m.content,
    }));

    // Avoid duplicating the user's latest message (already persisted).
    const last = chatHistory[chatHistory.length - 1];
    const historyWithoutLast =
      last && last.role === "user" && last.text === userMessage ? chatHistory.slice(0, -1) : chatHistory;

    const aiResult = await executeAIHttpRequest(process.env, {
      kind: "trainerChat",
      providerId: args.providerId,
      chatHistory: historyWithoutLast,
      userMessage,
    });

    if (aiResult.ok === false) {
      throw new Error(`${aiResult.error.code}: ${aiResult.error.message}`);
    }

    if (aiResult.data.kind !== "trainerChat") {
      throw new Error("AI returned unexpected response kind.");
    }

    const reply = (aiResult.data.text || "").trim();
    if (!reply) return { reply: "" };

    await ctx.runMutation(api.messages.insertAiReply, { content: reply });
    return { reply };
  },
});
