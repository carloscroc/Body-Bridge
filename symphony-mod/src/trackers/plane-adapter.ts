import type {
  PlaneConfig,
  PlaneWorkItem,
  PlaneState,
  SymphonyIssue,
  TrackerAdapter,
} from "./types.js";
import { PlaneClient } from "./plane-client.js";

declare const process:
  | {
      env: Record<string, string | undefined>;
    }
  | undefined;

const PRIORITY_MAP: Record<string, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export class PlaneAdapter implements TrackerAdapter {
  private client: PlaneClient;
  private config: PlaneConfig;
  private stateCache: Map<string, PlaneState> = new Map();
  private stateCacheInitialized = false;

  constructor(config: PlaneConfig) {
    this.config = config;
    this.client = new PlaneClient(config);
  }

  private async ensureStateCache(): Promise<void> {
    if (this.stateCacheInitialized) return;
    const states = await this.client.listStates();
    for (const state of states) {
      this.stateCache.set(state.name, state);
      this.stateCache.set(state.id, state);
    }
    this.stateCacheInitialized = true;
  }

  private stateNameToUuid(name: string): string | undefined {
    const state = this.stateCache.get(name);
    return state?.id;
  }

  private uuidToStateName(uuid: string): string {
    const state = this.stateCache.get(uuid);
    return state?.name ?? uuid;
  }

  private normalizeWorkItem(
    item: PlaneWorkItem,
    stateName: string
  ): SymphonyIssue {
    const projectIdentifier =
      item.project_detail?.identifier ?? this.config.project_id;
    const identifier = `${projectIdentifier}-${item.sequence_id}`;

    const branchName = this.generateBranchName(item);

    const url = `${this.config.base_url.replace(/\/+$/, "")}/workspaces/${this.config.workspace_slug}/work-items/${projectIdentifier}-${item.sequence_id}/`;

    return {
      id: item.id,
      identifier,
      title: item.name,
      description: item.description_stripped ?? "",
      priority: PRIORITY_MAP[item.priority] ?? 0,
      state: stateName,
      branch_name: branchName,
      url,
      assignee_id: item.assignees?.[0] ?? null,
      blocked_by: item.blocked_by ?? [],
      labels:
        item.label_details?.map((l) => l.name) ??
        item.labels ??
        [],
      assigned_to_worker: (item.assignees?.length ?? 0) > 0,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }

  private generateBranchName(item: PlaneWorkItem): string {
    const slug = item.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
    return `issue-${item.sequence_id}-${slug}`;
  }

  private async fetchWorkItemsByStateGroups(
    groups: string[]
  ): Promise<SymphonyIssue[]> {
    await this.ensureStateCache();

    const targetStateNames: string[] = [];
    const targetStateUuids: string[] = [];

    for (const [key, state] of this.stateCache) {
      if (groups.includes(state.group) && !targetStateUuids.includes(state.id)) {
        targetStateNames.push(state.name);
        targetStateUuids.push(state.id);
      }
    }

    const allItems: PlaneWorkItem[] = [];
    for (const uuid of targetStateUuids) {
      const items = await this.client.listAllWorkItems({
        state: uuid,
        expand: "project,label",
      });
      allItems.push(...items);
    }

    const seen = new Set<string>();
    const deduped = allItems.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return deduped.map((item) =>
      this.normalizeWorkItem(item, this.uuidToStateName(item.state))
    );
  }

  async fetch_candidate_issues(): Promise<SymphonyIssue[]> {
    return this.fetchWorkItemsByStateGroups(this.config.active_states);
  }

  async fetch_issues_by_states(stateNames: string[]): Promise<SymphonyIssue[]> {
    await this.ensureStateCache();

    const uuids = stateNames
      .map((name) => this.stateNameToUuid(name))
      .filter((id): id is string => id !== undefined);

    const allItems: PlaneWorkItem[] = [];
    for (const uuid of uuids) {
      const items = await this.client.listAllWorkItems({
        state: uuid,
        expand: "project,label",
      });
      allItems.push(...items);
    }

    const seen = new Set<string>();
    const deduped = allItems.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return deduped.map((item) =>
      this.normalizeWorkItem(item, this.uuidToStateName(item.state))
    );
  }

  async fetch_issue_states_by_ids(ids: string[]): Promise<Map<string, string>> {
    await this.ensureStateCache();

    const result = new Map<string, string>();

    const uniqueIds = [...new Set(ids)];
    const chunkSize = 50;

    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
      const chunk = uniqueIds.slice(i, i + chunkSize);
      const promises = chunk.map(async (id) => {
        try {
          const item = await this.client.getWorkItem(id);
          const stateName = this.uuidToStateName(item.state);
          result.set(id, stateName);
        } catch {
          result.set(id, "unknown");
        }
      });
      await Promise.all(promises);
    }

    return result;
  }

  async create_comment(issueId: string, commentHtml: string): Promise<void> {
    await this.client.createComment(issueId, commentHtml);
  }

  async update_issue_state(
    issueId: string,
    stateName: string
  ): Promise<void> {
    await this.ensureStateCache();

    const stateUuid = this.stateNameToUuid(stateName);
    if (!stateUuid) {
      throw new Error(
        `Plane state "${stateName}" not found in project. Available states: ${[...this.stateCache.values()]
          .filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i)
          .map((s) => s.name)
          .join(", ")}`
      );
    }

    await this.client.updateWorkItem(issueId, { state: stateUuid });
  }

  clearStateCache(): void {
    this.stateCache.clear();
    this.stateCacheInitialized = false;
  }
}

export function planeConfigFromEnv(): PlaneConfig {
  const env = process?.env ?? {};
  const required = [
    "PLANE_API_KEY",
    "PLANE_WORKSPACE_SLUG",
    "PLANE_PROJECT_ID",
  ] as const;

  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    api_key: env.PLANE_API_KEY!,
    base_url: env.PLANE_BASE_URL ?? "http://10.0.0.112:3300/api/v1/",
    workspace_slug: env.PLANE_WORKSPACE_SLUG!,
    project_id: env.PLANE_PROJECT_ID!,
    active_states: (env.PLANE_ACTIVE_STATE_GROUPS ?? "unstarted,started").split(","),
    terminal_states: (env.PLANE_TERMINAL_STATE_GROUPS ?? "completed,cancelled").split(","),
  };
}
