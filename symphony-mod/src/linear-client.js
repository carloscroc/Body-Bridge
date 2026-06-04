import { SymphonyError } from "./errors.js";
const PAGE_SIZE = 50;
const NETWORK_TIMEOUT_MS = 30_000;
export class LinearIssueTrackerClient {
    config;
    logger;
    fetchImpl;
    constructor(config, logger, fetchImpl = fetch) {
        this.config = config;
        this.logger = logger;
        this.fetchImpl = fetchImpl;
    }
    async fetchCandidateIssues() {
        return this.fetchIssuesByStates(this.config.tracker.activeStates);
    }
    async fetchIssuesByStates(stateNames) {
        if (stateNames.length === 0) {
            return [];
        }
        const issues = [];
        let after = null;
        do {
            const response = await this.graphql(CANDIDATE_ISSUES_QUERY, {
                projectSlug: this.requireProjectSlug(),
                stateNames,
                first: PAGE_SIZE,
                after,
            });
            const connection = readConnection(response, ["issues"]);
            issues.push(...connection.nodes.map(normalizeLinearIssue));
            if (connection.pageInfo.hasNextPage && !connection.pageInfo.endCursor) {
                throw new SymphonyError("linear_missing_end_cursor", "Linear response had hasNextPage=true without endCursor");
            }
            after = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
        } while (after);
        return issues;
    }
    async fetchIssueStatesByIds(issueIds) {
        if (issueIds.length === 0) {
            return [];
        }
        const response = await this.graphql(ISSUE_STATES_BY_IDS_QUERY, { ids: issueIds });
        return readConnection(response, ["issues"]).nodes.map(normalizeLinearIssue);
    }
    async markIssueDone(issueId) {
        const stateId = await this.findIssueWorkflowStateId(issueId, "Done");
        const response = await this.graphql(ISSUE_UPDATE_STATE_MUTATION, { issueId, stateId });
        const mutation = readObjectPath(response, ["data", "issueUpdate"]);
        if (mutation.success !== true) {
            throw new SymphonyError("linear_unknown_payload", "Linear issueUpdate did not succeed");
        }
    }
    async delegateIssueToCodexCloud(input) {
        if (await this.issueHasCodexCloudDelegation(input.issue.id, input.signal)) {
            return {
                alreadyDelegated: true,
                commentId: null,
                commentUrl: null,
            };
        }
        const response = await this.graphql(CODEX_CLOUD_COMMENT_CREATE_MUTATION, {
            input: {
                body: renderCodexCloudDelegationComment(input),
                issueId: input.issue.id,
            },
        }, { signal: input.signal });
        const mutation = readObjectPath(response, ["data", "commentCreate"]);
        if (mutation.success !== true) {
            throw new SymphonyError("linear_unknown_payload", "Linear commentCreate did not succeed");
        }
        const comment = isRecord(mutation.comment) ? mutation.comment : {};
        return {
            alreadyDelegated: false,
            commentId: readOptionalString(comment.id),
            commentUrl: readOptionalString(comment.url),
        };
    }
    async rawGraphql(query, variables = {}) {
        return this.graphql(query, variables, { preserveGraphqlErrors: true });
    }
    async graphql(query, variables, options = {}) {
        const apiKey = this.config.tracker.apiKey;
        if (!apiKey) {
            throw new SymphonyError("missing_tracker_api_key", "Linear API key is missing");
        }
        const controller = new AbortController();
        const abortFromSignal = () => {
            controller.abort(options.signal?.reason);
        };
        if (options.signal?.aborted) {
            controller.abort(options.signal.reason);
        }
        else {
            options.signal?.addEventListener("abort", abortFromSignal, { once: true });
        }
        const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
        let response;
        try {
            response = await this.fetchImpl(this.config.tracker.endpoint, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    authorization: apiKey,
                },
                body: JSON.stringify({ query, variables }),
                signal: controller.signal,
            });
        }
        catch (error) {
            if (options.signal?.aborted) {
                throw new SymphonyError("turn_cancelled", "Run was cancelled by orchestrator", {
                    cause: error,
                });
            }
            throw new SymphonyError("linear_api_request", "Linear request failed", { cause: error });
        }
        finally {
            clearTimeout(timeout);
            options.signal?.removeEventListener("abort", abortFromSignal);
        }
        if (!response.ok) {
            throw new SymphonyError("linear_api_status", `Linear request failed with HTTP status ${response.status}`);
        }
        let body;
        try {
            body = (await response.json());
        }
        catch (error) {
            throw new SymphonyError("linear_unknown_payload", "Linear response was not valid JSON", {
                cause: error,
            });
        }
        if (body.errors && !options.preserveGraphqlErrors) {
            this.logger.warn("linear_graphql_errors", { errors: body.errors });
            throw new SymphonyError("linear_graphql_errors", "Linear returned GraphQL errors");
        }
        return body;
    }
    requireProjectSlug() {
        const projectSlug = this.config.tracker.projectSlug;
        if (!projectSlug) {
            throw new SymphonyError("missing_tracker_project_slug", "tracker.project_slug is required for Linear");
        }
        return projectSlug;
    }
    async findIssueWorkflowStateId(issueId, stateName) {
        const response = await this.graphql(ISSUE_WORKFLOW_STATES_QUERY, { issueId });
        const states = readConnection(response, ["issue", "team", "states"]).nodes;
        const matchingState = states
            .filter(isRecord)
            .find((state) => normalizeStateName(readOptionalString(state.name)) === normalizeStateName(stateName));
        const stateId = matchingState ? readOptionalString(matchingState.id) : null;
        if (!stateId) {
            throw new SymphonyError("linear_unknown_payload", `Linear issue team does not have a ${stateName} workflow state`);
        }
        return stateId;
    }
    async issueHasCodexCloudDelegation(issueId, signal) {
        let after = null;
        do {
            const response = await this.graphql(ISSUE_COMMENTS_QUERY, {
                issueId,
                first: PAGE_SIZE,
                after,
            }, { signal });
            const comments = readConnection(response, ["issue", "comments"]);
            if (comments.nodes.some((comment) => commentHasCodexCloudDelegation(comment, issueId))) {
                return true;
            }
            if (comments.pageInfo.hasNextPage && !comments.pageInfo.endCursor) {
                throw new SymphonyError("linear_missing_end_cursor", "Linear comments response had hasNextPage=true without endCursor");
            }
            after = comments.pageInfo.hasNextPage ? comments.pageInfo.endCursor : null;
        } while (after);
        return false;
    }
}
export const CANDIDATE_ISSUES_QUERY = `#graphql
query SymphonyCandidateIssues(
  $projectSlug: String!
  $stateNames: [String!]
  $first: Int!
  $after: String
) {
  issues(
    first: $first
    after: $after
    filter: {
      project: { slugId: { eq: $projectSlug } }
      state: { name: { in: $stateNames } }
    }
  ) {
    nodes {
      ...SymphonyIssue
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

fragment SymphonyIssue on Issue {
  id
  identifier
  title
  description
  priority
  branchName
  url
  createdAt
  updatedAt
  state {
    name
  }
  labels(first: 50) {
    nodes {
      name
    }
  }
  comments(first: 50) {
    nodes {
      body
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  inverseRelations(first: 50) {
    nodes {
      type
      issue {
        id
        identifier
        state {
          name
        }
      }
      relatedIssue {
        id
        identifier
        state {
          name
        }
      }
    }
  }
}`;
export const ISSUE_STATES_BY_IDS_QUERY = `#graphql
query SymphonyIssueStates($ids: [ID!]) {
  issues(first: 50, filter: { id: { in: $ids } }) {
    nodes {
      ...SymphonyIssueState
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

fragment SymphonyIssueState on Issue {
  id
  identifier
  title
  description
  priority
  branchName
  url
  createdAt
  updatedAt
  state {
    name
  }
  labels(first: 50) {
    nodes {
      name
    }
  }
  comments(first: 50) {
    nodes {
      body
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  inverseRelations(first: 50) {
    nodes {
      type
      issue {
        id
        identifier
        state {
          name
        }
      }
      relatedIssue {
        id
        identifier
        state {
          name
        }
      }
    }
  }
}`;
export const ISSUE_WORKFLOW_STATES_QUERY = `#graphql
query SymphonyIssueWorkflowStates($issueId: String!) {
  issue(id: $issueId) {
    team {
      states(first: 100) {
        nodes {
          id
          name
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
}`;
export const ISSUE_COMMENTS_QUERY = `#graphql
query SymphonyIssueComments($issueId: String!, $first: Int!, $after: String) {
  issue(id: $issueId) {
    comments(first: $first, after: $after) {
      nodes {
        body
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}`;
export const ISSUE_UPDATE_STATE_MUTATION = `#graphql
mutation SymphonyIssueUpdateState($issueId: String!, $stateId: String!) {
  issueUpdate(id: $issueId, input: { stateId: $stateId }) {
    success
    issue {
      id
      state {
        name
      }
    }
  }
}`;
export const CODEX_CLOUD_COMMENT_CREATE_MUTATION = `#graphql
mutation SymphonyCodexCloudCommentCreate($input: CommentCreateInput!) {
  commentCreate(input: $input) {
    success
    comment {
      id
      url
    }
  }
}`;
function readConnection(response, path) {
    let current = response.data;
    for (const part of path) {
        if (!isRecord(current)) {
            throw new SymphonyError("linear_unknown_payload", `Missing Linear payload path: ${path.join(".")}`);
        }
        current = current[part];
    }
    if (!isRecord(current) || !Array.isArray(current.nodes) || !isRecord(current.pageInfo)) {
        throw new SymphonyError("linear_unknown_payload", `Invalid Linear connection: ${path.join(".")}`);
    }
    return {
        nodes: current.nodes,
        pageInfo: {
            hasNextPage: current.pageInfo.hasNextPage === true,
            endCursor: typeof current.pageInfo.endCursor === "string" ? current.pageInfo.endCursor : null,
        },
    };
}
function readObjectPath(response, path) {
    let current = response;
    for (const part of path) {
        if (!isRecord(current)) {
            throw new SymphonyError("linear_unknown_payload", `Missing Linear payload path: ${path.join(".")}`);
        }
        current = current[part];
    }
    if (!isRecord(current)) {
        throw new SymphonyError("linear_unknown_payload", `Invalid Linear payload object: ${path.join(".")}`);
    }
    return current;
}
export function normalizeLinearIssue(raw) {
    if (!isRecord(raw)) {
        throw new SymphonyError("linear_unknown_payload", "Issue payload must be an object");
    }
    const id = requiredString(raw.id, "id");
    const identifier = requiredString(raw.identifier, "identifier");
    const title = requiredString(raw.title, "title");
    const state = readStateName(raw.state);
    return {
        id,
        identifier,
        title,
        description: nullableString(raw.description),
        priority: readInteger(raw.priority),
        state,
        branch_name: nullableString(raw.branchName ?? raw.branch_name),
        url: nullableString(raw.url),
        labels: normalizeLabels(raw.labels),
        codex_cloud_delegated: commentsHaveCodexCloudDelegation(raw.comments, id),
        blocked_by: normalizeBlockers(raw.inverseRelations ?? raw.relations),
        created_at: normalizeTimestamp(raw.createdAt ?? raw.created_at),
        updated_at: normalizeTimestamp(raw.updatedAt ?? raw.updated_at),
    };
}
export function codexCloudDelegationMarker(issueId) {
    return `<!-- symphony:codex-cloud:${issueId} -->`;
}
function renderCodexCloudDelegationComment(input) {
    const repositoryHint = input.repository ? ` in ${input.repository}` : "";
    return [
        `${input.mention} please work on this issue${repositoryHint}.`,
        "",
        codexCloudDelegationMarker(input.issue.id),
        "",
        input.prompt,
    ].join("\n");
}
function commentsHaveCodexCloudDelegation(raw, issueId) {
    return readNodes(raw).some((comment) => commentHasCodexCloudDelegation(comment, issueId));
}
function commentHasCodexCloudDelegation(raw, issueId) {
    if (!isRecord(raw)) {
        return false;
    }
    return nullableString(raw.body)?.includes(codexCloudDelegationMarker(issueId)) ?? false;
}
function normalizeLabels(raw) {
    const nodes = readNodes(raw);
    return nodes
        .map((node) => (isRecord(node) ? node.name : null))
        .filter((name) => typeof name === "string")
        .map((name) => name.toLocaleLowerCase());
}
function normalizeBlockers(raw) {
    return readNodes(raw)
        .filter((relation) => isRecord(relation) && String(relation.type).toLocaleLowerCase() === "blocks")
        .map((relation) => {
        const candidate = isRecord(relation) && (relation.issue ?? relation.relatedIssue ?? relation.sourceIssue);
        const issue = isRecord(candidate) ? candidate : {};
        return {
            id: nullableString(issue.id),
            identifier: nullableString(issue.identifier),
            state: readOptionalStateName(issue.state),
        };
    });
}
function readNodes(raw) {
    if (!isRecord(raw) || !Array.isArray(raw.nodes)) {
        return [];
    }
    return raw.nodes;
}
function readStateName(raw) {
    const name = readOptionalStateName(raw);
    if (!name) {
        throw new SymphonyError("linear_unknown_payload", "Issue state name is missing");
    }
    return name;
}
function readOptionalStateName(raw) {
    if (typeof raw === "string") {
        return raw;
    }
    if (isRecord(raw) && typeof raw.name === "string") {
        return raw.name;
    }
    return null;
}
function normalizeTimestamp(raw) {
    if (typeof raw !== "string") {
        return null;
    }
    const time = Date.parse(raw);
    return Number.isNaN(time) ? null : new Date(time).toISOString();
}
function nullableString(raw) {
    return typeof raw === "string" ? raw : null;
}
function readOptionalString(raw) {
    return typeof raw === "string" && raw !== "" ? raw : null;
}
function normalizeStateName(raw) {
    return raw ? raw.trim().toLocaleLowerCase() : null;
}
function readInteger(raw) {
    return typeof raw === "number" && Number.isInteger(raw) ? raw : null;
}
function requiredString(raw, field) {
    if (typeof raw !== "string" || raw === "") {
        throw new SymphonyError("linear_unknown_payload", `Issue field is missing: ${field}`);
    }
    return raw;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=linear-client.js.map