export type AIErrorCode = "API_KEY_INVALID" | "RATE_LIMIT" | "UPSTREAM";

export type MappedError = {
  status: number;
  code: AIErrorCode;
  message: string;
};

export function mapUpstreamError(args: { status: number; bodyText: string }): MappedError {
  const body = args.bodyText.trim();

  // Best-effort: extract a human message from JSON error bodies.
  let extractedMessage: string | null = null;
  if (body && !body.startsWith("<")) {
    try {
      const parsed = JSON.parse(body) as unknown;
      if (parsed && typeof parsed === "object") {
        const p = parsed as Record<string, unknown>;
        const msg = typeof p.message === "string" ? p.message : null;
        const err = p.error && typeof p.error === "object" ? (p.error as Record<string, unknown>) : null;
        const errMsg = err && typeof err.message === "string" ? err.message : null;
        extractedMessage = errMsg ?? msg;
      }
    } catch {
      // ignore
    }
  }

  // If upstream returned HTML, keep it short and actionable.
  if (body.startsWith("<")) {
    extractedMessage = "Upstream returned an HTML error response. Check provider base URL and endpoint.";
  }

  const message = extractedMessage ?? (body.length > 0 ? body : `Upstream request failed (${args.status}).`);

  if (args.status === 401 || args.status === 403) {
    return {
      status: args.status,
      code: "API_KEY_INVALID",
      message,
    };
  }

  if (args.status === 429) {
    return {
      status: args.status,
      code: "RATE_LIMIT",
      message,
    };
  }

  return {
    status: args.status,
    code: "UPSTREAM",
    message,
  };
}
