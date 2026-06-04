import type {
  PlaneConfig,
  PlaneWorkItem,
  PlaneState,
  PlaneComment,
  PlanePaginatedResponse,
} from "./types.js";

const DEFAULT_BASE_URL = "http://10.0.0.112:3300/api/v1/";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const RETRY_DELAYS = [1000, 2000, 4000];

export class PlaneClient {
  private config: PlaneConfig;
  private requestTimestamps: number[] = [];

  constructor(config: PlaneConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    return this.config.base_url.replace(/\/+$/, "/");
  }

  private get headers(): Record<string, string> {
    return {
      "X-API-Key": this.config.api_key,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private workItemsPath(): string {
    return `${this.baseUrl}workspaces/${this.config.workspace_slug}/projects/${this.config.project_id}/issues/`;
  }

  private workItemPath(id: string): string {
    return `${this.workItemsPath()}${id}/`;
  }

  private statesPath(): string {
    return `${this.baseUrl}workspaces/${this.config.workspace_slug}/projects/${this.config.project_id}/states/`;
  }

  private statePath(id: string): string {
    return `${this.statesPath()}${id}/`;
  }

  private commentsPath(workItemId: string): string {
    return `${this.workItemPath(workItemId)}comments/`;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS
    );
    if (this.requestTimestamps.length >= RATE_LIMIT_MAX) {
      const oldest = this.requestTimestamps[0];
      const waitMs = RATE_LIMIT_WINDOW_MS - (now - oldest) + 100;
      await this.delay(waitMs);
    }
    this.requestTimestamps.push(Date.now());
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.enforceRateLimit();

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.headers, ...(options.headers as Record<string, string>) },
      });

      if (response.ok) {
        if (response.status === 204) return undefined as T;
        return response.json() as Promise<T>;
      }

      const isRetryable = response.status === 429 || response.status >= 500;
      if (!isRetryable || attempt === RETRY_DELAYS.length) {
        const body = await response.text().catch(() => "");
        throw new PlaneApiError(
          `Plane API ${response.status} for ${options.method || "GET"} ${url}`,
          response.status,
          body
        );
      }

      const retryAfter = response.headers.get("Retry-After");
      const waitMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : RETRY_DELAYS[attempt];
      await this.delay(waitMs);
    }

    throw new PlaneApiError("Exhausted retries", 0, "");
  }

  async listWorkItems(params?: {
    state?: string;
    expand?: string;
    per_page?: number;
    cursor?: string;
  }): Promise<PlanePaginatedResponse<PlaneWorkItem>> {
    const url = new URL(this.workItemsPath());
    if (params?.state) url.searchParams.set("state", params.state);
    if (params?.expand) url.searchParams.set("expand", params.expand);
    if (params?.per_page)
      url.searchParams.set("per_page", String(params.per_page));
    if (params?.cursor) url.searchParams.set("cursor", params.cursor);
    return this.request<PlanePaginatedResponse<PlaneWorkItem>>(
      url.toString()
    );
  }

  async listAllWorkItems(params?: {
    state?: string;
    expand?: string;
    per_page?: number;
  }): Promise<PlaneWorkItem[]> {
    const all: PlaneWorkItem[] = [];
    let cursor: string | undefined;

    do {
      const page = await this.listWorkItems({
        ...params,
        cursor,
        per_page: params?.per_page ?? 50,
      });
      all.push(...page.results);
      cursor = page.next_cursor ?? undefined;
    } while (cursor);

    return all;
  }

  async getWorkItem(id: string, expand?: string): Promise<PlaneWorkItem> {
    const url = new URL(this.workItemPath(id));
    if (expand) url.searchParams.set("expand", expand);
    return this.request<PlaneWorkItem>(url.toString());
  }

  async getWorkItemByIdentifier(
    identifier: string
  ): Promise<PlaneWorkItem | null> {
    const url = new URL(this.workItemsPath());
    const [, seqStr] = identifier.split("-");
    const sequenceId = parseInt(seqStr, 10);
    if (isNaN(sequenceId)) return null;
    url.searchParams.set("sequence_id", String(sequenceId));
    const result = await this.request<PlanePaginatedResponse<PlaneWorkItem>>(
      url.toString()
    );
    return result.results[0] ?? null;
  }

  async updateWorkItem(
    id: string,
    data: Partial<Pick<PlaneWorkItem, "state" | "priority" | "assignees" | "name" | "description_html" | "start_date" | "target_date">>
  ): Promise<PlaneWorkItem> {
    return this.request<PlaneWorkItem>(this.workItemPath(id), {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async listStates(): Promise<PlaneState[]> {
    const url = new URL(this.statesPath());
    const result = await this.request<PlanePaginatedResponse<PlaneState>>(
      url.toString()
    );
    let cursor = result.next_cursor;
    const all = [...result.results];

    while (cursor) {
      const nextUrl = new URL(this.statesPath());
      nextUrl.searchParams.set("cursor", cursor);
      const page = await this.request<PlanePaginatedResponse<PlaneState>>(
        nextUrl.toString()
      );
      all.push(...page.results);
      cursor = page.next_cursor;
    }

    return all;
  }

  async getState(id: string): Promise<PlaneState> {
    return this.request<PlaneState>(this.statePath(id));
  }

  async createComment(
    workItemId: string,
    commentHtml: string
  ): Promise<PlaneComment> {
    return this.request<PlaneComment>(this.commentsPath(workItemId), {
      method: "POST",
      body: JSON.stringify({ comment_html: commentHtml }),
    });
  }

  async listComments(workItemId: string): Promise<PlaneComment[]> {
    const url = new URL(this.commentsPath(workItemId));
    const result = await this.request<PlanePaginatedResponse<PlaneComment>>(
      url.toString()
    );
    let cursor = result.next_cursor;
    const all = [...result.results];

    while (cursor) {
      const nextUrl = new URL(this.commentsPath(workItemId));
      nextUrl.searchParams.set("cursor", cursor);
      const page = await this.request<PlanePaginatedResponse<PlaneComment>>(
        nextUrl.toString()
      );
      all.push(...page.results);
      cursor = page.next_cursor;
    }

    return all;
  }
}

export class PlaneApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string
  ) {
    super(message);
    this.name = "PlaneApiError";
  }
}
