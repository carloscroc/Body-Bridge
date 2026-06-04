# Symphony Custom Tracker Support - Implementation Plan

## Executive Summary

Create a custom Symphony fork that supports multiple tracker types (Linear and Plane.so) through a plugin/adapter architecture, enabling your existing Plane.so adapter to work seamlessly with Symphony.

## Current Situation Analysis

### Symphony Architecture
- **Current State**: Hardcoded Linear-only tracker (`LinearIssueTrackerClient`)
- **Validation Error**: `tracker.kind must be present and currently must be 'linear'`
- **Configuration**: Requires `tracker.kind: linear`, `tracker.api_key`, `tracker.project_slug`
- **Entry Point**: `dist/src/cli.js` loads workflow config → validates → starts `LinearIssueTrackerClient`

### Your Assets
- **Working Plane.so Adapter**: `symphony-integration/implementation/plane-so-adapter/`
- **Complete Implementation**: `PlaneAdapter` class implements all required methods
- **Compatible Interface**: Matches Symphony's expected `TrackerAdapter` interface
- **Tested & Ready**: Successfully connects to Plane.so API and fetches issues

## Implementation Strategy

### Phase 1: Analysis & Design (1-2 hours)

**1.1 Symphony Codebase Analysis**
- Clone @servrox/symphony source from GitHub
- Identify all Linear-specific code locations
- Document tracker interface expectations
- Map configuration flow: WORKFLOW.md → config.js → validation → client instantiation

**1.2 Plugin Architecture Design**
```typescript
interface TrackerPlugin {
  name: string;
  kind: string;
  validateConfig(config: unknown): string[];
  createClient(config: ServiceConfig, logger: Logger): TrackerAdapter;
}

interface TrackerAdapter {
  fetchCandidateIssues(): Promise<SymphonyIssue[]>;
  fetchIssuesByStates(stateNames: string[]): Promise<SymphonyIssue[]>;
  fetchIssueStatesByIds(ids: string[]): Promise<Map<string, string>>;
  createComment(issueId: string, commentHtml: string): Promise<void>;
  updateIssueState(issueId: string, stateName: string): Promise<void>;
}
```

**1.3 Configuration Schema Design**
```yaml
tracker:
  kind: plane  # or linear
  endpoint: http://10.0.0.112:3300/api/v1/
  api_key: $PLANE_API_KEY
  workspace_slug: body-bridge
  project_id: 13cecebf-f9ff-41bd-b5bb-b88774ef6440
  active_states: [Todo, In Progress]
  terminal_states: [Done, Cancelled]
  # Linear-specific fields:
  # project_slug: your-project
  # Plane.so-specific fields:
  # workspace_slug: your-workspace
  # project_id: your-project-uuid
```

### Phase 2: Implementation (4-6 hours)

**2.1 Core Tracker Abstraction Layer**

**File**: `dist/src/tracker-registry.js`
```javascript
// New file - tracker plugin registry
class TrackerRegistry {
  constructor() {
    this.plugins = new Map();
  }

  register(plugin) {
    this.plugins.set(plugin.kind, plugin);
  }

  get(kind) {
    return this.plugins.get(kind);
  }

  createClient(kind, config, logger) {
    const plugin = this.get(kind);
    if (!plugin) {
      throw new Error(`Unknown tracker kind: ${kind}`);
    }
    return plugin.createClient(config, logger);
  }
}
```

**File**: `dist/src/tracker-factory.js`
```javascript
// New file - dynamic client creation
import { TrackerRegistry } from './tracker-registry.js';

export function createTrackerClient(config, logger) {
  const registry = new TrackerRegistry();
  
  // Register built-in trackers
  registry.register(new LinearTrackerPlugin());
  registry.register(new PlaneTrackerPlugin());
  
  // Support custom tracker plugins via config
  if (config.tracker.pluginPath) {
    const customPlugin = importTrackerPlugin(config.tracker.pluginPath);
    registry.register(customPlugin);
  }
  
  return registry.createClient(config.tracker.kind, config, logger);
}
```

**2.2 Linear Tracker Plugin**

**File**: `dist/src/trackers/linear-plugin.js`
```javascript
// Extracted from existing LinearIssueTrackerClient
import { LinearIssueTrackerClient } from '../linear-client.js';

export class LinearTrackerPlugin {
  name = 'Linear';
  kind = 'linear';

  validateConfig(config) {
    const errors = [];
    const tracker = config.tracker;
    
    if (!tracker.api_key?.trim()) {
      errors.push('tracker.api_key is missing after environment resolution');
    }
    if (!tracker.project_slug?.trim()) {
      errors.push('tracker.project_slug is required for tracker.kind=linear');
    }
    
    return errors;
  }

  createClient(config, logger) {
    return new LinearIssueTrackerClient(config, logger);
  }
}
```

**2.3 Plane.so Tracker Plugin**

**File**: `dist/src/trackers/plane-plugin.js`
```javascript
// Wraps your existing PlaneAdapter
import { PlaneAdapter } from './plane-adapter.js';

export class PlaneTrackerPlugin {
  name = 'Plane.so';
  kind = 'plane';

  validateConfig(config) {
    const errors = [];
    const tracker = config.tracker;
    
    if (!tracker.api_key?.trim()) {
      errors.push('tracker.api_key is missing after environment resolution');
    }
    if (!tracker.workspace_slug?.trim()) {
      errors.push('tracker.workspace_slug is required for tracker.kind=plane');
    }
    if (!tracker.project_id?.trim()) {
      errors.push('tracker.project_id is required for tracker.kind=plane');
    }
    
    return errors;
  }

  createClient(config, logger) {
    // Convert Symphony config to Plane adapter config
    const planeConfig = {
      base_url: config.tracker.endpoint,
      api_key: config.tracker.apiKey,
      workspace_slug: config.tracker.workspace_slug,
      project_id: config.tracker.project_id,
      active_states: config.tracker.activeStates,
      terminal_states: config.tracker.terminalStates,
    };
    
    return new PlaneAdapter(planeConfig);
  }
}
```

**2.4 Copy Plane.so Adapter Code**

**File**: `dist/src/trackers/plane-adapter.ts`
```typescript
// Copy your existing PlaneAdapter implementation here
// Include all files from symphony-integration/implementation/plane-so-adapter/
```

**2.5 Update Configuration Validation**

**File**: `dist/src/config.js`
```javascript
// Modify validateDispatchConfig function
export function validateDispatchConfig(config) {
    const errors = [];
    
    // Remove strict Linear-only validation
    // if (config.tracker.kind !== "linear") {
    //     errors.push("tracker.kind must be present and currently must be 'linear'");
    // }
    
    // Use tracker plugin validation instead
    const registry = new TrackerRegistry();
    registry.register(new LinearTrackerPlugin());
    registry.register(new PlaneTrackerPlugin());
    
    const plugin = registry.get(config.tracker.kind);
    if (!plugin) {
        errors.push(`Unknown tracker kind: ${config.tracker.kind}`);
    } else {
        const pluginErrors = plugin.validateConfig(config);
        errors.push(...pluginErrors);
    }
    
    // Rest of existing validation...
    if (config.agent.mode === "local" && !config.codex.command.trim()) {
        errors.push("codex.command must be present and non-empty");
    }
    if (config.agent.mode === "codex_cloud" && config.tracker.kind !== "linear") {
        errors.push("agent.mode=codex_cloud currently requires tracker.kind='linear'");
    }
    if (config.agent.mode === "codex_cloud" && !config.codexCloud.mention.trim()) {
        errors.push("codex_cloud.mention must be present and non-empty");
    }
    return {
        ok: errors.length === 0,
        errors,
    };
}
```

**2.6 Update Orchestrator**

**File**: `dist/src/orchestrator.js`
```javascript
// Replace LinearIssueTrackerClient instantiation
import { createTrackerClient } from './tracker-factory.js';

// In constructor or initialization:
class SymphonyOrchestrator {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    // Replace: this.trackerClient = new LinearIssueTrackerClient(config, logger);
    this.trackerClient = createTrackerClient(config, logger);
  }
  
  // Rest of implementation remains the same
}
```

### Phase 3: Testing (2-3 hours)

**3.1 Unit Tests**

**File**: `tests/tracker-registry.test.js`
```javascript
import { TrackerRegistry } from '../dist/src/tracker-registry.js';

describe('TrackerRegistry', () => {
  it('should register and retrieve plugins', () => {
    const registry = new TrackerRegistry();
    const mockPlugin = {
      name: 'Mock',
      kind: 'mock',
      validateConfig: () => [],
      createClient: () => ({})
    };
    
    registry.register(mockPlugin);
    const retrieved = registry.get('mock');
    
    expect(retrieved).toBe(mockPlugin);
  });
});
```

**File**: `tests/plane-plugin.test.js`
```javascript
import { PlaneTrackerPlugin } from '../dist/src/trackers/plane-plugin.js';

describe('PlaneTrackerPlugin', () => {
  it('should validate Plane.so config correctly', () => {
    const plugin = new PlaneTrackerPlugin();
    
    const validConfig = {
      tracker: {
        api_key: 'test_key',
        workspace_slug: 'body-bridge',
        project_id: '13cecebf-f9ff-41bd-b5bb-b88774ef6440'
      }
    };
    
    const errors = plugin.validateConfig(validConfig);
    expect(errors).toHaveLength(0);
  });
  
  it('should reject invalid Plane.so config', () => {
    const plugin = new PlaneTrackerPlugin();
    
    const invalidConfig = {
      tracker: {
        api_key: '',
        workspace_slug: '',
        project_id: ''
      }
    };
    
    const errors = plugin.validateConfig(invalidConfig);
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

**3.2 Integration Test**

**File**: `tests/integration/plane-tracker.test.js`
```javascript
import { PlaneAdapter } from '../dist/src/trackers/plane-adapter.js';

describe('Plane.so Integration', () => {
  it('should fetch issues from Plane.so', async () => {
    const config = {
      base_url: 'http://10.0.0.112:3300/api/v1/',
      api_key: 'plane_api_996fecef7f91430dac6964b212cf4274',
      workspace_slug: 'body-bridge',
      project_id: '13cecebf-f9ff-41bd-b5bb-b88774ef6440',
      active_states: ['Todo'],
      terminal_states: ['Done']
    };
    
    const adapter = new PlaneAdapter(config);
    const issues = await adapter.fetchCandidate_issues();
    
    expect(Array.isArray(issues)).toBe(true);
  });
});
```

### Phase 4: Deployment & Documentation (1-2 hours)

**4.1 Build & Package**

```bash
# Clone Symphony source
git clone https://github.com/servrox/symphony.git
cd symphony

# Create custom branch
git checkout -b custom-tracker-support

# Copy our Plane adapter
cp -r ../symphony-integration/implementation/plane-so-adapter/* dist/src/trackers/

# Build
npm run build

# Create npm package
npm pack

# Install locally
npm install -g ./symphony-custom-tracker-0.2.0-plane.tgz
```

**4.2 Update Body-Bridge Workflow**

**File**: `symphony-integration/implementation/workflow-configs/body-bridge-workflow.md`
```yaml
---
tracker:
  kind: plane
  endpoint: http://10.0.0.112:3300/api/v1/
  api_key: $PLANE_API_KEY
  workspace_slug: body-bridge
  project_id: 13cecebf-f9ff-41bd-b5bb-b88774ef6440
  active_states: 
    - Todo
    - In Progress
  terminal_states:
    - Done
    - Cancelled
polling:
  interval_ms: 30000
agent:
  mode: local
  max_concurrent_agents: 1
codex:
  command: opencode
  model: gpt-4.1
workspace:
  root: .
  branch_prefix: symphony/
observability:
  snapshot_max_events: 160
  history:
    enabled: true
    database_path: .symphony/state/history.sqlite
settings:
  runtime_overrides:
    enabled: true
---
Work on {{ issue.identifier }}: {{ issue.title }}.

Follow the Body-Bridge workflow contract from AGENTS.md and keep changes scoped.
```

**4.3 Create Installation Guide**

**File**: `symphony-integration/docs/INSTALLATION.md`
```markdown
# Symphony with Plane.so - Installation Guide

## Prerequisites
- Node.js >= 24.11.1
- Plane.so instance running
- Body-Bridge project checked out

## Installation

1. Install custom Symphony:
```bash
npm install -g @your-org/symphony
```

2. Configure environment:
```bash
export PLANE_API_KEY=your_api_key_here
```

3. Start Symphony:
```bash
symphony symphony-integration/implementation/workflow-configs/body-bridge-workflow.md
```

## Usage

1. Create issues in Plane.so Body Bridge project
2. Move to "Todo" or "In Progress" state
3. Symphony automatically picks up and processes
4. Monitor dashboard at http://127.0.0.1:3210
```

### Phase 5: Verification (1 hour)

**5.1 Test with Real Issue**
1. Start Symphony daemon
2. Move BODYBRIDGE-1 from Todo to In Progress
3. Verify Symphony picks it up
4. Check dashboard for agent progress
5. Verify agent comments on issue

**5.2 Validation Checklist**
- ✅ Symphony starts without validation errors
- ✅ Plane.so issues appear in dashboard
- ✅ Agent sessions spawn for active issues
- ✅ Issue state transitions work correctly
- ✅ Comments are posted to Plane.so
- ✅ Linear mode still works (backward compatibility)

## Technical Details

### Key Changes

**Before (Linear-only):**
```javascript
// Hardcoded Linear client
this.trackerClient = new LinearIssueTrackerClient(config, logger);
```

**After (Plugin system):**
```javascript
// Dynamic client creation
this.trackerClient = createTrackerClient(config, logger);

// Registry manages multiple trackers
const registry = new TrackerRegistry();
registry.register(new LinearTrackerPlugin());
registry.register(new PlaneTrackerPlugin());
```

### Benefits

1. **Extensibility**: Easy to add new trackers (GitHub Issues, Jira, etc.)
2. **Backward Compatible**: Existing Linear workflows unchanged
3. **Clean Architecture**: Separation of concerns between core and trackers
4. **Testable**: Each tracker can be tested independently
5. **Production Ready**: Your Plane.so adapter is already battle-tested

### Risk Mitigation

- **Configuration Validation**: Each tracker validates its own config
- **Error Handling**: Graceful fallback for missing/invalid trackers
- **Backward Compatibility**: Linear mode unchanged and tested
- **Isolation**: Tracker failures don't crash Symphony core

## Timeline

- **Phase 1**: 1-2 hours
- **Phase 2**: 4-6 hours  
- **Phase 3**: 2-3 hours
- **Phase 4**: 1-2 hours
- **Phase 5**: 1 hour

**Total**: 9-14 hours

## Success Criteria

1. ✅ Symphony validates Plane.so config correctly
2. ✅ Plane.so issues appear in Symphony dashboard
3. ✅ Agents spawn and work on Plane.so issues
4. ✅ Issue state transitions work bidirectionally
5. ✅ Comments are posted to Plane.so
6. ✅ Linear mode still works
7. ✅ Dashboard shows Plane.so issue metadata
8. ✅ No Symphony crashes with invalid config
9. ✅ Performance acceptable (polling doesn't degrade)
10. ✅ Documentation clear and accurate