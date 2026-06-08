#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { parseArgs } = require('node:util');

const rootDir = path.resolve(__dirname, '..');

require('dotenv').config({ path: path.join(rootDir, '.env.symphony') });

const { PlaneApiClient, planeConfigFromEnv } = require(path.join(__dirname, 'plane-lib', 'plane-api-client.cjs'));
const { EvidenceCollector } = require(path.join(__dirname, 'plane-lib', 'evidence-collector.cjs'));

function printUsage() {
  console.log(`
Usage: node scripts/start-symphony-work.cjs [options]

Required:
  --ticket <identifier>   Ticket identifier (e.g. BODYBRIDGE-42)

Optional:
  --evidence-only         Only collect evidence (skip Symphony execution)
  --skip-evidence         Skip evidence collection after completion
  --skip-screenshots      Skip screenshot collection during evidence
  --watch-mode            Monitor progress and post updates
  --json                  Output result as JSON
  --help                  Show this help

Workflow:
  1. Validates ticket exists and is in an active state (Backlog/Todo/In Progress)
  2. Creates feature branch: symphony/<ticket-identifier>
  3. Triggers Symphony execution (if available)
  4. Collects evidence (tests, health, code quality, screenshots)
  5. Posts evidence report to ticket
  6. Moves ticket to appropriate state (Review on success, Todo on failure)

Examples:
  node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-42
  node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-42 --evidence-only
  node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-42 --skip-screenshots
`);
}

async function main() {
  const { values } = parseArgs({
    options: {
      ticket: { type: 'string' },
      'evidence-only': { type: 'boolean', default: false },
      'skip-evidence': { type: 'boolean', default: false },
      'skip-screenshots': { type: 'boolean', default: false },
      'skip-tests': { type: 'boolean', default: false },
      'watch-mode': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help) {
    printUsage();
    process.exit(0);
  }

  if (!values.ticket) {
    console.error('Error: --ticket is required');
    printUsage();
    process.exit(1);
  }

  const ticketIdentifier = values.ticket;
  const evidenceOnly = values['evidence-only'];
  const skipEvidence = values['skip-evidence'];
  const skipScreenshots = values['skip-screenshots'];
  const watchMode = values['watch-mode'];
  const jsonOutput = values.json;

  const config = planeConfigFromEnv(process.env);
  const client = new PlaneApiClient(config);

  const verification = await client.verifyProject();
  if (!verification.valid) {
    console.error(`Project verification failed: ${verification.error}`);
    process.exit(1);
  }

  console.log(`Looking up ticket ${ticketIdentifier}...`);
  const ticket = await client.getWorkItemByIdentifier(ticketIdentifier);
  if (!ticket) {
    console.error(`Ticket ${ticketIdentifier} not found`);
    process.exit(1);
  }

  const states = await client.listStates();
  const stateMap = new Map();
  for (const s of states) stateMap.set(s.id, s);

  const currentState = stateMap.get(ticket.state);
  const currentGroupName = currentState?.group || 'unknown';
  const currentStateName = currentState?.name || 'unknown';

  const activeGroups = (process.env.PLANE_ACTIVE_STATE_GROUPS || 'unstarted,started').split(',');
  const terminalGroups = (process.env.PLANE_TERMINAL_STATE_GROUPS || 'completed,cancelled').split(',');

  if (terminalGroups.includes(currentGroupName)) {
    console.error(`Ticket ${ticketIdentifier} is in terminal state "${currentStateName}" — cannot start work`);
    process.exit(1);
  }

  console.log(`Ticket: ${ticketIdentifier} — "${ticket.name}"`);
  console.log(`State: ${currentStateName} (${currentGroupName})`);

  let branchName = '';
  let branchCreated = false;
  let symphonyResult = null;

  if (!evidenceOnly) {
    const branchSlug = ticket.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    branchName = `symphony/${ticketIdentifier.toLowerCase()}-${branchSlug}`;

    console.log(`Creating branch: ${branchName}`);
    try {
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: rootDir,
        encoding: 'utf-8',
      }).trim();
      if (currentBranch !== branchName) {
        try {
          execSync(`git checkout -b "${branchName}"`, {
            cwd: rootDir,
            encoding: 'utf-8',
            stdio: 'pipe',
          });
          branchCreated = true;
          console.log(`✅ Branch created: ${branchName}`);
        } catch (err) {
          if (err.message?.includes('already exists')) {
            execSync(`git checkout "${branchName}"`, {
              cwd: rootDir,
              encoding: 'utf-8',
              stdio: 'pipe',
            });
            console.log(`✅ Switched to existing branch: ${branchName}`);
            branchCreated = true;
          } else {
            console.warn(`⚠️ Branch creation failed: ${err.message}`);
          }
        }
      } else {
        console.log(`✅ Already on branch: ${branchName}`);
        branchCreated = true;
      }
    } catch (err) {
      console.warn(`⚠️ Git check failed: ${err.message}`);
    }

    const inProgressState = states.find((s) => s.name === 'In Progress');
    if (inProgressState && currentGroupName !== 'started') {
      try {
        await client.updateWorkItem(ticket.id, { state: inProgressState.id });
        console.log(`✅ Ticket moved to "In Progress"`);
      } catch (err) {
        console.warn(`⚠️ Failed to update ticket state: ${err.message}`);
      }
    }

    const initComment = `<h3>🚀 Work Started</h3>
<p><strong>Branch:</strong> <code>${branchName}</code><br/>
<strong>Started:</strong> ${new Date().toISOString()}<br/>
<strong>Previous State:</strong> ${currentStateName}</p>
<p>Symphony workflow has been initiated. Evidence will be collected upon completion.</p>`;

    try {
      await client.createComment(ticket.id, initComment);
    } catch (err) {
      console.warn(`Failed to post start comment: ${err.message}`);
    }

    console.log(`\n📝 Work has been started on ${ticketIdentifier}`);
    console.log(`   Branch: ${branchName}`);
    console.log(`   State: In Progress`);
    console.log(`\n   Implement the ticket changes, then run evidence collection:`);
    console.log(`   node scripts/start-symphony-work.cjs --ticket ${ticketIdentifier} --evidence-only`);
  }

  let evidenceResult = null;
  if (!skipEvidence) {
    console.log(`\n🔍 Collecting evidence for ${ticketIdentifier}...`);

    const collectorOptions = {
      healthEndpoint: process.env.HEALTH_ENDPOINT || 'http://localhost:3001/api/health',
      skipScreenshots: skipScreenshots,
      skipTests: values['skip-tests'] || false,
      skipSecurity: true,
    };

    const collector = new EvidenceCollector(rootDir, ticketIdentifier, collectorOptions);
    evidenceResult = await collector.collectAll();

    console.log(`\n📊 Evidence Summary:`);
    console.log(`   Pass: ${evidenceResult.summary.pass}`);
    console.log(`   Fail: ${evidenceResult.summary.fail}`);
    console.log(`   Skip: ${evidenceResult.summary.skip}`);

    const evidenceHtml = buildEvidenceComment(evidenceResult);
    try {
      await client.createComment(ticket.id, evidenceHtml);
      console.log(`✅ Evidence report posted to ticket`);
    } catch (err) {
      console.warn(`⚠️ Failed to post evidence report: ${err.message}`);
    }

    const allCriticalPass =
      evidenceResult.automated_tests?.status !== 'fail' &&
      evidenceResult.health_check?.status !== 'fail';

    if (allCriticalPass && evidenceResult.summary.fail === 0) {
      const todoState = states.find((s) => s.name === 'Todo');
      const reviewState = states.find((s) => s.name === 'Review') || todoState;
      if (reviewState && reviewState.id !== ticket.state) {
        try {
          await client.updateWorkItem(ticket.id, { state: reviewState.id });
          console.log(`✅ Ticket moved to "${reviewState.name}"`);
        } catch (err) {
          console.warn(`⚠️ Failed to move ticket: ${err.message}`);
        }
      }
    } else {
      console.log(`⚠️ Evidence has failures — ticket stays in current state`);
      console.log(`   Fix the issues and re-run evidence collection`);
    }

    const reportHtml = collector.generateHtmlReport();
    const reportPath = path.join(rootDir, '.symphony', 'evidence', ticketIdentifier, 'evidence-report.html');
    fs.writeFileSync(reportPath, reportHtml);
    console.log(`   Full report: ${reportPath}`);
  }

  const result = {
    success: true,
    ticket: {
      id: ticket.id,
      identifier: ticketIdentifier,
      name: ticket.name,
      previousState: currentStateName,
    },
    branch: branchName,
    branchCreated,
    evidence: evidenceResult ? {
      pass: evidenceResult.summary.pass,
      fail: evidenceResult.summary.fail,
      skip: evidenceResult.summary.skip,
    } : null,
  };

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  }

  return result;
}

function buildEvidenceComment(evidence) {
  const statusIcon = (s) => {
    switch (s) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warn': return '⚠️';
      case 'skip': return '⏭️';
      default: return '❓';
    }
  };

  let html = `<h3>📊 Evidence Report</h3>
<p><strong>Collected:</strong> ${evidence.timestamp}<br/>
<strong>Pass:</strong> ${evidence.summary.pass} | <strong>Fail:</strong> ${evidence.summary.fail} | <strong>Skip:</strong> ${evidence.summary.skip}</p>`;

  const sections = [
    { key: 'automated_tests', title: 'Automated Tests' },
    { key: 'health_check', title: 'Health Check' },
    { key: 'code_quality', title: 'Code Quality' },
    { key: 'security_scan', title: 'Security Scan' },
    { key: 'screenshots', title: 'Screenshots' },
  ];

  for (const { key, title } of sections) {
    const data = evidence[key];
    if (!data) continue;
    html += `<p>${statusIcon(data.status)} <strong>${title}:</strong> ${data.status}`;
    if (data.error) html += ` — <em>${data.error}</em>`;
    if (data.count !== undefined) html += ` (${data.count} files)`;
    if (data.findings !== undefined) html += ` (${data.findings} findings)`;
    if (data.statusCode !== undefined) html += ` (HTTP ${data.statusCode})`;
    html += `</p>`;
  }

  html += `<p><em>Full HTML report saved to <code>.symphony/evidence/${evidence.ticketId}/evidence-report.html</code></em></p>`;

  return html;
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ success: false, error: err.message }));
  }
  process.exit(1);
});
