export type LLMProviderId = "openrouter" | "zai" | "openai";

export type LLMEnv = Record<string, string | undefined>;

export type LLMProviderConfig = {
  providerId: LLMProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
  headers: Record<string, string>;
};

export type LLMConfigErrorCode = "API_KEY_MISSING" | "CONFIG_INVALID";

export type LLMConfigResult =
  | { ok: true; config: LLMProviderConfig }
  | {
      ok: false;
      error: {
        code: LLMConfigErrorCode;
        providerId: LLMProviderId;
        message: string;
      };
    };

function nonEmpty(value: string | undefined): string | null {
  const v = value?.trim();
  return v && v.length > 0 ? v : null;
}

function hasControlChars(value: string): boolean {
  // Disallow CR/LF and other control chars to avoid header injection.
  return /[\u0000-\u001f\u007f]/u.test(value);
}

function safeHeaderValue(value: string, maxLen = 200): string | null {
  const v = value.trim();
  if (v.length === 0) return null;
  if (v.length > maxLen) return null;
  if (hasControlChars(v)) return null;
  return v;
}

function isValidIpv4(hostname: string): boolean {
  const parts = hostname.split(".");
  if (parts.length !== 4) return false;
  for (const p of parts) {
    if (!/^\d{1,3}$/u.test(p)) return false;
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) return false;
  }
  return true;
}

function isPrivateIpv4(hostname: string): boolean {
  if (!isValidIpv4(hostname)) return false;
  const [a, b] = hostname.split(".").map((p) => Number(p));

  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

function isClearlyPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "::1") return true;
  if (h.endsWith(".local")) return true;
  if (h.includes(":")) {
    // Heuristic: block link-local and ULA ranges.
    if (h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
    return false;
  }
  return isPrivateIpv4(h);
}

function validateBaseUrl(args: {
  providerId: LLMProviderId;
  raw: string;
  allowHttp: boolean;
  requireHostSuffix?: string;
}): { ok: true; baseUrl: string } | { ok: false; message: string } {
  let url: URL;
  try {
    url = new URL(args.raw);
  } catch {
    return { ok: false, message: `Invalid base URL for ${args.providerId}.` };
  }

  if (url.username || url.password) {
    return { ok: false, message: `Base URL for ${args.providerId} must not include credentials.` };
  }

  if (url.protocol !== "https:" && !(args.allowHttp && url.protocol === "http:")) {
    return { ok: false, message: `Base URL for ${args.providerId} must use https.` };
  }

  const hostname = url.hostname;
  if (isClearlyPrivateHostname(hostname)) {
    return { ok: false, message: `Base URL for ${args.providerId} must not target localhost or private networks.` };
  }

  if (args.requireHostSuffix) {
    const suffix = args.requireHostSuffix.toLowerCase();
    if (!hostname.toLowerCase().endsWith(suffix)) {
      return { ok: false, message: `Base URL for ${args.providerId} must be on ${args.requireHostSuffix}.` };
    }
  }

  return { ok: true, baseUrl: normalizeBaseUrl(url.toString()) };
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/u, "");
}

export function resolveProviderConfig(providerId: LLMProviderId, env: LLMEnv): LLMConfigResult {
  const allowHttp = nonEmpty(env.LLM_ALLOW_INSECURE_HTTP) === "1" || nonEmpty(env.LLM_ALLOW_INSECURE_HTTP)?.toLowerCase() === "true";

  if (providerId === "openrouter") {
    const apiKey = nonEmpty(env.OPENROUTER_API_KEY);
    if (!apiKey) {
      return {
        ok: false,
        error: {
          code: "API_KEY_MISSING",
          providerId,
          message: 'Missing API key for OpenRouter. Set OPENROUTER_API_KEY in your server environment.',
        },
      };
    }

    const baseUrlRaw = nonEmpty(env.OPENROUTER_BASE_URL) ?? "https://api.openrouter.ai/v1";
    const baseUrlValidated = validateBaseUrl({ providerId, raw: baseUrlRaw, allowHttp, requireHostSuffix: "openrouter.ai" });
    if (baseUrlValidated.ok === false) {
      return {
        ok: false,
        error: { code: "CONFIG_INVALID", providerId, message: `${baseUrlValidated.message} Set OPENROUTER_BASE_URL to https://api.openrouter.ai/v1.` },
      };
    }
    const baseUrl = baseUrlValidated.baseUrl;

    const model = nonEmpty(env.OPENROUTER_MODEL) ?? "openai/gpt-4o-mini";

    const headers: Record<string, string> = {};
    const siteUrlRaw = nonEmpty(env.OPENROUTER_SITE_URL);
    if (siteUrlRaw) {
      try {
        const parsed = new URL(siteUrlRaw);
        if (!parsed.username && !parsed.password) {
          const safe = safeHeaderValue(parsed.toString(), 300);
          if (safe) headers["HTTP-Referer"] = safe;
        }
      } catch {
        // ignore invalid optional header
      }
    }

    const appNameRaw = nonEmpty(env.OPENROUTER_APP_NAME);
    if (appNameRaw) {
      const safe = safeHeaderValue(appNameRaw, 120);
      if (safe) headers["X-Title"] = safe;
    }

    return { ok: true, config: { providerId, apiKey, baseUrl, model, headers } };
  }

  if (providerId === "zai") {
    const apiKey = nonEmpty(env.ZAI_API_KEY) ?? nonEmpty(env.GLM_API_KEY);
    if (!apiKey) {
      return {
        ok: false,
        error: {
          code: "API_KEY_MISSING",
          providerId,
          message: 'Missing API key for Z.AI. Set ZAI_API_KEY (or GLM_API_KEY) in your server environment.',
        },
      };
    }

    const baseUrlRaw = nonEmpty(env.ZAI_BASE_URL) ?? nonEmpty(env.GLM_BASE_URL) ?? "https://api.z.ai/api/paas/v4";
    const baseUrlValidated = validateBaseUrl({ providerId, raw: baseUrlRaw, allowHttp, requireHostSuffix: "z.ai" });
    if (baseUrlValidated.ok === false) {
      return {
        ok: false,
        error: { code: "CONFIG_INVALID", providerId, message: `${baseUrlValidated.message} Set ZAI_BASE_URL to https://api.z.ai/api/paas/v4.` },
      };
    }
    const baseUrl = baseUrlValidated.baseUrl;

    const model = nonEmpty(env.ZAI_MODEL) ?? nonEmpty(env.GLM_MODEL) ?? "glm-4.7";

    return { ok: true, config: { providerId, apiKey, baseUrl, model, headers: {} } };
  }

  // providerId === "openai" (generic OpenAI-compatible)
  const apiKey = nonEmpty(env.LLM_API_KEY);
  if (!apiKey) {
    return {
      ok: false,
      error: {
        code: "API_KEY_MISSING",
        providerId,
        message: 'Missing API key for OpenAI-compatible provider. Set LLM_API_KEY in your server environment.',
      },
    };
  }

  const baseUrlRaw = nonEmpty(env.LLM_BASE_URL);
  if (!baseUrlRaw) {
    return {
      ok: false,
      error: {
        code: "CONFIG_INVALID",
        providerId,
        message: 'Missing base URL for OpenAI-compatible provider. Set LLM_BASE_URL (for example, https://api.openai.com/v1).',
      },
    };
  }

  const baseUrlValidated = validateBaseUrl({ providerId, raw: baseUrlRaw, allowHttp });
  if (baseUrlValidated.ok === false) {
    return {
      ok: false,
      error: {
        code: "CONFIG_INVALID",
        providerId,
        message: `${baseUrlValidated.message} Set LLM_BASE_URL (for example, https://api.openai.com/v1).`,
      },
    };
  }

  const baseUrl = baseUrlValidated.baseUrl;
  const model = nonEmpty(env.LLM_MODEL) ?? "gpt-4o-mini";

  return { ok: true, config: { providerId, apiKey, baseUrl, model, headers: {} } };
}
