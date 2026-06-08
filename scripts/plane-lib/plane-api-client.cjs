'use strict';

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const RETRY_DELAYS = [1000, 2000, 4000];

class PlaneApiClient {
  constructor(config) {
    this.config = config;
    this.requestTimestamps = [];
  }

  get baseUrl() {
    return this.config.base_url.replace(/\/+$/, '/');
  }

  get headers() {
    return {
      'X-API-Key': this.config.api_key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  workItemsPath() {
    return `${this.baseUrl}workspaces/${this.config.workspace_slug}/projects/${this.config.project_id}/issues/`;
  }

  workItemPath(id) {
    return `${this.workItemsPath()}${id}/`;
  }

  statesPath() {
    return `${this.baseUrl}workspaces/${this.config.workspace_slug}/projects/${this.config.project_id}/states/`;
  }

  commentsPath(workItemId) {
    return `${this.workItemPath(workItemId)}comments/`;
  }

  attachmentsPath(workItemId) {
    return `${this.workItemPath(workItemId)}attachments/`;
  }

  async enforceRateLimit() {
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

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async request(url, options = {}) {
    await this.enforceRateLimit();

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.headers, ...(options.headers || {}) },
      });

      if (response.ok) {
        if (response.status === 204) return undefined;
        return response.json();
      }

      const isRetryable = response.status === 429 || response.status >= 500;
      if (!isRetryable || attempt === RETRY_DELAYS.length) {
        const body = await response.text().catch(() => '');
        throw new PlaneApiError(
          `Plane API ${response.status} for ${options.method || 'GET'} ${url}`,
          response.status,
          body
        );
      }

      const retryAfter = response.headers.get('Retry-After');
      const waitMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : RETRY_DELAYS[attempt];
      await this.delay(waitMs);
    }

    throw new PlaneApiError('Exhausted retries', 0, '');
  }

  async createWorkItem(data) {
    return this.request(this.workItemsPath(), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkItem(id) {
    return this.request(this.workItemPath(id));
  }

  async getWorkItemByIdentifier(identifier) {
    const url = new URL(this.workItemsPath());
    const parts = identifier.split('-');
    const seqStr = parts[parts.length - 1];
    const sequenceId = parseInt(seqStr, 10);
    if (isNaN(sequenceId)) return null;
    url.searchParams.set('sequence_id', String(sequenceId));
    const result = await this.request(url.toString());
    return result.results?.[0] ?? null;
  }

  async updateWorkItem(id, data) {
    return this.request(this.workItemPath(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async listWorkItems(params = {}) {
    const url = new URL(this.workItemsPath());
    if (params.state) url.searchParams.set('state', params.state);
    if (params.expand) url.searchParams.set('expand', params.expand);
    if (params.per_page) url.searchParams.set('per_page', String(params.per_page));
    if (params.cursor) url.searchParams.set('cursor', params.cursor);
    return this.request(url.toString());
  }
  async listAllWorkItems(params = {}) {
    const all = [];
    let cursor;
    do {
      const page = await this.listWorkItems({ ...params, cursor, per_page: params.per_page ?? 50 });
      all.push(...page.results);
      cursor = (page.results.length > 0 && page.next_cursor) ? page.next_cursor : undefined;
    } while (cursor);
    return all;
  }

  async listStates() {
    const url = new URL(this.statesPath());
    const result = await this.request(url.toString());
    let cursor = (result.results.length > 0 && result.next_cursor) ? result.next_cursor : null;
    const all = [...result.results];

    while (cursor) {
      const nextUrl = new URL(this.statesPath());
      nextUrl.searchParams.set('cursor', cursor);
      const page = await this.request(nextUrl.toString());
      if (!page.results || page.results.length === 0) break;
      all.push(...page.results);
      cursor = page.next_cursor ?? undefined;
    }

    return all;
  }
  async createComment(workItemId, commentHtml) {
    return this.request(this.commentsPath(workItemId), {
      method: 'POST',
      body: JSON.stringify({ comment_html: commentHtml }),
    });
  }

  async addAttachment(workItemId, filePath) {
    await this.enforceRateLimit();

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType: this.detectContentType(filePath),
    });
    formData.append('name', path.basename(filePath));

    const url = this.attachmentsPath(workItemId);

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': this.config.api_key,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      if (response.ok) {
        if (response.status === 204) return undefined;
        return response.json();
      }

      const isRetryable = response.status === 429 || response.status >= 500;
      if (!isRetryable || attempt === RETRY_DELAYS.length) {
        const body = await response.text().catch(() => '');
        throw new PlaneApiError(
          `Plane API ${response.status} for POST ${url}`,
          response.status,
          body
        );
      }

      const waitMs = RETRY_DELAYS[attempt];
      await this.delay(waitMs);
    }

    throw new PlaneApiError('Exhausted retries on attachment upload', 0, '');
  }

  detectContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.html': 'text/html',
    };
    return types[ext] || 'application/octet-stream';
  }

  async verifyProject() {
    try {
      const url = `${this.baseUrl}workspaces/${this.config.workspace_slug}/projects/${this.config.project_id}/`;
      const result = await this.request(url);
      return { valid: true, project: result };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }
}

class PlaneApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'PlaneApiError';
    this.status = status;
    this.body = body;
  }
}

function planeConfigFromEnv(env) {
  const required = ['PLANE_API_KEY', 'PLANE_WORKSPACE_SLUG', 'PLANE_PROJECT_ID'];
  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  return {
    api_key: env.PLANE_API_KEY,
    base_url: env.PLANE_BASE_URL || 'http://10.0.0.112:3300/api/v1/',
    workspace_slug: env.PLANE_WORKSPACE_SLUG,
    project_id: env.PLANE_PROJECT_ID,
    project_identifier: env.PLANE_PROJECT_IDENTIFIER || '',
  };
}

module.exports = { PlaneApiClient, PlaneApiError, planeConfigFromEnv };
