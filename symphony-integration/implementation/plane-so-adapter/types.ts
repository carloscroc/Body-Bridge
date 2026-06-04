export interface PlaneConfig {
  base_url: string;
  api_key: string;
  workspace_slug: string;
  project_id: string;
  active_states: string[];
  terminal_states: string[];
}

export interface PlaneWorkItem {
  id: string;
  name: string;
  description_html: string;
  description_stripped: string;
  state: string;
  state_group: string;
  priority: "none" | "low" | "medium" | "high" | "urgent";
  sequence_id: number;
  project: string;
  project_detail?: { identifier: string; name: string };
  workspace: string;
  parent: string | null;
  assignees: string[];
  labels: string[];
  label_details?: { id: string; name: string; color: string }[];
  blocked_by: string[];
  blockers: string[];
  attachments: string[];
  links: string[];
  start_date: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  archived_at: string | null;
  created_by: string;
  updated_by: string;
  estimate_point: number | null;
  cycle: string | null;
  module: string | null;
  is_draft: boolean;
  access: number;
}

export interface PlaneState {
  id: string;
  name: string;
  group: "backlog" | "unstarted" | "started" | "completed" | "cancelled";
  color: string;
  sequence: number;
  default: boolean;
  project: string;
  workspace: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface PlaneComment {
  id: string;
  comment_html: string;
  comment_stripped: string;
  created_at: string;
  updated_at: string;
  issue: string;
  actor: string;
  access: number;
}

export interface PlanePaginatedResponse<T> {
  next_cursor: string | null;
  prev_cursor: string | null;
  results: T[];
  total_results: number;
  count: number;
  total_pages: number;
}

export interface SymphonyIssue {
  id: string;
  identifier: string;
  title: string;
  description: string;
  priority: number;
  state: string;
  branch_name: string;
  url: string;
  assignee_id: string | null;
  blocked_by: string[];
  labels: string[];
  assigned_to_worker: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackerAdapter {
  fetch_candidate_issues(): Promise<SymphonyIssue[]>;
  fetch_issues_by_states(stateNames: string[]): Promise<SymphonyIssue[]>;
  fetch_issue_states_by_ids(ids: string[]): Promise<Map<string, string>>;
  create_comment(issueId: string, commentHtml: string): Promise<void>;
  update_issue_state(issueId: string, stateName: string): Promise<void>;
}
