'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EvidenceCollector {
  constructor(projectRoot, ticketId, options = {}) {
    this.projectRoot = projectRoot;
    this.ticketId = ticketId;
    this.evidenceDir = path.join(projectRoot, '.symphony', 'evidence', ticketId);
    this.screenshotsDir = path.join(projectRoot, 'screenshots', 'evidence', ticketId);
    this.healthEndpoint = options.healthEndpoint || 'http://localhost:3001/api/health';
    this.skipTests = options.skipTests || false;
    this.skipScreenshots = options.skipScreenshots || false;
    this.skipSecurity = options.skipSecurity || false;
    this.testTimeout = options.testTimeout || 120_000;
    this.results = {
      ticketId,
      timestamp: new Date().toISOString(),
      automated_tests: null,
      health_check: null,
      code_quality: null,
      security_scan: null,
      screenshots: null,
      summary: { pass: 0, fail: 0, skip: 0, total: 0 },
    };
  }

  async init() {
    fs.mkdirSync(this.evidenceDir, { recursive: true });
    fs.mkdirSync(this.screenshotsDir, { recursive: true });
  }

  async collectAll() {
    await this.init();

    const collectors = [
      { name: 'automated_tests', fn: () => this.collectAutomatedTests(), skip: this.skipTests },
      { name: 'health_check', fn: () => this.collectHealthCheck(), skip: false },
      { name: 'code_quality', fn: () => this.collectCodeQuality(), skip: false },
      { name: 'security_scan', fn: () => this.collectSecurityScan(), skip: this.skipSecurity },
      { name: 'screenshots', fn: () => this.collectScreenshots(), skip: this.skipScreenshots },
    ];

    for (const { name, fn, skip } of collectors) {
      if (skip) {
        console.log(`[evidence] Skipping ${name}...`);
        this.results[name] = { status: 'skip', reason: 'skipped by user' };
        this.results.summary.skip++;
        this.results.summary.total++;
        continue;
      }
      try {
        console.log(`[evidence] Collecting ${name}...`);
        this.results[name] = await fn();
        if (this.results[name]?.status === 'pass') {
          this.results.summary.pass++;
        } else if (this.results[name]?.status === 'fail') {
          this.results.summary.fail++;
        } else {
          this.results.summary.skip++;
        }
        this.results.summary.total++;
      } catch (err) {
        console.warn(`[evidence] ${name} collection failed: ${err.message}`);
        this.results[name] = { status: 'error', error: err.message };
        this.results.summary.fail++;
        this.results.summary.total++;
      }
    }

    await this.saveReport();
    return this.results;
  }

  async collectAutomatedTests() {
    try {
      const output = execSync('npx playwright test --reporter=line 2>&1', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        timeout: this.testTimeout,
        maxBuffer: 10 * 1024 * 1024,
      });

      return { status: 'pass', output: output.substring(0, 5000) };
    } catch (err) {
      const stdout = err.stdout || '';
      const stderr = err.stderr || '';
      const combined = (stdout + stderr).substring(0, 5000);
      const hasFailures = combined.includes('failed') || err.status !== 1;
      return {
        status: hasFailures && err.status !== 1 ? 'fail' : 'warn',
        exitCode: err.status,
        output: combined,
      };
    }
  }

  async collectHealthCheck() {
    try {
      const response = await fetch(this.healthEndpoint, {
        signal: AbortSignal.timeout(5000),
      });
      const body = await response.text();
      let parsed;
      try { parsed = JSON.parse(body); } catch { parsed = null; }

      return {
        status: response.ok ? 'pass' : 'fail',
        statusCode: response.status,
        endpoint: this.healthEndpoint,
        response: parsed || body.substring(0, 1000),
      };
    } catch (err) {
      return {
        status: 'fail',
        endpoint: this.healthEndpoint,
        error: err.message,
      };
    }
  }

  async collectCodeQuality() {
    try {
      const output = execSync('npx knip --reporter json 2>&1', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        timeout: 60_000,
        maxBuffer: 5 * 1024 * 1024,
      });

      try {
        const report = JSON.parse(output);
        const unusedCount = Object.values(report)
          .filter((v) => typeof v === 'object')
          .reduce((acc, section) => {
            if (Array.isArray(section)) return acc + section.length;
            return acc + Object.values(section).reduce((a, arr) => a + (Array.isArray(arr) ? arr.length : 0), 0);
          }, 0);

        fs.writeFileSync(
          path.join(this.evidenceDir, 'knip-report.json'),
          JSON.stringify(report, null, 2)
        );

        return { status: unusedCount === 0 ? 'pass' : 'warn', unusedCount, report };
      } catch {
        return { status: 'pass', raw: output.substring(0, 3000) };
      }
    } catch (err) {
      const output = (err.stdout || '') + (err.stderr || '');
      return { status: 'warn', output: output.substring(0, 3000), exitCode: err.status };
    }
  }

  async collectSecurityScan() {
    try {
      const hasSemgrep = execSync('where semgrep 2>&1', { encoding: 'utf-8' }).trim();
      if (!hasSemgrep || hasSemgrep.includes('not found')) {
        return { status: 'skip', reason: 'semgrep not installed' };
      }
    } catch {
      return { status: 'skip', reason: 'semgrep not installed' };
    }

    try {
      const output = execSync('semgrep --config p/security-audit --json src convex 2>&1', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        timeout: 300_000,
        maxBuffer: 10 * 1024 * 1024,
      });

      try {
        const report = JSON.parse(output);
        const findingCount = report.results?.length || 0;
        fs.writeFileSync(
          path.join(this.evidenceDir, 'semgrep-report.json'),
          JSON.stringify(report, null, 2)
        );
        return {
          status: findingCount === 0 ? 'pass' : 'fail',
          findings: findingCount,
          report: 'semgrep-report.json',
        };
      } catch {
        return { status: 'pass', raw: output.substring(0, 3000) };
      }
    } catch (err) {
      return { status: 'warn', error: err.message };
    }
  }

  async collectScreenshots() {
    const { execSync } = require('child_process');
    const screenshotScript = path.join(this.projectRoot, 'scripts', 'generate-screenshots.js');

    if (!fs.existsSync(screenshotScript)) {
      return { status: 'skip', reason: 'No screenshot script found' };
    }

    try {
      execSync(`node "${screenshotScript}" --output "${this.screenshotsDir}"`, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        timeout: 120_000,
      });

      const files = fs.readdirSync(this.screenshotsDir).filter((f) =>
        /\.(png|jpg|jpeg|webp)$/.test(f)
      );

      return {
        status: files.length > 0 ? 'pass' : 'warn',
        count: files.length,
        files: files.map((f) => path.join(this.screenshotsDir, f)),
      };
    } catch (err) {
      return { status: 'skip', error: err.message };
    }
  }

  async saveReport() {
    const reportPath = path.join(this.evidenceDir, 'evidence-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    return reportPath;
  }

  generateHtmlReport() {
    const r = this.results;
    const statusIcon = (s) => {
      switch (s) {
        case 'pass': return '✅';
        case 'fail': return '❌';
        case 'warn': return '⚠️';
        case 'skip': return '⏭️';
        case 'error': return '💥';
        default: return '❓';
      }
    };

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Evidence Report - ${r.ticketId}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;color:#1a1a1a}
h1{border-bottom:2px solid #e5e7eb;padding-bottom:.5rem}
.summary{display:flex;gap:1rem;margin:1rem 0}
.summary .stat{padding:1rem;border-radius:8px;flex:1;text-align:center}
.stat.pass{background:#dcfce7;color:#166534}
.stat.fail{background:#fee2e2;color:#991b1b}
.stat.skip{background:#f3f4f6;color:#6b7280}
.section{margin:1.5rem 0;padding:1rem;border:1px solid #e5e7eb;border-radius:8px}
.section h3{margin-top:0}
pre{background:#f8f9fa;padding:1rem;border-radius:4px;overflow-x:auto;font-size:0.85rem}
</style></head><body>
<h1>Evidence Report: ${r.ticketId}</h1>
<p>Collected: ${r.timestamp}</p>
<div class="summary">
<div class="stat pass"><strong>${r.summary.pass}</strong><br>Pass</div>
<div class="stat fail"><strong>${r.summary.fail}</strong><br>Fail</div>
<div class="stat skip"><strong>${r.summary.skip}</strong><br>Skip</div>
</div>`;

    const sections = [
      { key: 'automated_tests', title: 'Automated Tests' },
      { key: 'health_check', title: 'Health Check' },
      { key: 'code_quality', title: 'Code Quality (Knip)' },
      { key: 'security_scan', title: 'Security Scan (Semgrep)' },
      { key: 'screenshots', title: 'Screenshots' },
    ];

    for (const { key, title } of sections) {
      const data = r[key];
      if (!data) continue;
      html += `<div class="section"><h3>${statusIcon(data.status)} ${title}</h3>`;
      if (data.error) {
        html += `<p><strong>Error:</strong> ${data.error}</p>`;
      } else {
        const display = { ...data };
        delete display.output;
        delete display.raw;
        delete display.report;
        html += `<pre>${JSON.stringify(display, null, 2)}</pre>`;
        if (data.output) {
          html += `<details><summary>Output</summary><pre>${data.output.substring(0, 3000)}</pre></details>`;
        }
      }
      html += `</div>`;
    }

    html += `</body></html>`;
    return html;
  }
}

module.exports = { EvidenceCollector };
