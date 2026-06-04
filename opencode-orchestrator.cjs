// opencode-orchestrator.cjs — Plane.so ↔ OpenCode daemon
// Usage:
//   node opencode-orchestrator.cjs start     — start daemon in background
//   node opencode-orchestrator.cjs stop      — stop daemon
//   node opencode-orchestrator.cjs restart   — restart daemon
//   node opencode-orchestrator.cjs status    — show daemon status
//   node opencode-orchestrator.cjs logs      — tail live logs
//   node opencode-orchestrator.cjs foreground — run in foreground (for debug)

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const RUNTIME_DIR = path.join(__dirname, '.orchestrator');
const PID_FILE = path.join(RUNTIME_DIR, 'daemon.pid');
const LOG_FILE = path.join(RUNTIME_DIR, 'daemon.log');
const STATUS_FILE = path.join(RUNTIME_DIR, 'status.json');
const ENV_FILE = path.join(RUNTIME_DIR, 'env.json');

fs.mkdirSync(RUNTIME_DIR, { recursive: true });

// ── Plane.so API client ──────────────────────────────────────────────

class PlaneClient {
  constructor(apiKey, baseUrl, workspaceSlug, projectId) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '/');
    this.workspaceSlug = workspaceSlug;
    this.projectId = projectId;
    this.headers = {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    this.minRequestInterval = 2000;
    this.lastRequestTime = 0;
    this.retryDelayBase = 5000;
    this.retryMaxAttempts = 5;
  }

  async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestInterval) {
      await this.sleep(this.minRequestInterval - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchWithRetry(url, options = {}, attempt = 0) {
    await this.throttle();
    const response = await fetch(url, {
      ...options,
      headers: { ...this.headers, ...(options.headers || {}) }
    });
    if (response.ok) {
      if (response.status === 204) return null;
      return response.json();
    }
    const isRetryable = response.status === 429 || response.status >= 500;
    if (!isRetryable || attempt >= this.retryMaxAttempts) {
      const text = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }
    const waitMs = response.status === 429
      ? 30000 * (attempt + 1)
      : this.retryDelayBase * Math.pow(2, attempt);
    log('warn', `${response.status} — retry ${attempt + 1}/${this.retryMaxAttempts} after ${Math.round(waitMs / 1000)}s`);
    await this.sleep(waitMs);
    return this.fetchWithRetry(url, options, attempt + 1);
  }

  async fetch(url, options = {}) {
    return this.fetchWithRetry(url, options, 0);
  }

  async getStates() {
    const url = `${this.baseUrl}workspaces/${this.workspaceSlug}/projects/${this.projectId}/states/`;
    const data = await this.fetch(url);
    return data.results || [];
  }

  async getIssuesByState(stateId) {
    const url = `${this.baseUrl}workspaces/${this.workspaceSlug}/projects/${this.projectId}/issues/?state=${stateId}`;
    const data = await this.fetch(url);
    return data.results || [];
  }

  async updateIssue(issueId, data) {
    const url = `${this.baseUrl}workspaces/${this.workspaceSlug}/projects/${this.projectId}/issues/${issueId}/`;
    return await this.fetch(url, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async addComment(issueId, commentHtml) {
    const url = `${this.baseUrl}workspaces/${this.workspaceSlug}/projects/${this.projectId}/issues/${issueId}/comments/`;
    return await this.fetch(url, { method: 'POST', body: JSON.stringify({ comment_html: commentHtml }) });
  }
}

// ── Logging ──────────────────────────────────────────────────────────

let logStream = null;

function openLog() {
  logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
}

function log(level, message) {
  const ts = new Date().toISOString();
  const prefix = { info: 'INFO', warn: 'WARN', error: 'ERR ', ok: ' OK ', work: 'WORK' }[level] || 'INFO';
  const line = `[${ts}] [${prefix}] ${message}\n`;

  if (logStream) logStream.write(line);
  if (process.env.ORCHESTRATOR_FOREGROUND === '1') {
    process.stdout.write(line);
  }
}

// ── Status heartbeat ─────────────────────────────────────────────────

function writeStatus(overrides = {}) {
  const status = {
    pid: process.pid,
    startedAt: statusGlobal.startedAt,
    lastHeartbeat: new Date().toISOString(),
    state: overrides.state || statusGlobal.state || 'idle',
    currentIssue: overrides.currentIssue || statusGlobal.currentIssue || null,
    pollsCompleted: statusGlobal.pollsCompleted || 0,
    issuesProcessed: statusGlobal.issuesProcessed || 0,
    errors: statusGlobal.errors || 0,
    lastError: overrides.lastError || statusGlobal.lastError || null,
    ...overrides
  };
  Object.assign(statusGlobal, status);
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
}

const statusGlobal = {
  pid: 0,
  startedAt: '',
  state: 'starting',
  currentIssue: null,
  pollsCompleted: 0,
  issuesProcessed: 0,
  errors: 0,
  lastError: null
};

// ── Orchestrator core ────────────────────────────────────────────────

class OpenCodeOrchestrator {
  constructor(config) {
    this.config = config;
    this.client = new PlaneClient(
      config.plane.apiKey,
      config.plane.baseUrl,
      config.plane.workspaceSlug,
      config.plane.projectId
    );
    this.isRunning = false;
    this.processedIssues = new Set();
    this.statesById = new Map();
    this.statesByName = new Map();
  }

  async start() {
    log('info', '========================================');
    log('info', '  OpenCode Orchestrator starting');
    log('info', `  Workspace : ${this.config.plane.workspaceSlug}`);
    log('info', `  Project   : ${this.config.plane.projectId}`);
    log('info', `  Triggers  : ${this.config.plane.triggerStates.join(', ')}`);
    log('info', `  Auto-run  : ${this.config.opencode.autoRun}`);
    log('info', `  Workdir   : ${this.config.opencode.workdir}`);
    log('info', '========================================');

    writeStatus({ state: 'initializing', startedAt: new Date().toISOString(), pid: process.pid });

    // heartbeat every 30s
    this.heartbeatInterval = setInterval(() => writeStatus(), 30000);

    await this.initializeStateCache();
    this.isRunning = true;
    writeStatus({ state: 'idle' });
    await this.runLoop();
  }

  async initializeStateCache() {
    log('info', 'Loading Plane.so states...');
    const states = await this.client.getStates();
    for (const state of states) {
      this.statesById.set(state.id, state);
      this.statesByName.set(state.name, state);
    }
    log('ok', `Loaded ${states.length} states: ${states.map(s => s.name).join(', ')}`);
  }

  async runLoop() {
    while (this.isRunning) {
      try {
        log('info', 'Polling for candidate issues...');
        writeStatus({ state: 'polling' });
        const issues = await this.getCandidateIssues();
        log('info', `Found ${issues.length} candidate issue(s)`);
        statusGlobal.pollsCompleted++;

        for (const issue of issues) {
          if (!this.processedIssues.has(issue.id)) {
            await this.processIssue(issue);
          }
        }

        writeStatus({ state: 'idle', currentIssue: null });
        log('info', `Next poll in ${this.config.polling.intervalMs / 1000}s`);
        await this.client.sleep(this.config.polling.intervalMs);
      } catch (error) {
        statusGlobal.errors++;
        log('error', `Orchestration loop error: ${error.message}`);
        writeStatus({ state: 'error', lastError: error.message });
        await this.client.sleep(15000);
      }
    }
  }

  async getCandidateIssues() {
    const candidateIssues = [];
    const seen = new Set();

    for (const stateName of this.config.plane.triggerStates) {
      const state = this.statesByName.get(stateName);
      if (!state) {
        log('warn', `State "${stateName}" not found, skipping`);
        continue;
      }
      const issues = await this.client.getIssuesByState(state.id);
      for (const issue of issues) {
        if (seen.has(issue.id)) continue;
        seen.add(issue.id);
        const stateObj = this.statesById.get(issue.state);
        const projectIdentifier = issue.project_detail?.identifier || 'BODYBRIDGE';
        const identifier = `${projectIdentifier}-${issue.sequence_id}`;
        const priorityMap = { none: 0, low: 1, medium: 2, high: 3, urgent: 4 };
        candidateIssues.push({
          id: issue.id,
          identifier,
          title: issue.name,
          description: issue.description_stripped || issue.description_html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '',
          priority: priorityMap[issue.priority] || 0,
          state: stateObj ? stateObj.name : stateName,
          url: `http://10.0.0.112:3300/${this.config.plane.workspaceSlug}/projects/${this.config.plane.projectId}/issues/${issue.id}`,
        });
      }
    }
    return candidateIssues;
  }

  async processIssue(issue) {
    log('work', `Processing: ${issue.identifier} — ${issue.title}`);
    writeStatus({ state: 'processing', currentIssue: `${issue.identifier}: ${issue.title}` });
    this.processedIssues.add(issue.id);

    try {
      if (issue.state === 'Todo') {
        const inProgressState = this.statesByName.get('In Progress');
        if (inProgressState) {
          log('info', `Moving ${issue.identifier} to "In Progress"`);
          await this.client.updateIssue(issue.id, { state: inProgressState.id });
        }
      }

      await this.client.addComment(issue.id,
        `<p><strong>🤖 OpenCode Agent Started</strong></p>
<p>Working on: <em>${issue.title}</em></p>
<p>The orchestrator has picked up this issue.</p>`);

      log('ok', `${issue.identifier} moved to In Progress, comment added`);

      if (this.config.opencode.autoRun) {
        await this.triggerOpenCode(issue);
      }

      statusGlobal.issuesProcessed++;
    } catch (error) {
      statusGlobal.errors++;
      log('error', `Failed to process ${issue.identifier}: ${error.message}`);
      writeStatus({ lastError: error.message });
      try {
        await this.client.addComment(issue.id,
          `<p><strong>❌ OpenCode Error</strong></p><p>${error.message}</p>`);
      } catch (_) {}
    }
  }

  async triggerOpenCode(issue) {
    log('work', `Triggering OpenCode for ${issue.identifier}`);
    writeStatus({ state: 'running-opencode', currentIssue: `${issue.identifier}: ${issue.title}` });

    const message = `Work on Plane.so issue ${issue.identifier}: ${issue.title}\n\nDescription:\n${issue.description || '(no description)'}\n\nIssue URL: ${issue.url}`;

    const args = [
      'run',
      message,
      '--dir', this.config.opencode.workdir,
      '--title', `${issue.identifier}: ${issue.title}`,
      '--format', 'json'
    ];

    if (this.config.opencode.model) {
      args.push('--model', this.config.opencode.model);
    }

    return new Promise((resolve) => {
      log('info', `Spawning: opencode ${args.slice(0, 3).join(' ')}...`);

      const child = spawn('opencode', args, {
        cwd: this.config.opencode.workdir,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      });

      let lastActivity = Date.now();

      child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          lastActivity = Date.now();
          try {
            const event = JSON.parse(line);
            if (event.type === 'assistant') {
              log('work', `[OpenCode] ${event.content?.slice(0, 200) || '(thinking...)'}`);
            } else if (event.type === 'tool_use') {
              log('work', `[OpenCode] Tool: ${event.name || 'unknown'} ${JSON.stringify(event.input || {}).slice(0, 100)}`);
            } else if (event.type === 'tool_result') {
              log('info', `[OpenCode] Tool result: ${(event.content || '').slice(0, 100)}`);
            } else if (event.type === 'thinking') {
              log('work', `[OpenCode] Thinking...`);
            } else {
              log('info', `[OpenCode] ${event.type}: ${JSON.stringify(event).slice(0, 150)}`);
            }
          } catch {
            log('info', `[OpenCode] ${line.slice(0, 200)}`);
          }
        }
      });

      child.stderr.on('data', (data) => {
        const text = data.toString().trim();
        if (text) log('warn', `[OpenCode stderr] ${text.slice(0, 300)}`);
      });

      // idle watchdog — if no output for 5 min, log a warning
      const watchdog = setInterval(() => {
        const idle = Date.now() - lastActivity;
        if (idle > 300000) {
          log('warn', `[OpenCode] No output for ${Math.round(idle / 60000)}min — may be stuck`);
        }
      }, 60000);

      child.on('close', async (code) => {
        clearInterval(watchdog);
        if (code === 0) {
          log('ok', `OpenCode completed for ${issue.identifier}`);
          const doneState = this.statesByName.get('Done');
          if (doneState) {
            await this.client.updateIssue(issue.id, { state: doneState.id });
            log('ok', `${issue.identifier} moved to Done`);
          }
          await this.client.addComment(issue.id,
            `<p><strong>✅ OpenCode Completed</strong></p><p>Finished processing ${issue.identifier}.</p>`);
        } else {
          log('error', `OpenCode exited with code ${code} for ${issue.identifier}`);
          statusGlobal.errors++;
          await this.client.addComment(issue.id,
            `<p><strong>❌ OpenCode Failed</strong></p><p>Exit code: ${code}</p>`);
          writeStatus({ lastError: `OpenCode exit code ${code}` });
        }
        resolve();
      });

      child.on('error', (err) => {
        clearInterval(watchdog);
        log('error', `Failed to spawn OpenCode: ${err.message}`);
        statusGlobal.errors++;
        writeStatus({ lastError: err.message });
        resolve();
      });
    });
  }

  stop() {
    log('info', 'Stopping orchestrator...');
    clearInterval(this.heartbeatInterval);
    this.isRunning = false;
  }
}

// ── Daemon management ────────────────────────────────────────────────

function saveEnv() {
  const env = {
    PLANE_API_KEY: process.env.PLANE_API_KEY || 'plane_api_996fecef7f91430dac6964b212cf4274',
    PLANE_BASE_URL: process.env.PLANE_BASE_URL || 'http://10.0.0.112:3300/api/v1/',
    PLANE_WORKSPACE_SLUG: process.env.PLANE_WORKSPACE_SLUG || 'body-bridge',
    PLANE_PROJECT_ID: process.env.PLANE_PROJECT_ID || '13cecebf-f9ff-41bd-b5bb-b88774ef6440',
    OPENCODE_AUTO_RUN: process.env.OPENCODE_AUTO_RUN || 'true',
    OPENCODE_WORKDIR: process.env.OPENCODE_WORKDIR || process.cwd(),
    OPENCODE_MODEL: process.env.OPENCODE_MODEL || ''
  };
  fs.writeFileSync(ENV_FILE, JSON.stringify(env, null, 2));
}

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    console.error('No saved environment. Run with env vars first, or set them in .orchestrator/env.json');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(ENV_FILE, 'utf8'));
}

function isRunning() {
  if (!fs.existsSync(PID_FILE)) return false;
  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'), 10);
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return pid;
  } catch {
    fs.unlinkSync(PID_FILE);
    return false;
  }
}

function cmdStart() {
  const pid = isRunning();
  if (pid) {
    console.log(`Orchestrator already running (PID ${pid})`);
    console.log(`  Logs : ${LOG_FILE}`);
    console.log(`  Status: node opencode-orchestrator.cjs status`);
    return;
  }

  saveEnv();

  const child = spawn(process.execPath, [__filename, '_daemon'], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, ORCHESTRATOR_DAEMON: '1' }
  });
  child.unref();

  fs.writeFileSync(PID_FILE, String(child.pid));
  console.log(`Orchestrator started (PID ${child.pid})`);
  console.log(`  Logs  : ${LOG_FILE}`);
  console.log(`  Status: node opencode-orchestrator.cjs status`);
  console.log(`  Tail  : node opencode-orchestrator.cjs logs`);
}

function cmdStop() {
  const pid = isRunning();
  if (!pid) {
    console.log('Orchestrator is not running');
    return;
  }
  try {
    process.kill(pid, 'SIGTERM');
    console.log(`Sent SIGTERM to PID ${pid}`);
    // wait for it to die
    let tries = 0;
    const check = setInterval(() => {
      try {
        process.kill(pid, 0);
        tries++;
        if (tries > 20) {
          process.kill(pid, 'SIGKILL');
          console.log('Force killed');
          clearInterval(check);
        }
      } catch {
        console.log('Orchestrator stopped');
        try { fs.unlinkSync(PID_FILE); } catch {}
        clearInterval(check);
      }
    }, 500);
  } catch {
    console.log('Process already dead');
    try { fs.unlinkSync(PID_FILE); } catch {}
  }
}

function cmdRestart() {
  const pid = isRunning();
  if (pid) {
    console.log('Stopping...');
    try { process.kill(pid, 'SIGTERM'); } catch {}
    // give it a moment
    const wait = () => new Promise(r => setTimeout(r, 2000));
    wait().then(() => {
      try { fs.unlinkSync(PID_FILE); } catch {}
      console.log('Starting...');
      cmdStart();
    });
  } else {
    cmdStart();
  }
}

function cmdStatus() {
  const pid = isRunning();
  console.log('╔══════════════════════════════════════╗');
  console.log('║   OpenCode Orchestrator Status       ║');
  console.log('╚══════════════════════════════════════╝');

  if (!pid) {
    console.log('  State: STOPPED');
    if (fs.existsSync(STATUS_FILE)) {
      const last = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
      console.log(`  Last state : ${last.state}`);
      console.log(`  Last issue : ${last.currentIssue || 'none'}`);
      console.log(`  Last error : ${last.lastError || 'none'}`);
      console.log(`  Stopped at : ${last.lastHeartbeat}`);
    }
    return;
  }

  console.log(`  PID         : ${pid}`);

  if (fs.existsSync(STATUS_FILE)) {
    const s = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    const stateEmoji = { idle: '💤', polling: '🔍', processing: '⚙️', 'running-opencode': '🤖', error: '❌', starting: '🚀', initializing: '🔧' }[s.state] || '❓';
    console.log(`  State       : ${stateEmoji} ${s.state}`);
    console.log(`  Uptime      : ${formatDuration(Date.now() - new Date(s.startedAt).getTime())}`);
    console.log(`  Current     : ${s.currentIssue || 'nothing'}`);
    console.log(`  Polls       : ${s.pollsCompleted}`);
    console.log(`  Processed   : ${s.issuesProcessed}`);
    console.log(`  Errors      : ${s.errors}`);
    if (s.lastError) console.log(`  Last error  : ${s.lastError}`);
    console.log(`  Heartbeat   : ${s.lastHeartbeat}`);
    const hbAge = Date.now() - new Date(s.lastHeartbeat).getTime();
    if (hbAge > 90000) {
      console.log(`  ⚠️  Heartbeat is ${Math.round(hbAge / 1000)}s old — daemon may be stuck!`);
    }
  }

  console.log(`\n  Log file: ${LOG_FILE}`);
}

function cmdLogs() {
  if (!fs.existsSync(LOG_FILE)) {
    console.log('No log file yet. Start the orchestrator first.');
    return;
  }

  // tail -f equivalent
  console.log(`Tailing ${LOG_FILE} (Ctrl+C to stop)\n`);
  const content = fs.readFileSync(LOG_FILE, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  const start = Math.max(0, lines.length - 50);
  for (let i = start; i < lines.length; i++) {
    console.log(lines[i]);
  }

  let offset = fs.statSync(LOG_FILE).size;
  const watcher = fs.watch(LOG_FILE, () => {
    try {
      const stat = fs.statSync(LOG_FILE);
      if (stat.size < offset) offset = 0;
      if (stat.size > offset) {
        const stream = fs.createReadStream(LOG_FILE, { start: offset, encoding: 'utf8' });
        stream.on('data', (chunk) => {
          process.stdout.write(chunk);
        });
        offset = stat.size;
      }
    } catch {}
  });

  process.on('SIGINT', () => {
    watcher.close();
    process.exit(0);
  });
}

function cmdForeground() {
  process.env.ORCHESTRATOR_FOREGROUND = '1';
  process.env.ORCHESTRATOR_DAEMON = '1';
  runDaemon();
}

// ── Daemon entry point ───────────────────────────────────────────────

async function runDaemon() {
  const env = process.env.ORCHESTRATOR_DAEMON === '1' && fs.existsSync(ENV_FILE)
    ? loadEnv()
    : {};

  const config = {
    plane: {
      apiKey: process.env.PLANE_API_KEY || env.PLANE_API_KEY || '',
      baseUrl: process.env.PLANE_BASE_URL || env.PLANE_BASE_URL || 'http://10.0.0.112:3300/api/v1/',
      workspaceSlug: process.env.PLANE_WORKSPACE_SLUG || env.PLANE_WORKSPACE_SLUG || 'body-bridge',
      projectId: process.env.PLANE_PROJECT_ID || env.PLANE_PROJECT_ID || '',
      triggerStates: ['Todo'],
      terminalStates: ['Done', 'Cancelled']
    },
    polling: {
      intervalMs: 60000
    },
    opencode: {
      autoRun: (process.env.OPENCODE_AUTO_RUN || env.OPENCODE_AUTO_RUN || 'true') === 'true',
      workdir: process.env.OPENCODE_WORKDIR || env.OPENCODE_WORKDIR || process.cwd(),
      model: process.env.OPENCODE_MODEL || env.OPENCODE_MODEL || ''
    }
  };

  if (!config.plane.apiKey) {
    console.error('PLANE_API_KEY is required');
    process.exit(1);
  }
  if (!config.plane.projectId) {
    console.error('PLANE_PROJECT_ID is required');
    process.exit(1);
  }

  openLog();

  const orchestrator = new OpenCodeOrchestrator(config);

  process.on('SIGINT', () => { orchestrator.stop(); writeStatus({ state: 'stopped' }); process.exit(0); });
  process.on('SIGTERM', () => { orchestrator.stop(); writeStatus({ state: 'stopped' }); process.exit(0); });

  // crash guard — write status before dying
  process.on('uncaughtException', (err) => {
    log('error', `UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}`);
    writeStatus({ state: 'crashed', lastError: err.message });
    if (logStream) logStream.end();
    process.exit(2);
  });

  process.on('unhandledRejection', (reason) => {
    log('error', `UNHANDLED REJECTION: ${reason}`);
    writeStatus({ state: 'crashed', lastError: String(reason) });
    if (logStream) logStream.end();
    process.exit(2);
  });

  await orchestrator.start();
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// ── CLI ──────────────────────────────────────────────────────────────

const command = process.argv[2];

switch (command) {
  case 'start':
    cmdStart();
    break;
  case 'stop':
    cmdStop();
    break;
  case 'restart':
    cmdRestart();
    break;
  case 'status':
    cmdStatus();
    break;
  case 'logs':
    cmdLogs();
    break;
  case 'foreground':
    cmdForeground();
    break;
  case '_daemon':
    runDaemon();
    break;
  default:
    console.log('OpenCode Orchestrator for Plane.so');
    console.log('');
    console.log('Usage:');
    console.log('  node opencode-orchestrator.cjs start      Start daemon in background');
    console.log('  node opencode-orchestrator.cjs stop       Stop daemon');
    console.log('  node opencode-orchestrator.cjs restart    Restart daemon');
    console.log('  node opencode-orchestrator.cjs status     Show daemon status');
    console.log('  node opencode-orchestrator.cjs logs       Tail live logs');
    console.log('  node opencode-orchestrator.cjs foreground Run in foreground');
    console.log('');
    console.log('Environment (saved on first start):');
    console.log('  PLANE_API_KEY         Plane.so API key');
    console.log('  PLANE_BASE_URL        Plane.so API base URL');
    console.log('  PLANE_WORKSPACE_SLUG  Workspace slug');
    console.log('  PLANE_PROJECT_ID      Project UUID');
    console.log('  OPENCODE_AUTO_RUN     "true" to auto-run OpenCode (default: true)');
    console.log('  OPENCODE_WORKDIR      Working directory for OpenCode');
    console.log('  OPENCODE_MODEL        Model to use (optional)');
}
