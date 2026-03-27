import type { LLMProviderConfig } from "./config";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export function buildChatCompletionsRequest(
  cfg: LLMProviderConfig,
  payload: { [key: string]: JsonValue },
): { url: string; init: RequestInit } {
  const url = `${cfg.baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${cfg.apiKey}`,
    ...cfg.headers,
  };

  const body = JSON.stringify({ model: cfg.model, ...payload });

  return {
    url,
    init: {
      method: "POST",
      headers,
      body,
    },
  };
}
