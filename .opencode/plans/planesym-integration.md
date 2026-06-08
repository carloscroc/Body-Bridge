# Plane Ticket Creation & Symphony Integration - Implementation Plan

## Executive Summary

Create two integrated commands to streamline the Body-Bridge development workflow:

1. **`create-plane-ticket`** - Creates meticulous, evidence-driven tickets in Plane.so with element context, images, references, and comprehensive verification requirements
2. **`start-symphony-work`** - Triggers Symphony workflow to execute tickets with automatic evidence collection, verification, and state management

## Current Infrastructure Analysis

### Existing Assets ✅

#### Plane.so Integration
- **Client**: `symphony-mod/src/trackers/plane-client.ts`
  - Full API integration with rate limiting (60 req/min), retry logic (3 attempts), error handling
  - Methods: `createWorkItem`, `updateWorkItem`, `createComment`, `listStates`, `getWorkItem`, `addAttachment`
  - Base URL: `http://10.0.0.112:3300/api/v1/`
  - API Key: `plane_api_996fecef7f91430dac6964b212cf4274`
  - Workspace: `body-bridge`
  - ⚠️ **PROJECT ID CONFLICT**: Two different IDs found:
    - In test file: `8e7bb5fa-3f95-4701-a3d0-49562b4c0f4c`
    - In workflow config: `13cecebf-f9ff-41bd-b5bb-b88774ef6440`
    - **RESOLUTION NEEDED**: Verify correct project ID before implementation

- **Adapter**: `symphony-mod/src/trackers/plane-adapter.ts`
  - Symphony-compatible interface implementation
  - State caching and normalization
  - Branch naming: `issue-{sequence_id}-{slug}` (60 char max)
  - Priority mapping: none/low/medium/high/urgent → 0-4
  - Active states: `Todo`, `In Progress`
  - Terminal states: `Done`, `Cancelled`

#### Symphony Integration
- **Workflow Config**: `symphony-integration/implementation/workflow-configs/body-bridge-workflow.md`
  - Agent instructions for Body-Bridge development
  - Branch naming: `symphony/{issue-identifier}`
  - Definition of Done with verification requirements
  - Git workflow conventions

#### Application Infrastructure
- **Frontend**: React 19 + Vite, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Express 5 (port 3001), Convex
- **Testing**: Playwright E2E only (no unit test runner)
- **Health Endpoints**: `/api/health` on Express server
- **Dev Command**: `npm run dev` (Convex + Express + Vite)

## Command Architecture

### Command 1: `create-plane-ticket`

**Purpose**: Create meticulous Plane tickets with element context, images, references, and evidence requirements.

**Location**: `scripts/create-plane-ticket.cjs`

**Usage Examples**:
```bash
# Feature request
node scripts/create-plane-ticket.cjs \
  --title "Add workout video playback progress tracking" \
  --type feature \
  --priority high \
  --context "Users need to see progress when playing workout videos. Currently no progress indicator is visible during playback." \
  --images screenshots/workout-player.png,screenshots/controls.png \
  --references src/components/WorkoutPlayer.tsx,src/hooks/useWorkoutSession.ts \
  --test-specs tests/video-playback.spec.ts

# Bug report
node scripts/create-plane-ticket.cjs \
  --title "Workout session timer resets when app is backgrounded" \
  --type bug \
  --priority urgent \
  --context "Timer incorrectly resets to 0 when user backgrounds the app on Android" \
  --images screenshots/timer-bug.png \
  --references src/hooks/useWorkoutSession.ts,convex/functions.ts

# Enhancement
node scripts/create-plane-ticket.cjs \
  --title "Add dark mode support" \
  --type enhancement \
  --priority medium \
  --context "Users have requested dark mode for evening workouts"
```

**Input Parameters**:
```javascript
{
  title: string,           // Ticket title (required)
  type: string,            // feature|bug|enhancement|investigation (required)
  priority: string,        // none|low|medium|high|urgent (required)
  context: string,         // Detailed context/description (required)
  images?: string[],       // Comma-separated image paths
  references?: string[],   // Comma-separated file paths
  testSpecs?: string[],    // Comma-separated test file paths
  parent?: string,         // Parent ticket identifier (optional)
  tags?: string[]          // Additional tags (optional)
}
```

**Ticket Template Structure**:
```markdown
# {{ title }}

## Context
{{ detailed_context }}

## Current Behavior
{{ current_behavior_if_bug }}

## Expected Behavior
{{ expected_behavior }}

## Visual References
{{#if images}}
{{#each images}}
![{{ name }}]({{ url }})
{{/each}}
{{/if}}

## Code References
{{#each references}}
- [{{ this }}](path/to/{{ this }})
{{/each}}

## Evidence Required Before Completion

### Automated Testing
- [ ] All existing Playwright tests pass: `npx playwright test tests/{{ relevant_spec }}.spec.ts`
- [ ] New test coverage added for the feature/fix
- [ ] No regression in existing functionality

### Health Checks
- [ ] Application starts successfully: `npm run dev`
- [ ] Health endpoint responds: `GET http://localhost:3001/api/health`
- [ ] Convex backend is accessible

### Visual Verification
- [ ] Screenshots of working feature captured
- [ ] Before/after comparisons where applicable
- [ ] Mobile responsiveness verified (tested on 360x640 viewport)

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser DevTools
- [ ] No security vulnerabilities introduced (semgrep scan passes)

## Success Criteria
{{#each success_criteria}}
- [ ] {{ this }}
{{/each}}

## References
{{#each references}}
- [{{ this }}](path/to/{{ this }})
{{/each}}

## Definition of Done
✅ All automated tests pass
✅ All health checks pass
✅ Visual evidence captured and documented
✅ Code quality verified
✅ Success criteria met
✅ Human review approved
```

**Output**:
```javascript
{
  ticket: {
    identifier: "BB-42",
    sequence_id: 42,
    title: "Add workout video playback progress tracking",
    state: "Todo",
    priority: "high",
    labels: ["feature", "video-playback"],
    url: "http://10.0.0.112:3300/body-bridge/work-items/BB-42/"
  },
  attachments: [
    { name: "workout-player.png", url: "..." },
    { name: "controls.png", url: "..." }
  ],
  evidenceRequirements: {
    automatedTests: ["tests/video-playback.spec.ts"],
    healthChecks: ["build", "startup", "api/health"],
    visualVerification: true,
    codeQuality: ["typescript", "security"]
  }
}
```

### Command 2: `start-symphony-work`

**Purpose**: Trigger Symphony workflow to execute a Plane ticket with automatic evidence collection, verification, and state management.

**Location**: `scripts/start-symphony-work.cjs`

**Usage Examples**:
```bash
# Start Symphony for a ticket
node scripts/start-symphony-work.cjs \
  --ticket "BB-42" \
  --watch-mode

# Run verification only (manual development mode)
node scripts/start-symphony-work.cjs \
  --ticket "BB-42" \
  --verify-only

# Create ticket and immediately start Symphony
node scripts/create-plane-ticket.cjs --title "Fix login bug" --type bug --priority high | \
  xargs -I {} node scripts/start-symphony-work.cjs --ticket "{}"
```

**Input Parameters**:
```javascript
{
  ticket: string,           // Plane ticket identifier (required)
  watchMode?: boolean,      // Monitor progress in real-time
  verifyOnly?: boolean,     // Skip Symphony execution, just verify
  branchPrefix?: string     // Custom branch prefix (default: "feature/")
}
```

**Workflow Steps**:

#### Phase 1: Initialization
1. Fetch ticket details from Plane.so
2. Validate ticket is in "Todo" or "In Progress" state
3. Move ticket to "In Progress"
4. Create feature branch: `feature/BB-42-add-workout-video-playback-progress`
5. Post initialization comment to ticket

#### Phase 2: Execution
1. Start Symphony orchestrator with ticket context
2. Apply AI agent to implement requirements
3. Monitor agent progress in real-time (if `--watch-mode`)
4. Post progress updates to ticket

#### Phase 3: Evidence Collection
1. Run automated tests: `npx playwright test tests/{{ relevant_spec }}.spec.ts`
2. Capture before/after screenshots
3. Perform health checks:
   - Build: `npm run build`
   - Startup: `npm run dev`
   - Health endpoint: `GET http://localhost:3001/api/health`
4. Run code quality checks:
   - TypeScript: `npx tsc -p tsconfig.json --noEmit`
   - Security: `semgrep --config p/security-audit src convex`
   - Dead code: `npx knip`
5. Generate evidence report

#### Phase 4: Verification
1. Verify all evidence criteria met
2. Generate comprehensive evidence comment
3. Post evidence report to ticket
4. Move to appropriate state:
   - **Review**: If all verification passes
   - **Todo**: If verification fails (with failure details)

#### Phase 5: Completion
1. Request human review in "Review" state
2. Wait for human approval
3. Move to "Done" only after approval
4. Post completion summary

**State Flow**:
```
Todo → In Progress (start-symphony-work)
In Progress → Review (verification passes)
In Progress → Todo (verification fails)
Review → Done (human approval)
Review → In Progress (changes requested)
Done → (terminal state)
```

**Evidence Comment Structure**:
```markdown
## Evidence Report - {{ timestamp }}

### ✅ Automated Tests
```
Running: npx playwright test tests/video-playback.spec.ts
Result: PASSED (12/12 tests)
Duration: 45s
```

### ✅ Health Checks
- Build: ✅ PASSED
- Application Startup: ✅ PASSED
- Health Endpoint: ✅ PASSED (200 OK)
- Convex Backend: ✅ CONNECTED

### ✅ Visual Verification
- Before screenshots: ✅ Captured
- After screenshots: ✅ Captured
- Comparison: ✅ Feature working as expected

### ✅ Code Quality
- TypeScript: ✅ PASSED
- Security Scan: ✅ PASSED (0 findings)
- Dead Code: ✅ PASSED (0 issues)

## Summary
- Total Checks: 7
- Passed: 7
- Failed: 0
- Success Rate: 100%

## Next Steps
✅ All evidence collected and verified
✅ Ready for human review
👉 Please review and approve to move to "Done"

## Artifacts
- Screenshots: [View](/attachments/screenshots.zip)
- Test Results: [View](/attachments/test-results.html)
- Build Log: [View](/attachments/build.log)
```

## Technical Implementation

### Phase 1: Core Infrastructure

#### 1.1 Base Ticket Script
**File**: `scripts/create-plane-ticket.cjs`

```javascript
#!/usr/bin/env node

const args = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const path = require('path');

// Load PlaneClient from existing implementation
const { PlaneClient } = require('../symphony-mod/src/trackers/plane-client.js');

const PLANE_CONFIG = {
  api_key: 'plane_api_996fecef7f91430dac6964b212cf4274',
  base_url: 'http://10.0.0.112:3300/api/v1/',
  workspace_slug: 'body-bridge',
  project_id: '8e7bb5fa-3f95-4701-a3d0-49562b4c0f4c'
};

async function main() {
  const { title, type, priority, context, images, references, testSpecs, parent, tags } = args;

  // Validation
  if (!title || !type || !priority || !context) {
    console.error('Error: Required parameters missing');
    console.error('Usage: node create-plane-ticket.cjs --title "..." --type feature --priority high --context "..."');
    process.exit(1);
  }

  const client = new PlaneClient(PLANE_CONFIG);

  // Load template based on ticket type
  const template = loadTemplate(type);

  // Build description with evidence requirements
  const description = buildDescription(template, { title, context, references, testSpecs });

  // Create the ticket
  const ticket = await client.createWorkItem({
    name: title,
    description_html: markdownToHtml(description),
    priority: priority.toLowerCase(),
    labels: generateLabels(type, tags)
  });

  // Upload images as attachments
  if (images) {
    const imagePaths = images.split(',');
    for (const imagePath of imagePaths) {
      if (fs.existsSync(imagePath)) {
        await client.addAttachment(ticket.id, imagePath);
      }
    }
  }

  // Output ticket details
  console.log(`✓ Created ticket: ${ticket.sequence_id}`);
  console.log(`✓ Identifier: ${ticket.identifier || `${ticket.project_detail?.identifier}-${ticket.sequence_id}`}`);
  console.log(`✓ URL: ${PLANE_CONFIG.base_url.replace('/api/v1/', '')}/workspaces/${PLANE_CONFIG.workspace_slug}/work-items/${ticket.sequence_id}/`);
  console.log(`✓ State: ${ticket.state}`);
  console.log(`✓ Evidence requirements configured`);

  return ticket;
}

function loadTemplate(type) {
  const templatePath = path.join(__dirname, 'ticket-templates', `${type}.template.md`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  return fs.readFileSync(templatePath, 'utf8');
}

function buildDescription(template, { title, context, references, testSpecs }) {
  let description = template
    .replace('{{ title }}', title)
    .replace('{{ detailed_context }}', context);

  if (references) {
    const refList = references.split(',').map(r => `- [${r}](path/to/${r})`).join('\n');
    description = description.replace('{{#each references}}- [{{ this }}](path/to/{{ this }}){{/each}}', refList);
  }

  return description;
}

function generateLabels(type, tags) {
  const labels = [type];
  if (tags) {
    labels.push(...tags.split(','));
  }
  return labels;
}

function markdownToHtml(markdown) {
  // Simple markdown to HTML conversion
  return markdown
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
```

#### 1.2 Ticket Templates
**Directory**: `scripts/ticket-templates/`

**feature.template.md**:
```markdown
# Feature Request: {{ title }}

## Context
{{ detailed_context }}

## Expected Behavior
[Describe what should happen after implementation]

## Visual References
[Upload screenshots or mockups showing the desired feature]

## Code References
{{#each references}}
- [{{ this }}](path/to/{{ this }})
{{/each}}

## Evidence Required Before Completion

### Automated Testing
- [ ] All existing Playwright tests pass: `npx playwright test tests/{{ relevant_spec }}.spec.ts`
- [ ] New test coverage added for the feature
- [ ] No regression in existing functionality

### Health Checks
- [ ] Application starts successfully: `npm run dev`
- [ ] Health endpoint responds: `GET http://localhost:3001/api/health`
- [ ] Convex backend is accessible

### Visual Verification
- [ ] Screenshots of working feature captured
- [ ] Before/after comparisons where applicable
- [ ] Mobile responsiveness verified (tested on 360x640 viewport)

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser DevTools
- [ ] No security vulnerabilities introduced (semgrep scan passes)

## Success Criteria
- [ ] Feature works as expected
- [ ] Mobile responsive
- [ ] Accessible
- [ ] Performance impact minimal

## Definition of Done
✅ All automated tests pass
✅ All health checks pass
✅ Visual evidence captured and documented
✅ Code quality verified
✅ Success criteria met
✅ Human review approved
```

**bug.template.md**:
```markdown
# Bug: {{ title }}

## Context
{{ detailed_context }}

## Current Behavior
[Describe what is happening now - the bug]

## Expected Behavior
[Describe what should happen]

## Visual References
[Screenshots showing the bug]

## Code References
{{#each references}}
- [{{ this }}](path/to/{{ this }})
{{/each}}

## Evidence Required Before Completion

### Automated Testing
- [ ] All existing Playwright tests pass
- [ ] Test added to prevent regression
- [ ] Bug no longer occurs

### Health Checks
- [ ] Application starts successfully
- [ ] No console errors
- [ ] No side effects on other features

### Visual Verification
- [ ] Before screenshots showing bug
- [ ] After screenshots showing fix
- [ ] Multiple scenarios tested

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] Root cause addressed, not just symptoms
- [ ] No security vulnerabilities introduced

## Definition of Done
✅ Bug is fixed
✅ All tests pass
✅ Visual evidence of fix
✅ Root cause addressed
✅ Human review approved
```

**enhancement.template.md**:
```markdown
# Enhancement: {{ title }}

## Context
{{ detailed_context }}

## Current Behavior
[Describe current implementation]

## Proposed Enhancement
[Describe the improvement]

## Visual References
[Mockups or examples showing the enhancement]

## Code References
{{#each references}}
- [{{ this }}](path/to/{{ this }})
{{/each}}

## Evidence Required Before Completion

### Automated Testing
- [ ] All existing Playwright tests pass
- [ ] Tests added for new functionality
- [ ] No regression in existing features

### Health Checks
- [ ] Application starts successfully
- [ ] Performance impact minimal
- [ ] No new errors introduced

### Visual Verification
- [ ] Before screenshots showing current behavior
- [ ] After screenshots showing enhancement
- [ ] User experience improved

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] Code follows existing patterns
- [ ] No security vulnerabilities introduced

## Success Criteria
- [ ] Enhancement implemented as specified
- [ ] Performance maintained or improved
- [ ] User experience enhanced
- [ ] Backward compatible

## Definition of Done
✅ Enhancement implemented
✅ All tests pass
✅ Visual evidence of improvement
✅ Performance verified
✅ Human review approved
```

**investigation.template.md**:
```markdown
# Investigation: {{ title }}

## Context
{{ detailed_context }}

## Problem Statement
[What needs to be investigated?]

## Investigation Approach
[How will this be investigated?]

## Visual References
[Relevant screenshots or logs]

## Code References
{{#each references}}
- [{{ this }}](path/to/{{ this }})
{{/each}}

## Evidence Required Before Completion

### Automated Testing
- [ ] Existing tests still pass
- [ ] No regressions introduced

### Health Checks
- [ ] Application remains stable
- [ ] No crashes or errors

### Visual Verification
- [ ] Investigation documented
- [ ] Screenshots of findings
- [ ] Logs captured if applicable

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] Findings clearly documented
- [ ] Recommendations provided

## Expected Outcomes
- [ ] Root cause identified
- [ ] Impact assessed
- [ ] Recommended actions documented

## Definition of Done
✅ Investigation complete
✅ Root cause identified
✅ Findings documented
✅ Recommendations provided
✅ Human review approved
```

#### 1.3 Evidence Collector
**File**: `scripts/ticket-helpers/evidence-collector.js`

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class EvidenceCollector {
  constructor(projectRoot, ticketId) {
    this.projectRoot = projectRoot;
    this.ticketId = ticketId;
    this.evidence = [];
    this.screenshotsDir = path.join(projectRoot, 'screenshots', 'evidence', ticketId);
  }

  async collectAllEvidence() {
    console.log(`Collecting evidence for ticket ${this.ticketId}...`);

    // Create screenshots directory
    fs.mkdirSync(this.screenshotsDir, { recursive: true });

    // Collect all evidence types
    const results = {
      tests: await this.collectAutomatedTests(),
      healthChecks: await this.performHealthChecks(),
      codeQuality: await this.runCodeQualityChecks(),
      security: await this.runSecurityChecks(),
      screenshots: await this.captureScreenshots()
    };

    // Merge all evidence
    this.evidence = [
      ...results.tests,
      ...results.healthChecks,
      ...results.codeQuality,
      ...results.security,
      ...results.screenshots
    ];

    return this.generateEvidenceReport();
  }

  async collectAutomatedTests() {
    console.log('Running automated tests...');

    // Find relevant test specs based on ticket context
    const testSpecs = this.findRelevantTestSpecs();

    const results = [];

    for (const spec of testSpecs) {
      try {
        console.log(`  Running: ${spec}`);
        const output = execSync(`npx playwright test ${spec}`, {
          cwd: this.projectRoot,
          encoding: 'utf8',
          timeout: 120000
        });

        results.push({
          type: 'test',
          spec,
          status: 'passed',
          output: output,
          timestamp: new Date().toISOString()
        });

        console.log(`    ✓ PASSED`);
      } catch (error) {
        results.push({
          type: 'test',
          spec,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });

        console.log(`    ✗ FAILED: ${error.message.split('\n')[0]}`);
      }
    }

    return results;
  }

  async performHealthChecks() {
    console.log('Performing health checks...');

    const checks = [];

    // Application build check
    try {
      console.log('  Building application...');
      execSync('npm run build', { cwd: this.projectRoot, stdio: 'pipe' });
      checks.push({ type: 'build', status: 'passed', timestamp: new Date().toISOString() });
      console.log('    ✓ Build successful');
    } catch (error) {
      checks.push({
        type: 'build',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.log(`    ✗ Build failed: ${error.message.split('\n')[0]}`);
    }

    // Health endpoint check (requires server to be running)
    try {
      console.log('  Checking health endpoint...');
      const response = await fetch('http://localhost:3001/api/health', {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        const health = await response.json();
        checks.push({
          type: 'health-endpoint',
          status: 'passed',
          data: health,
          timestamp: new Date().toISOString()
        });
        console.log(`    ✓ Health endpoint: ${response.status} OK`);
      } else {
        checks.push({
          type: 'health-endpoint',
          status: 'failed',
          code: response.status,
          timestamp: new Date().toISOString()
        });
        console.log(`    ✗ Health endpoint: ${response.status}`);
      }
    } catch (error) {
      checks.push({
        type: 'health-endpoint',
        status: 'skipped',
        reason: 'Server not running',
        timestamp: new Date().toISOString()
      });
      console.log('    ⊘ Health endpoint skipped (server not running)');
    }

    return checks;
  }

  async runCodeQualityChecks() {
    console.log('Running code quality checks...');

    const checks = [];

    // TypeScript check
    try {
      console.log('  Checking TypeScript...');
      execSync('npx tsc -p tsconfig.json --noEmit', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      checks.push({ type: 'typescript', status: 'passed', timestamp: new Date().toISOString() });
      console.log('    ✓ TypeScript check passed');
    } catch (error) {
      checks.push({
        type: 'typescript',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.log(`    ✗ TypeScript check failed`);
    }

    // Dead code check
    try {
      console.log('  Checking for dead code...');
      execSync('npx knip', { cwd: this.projectRoot, stdio: 'pipe' });
      checks.push({ type: 'dead-code', status: 'passed', timestamp: new Date().toISOString() });
      console.log('    ✓ No dead code found');
    } catch (error) {
      checks.push({
        type: 'dead-code',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.log(`    ✗ Dead code check failed`);
    }

    return checks;
  }

  async runSecurityChecks() {
    console.log('Running security checks...');

    const checks = [];

    // Semgrep security scan
    try {
      console.log('  Running Semgrep scan...');
      execSync('semgrep --config p/security-audit src convex', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      checks.push({ type: 'security', status: 'passed', findings: 0, timestamp: new Date().toISOString() });
      console.log('    ✓ No security findings');
    } catch (error) {
      // Semgrep exits with error code if findings found
      checks.push({
        type: 'security',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.log(`    ✗ Security findings detected`);
    }

    return checks;
  }

  async captureScreenshots() {
    console.log('Capturing screenshots...');

    const screenshots = [];

    // Use Playwright to capture screenshots of key pages
    const keyPages = [
      { url: 'http://localhost:7770', name: 'home' },
      { url: 'http://localhost:7770/workouts', name: 'workouts' },
      { url: 'http://localhost:7770/profile', name: 'profile' }
    ];

    const script = `
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  ${keyPages.map(({ url, name }) => `
  try {
    await page.goto('${url}');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: '${this.screenshotsDir}/${name}.png',
      fullPage: true
    });
    console.log('${name} screenshot captured');
  } catch (error) {
    console.log('Failed to capture ${name}:', error.message);
  }
  `).join('\n')}

  await browser.close();
})();
    `;

    try {
      const scriptPath = path.join(this.screenshotsDir, 'capture-screenshots.js');
      fs.writeFileSync(scriptPath, script);

      execSync(`node ${scriptPath}`, {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });

      // Find captured screenshots
      const files = fs.readdirSync(this.screenshotsDir).filter(f => f.endsWith('.png'));
      screenshots.push(...files.map(f => ({
        type: 'screenshot',
        name: f,
        path: path.join(this.screenshotsDir, f),
        timestamp: new Date().toISOString()
      })));

      console.log(`    ✓ Captured ${screenshots.length} screenshots`);
    } catch (error) {
      console.log(`    ✗ Screenshot capture failed: ${error.message}`);
    }

    return screenshots;
  }

  findRelevantTestSpecs() {
    // Default test specs for Body-Bridge
    const defaultSpecs = [
      'tests/onboarding.spec.ts',
      'tests/exercise-picker.spec.ts',
      'tests/workout-builder.spec.ts'
    ];

    // Look for test specs based on ticket context
    const allSpecs = [];
    const testsDir = path.join(this.projectRoot, 'tests');

    if (fs.existsSync(testsDir)) {
      const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.spec.ts'));
      allSpecs.push(...files.map(f => `tests/${f}`));
    }

    // Return defaults if no specific specs found
    return allSpecs.length > 0 ? allSpecs : defaultSpecs;
  }

  generateEvidenceReport() {
    const report = {
      ticketId: this.ticketId,
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      details: {
        tests: this.evidence.filter(e => e.type === 'test'),
        healthChecks: this.evidence.filter(e => e.type === 'build' || e.type === 'health-endpoint'),
        codeQuality: this.evidence.filter(e => e.type === 'typescript' || e.type === 'dead-code'),
        security: this.evidence.filter(e => e.type === 'security'),
        screenshots: this.evidence.filter(e => e.type === 'screenshot')
      },
      artifacts: {
        screenshotsDir: this.screenshotsDir
      }
    };

    return report;
  }

  generateSummary() {
    const totalChecks = this.evidence.length;
    const passedChecks = this.evidence.filter(e => e.status === 'passed').length;
    const failedChecks = this.evidence.filter(e => e.status === 'failed').length;
    const skippedChecks = this.evidence.filter(e => e.status === 'skipped').length;

    const allPassed = passedChecks === totalChecks;

    return {
      allEvidenceCollected: true,
      allChecksPassed: allPassed,
      totalChecks,
      passedChecks,
      failedChecks,
      skippedChecks,
      successRate: totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0
    };
  }
}

module.exports = { EvidenceCollector };
```

#### 1.4 Reference Builder
**File**: `scripts/ticket-helpers/reference-builder.js`

```javascript
const fs = require('fs');
const path = require('path');

class ReferenceBuilder {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  buildReferences(filePaths) {
    const references = [];

    for (const filePath of filePaths) {
      const fullPath = path.join(this.projectRoot, filePath);

      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        const ext = path.extname(fullPath);

        references.push({
          path: filePath,
          fullPath,
          type: this.getFileType(ext),
          size: stats.size,
          modified: stats.mtime.toISOString(),
          url: this.generateGitHubUrl(filePath)
        });
      }
    }

    return references;
  }

  generateMarkdown(references) {
    let markdown = '## Code References\n\n';

    for (const ref of references) {
      markdown += `- [${ref.path}](${ref.url}) (${this.getFileIcon(ref.type)})\n`;
    }

    return markdown;
  }

  getFileType(ext) {
    const types = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.css': 'stylesheet',
      '.scss': 'stylesheet',
      '.md': 'documentation',
      '.json': 'config'
    };

    return types[ext] || 'file';
  }

  getFileIcon(type) {
    const icons = {
      typescript: 'TS',
      javascript: 'JS',
      stylesheet: 'CSS',
      documentation: 'DOC',
      config: 'CONF',
      file: 'FILE'
    };

    return icons[type] || 'FILE';
  }

  generateGitHubUrl(filePath) {
    // Assumes GitHub repository - adjust for your repo
    const branch = 'main';
    return `https://github.com/your-org/body-bridge-fitness/blob/${branch}/${filePath}`;
  }

  extractRelatedFiles(ticketContext) {
    // Analyze ticket context to find potentially related files
    const relatedFiles = [];

    // Look for component mentions
    const componentMatches = ticketContext.match(/\b[A-Z][a-zA-Z]*Component\b/g);
    if (componentMatches) {
      relatedFiles.push(...componentMatches.map(c => `src/components/${c}.tsx`));
    }

    // Look for hook mentions
    const hookMatches = ticketContext.match(/\buse[A-Z][a-zA-Z]*\b/g);
    if (hookMatches) {
      relatedFiles.push(...hookMatches.map(h => `src/hooks/${h}.ts`));
    }

    // Look for Convex function mentions
    if (ticketContext.toLowerCase().includes('convex')) {
      relatedFiles.push('convex/functions.ts');
    }

    return relatedFiles.filter(f => fs.existsSync(path.join(this.projectRoot, f)));
  }
}

module.exports = { ReferenceBuilder };
```

#### 1.5 Context Gatherer
**File**: `scripts/ticket-helpers/context-gatherer.js`

```javascript
const fs = require('fs');
const path = require('path');

class ContextGatherer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  async gatherImageContext(imagePaths) {
    const contexts = [];

    for (const imagePath of imagePaths) {
      const fullPath = path.join(this.projectRoot, imagePath);

      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        const dimensions = await this.getImageDimensions(fullPath);

        contexts.push({
          path: imagePath,
          fullPath,
          size: stats.size,
          dimensions,
          type: this.getImageType(imagePath),
          description: this.generateImageDescription(imagePath)
        });
      }
    }

    return contexts;
  }

  getImageDimensions(imagePath) {
    // In a real implementation, use sharp or jimp to get dimensions
    // For now, return placeholder
    return { width: 0, height: 0 };
  }

  getImageType(imagePath) {
    const ext = path.extname(imagePath).toLowerCase();

    const types = {
      '.png': 'screenshot',
      '.jpg': 'screenshot',
      '.jpeg': 'screenshot',
      '.gif': 'animated',
      '.svg': 'diagram',
      '.mp4': 'video'
    };

    return types[ext] || 'image';
  }

  generateImageDescription(imagePath) {
    const filename = path.basename(imagePath);
    const words = filename.replace(/\.(png|jpg|jpeg|gif|svg|mp4)$/, '').split(/[-_\s]+/);

    return {
      filename,
      keywords: words,
      inferredContext: this.inferContextFromFilename(filename)
    };
  }

  inferContextFromFilename(filename) {
    const lower = filename.toLowerCase();

    const contexts = {
      'home': 'Home page view',
      'login': 'Authentication screen',
      'signup': 'Registration screen',
      'profile': 'User profile page',
      'workout': 'Workout-related screen',
      'exercise': 'Exercise selection or detail',
      'timer': 'Timer interface',
      'player': 'Media player interface',
      'settings': 'Settings screen',
      'menu': 'Navigation menu'
    };

    for (const [key, value] of Object.entries(contexts)) {
      if (lower.includes(key)) {
        return value;
      }
    }

    return 'General UI element';
  }

  async gatherCodeContext(references) {
    const contexts = [];

    for (const ref of references) {
      const fullPath = path.join(this.projectRoot, ref);

      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');

        contexts.push({
          path: ref,
          fullPath,
          language: this.detectLanguage(fullPath),
          lines: content.split('\n').length,
          imports: this.extractImports(content),
          exports: this.extractExports(content),
          complexity: this.estimateComplexity(content)
        });
      }
    }

    return contexts;
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath);

    const languages = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.css': 'css',
      '.scss': 'scss',
      '.html': 'html',
      '.md': 'markdown'
    };

    return languages[ext] || 'unknown';
  }

  extractImports(content) {
    // Extract import statements
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  extractExports(content) {
    // Extract export statements
    const exports = [];

    // Named exports
    const namedExportRegex = /export\s+(?:const|function|class)\s+(\w+)/g;
    let match;

    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push({ type: 'named', name: match[1] });
    }

    // Default exports
    if (/export\s+default/.test(content)) {
      exports.push({ type: 'default' });
    }

    return exports;
  }

  estimateComplexity(content) {
    // Simple heuristic: count functions, classes, and control flow
    const functionCount = (content.match(/function\s+\w+/g) || []).length;
    const classCount = (content.match(/class\s+\w+/g) || []).length;
    const ifCount = (content.match(/\bif\s*\(/g) || []).length;
    const loopCount = (content.match(/\b(for|while)\s*\(/g) || []).length;

    return {
      score: functionCount + classCount + ifCount + loopCount,
      functions: functionCount,
      classes: classCount,
      conditionals: ifCount,
      loops: loopCount
    };
  }
}

module.exports = { ContextGatherer };
```

### Phase 2: Symphony Integration

#### 2.1 Symphony Executor
**File**: `scripts/symphony-orchestrator/executor.js`

```javascript
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { EvidenceCollector } = require('../ticket-helpers/evidence-collector.js');
const { PlaneClient } = require('../../symphony-mod/src/trackers/plane-client.js');

const PLANE_CONFIG = {
  api_key: 'plane_api_996fecef7f91430dac6964b212cf4274',
  base_url: 'http://10.0.0.112:3300/api/v1/',
  workspace_slug: 'body-bridge',
  project_id: '8e7bb5fa-3f95-4701-a3d0-49562b4c0f4c'
};

class SymphonyExecutor {
  constructor(ticketId, workspaceRoot, options = {}) {
    this.ticketId = ticketId;
    this.workspaceRoot = workspaceRoot;
    this.watchMode = options.watchMode || false;
    this.branchPrefix = options.branchPrefix || 'feature/';
    this.process = null;
    this.client = new PlaneClient(PLANE_CONFIG);
  }

  async start() {
    console.log(`Starting Symphony workflow for ticket ${this.ticketId}...`);

    try {
      // Phase 1: Initialization
      await this.initialize();

      // Phase 2: Execute Symphony
      await this.execute();

      // Phase 3: Collect Evidence
      await this.collectEvidence();

      console.log('Symphony workflow completed successfully');
    } catch (error) {
      console.error('Symphony workflow failed:', error.message);
      await this.handleFailure(error);
    }
  }

  async initialize() {
    console.log('Phase 1: Initialization...');

    // Fetch ticket details
    const ticket = await this.fetchTicket();
    console.log(`  Ticket: ${ticket.sequence_id} - ${ticket.name}`);

    // Validate ticket state
    const validStates = ['Todo', 'In Progress'];
    if (!validStates.includes(ticket.state)) {
      throw new Error(`Ticket must be in one of: ${validStates.join(', ')}`);
    }

    // Move to In Progress
    await this.updateTicketState('In Progress');
    console.log('  ✓ Ticket moved to In Progress');

    // Create feature branch
    await this.createBranch();
    console.log('  ✓ Feature branch created');

    // Post initialization comment
    await this.postComment(`
## Symphony Started
Started Symphony workflow for this ticket.

**Branch**: ${this.branchName}
**Watch Mode**: ${this.watchMode ? 'Enabled' : 'Disabled'}

Agent is now analyzing requirements and implementing changes...
    `);
  }

  async execute() {
    console.log('Phase 2: Executing Symphony...');

    // Start Symphony orchestrator
    const workflowConfig = path.join(
      this.workspaceRoot,
      'symphony-integration/implementation/workflow-configs/body-bridge-workflow.md'
    );

    const env = {
      ...process.env,
      SYMPHONY_TICKET_ID: this.ticketId
    };

    return new Promise((resolve, reject) => {
      this.process = spawn('symphony', [workflowConfig], {
        cwd: this.workspaceRoot,
        env,
        stdio: this.watchMode ? 'inherit' : 'pipe'
      });

      let stdout = '';
      let stderr = '';

      if (!this.watchMode) {
        this.process.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        this.process.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      this.process.on('close', async (code) => {
        console.log(`Symphony process exited with code ${code}`);

        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Symphony failed with exit code ${code}${stderr ? ': ' + stderr : ''}`));
        }
      });

      this.process.on('error', (error) => {
        reject(error);
      });

      // Monitor progress and post updates
      if (this.watchMode) {
        this.monitorProgress();
      }
    });
  }

  async collectEvidence() {
    console.log('Phase 3: Collecting Evidence...');

    // Post evidence collection started comment
    await this.postComment(`
## Evidence Collection Started
Collecting evidence to verify ticket completion...

This may take several minutes...
    `);

    // Collect all evidence
    const collector = new EvidenceCollector(this.workspaceRoot, this.ticketId);
    const evidence = await collector.collectAllEvidence();

    // Generate report
    const report = evidence.summary;

    // Post evidence report
    await this.postEvidenceComment(evidence);

    // Verify results
    if (report.allChecksPassed) {
      console.log('  ✓ All evidence collected and verified');
      await this.handleSuccess(evidence);
    } else {
      console.log(`  ✗ Evidence verification failed (${report.failedChecks} failures)`);
      await this.handleFailure(new Error('Evidence verification failed'), evidence);
    }
  }

  async handleSuccess(evidence) {
    console.log('Symphony completed successfully');

    // Move to Review for human approval
    await this.updateTicketState('Review');
    console.log('  ✓ Ticket moved to Review');

    // Post review request
    await this.postReviewRequest(evidence);
  }

  async handleFailure(error, evidence = null) {
    console.error('Symphony failed:', error.message);

    // Move back to Todo with notes
    await this.updateTicketState('Todo');
    console.log('  ✓ Ticket moved back to Todo');

    // Post failure comment
    await this.postFailureComment(error, evidence);
  }

  async fetchTicket() {
    const ticket = await this.client.getWorkItemByIdentifier(this.ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${this.ticketId} not found`);
    }
    return ticket;
  }

  async updateTicketState(stateName) {
    const ticket = await this.fetchTicket();
    await this.client.updateWorkItem(ticket.id, { state: stateName });
  }

  async createBranch() {
    const ticket = await this.fetchTicket();

    // Generate branch name from ticket title
    const slug = ticket.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);

    this.branchName = `${this.branchPrefix}${ticket.sequence_id}-${slug}`;

    // Switch to main branch first
    execSync('git checkout main', { cwd: this.workspaceRoot, stdio: 'pipe' });
    execSync('git pull', { cwd: this.workspaceRoot, stdio: 'pipe' });

    // Create and checkout new branch
    execSync(`git checkout -b ${this.branchName}`, { cwd: this.workspaceRoot, stdio: 'pipe' });
  }

  async postComment(commentText) {
    const ticket = await this.fetchTicket();
    await this.client.createComment(ticket.id, commentText);
  }

  async postEvidenceComment(evidence) {
    const report = evidence.generateEvidenceReport();
    const comment = this.generateEvidenceHtml(report);
    await this.postComment(comment);
  }

  generateEvidenceHtml(report) {
    const { summary, details } = report;

    let html = `
## Evidence Report - ${report.timestamp}

### Summary
- Total Checks: ${summary.totalChecks}
- Passed: ${summary.passedChecks}
- Failed: ${summary.failedChecks}
- Skipped: ${summary.skippedChecks}
- Success Rate: ${summary.successRate}%

`;

    // Tests section
    html += '### ✅ Automated Tests\n';
    details.tests.forEach(test => {
      const icon = test.status === 'passed' ? '✅' : '✗';
      html += `${icon} ${test.spec}\n`;
      if (test.status === 'failed') {
        html += `   Error: ${test.error.split('\n')[0]}\n`;
      }
    });

    // Health checks section
    html += '\n### ✅ Health Checks\n';
    details.healthChecks.forEach(check => {
      const icon = check.status === 'passed' ? '✅' : check.status === 'skipped' ? '⊘' : '✗';
      html += `${icon} ${check.type}: ${check.status.toUpperCase()}\n`;
      if (check.status === 'skipped') {
        html += `   Reason: ${check.reason}\n`;
      }
    });

    // Code quality section
    html += '\n### ✅ Code Quality\n';
    details.codeQuality.forEach(check => {
      const icon = check.status === 'passed' ? '✅' : '✗';
      html += `${icon} ${check.type}: ${check.status.toUpperCase()}\n`;
    });

    // Security section
    html += '\n### ✅ Security\n';
    details.security.forEach(check => {
      const icon = check.status === 'passed' ? '✅' : '✗';
      html += `${icon} Security Scan: ${check.status.toUpperCase()}\n`;
      if (check.findings !== undefined) {
        html += `   Findings: ${check.findings}\n`;
      }
    });

    // Screenshots section
    if (details.screenshots.length > 0) {
      html += '\n### 📸 Visual Evidence\n';
      details.screenshots.forEach(screenshot => {
        html += `- ${screenshot.name}\n`;
      });
    }

    // Next steps
    if (summary.allChecksPassed) {
      html += `
## Next Steps
✅ All evidence collected and verified
✅ Ready for human review
👉 Please review and approve to move to "Done"
`;
    } else {
      html += `
## Issues Found
❌ ${summary.failedChecks} check(s) failed
👉 Please review the failures and move back to "Todo" to re-run
`;
    }

    return html;
  }

  async postReviewRequest(evidence) {
    const report = evidence.generateEvidenceReport();

    await this.postComment(`
## Ready for Review 🎯

This ticket has completed Symphony execution and all verification checks have passed.

**Branch**: ${this.branchName}
**Success Rate**: ${report.summary.successRate}%

### Evidence Summary
- Automated Tests: ✅ PASSED
- Health Checks: ✅ PASSED
- Code Quality: ✅ PASSED
- Security: ✅ PASSED

### What Changed
[Summary of changes made by Symphony agent]

### How to Verify
1. Check out the branch: \`git checkout ${this.branchName}\`
2. Start the app: \`npm run dev\`
3. Review the changes
4. If approved, move ticket to "Done"

### Screenshots
${report.details.screenshots.map(s => `- ${s.name}`).join('\n')}

---

👀 Please review the changes and move to "Done" if approved.
    `);
  }

  async postFailureComment(error, evidence = null) {
    let comment = `
## Symphony Failed ❌

Symphony workflow execution failed.

**Error**: ${error.message}

`;

    if (evidence) {
      const report = evidence.generateEvidenceReport();
      comment += `**Success Rate**: ${report.summary.successRate}%\n\n`;
      comment += `**Failed Checks**: ${report.summary.failedChecks}\n\n`;
    }

    comment += `
### Next Steps
1. Review the error above
2. Check the branch: ${this.branchName}
3. Fix the issues
4. Move ticket back to "In Progress" to re-run Symphony
    `;

    await this.postComment(comment);
  }

  async monitorProgress() {
    // Periodically check progress and post updates
    // This could poll for file changes, check Git status, etc.
    console.log('Progress monitoring enabled...');
  }
}

module.exports = { SymphonyExecutor };
```

#### 2.4 Progress Monitor
**File**: `scripts/symphony-orchestrator/progress-monitor.js`

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProgressMonitor {
  constructor(ticketId, workspaceRoot, planeClient) {
    this.ticketId = ticketId;
    this.workspaceRoot = workspaceRoot;
    this.planeClient = planeClient;
    this.lastCommit = null;
    this.lastFileCount = null;
    this.monitoringInterval = null;
    this.startTime = Date.now();
  }

  async start(intervalMs = 30000) {
    console.log('Starting progress monitoring...');

    // Capture initial state
    this.lastCommit = this.getCurrentCommit();
    this.lastFileCount = this.countChangedFiles();

    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.checkProgress();
    }, intervalMs);
  }

  async checkProgress() {
    try {
      // Check for new commits
      const currentCommit = this.getCurrentCommit();
      if (currentCommit !== this.lastCommit) {
        await this.postCommitUpdate(currentCommit);
        this.lastCommit = currentCommit;
      }

      // Check for file changes
      const currentFileCount = this.countChangedFiles();
      if (currentFileCount !== this.lastFileCount) {
        await this.postFileUpdate(currentFileCount);
        this.lastFileCount = currentFileCount;
      }

      // Check elapsed time
      const elapsed = Date.now() - this.startTime;
      if (elapsed > 60000) { // More than 1 minute
        await this.postTimeUpdate(elapsed);
      }
    } catch (error) {
      console.error('Progress monitoring error:', error.message);
    }
  }

  getCurrentCommit() {
    try {
      const hash = execSync('git rev-parse HEAD', {
        cwd: this.workspaceRoot,
        encoding: 'utf8'
      }).trim();

      const message = execSync('git log -1 --pretty=%s', {
        cwd: this.workspaceRoot,
        encoding: 'utf8'
      }).trim();

      return { hash, message };
    } catch (error) {
      return null;
    }
  }

  countChangedFiles() {
    try {
      const output = execSync('git status --porcelain', {
        cwd: this.workspaceRoot,
        encoding: 'utf8'
      });

      return output.split('\n').filter(line => line.trim()).length;
    } catch (error) {
      return 0;
    }
  }

  async postCommitUpdate(commit) {
    const comment = `
## Progress Update: New Commit

**Commit**: \`${commit.hash.substring(0, 8)}\`
**Message**: ${commit.message}

Agent has committed changes. Development is progressing...
    `;

    await this.postComment(comment);
  }

  async postFileUpdate(fileCount) {
    const comment = `
## Progress Update: File Changes

**Files Modified**: ${fileCount}

Agent is working on the implementation. ${fileCount} files have been modified so far.
    `;

    await this.postComment(comment);
  }

  async postTimeUpdate(elapsedMs) {
    const minutes = Math.floor(elapsedMs / 60000);
    const seconds = Math.floor((elapsedMs % 60000) / 1000);

    const comment = `
## Progress Update: Time Elapsed

**Elapsed Time**: ${minutes}m ${seconds}s

Agent continues working on the implementation. This is taking longer than expected - may indicate complexity or blockers.
    `;

    await this.postComment(comment);
  }

  async postComment(commentText) {
    const ticket = await this.planeClient.getWorkItemByIdentifier(this.ticketId);
    if (ticket) {
      await this.planeClient.createComment(ticket.id, commentText);
    }
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Progress monitoring stopped');
    }
  }

  async finalize() {
    this.stop();

    // Post final summary
    const finalCommit = this.getCurrentCommit();
    const finalFileCount = this.countChangedFiles();
    const elapsed = Date.now() - this.startTime;

    const comment = `
## Progress Summary

**Total Time**: ${Math.floor(elapsed / 60000)}m ${Math.floor((elapsed % 60000) / 1000)}s
**Final Commit**: ${finalCommit ? finalCommit.hash.substring(0, 8) : 'N/A'}
**Total Files Modified**: ${finalFileCount}

Workflow execution completed.
    `;

    await this.postComment(comment);
  }
}

module.exports = { ProgressMonitor };
```

#### 2.5 Evidence Logger
**File**: `scripts/symphony-orchestrator/evidence-logger.js`

```javascript
const fs = require('fs');
const path = require('path');

class EvidenceLogger {
  constructor(ticketId, workspaceRoot, planeClient) {
    this.ticketId = ticketId;
    this.workspaceRoot = workspaceRoot;
    this.planeClient = planeClient;
    this.logDir = path.join(workspaceRoot, '.symphony', 'evidence', ticketId);
    this.logs = [];
  }

  async initialize() {
    // Create log directory
    fs.mkdirSync(this.logDir, { recursive: true });

    // Initialize log file
    this.logFile = path.join(this.logDir, 'evidence.log');
    this.clearLogFile();

    this.log('INFO', 'Evidence logger initialized');
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level, message, data };

    this.logs.push(entry);

    // Write to file
    const logLine = `[${timestamp}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;
    fs.appendFileSync(this.logFile, logLine);

    // Also log to console
    if (level === 'ERROR') {
      console.error(`[${level}] ${message}`);
    } else {
      console.log(`[${level}] ${message}`);
    }
  }

  clearLogFile() {
    if (fs.existsSync(this.logFile)) {
      fs.unlinkSync(this.logFile);
    }
  }

  async logEvidence(evidenceType, details) {
    this.log('INFO', `Evidence collected: ${evidenceType}`, details);

    // Save detailed evidence to JSON file
    const evidenceFile = path.join(this.logDir, `${evidenceType}.json`);
    fs.writeFileSync(evidenceFile, JSON.stringify(details, null, 2));
  }

  async logTestResult(testSpec, result) {
    this.log('INFO', `Test result for ${testSpec}`, result);

    const testResultsFile = path.join(this.logDir, 'test-results.json');
    let testResults = {};

    if (fs.existsSync(testResultsFile)) {
      testResults = JSON.parse(fs.readFileSync(testResultsFile, 'utf8'));
    }

    testResults[testSpec] = result;
    fs.writeFileSync(testResultsFile, JSON.stringify(testResults, null, 2));
  }

  async logHealthCheck(checkType, result) {
    this.log('INFO', `Health check: ${checkType}`, result);

    const healthResultsFile = path.join(this.logDir, 'health-checks.json');
    let healthResults = {};

    if (fs.existsSync(healthResultsFile)) {
      healthResults = JSON.parse(fs.readFileSync(healthResultsFile, 'utf8'));
    }

    healthResults[checkType] = result;
    fs.writeFileSync(healthResultsFile, JSON.stringify(healthResults, null, 2));
  }

  async logScreenshot(screenshotName, screenshotPath) {
    this.log('INFO', `Screenshot captured: ${screenshotName}`, { path: screenshotPath });

    const screenshotsFile = path.join(this.logDir, 'screenshots.json');
    let screenshots = [];

    if (fs.existsSync(screenshotsFile)) {
      screenshots = JSON.parse(fs.readFileSync(screenshotsFile, 'utf8'));
    }

    screenshots.push({
      name: screenshotName,
      path: screenshotPath,
      timestamp: new Date().toISOString()
    });

    fs.writeFileSync(screenshotsFile, JSON.stringify(screenshots, null, 2));
  }

  async logError(error, context = {}) {
    this.log('ERROR', error.message, {
      stack: error.stack,
      context
    });

    const errorsFile = path.join(this.logDir, 'errors.json');
    let errors = [];

    if (fs.existsSync(errorsFile)) {
      errors = JSON.parse(fs.readFileSync(errorsFile, 'utf8'));
    }

    errors.push({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });

    fs.writeFileSync(errorsFile, JSON.stringify(errors, null, 2));
  }

  async logArtifacts(artifacts) {
    this.log('INFO', 'Artifacts generated', artifacts);

    const artifactsFile = path.join(this.logDir, 'artifacts.json');
    fs.writeFileSync(artifactsFile, JSON.stringify(artifacts, null, 2));
  }

  async generateReport() {
    const report = {
      ticketId: this.ticketId,
      timestamp: new Date().toISOString(),
      logs: this.logs,
      artifacts: {
        logFile: this.logFile,
        testResults: path.join(this.logDir, 'test-results.json'),
        healthChecks: path.join(this.logDir, 'health-checks.json'),
        screenshots: path.join(this.logDir, 'screenshots.json'),
        errors: path.join(this.logDir, 'errors.json'),
        artifacts: path.join(this.logDir, 'artifacts.json')
      },
      summary: this.generateSummary()
    };

    // Save report
    const reportFile = path.join(this.logDir, 'report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    return report;
  }

  generateSummary() {
    const summary = {
      totalLogs: this.logs.length,
      errors: this.logs.filter(l => l.level === 'ERROR').length,
      warnings: this.logs.filter(l => l.level === 'WARN').length,
      info: this.logs.filter(l => l.level === 'INFO').length
    };

    return summary;
  }

  async postLogSummaryToTicket() {
    const report = await this.generateReport();
    const summary = report.summary;

    const comment = `
## Evidence Collection Log Summary

**Total Logs**: ${summary.totalLogs}
**Errors**: ${summary.errors}
**Warnings**: ${summary.warnings}
**Info**: ${summary.info}

### Artifacts
- Test Results: Available
- Health Checks: Available
- Screenshots: Available
- Errors: ${summary.errors > 0 ? 'Available' : 'None'}

### Log Location
Evidence logs saved to: \`.symphony/evidence/${this.ticketId}/\`
    `;

    const ticket = await this.planeClient.getWorkItemByIdentifier(this.ticketId);
    if (ticket) {
      await this.planeClient.createComment(ticket.id, comment);
    }
  }

  async cleanup() {
    // Archive old logs if needed
    this.log('INFO', 'Evidence logger cleanup complete');
  }
}

module.exports = { EvidenceLogger };
```

#### 2.2 Verification Runner
**File**: `scripts/symphony-orchestrator/verification-runner.js`

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class VerificationRunner {
  constructor(workspaceRoot, ticketId) {
    this.workspaceRoot = workspaceRoot;
    this.ticketId = ticketId;
    this.results = [];
  }

  async runAllVerifications() {
    console.log('Running all verification checks...');

    this.results = {
      tests: await this.runTests(),
      healthChecks: await this.runHealthChecks(),
      codeQuality: await this.runCodeQualityChecks(),
      security: await this.runSecurityChecks()
    };

    return this.generateReport();
  }

  async runTests() {
    console.log('Running automated tests...');

    // Find all test specs
    const testsDir = path.join(this.workspaceRoot, 'tests');
    const testFiles = [];

    if (fs.existsSync(testsDir)) {
      const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.spec.ts'));
      testFiles.push(...files.map(f => `tests/${f}`));
    }

    const results = [];

    for (const file of testFiles) {
      try {
        console.log(`  Running: ${file}`);
        execSync(`npx playwright test ${file}`, {
          cwd: this.workspaceRoot,
          encoding: 'utf8',
          timeout: 120000,
          stdio: 'pipe'
        });
        results.push({ file, status: 'passed' });
        console.log(`    ✓ PASSED`);
      } catch (error) {
        results.push({
          file,
          status: 'failed',
          error: error.message
        });
        console.log(`    ✗ FAILED`);
      }
    }

    return results;
  }

  async runHealthChecks() {
    console.log('Running health checks...');

    const checks = [];

    // Build check
    try {
      console.log('  Checking build...');
      execSync('npm run build', { cwd: this.workspaceRoot, stdio: 'pipe' });
      checks.push({ type: 'build', status: 'passed' });
      console.log('    ✓ Build successful');
    } catch (error) {
      checks.push({
        type: 'build',
        status: 'failed',
        error: error.message
      });
      console.log(`    ✗ Build failed`);
    }

    // Health endpoint
    try {
      console.log('  Checking health endpoint...');
      const response = await fetch('http://localhost:3001/api/health', {
        method: 'GET',
        timeout: 5000
      });
      if (response.ok) {
        const health = await response.json();
        checks.push({ type: 'health-endpoint', status: 'passed', data: health });
        console.log(`    ✓ Health endpoint: ${response.status} OK`);
      } else {
        checks.push({ type: 'health-endpoint', status: 'failed', code: response.status });
      }
    } catch (error) {
      checks.push({
        type: 'health-endpoint',
        status: 'skipped',
        reason: 'Server not running'
      });
    }

    return checks;
  }

  async runCodeQualityChecks() {
    console.log('Running code quality checks...');

    const checks = [];

    // TypeScript check
    try {
      console.log('  Checking TypeScript...');
      execSync('npx tsc -p tsconfig.json --noEmit', {
        cwd: this.workspaceRoot,
        stdio: 'pipe'
      });
      checks.push({ type: 'typescript', status: 'passed' });
      console.log('    ✓ TypeScript check passed');
    } catch (error) {
      checks.push({
        type: 'typescript',
        status: 'failed',
        error: error.message
      });
    }

    // Dead code check
    try {
      console.log('  Checking for dead code...');
      execSync('npx knip', { cwd: this.workspaceRoot, stdio: 'pipe' });
      checks.push({ type: 'dead-code', status: 'passed' });
      console.log('    ✓ No dead code found');
    } catch (error) {
      checks.push({
        type: 'dead-code',
        status: 'failed',
        error: error.message
      });
    }

    return checks;
  }

  async runSecurityChecks() {
    console.log('Running security checks...');

    const checks = [];

    try {
      console.log('  Running Semgrep scan...');
      execSync('semgrep --config p/security-audit src convex', {
        cwd: this.workspaceRoot,
        stdio: 'pipe'
      });
      checks.push({ type: 'security', status: 'passed', findings: 0 });
      console.log('    ✓ No security findings');
    } catch (error) {
      checks.push({
        type: 'security',
        status: 'failed',
        error: error.message
      });
    }

    return checks;
  }

  generateReport() {
    const allChecks = Object.values(this.results).flat();
    const passedChecks = allChecks.filter(r => r.status === 'passed').length;
    const failedChecks = allChecks.filter(r => r.status === 'failed').length;
    const skippedChecks = allChecks.filter(r => r.status === 'skipped').length;

    return {
      allPassed: passedChecks === allChecks.length,
      timestamp: new Date().toISOString(),
      summary: {
        total: allChecks.length,
        passed: passedChecks,
        failed: failedChecks,
        skipped: skippedChecks,
        successRate: allChecks.length > 0 ? Math.round((passedChecks / allChecks.length) * 100) : 0
      },
      details: this.results
    };
  }
}

module.exports = { VerificationRunner };
```

#### 2.3 Main Symphony Work Script
**File**: `scripts/start-symphony-work.cjs`

```javascript
#!/usr/bin/env node

const args = require('minimist')(process.argv.slice(2));
const path = require('path');

const { SymphonyExecutor } = require('./symphony-orchestrator/executor.js');

async function main() {
  const { ticket, watchMode, verifyOnly, branchPrefix } = args;

  // Validation
  if (!ticket) {
    console.error('Error: --ticket parameter is required');
    console.error('Usage: node start-symphony-work.cjs --ticket BB-42 [--watch-mode] [--verify-only]');
    process.exit(1);
  }

  const workspaceRoot = process.cwd();
  const options = {
    watchMode: watchMode || false,
    branchPrefix: branchPrefix || 'feature/'
  };

  const executor = new SymphonyExecutor(ticket, workspaceRoot, options);

  try {
    await executor.start();
    console.log('Symphony workflow completed successfully');
  } catch (error) {
    console.error('Symphony workflow failed:', error.message);
    process.exit(1);
  }
}

main();
```

### Phase 3: Configuration & Integration

#### 3.1 Environment Configuration
**File**: `.env.symphony`

```env
# Plane.so Configuration
PLANE_API_KEY=plane_api_996fecef7f91430dac6964b212cf4274
PLANE_BASE_URL=http://10.0.0.112:3300/api/v1/
PLANE_WORKSPACE_SLUG=body-bridge
PLANE_PROJECT_ID=8e7bb5fa-3f95-4701-a3d0-49562b4c0f4c

# Symphony Configuration
SYMPHONY_MODEL=codex
SYMPHONY_TIMEOUT=600
SYMPHONY_BRANCH_PREFIX=feature/

# Verification Configuration
EVIDENCE_SCREENSHOTS_DIR=./screenshots/evidence/
VERIFICATION_TEST_SPECS=tests/onboarding.spec.ts,tests/exercise-picker.spec.ts,tests/workout-builder.spec.ts
HEALTH_CHECK_ENDPOINT=http://localhost:3001/api/health

# Application Configuration
APP_DEV_PORT=7770
APP_API_PORT=3001
```

#### 3.2 Package.json Updates
**File**: `package.json` (add to scripts section)

```json
{
  "scripts": {
    "create-ticket": "node scripts/create-plane-ticket.cjs",
    "start-symphony": "node scripts/start-symphony-work.cjs",
    "verify-ticket": "node scripts/ticket-helpers/evidence-collector.js",
    "collect-evidence": "node scripts/ticket-helpers/evidence-collector.js collect"
  }
}
```

#### 3.3 OpenCode Skill
**File**: `.opencode/skills/create-plane-ticket/SKILL.md`

```yaml
name: create-plane-ticket
description: Create meticulous Plane tickets with element context, images, references, and comprehensive evidence requirements. Automatically includes verification criteria for automated tests, health checks, visual verification, and code quality checks before ticket completion.

# Usage
/run create-ticket --title "Fix workout timer bug" --type bug --priority high --context "Timer resets incorrectly"

# Evidence Requirements (Auto-included)
All tickets require evidence before completion:
- ✅ Automated tests pass (Playwright)
- ✅ Health checks pass (build, startup, api/health)
- ✅ Visual verification (screenshots)
- ✅ Code quality verified (TypeScript, security, dead code)
- ✅ No regressions in existing functionality

# Supported Ticket Types
- feature: New functionality
- bug: Bug fixes
- enhancement: Improvements to existing features
- investigation: Research or debugging tasks

# Priority Levels
- none: Default priority
- low: Nice to have
- medium: Normal priority
- high: Important
- urgent: Critical issues

# Examples
Feature request:
/run create-ticket --title "Add dark mode support" --type feature --priority medium --context "Users requested dark mode for evening workouts"

Bug report:
/run create-ticket --title "Workout timer resets on background" --type bug --priority urgent --context "Timer incorrectly resets when app is backgrounded on Android"
```

## File Structure Summary

```
Body-Bridge/
├── scripts/
│   ├── create-plane-ticket.cjs                 # Main ticket creation command
│   ├── start-symphony-work.cjs                 # Symphony workflow trigger
│   ├── ticket-templates/                       # Ticket templates
│   │   ├── feature.template.md
│   │   ├── bug.template.md
│   │   ├── enhancement.template.md
│   │   └── investigation.template.md
│   ├── ticket-helpers/
│   │   ├── evidence-collector.js               # Evidence collection logic
│   │   ├── reference-builder.js                # Build code/file references
│   │   └── context-gatherer.js                 # Gather element context
│   └── symphony-orchestrator/
│       ├── executor.js                         # Symphony workflow executor
│       ├── progress-monitor.js                 # Real-time progress monitoring
│       ├── evidence-logger.js                  # Evidence logging to tickets
│       └── verification-runner.js               # Verification check execution
├── screenshots/
│   └── evidence/                               # Per-ticket screenshot storage
│       └── {ticket-id}/
├── .env.symphony                               # Configuration file
├── .opencode/skills/create-plane-ticket/       # OpenCode skill
│   └── SKILL.md
└── package.json                                # Updated with new scripts
```

## Success Criteria

### Command 1: `create-plane-ticket`
✅ Creates tickets in Plane.so with all required metadata
✅ Includes comprehensive evidence requirements in description
✅ Uploads images as attachments
✅ Generates references to code files
✅ Supports multiple ticket types (feature, bug, enhancement, investigation)
✅ Validates input parameters
✅ Returns ticket identifier and URL for easy access

### Command 2: `start-symphony-work`
✅ Moves ticket to "In Progress" on start
✅ Creates feature branch with naming convention
✅ Starts Symphony orchestrator with ticket context
✅ Collects all evidence types (tests, health checks, screenshots)
✅ Posts evidence as structured ticket comments
✅ Moves ticket to "Review" on success, "Todo" on failure
✅ Provides real-time progress monitoring (optional)
✅ Generates comprehensive evidence reports

### Evidence Collection System
✅ Runs all Playwright tests
✅ Performs health checks (build, startup, endpoints)
✅ Captures before/after screenshots
✅ Runs code quality checks (TypeScript, security, dead code)
✅ Generates comprehensive evidence reports
✅ Posts results to tickets as comments

## Dependencies

### Required Packages (to be installed)
```json
{
  "minimist": "^1.2.8",           // CLI argument parsing
  "marked": "^12.0.0",            // Markdown to HTML conversion
  "node-fetch": "^3.3.2",          // HTTP requests for health checks
  "dotenv": "^16.4.5",            // Environment variable loading
  "sharp": "^0.33.0"              // Image processing for dimensions (optional)
}
```

### Module System Considerations ⚠️

**Issue**: The Body-Bridge project uses ESM modules (`"type": "module"` in package.json), but the scripts are written in CommonJS (`.cjs` extension and `require()`).

**Options**:
1. **Keep as CommonJS** (Recommended):
   - Use `.cjs` extension for all script files
   - Use `require()` instead of `import`
   - Use `module.exports` instead of `export`
   - Benefits: Simpler, works with existing PlaneClient which may not support ESM

2. **Convert to ESM**:
   - Change all `.cjs` to `.js` or `.mjs`
   - Use `import` instead of `require`
   - Use `export default` instead of `module.exports`
   - May need to transpile PlaneClient to ESM first
   - Benefits: Consistent with project module system

**Current Plan**: Use **Option 1 (CommonJS)** for scripts to avoid complexity with existing PlaneClient infrastructure.

### Existing Dependencies (Already Available)
- **PlaneClient**: `symphony-mod/src/trackers/plane-client.ts` (TypeScript, may need transpilation)
- **PlaneAdapter**: `symphony-mod/src/trackers/plane-adapter.ts` (TypeScript, may need transpilation)
- **Playwright**: Testing and screenshot capture (already installed)
- **Node.js built-ins**: `fs`, `path`, `child_process`

### TypeScript Transpilation

Since PlaneClient and PlaneAdapter are TypeScript files, the CommonJS scripts need to import transpiled versions:

**Option A**: Add `tsc` to build step for `symphony-mod/` directory
**Option B**: Use `tsx` or `ts-node` to run TypeScript directly (not recommended for production)
**Option C**: Transpile to `.cjs` files as part of build process

**Recommended**: Add a build step to transpile `symphony-mod/src/trackers/*.ts` to `symphony-mod/dist/trackers/*.cjs`

**Package.json addition**:
```json
{
  "scripts": {
    "build:symphony-trackers": "tsc symphony-mod/src/trackers/*.ts --outDir symphony-mod/dist/trackers --module commonjs --target es2020"
  }
}
```

Then import from:
```javascript
const { PlaneClient } = require('../symphony-mod/dist/trackers/plane-client.cjs');
```

## Implementation Timeline

### Week 1: Core Infrastructure
- **Day 1-2**: Create `create-plane-ticket` script with template system
- **Day 3**: Implement evidence collector with test and health check integration
- **Day 4-5**: Build Symphony executor and verification runner

### Week 2: Integration & Testing
- **Day 1-2**: Configure environment variables and package.json scripts
- **Day 3**: Create OpenCode skill integration
- **Day 4-5**: Test full workflow with real tickets

### Total Estimated Time: 2 weeks

## Usage Examples

### Example 1: Create Feature Ticket
```bash
npm run create-ticket \
  --title "Add workout video playback progress tracking" \
  --type feature \
  --priority high \
  --context "Users need to see progress when playing workout videos. Currently no progress indicator is visible during playback, making it difficult to track workout duration." \
  --images screenshots/workout-player.png,screenshots/controls.png \
  --references src/components/WorkoutPlayer.tsx,src/hooks/useWorkoutSession.ts \
  --test-specs tests/video-playback.spec.ts
```

**Output**:
```
✓ Created ticket: BB-42
✓ Identifier: BB-42
✓ URL: http://10.0.0.112:3300/body-bridge/work-items/BB-42/
✓ State: Todo
✓ Priority: high
✓ Labels: feature
✓ Evidence requirements configured

Evidence Requirements:
  - Automated tests: tests/video-playback.spec.ts
  - Health checks: build, startup, api/health
  - Visual verification: screenshots required
  - Code quality: TypeScript, security, dead code
```

### Example 2: Start Symphony Work
```bash
npm run start-symphony --ticket BB-42 --watch-mode
```

**Output**:
```
Starting Symphony workflow for ticket BB-42...
Phase 1: Initialization...
  Ticket: BB-42 - Add workout video playback progress tracking
  ✓ Ticket moved to In Progress
  ✓ Feature branch created: feature/42-add-workout-video-playback-progress

Phase 2: Executing Symphony...
[Symphony] Fetching ticket details...
[Symphony] Analyzing requirements...
[Symphony] Starting agent session...

[Progress] Agent implementing video progress tracking...
[Progress] Added progress bar component
[Progress] Integrated with video player
[Progress] Writing tests...
[Symphony] Process exited with code 0

Phase 3: Collecting Evidence...
  Running automated tests...
    ✓ Running: tests/video-playback.spec.ts
    ✓ PASSED (12/12 tests)
  Performing health checks...
    ✓ Build successful
    ✓ Health endpoint: 200 OK
  Running code quality checks...
    ✓ TypeScript check passed
    ✓ No dead code found
  Running security checks...
    ✓ No security findings
  Capturing screenshots...
    ✓ Captured 3 screenshots

  ✓ All evidence collected and verified
Symphony workflow completed successfully
  ✓ Ticket moved to Review
  ✓ Evidence posted to ticket

Ready for Review at:
http://10.0.0.112:3300/body-bridge/work-items/BB-42/
```

## Risk Mitigation

### Identified Risks

1. **Plane API Rate Limiting**
   - **Mitigation**: PlaneClient already implements rate limiting (60 req/min window)

2. **Symphony Workflow Failures**
   - **Mitigation**: Comprehensive error handling and rollback to "Todo" with detailed error comments

3. **Missing Dependencies**
   - **Mitigation**: Environment validation before execution, clear error messages

4. **Evidence Collection Failures**
   - **Mitigation**: Partial evidence still reported, non-blocking collection (continues even if some checks fail)

5. **State Synchronization Issues**
   - **Mitigation**: State transitions only on success, manual override options

### Error Handling Strategy

- **Validation Errors**: Fail fast with clear error messages before execution
- **Execution Errors**: Rollback state, post error comment, move to "Todo"
- **Partial Failures**: Report what succeeded, what failed, and next steps
- **Network Errors**: Retry logic in PlaneClient, timeout handling

## Critical Implementation Details ⚠️

### 1. Server Startup for Evidence Collection

**Issue**: Evidence collector checks for health endpoints but never starts the application server.

**Solution**: Add server startup/shutdown logic to evidence collection:

```javascript
// Add to EvidenceCollector class
async performHealthChecks() {
  console.log('Performing health checks...');

  const checks = [];

  // Start server if not running
  const serverRunning = await this.isServerRunning();
  if (!serverRunning) {
    console.log('  Starting application server...');
    await this.startServer();
    await this.sleep(5000); // Wait for server to be ready
  }

  try {
    // Health endpoint check
    console.log('  Checking health endpoint...');
    const response = await fetch('http://localhost:3001/api/health', {
      method: 'GET',
      timeout: 5000
    });

    if (response.ok) {
      const health = await response.json();
      checks.push({
        type: 'health-endpoint',
        status: 'passed',
        data: health,
        timestamp: new Date().toISOString()
      });
      console.log(`    ✓ Health endpoint: ${response.status} OK`);
    } else {
      checks.push({
        type: 'health-endpoint',
        status: 'failed',
        code: response.status,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    checks.push({
      type: 'health-endpoint',
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Stop server if we started it
    if (!serverRunning) {
      console.log('  Stopping application server...');
      await this.stopServer();
    }
  }

  return checks;
}

async isServerRunning() {
  try {
    const response = await fetch('http://localhost:3001/api/health', {
      method: 'GET',
      timeout: 2000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async startServer() {
  // Start the server in background
  this.serverProcess = spawn('npm', ['run', dev:app'], {
    cwd: this.projectRoot,
    detached: true,
    stdio: 'ignore'
  });

  return new Promise((resolve, reject) => {
    this.serverProcess.on('spawn', resolve);
    this.serverProcess.on('error', reject);
  });
}

async stopServer() {
  if (this.serverProcess) {
    this.serverProcess.kill('SIGTERM');
    await this.sleep(2000); // Wait for graceful shutdown
    this.serverProcess = null;
  }
}

sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 2. Branch Naming Convention Conflict

**Issue**: Plan uses `feature/` prefix but existing Symphony workflow config uses `symphony/` prefix.

**Resolution**: Use `symphony/` to match existing workflow config and avoid confusion.

**Update in plan**:
- Change default branch prefix from `feature/` to `symphony/`
- Update all examples to use `symphony/BB-42-title` format
- This aligns with existing workflow config: `symphony/{issue-identifier}`

**Updated code**:
```javascript
// In SymphonyExecutor constructor
constructor(ticketId, workspaceRoot, options = {}) {
  // ...
  this.branchPrefix = options.branchPrefix || 'symphony/'; // Changed from 'feature/'
  // ...
}
```

### 3. Project ID Verification

**Issue**: Two different project IDs found in codebase.

**Resolution**: Add verification step during initialization:

```javascript
// Add to create-plane-ticket.cjs
async function verifyProjectId() {
  const client = new PlaneClient(PLANE_CONFIG);

  try {
    // Try to fetch project to verify ID
    const projectUrl = `${PLANE_CONFIG.base_url}workspaces/${PLANE_CONFIG.workspace_slug}/projects/${PLANE_CONFIG.project_id}/`;
    const response = await fetch(projectUrl, {
      headers: { 'X-API-Key': PLANE_CONFIG.api_key }
    });

    if (response.ok) {
      const project = await response.json();
      console.log(`✓ Verified project: ${project.name}`);
      return true;
    } else {
      console.error(`✗ Project ID verification failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Project ID verification error: ${error.message}`);
    return false;
  }
}

// Add to main() function
async function main() {
  // Verify project ID before creating ticket
  const projectIdValid = await verifyProjectId();
  if (!projectIdValid) {
    console.error('Error: Project ID verification failed. Please check PLANE_PROJECT_ID in configuration.');
    process.exit(1);
  }

  // Continue with ticket creation...
}
```

### 4. Environment Variable Loading

**Issue**: Scripts don't explicitly load `.env.symphony` file.

**Solution**: Add dotenv loading at top of all scripts:

```javascript
// Add at top of create-plane-ticket.cjs
require('dotenv').config({ path: '.env.symphony' });
```

### 5. TypeScript Import Path Resolution

**Issue**: Scripts need to import TypeScript modules (PlaneClient).

**Solution Options:

**Option A: Transpile TypeScript modules** (Recommended)
```javascript
// Build script in package.json
"build:symphony-trackers": "tsc symphony-mod/src/trackers/*.ts --outDir symphony-mod/dist/trackers --module commonjs --declaration false"

// In scripts
const { PlaneClient } = require('../symphony-mod/dist/trackers/plane-client.cjs');
```

**Option B: Use TypeScript runtime**
```javascript
// Add to package.json
"tsx": "^4.19.0"

// Use .mjs extension and tsx
import { PlaneClient } from '../symphony-mod/src/trackers/plane-client.js';
```

**Recommended**: Option A - Transpile once during development, use faster CommonJS in production.

### 6. Attachment Upload to Plane.so

**Issue**: Code references uploading images but PlaneClient may not have `addAttachment` method.

**Solution**: Verify PlaneClient API and implement if missing:

```javascript
// Check if PlaneClient has addAttachment method
// If not, implement in create-plane-ticket.cjs:

async function uploadAttachment(client, ticketId, imagePath) {
  const fs = require('fs');

  if (!fs.existsSync(imagePath)) {
    console.warn(`Image not found: ${imagePath}`);
    return null;
  }

  const stats = fs.statSync(imagePath);
  const fileBuffer = fs.readFileSync(imagePath);
  const fileName = path.basename(imagePath);

  // Create FormData for multipart upload
  const FormData = require('form-data');
  const formData = new FormData();

  formData.append('file', fileBuffer, {
    filename: fileName,
    contentType: getMimeType(fileName)
  });

  // Upload to Plane API
  const uploadUrl = `${client.baseUrl}workspaces/${client.config.workspace_slug}/projects/${client.config.project_id}/issues/${ticketId}/attachments/`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-API-Key': client.config.api_key,
      ...formData.getHeaders()
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Failed to upload attachment: ${response.status}`);
  }

  return await response.json();
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };
  return types[ext] || 'application/octet-stream';
}
```

### 7. Test Server Configuration

**Issue**: Screenshots capture assumes app is running on port 7770.

**Solution**: Make port configurable:

```javascript
// In .env.symphony
APP_DEV_PORT=7770

// In scripts
const APP_DEV_PORT = process.env.APP_DEV_PORT || 7770;

const keyPages = [
  { url: `http://localhost:${APP_DEV_PORT}`, name: 'home' },
  { url: `http://localhost:${APP_DEV_PORT}/workouts`, name: 'workouts' },
  { url: `http://localhost:${APP_DEV_PORT}/profile`, name: 'profile' }
];
```

### 8. Error Recovery in Evidence Collection

**Issue**: If one evidence type fails, collection stops.

**Solution**: Make evidence collection resilient:

```javascript
async collectAllEvidence() {
  console.log(`Collecting evidence for ticket ${this.ticketId}...`);

  fs.mkdirSync(this.screenshotsDir, { recursive: true });

  const results = {};
  const errors = [];

  // Collect each evidence type independently
  try {
    results.tests = await this.collectAutomatedTests();
  } catch (error) {
    errors.push({ type: 'tests', error: error.message });
    results.tests = [];
  }

  try {
    results.healthChecks = await this.performHealthChecks();
  } catch (error) {
    errors.push({ type: 'healthChecks', error: error.message });
    results.healthChecks = [];
  }

  try {
    results.codeQuality = await this.runCodeQualityChecks();
  } catch (error) {
    errors.push({ type: 'codeQuality', error: error.message });
    results.codeQuality = [];
  }

  try {
    results.security = await this.runSecurityChecks();
  } catch (error) {
    errors.push({ type: 'security', error: error.message });
    results.security = [];
  }

  try {
    results.screenshots = await this.captureScreenshots();
  } catch (error) {
    errors.push({ type: 'screenshots', error: error.message });
    results.screenshots = [];
  }

  // Merge all evidence
  this.evidence = [
    ...results.tests,
    ...results.healthChecks,
    ...results.codeQuality,
    ...results.security,
    ...results.screenshots
  ];

  // Log any errors that occurred
  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} evidence type(s) failed to collect:`);
    errors.forEach(e => console.warn(`  - ${e.type}: ${e.error}`));
  }

  const report = this.generateEvidenceReport();
  report.collectionErrors = errors;

  return report;
}
```

## Questions for Implementation

### Critical Decisions Required

1. **Project ID Conflict Resolution** ⚠️ HIGH PRIORITY
   - Two project IDs found: `8e7bb5fa-3f95-4701-a3d0-49562b4c0f4c` (test file) and `13cecebf-f9ff-41bd-b5bb-b88774ef6440` (workflow config)
   - **QUESTION**: Which one is correct? Must verify before implementation.

2. **Branch Naming Convention**
   - Existing workflow config uses `symphony/` prefix
   - Plan initially proposed `feature/` prefix
   - **DECISION**: Use `symphony/` to match existing conventions (already resolved in critical details)

3. **Module System for Scripts**
   - Project uses ESM (`"type": "module"`)
   - Scripts are written in CommonJS for simplicity
   - **DECISION**: Keep as CommonJS (`.cjs` files) to avoid complexity with PlaneClient

4. **TypeScript Transpilation**
   - PlaneClient and PlaneAdapter are TypeScript files
   - CommonJS scripts need transpiled versions
   - **QUESTION**: Should we:
     - Add build step to transpile `symphony-mod/src/trackers/*.ts`?
     - Use `tsx` to run TypeScript directly?
     - Convert everything to CommonJS?

5. **Test Server Startup** ⚠️ IMPORTANT
   - Evidence collector needs app running for screenshots
   - **DECISION**: Start server automatically, capture screenshots, then stop
   - **QUESTION**: Which server command to use? `npm run dev:app` (Express + Vite) or `npm run dev` (full stack)?

6. **Image Attachments to Plane**
   - PlaneClient may not have `addAttachment` method
   - **DECISION**: Implement attachment upload if missing (code provided in critical details)
   - **QUESTION**: What file size limits does Plane.so have for attachments?

7. **Evidence Collection Failures**
   - **DECISION**: Continue collecting even if some types fail, report all errors
   - **QUESTION**: Should partial evidence still allow ticket to move to "Review"?

8. **Environment Variable Loading**
   - **DECISION**: Load `.env.symphony` at top of all scripts using `dotenv`
   - **QUESTION**: Should `.env.symphony` also be loaded in `symphony-mod/` if needed?

### Optional Enhancements

9. **Ticket Types**
   - Currently: feature, bug, enhancement, investigation
   - **QUESTION**: Add more types? (e.g., chore, documentation, refactor, performance)

10. **Priority Levels**
    - Currently: none, low, medium, high, urgent (matches Plane.so)
    - **QUESTION**: Should we restrict or allow any priority?

11. **Evidence Collection Trigger**
    - **QUESTION**: Should evidence collection be:
      - Automatic after Symphony execution? (current plan)
      - Manual trigger only?
      - Both options available?

12. **Verification Frequency**
    - **QUESTION**: Should verification run:
      - Only on completion? (current plan)
      - Continuously during development?
      - Both options available?

13. **Screenshot Capture Strategy**
    - **QUESTION**: Should we capture:
      - All key pages? (current plan)
      - Only pages relevant to ticket?
      - Let user specify pages?

14. **Test Execution Scope**
    - **QUESTION**: Should we run:
      - All tests? (current default)
      - Only tests related to ticket?
      - Both options available?

15. **Health Check Timeout**
    - **QUESTION**: What timeout for health endpoint?
    - Currently: 5 seconds
    - Should be configurable per environment?

16. **Progress Monitoring**
    - **QUESTION**: Should progress monitoring:
      - Be on by default? (current plan: optional with `--watch-mode`)
      - Check for file changes, commits, or both?
      - Post updates to ticket immediately or batch them?

17. **Screenshot Before/After**
    - **QUESTION**: Should we capture:
      - Screenshots only after changes?
      - Before AND after screenshots for comparison?

18. **Convex Backend Checks**
    - **QUESTION**: Should evidence collection verify Convex backend?
    - Currently only checks Express server
    - May need to start Convex dev server independently

19. **Mobile Verification**
    - **QUESTION**: Should evidence collection include:
      - Mobile viewport screenshots?
      - Capacitor app builds?
      - Device testing? (beyond scope?)

20. **Git Conflict Handling**
    - **QUESTION**: What if Symphony fails with merge conflicts?
    - Should we:
      - Abort and report?
      - Try to auto-resolve?
      - Move ticket to "Todo" with manual intervention needed?

### Configuration Questions

21. **Symphony Command Availability**
    - **QUESTION**: Is `symphony` CLI installed and available?
    - Should we verify and install if missing?

22. **Playwright Browsers**
    - **QUESTION**: Which browsers should Playwright use?
    - Currently: Chromium (headless)
    - Should we test Firefox, Chrome, WebKit too?

23. **Screenshot Storage**
    - **QUESTION**: Where should screenshots be stored long-term?
    - Currently: `screenshots/evidence/{ticket-id}/`
    - Should we:
      - Upload to Plane as attachments?
      - Store in cloud storage (S3, etc.)?
      - Keep local only?

24. **Evidence Retention**
    - **QUESTION**: How long should evidence logs be kept?
    - Currently: Permanently in `.symphony/evidence/{ticket-id}/`
    - Should we clean up old evidence?

25. **Parallel Evidence Collection**
    - **QUESTION**: Should we run evidence collection steps in parallel?
    - Currently: Sequential
    - Could be faster but may conflict with each other

## Next Steps

1. **Review and approve this plan** ⬅️ *Current step*
2. **Set up environment variables** in `.env.symphony`
3. **Create base infrastructure** (scripts, templates, helpers)
4. **Implement core commands** (create-ticket, start-symphony)
5. **Integrate with Symphony** and test workflow
6. **Add OpenCode skill** for command discovery
7. **Test full workflow** with real tickets
8. **Document usage** in README.md

## Maintenance Requirements

- **Minimal**: Leverages existing PlaneClient and Symphony infrastructure
- **Updates**: Keep Plane API client in sync with Plane.so API changes
- **Monitoring**: Monitor Symphony execution logs and evidence collection success rates
- **Templates**: Update ticket templates as project requirements evolve

## Testing Strategy

### Unit Tests

**1. Template Loading**
```javascript
// test/ticket-templates.test.js
describe('Ticket Templates', () => {
  it('should load feature template', () => {
    const template = loadTemplate('feature');
    expect(template).toContain('Context');
    expect(template).toContain('Evidence Required');
  });

  it('should render with context', () => {
    const result = buildDescription(template, {
      context: 'Test context'
    });
    expect(result).toContain('Test context');
  });
});
```

**2. Evidence Collector**
```javascript
// test/evidence-collector.test.js
describe('EvidenceCollector', () => {
  it('should collect test results', async () => {
    const collector = new EvidenceCollector('/tmp', 'TEST-1');
    const results = await collector.collectAutomatedTests();
    expect(results).toBeDefined();
  });

  it('should handle test failures gracefully', async () => {
    const collector = new EvidenceCollector('/tmp', 'TEST-1');
    // Mock failing test
    const results = await collector.collectAutomatedTests();
    expect(results.some(r => r.status === 'failed')).toBe(true);
  });
});
```

**3. Reference Builder**
```javascript
// test/reference-builder.test.js
describe('ReferenceBuilder', () => {
  it('should build file references', () => {
    const builder = new ReferenceBuilder(process.cwd());
    const refs = builder.buildReferences(['README.md']);
    expect(refs).toHaveLength(1);
    expect(refs[0]).toHaveProperty('url');
  });

  it('should generate markdown', () => {
    const builder = new ReferenceBuilder(process.cwd());
    const markdown = builder.generateMarkdown(refs);
    expect(markdown).toContain('Code References');
  });
});
```

### Integration Tests

**1. End-to-End Ticket Creation**
```javascript
// test/integration/create-ticket.test.js
describe('Create Ticket Integration', () => {
  it('should create ticket with all parameters', async () => {
    const result = await createTicket({
      title: 'Test Ticket',
      type: 'feature',
      priority: 'high',
      context: 'Test context'
    });

    expect(result.ticket).toHaveProperty('sequence_id');
    expect(result.ticket).toHaveProperty('url');
  });

  it('should upload image attachments', async () => {
    // Requires actual image file
    const result = await createTicket({
      title: 'Test Ticket with Images',
      type: 'feature',
      priority: 'high',
      context: 'Test context',
      images: 'test/fixtures/screenshot.png'
    });

    expect(result.attachments).toBeDefined();
  });
});
```

**2. Symphony Workflow**
```javascript
// test/integration/symphony-workflow.test.js
describe('Symphony Workflow Integration', () => {
  it('should start and complete workflow', async () => {
    // Create test ticket first
    const ticket = await createTestTicket();

    // Start Symphony
    const executor = new SymphonyExecutor(ticket.identifier, process.cwd());
    await executor.start();

    // Verify ticket moved to Review
    const updatedTicket = await getTicket(ticket.identifier);
    expect(updatedTicket.state).toBe('Review');
  });

  it('should handle failures gracefully', async () => {
    // Create ticket that will fail
    const ticket = await createFailingTicket();

    const executor = new SymphonyExecutor(ticket.identifier, process.cwd());
    await executor.start().catch(() => {});

    // Verify ticket moved back to Todo
    const updatedTicket = await getTicket(ticket.identifier);
    expect(updatedTicket.state).toBe('Todo');
  });
});
```

### Manual Testing Checklist

**Phase 1: Create Ticket Command**
- [ ] Create feature ticket with all parameters
- [ ] Create bug ticket with minimal parameters
- [ ] Create enhancement ticket with images
- [ ] Verify ticket appears in Plane.so
- [ ] Verify evidence requirements in description
- [ ] Verify image attachments uploaded
- [ ] Verify code references formatted correctly
- [ ] Test with invalid parameters (should fail gracefully)
- [ ] Test with non-existent images (should skip with warning)
- [ ] Test with non-existent references (should skip)

**Phase 2: Start Symphony Command**
- [ ] Start Symphony for existing ticket
- [ ] Verify ticket moves to "In Progress"
- [ ] Verify feature branch created with correct name
- [ ] Verify initialization comment posted
- [ ] Monitor progress updates (if watch mode enabled)
- [ ] Verify evidence collection runs after completion
- [ ] Verify evidence report posted to ticket
- [ ] Verify ticket moves to "Review" on success
- [ ] Verify ticket moves to "Todo" on failure
- [ ] Test with non-existent ticket (should fail)
- [ ] Test with ticket in wrong state (should fail)

**Phase 3: Evidence Collection**
- [ ] Run automated tests
- [ ] Perform health checks
- [ ] Run code quality checks
- [ ] Run security scans
- [ ] Capture screenshots (server must be running)
- [ ] Generate evidence report
- [ ] Verify all evidence types collected
- [ ] Verify partial evidence still reported on failures
- [ ] Test with server not running (should skip health checks)
- [ ] Test with test failures (should report failures)

**Phase 4: Error Handling**
- [ ] Test with invalid Plane API key
- [ ] Test with invalid project ID
- [ ] Test with network connectivity issues
- [ ] Test with Symphony CLI not installed
- [ ] Test with insufficient disk space
- [ ] Test with file permission issues
- [ ] Verify all errors logged
- [ ] Verify tickets moved to appropriate state on errors
- [ ] Verify helpful error messages

### Performance Testing

**1. Evidence Collection Performance**
- Measure time to collect all evidence types
- Target: < 5 minutes for full collection
- Benchmark:
  - Tests: ~2 minutes
  - Health checks: ~30 seconds
  - Code quality: ~1 minute
  - Security: ~1 minute
  - Screenshots: ~30 seconds

**2. API Rate Limiting**
- Test with multiple rapid ticket creations
- Verify PlaneClient rate limiting works
- Verify no API errors

**3. Memory Usage**
- Monitor memory during evidence collection
- Verify no memory leaks
- Target: < 500MB peak usage

## Implementation Verification Checklist

### Pre-Implementation
- [ ] Verify Plane.so project ID (resolve conflict)
- [ ] Confirm Plane API key is valid
- [ ] Test Plane API connectivity
- [ ] Verify Symphony CLI is installed
- [ ] Confirm Node.js version (>= 18)
- [ ] Verify project has npm packages installed

### During Implementation
- [ ] Create all directory structure
- [ ] Create all ticket templates (4 types)
- [ ] Implement create-plane-ticket.cjs
- [ ] Implement evidence-collector.js
- [ ] Implement reference-builder.js
- [ ] Implement context-gatherer.js
- [ ] Implement executor.js
- [ ] Implement progress-monitor.js
- [ ] Implement evidence-logger.js
- [ ] Implement verification-runner.js
- [ ] Implement start-symphony-work.cjs
- [ ] Create .env.symphony file
- [ ] Update package.json scripts
- [ ] Create OpenCode skill
- [ ] Add TypeScript build step (if needed)

### Post-Implementation
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Manual test create-ticket command
- [ ] Manual test start-symphony command
- [ ] Test error scenarios
- [ ] Verify evidence collection
- [ ] Test with real Plane tickets
- [ ] Performance testing
- [ ] Documentation complete

### Production Readiness
- [ ] All tests passing
- [ ] Error handling comprehensive
- [ ] Logging complete
- [ ] Configuration validated
- [ ] Documentation updated
- [ ] Team trained on usage
- [ ] Rollback plan documented
- [ ] Monitoring configured

---

**Plan Status**: 📋 Review in Progress
**Estimated Implementation Time**: 2-3 weeks (accounting for critical details)
**Infrastructure Readiness**: ✅ All components identified
**Risk Level**: 🟡 Medium (critical issues identified, resolvable)

**Next Steps**: Resolve critical decisions → Begin implementation → Test thoroughly → Deploy