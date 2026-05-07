# Mempalace Integration for Forge

## Overview

This integration provides automated knowledge management for the Forge project using mempalace. It automatically captures, stores, and retrieves development context across all sessions and chats.

## Features

### ✅ Automatic Memory Capture
- **Git commits** - Automatically captures commit information
- **Build completion** - Stores build results and metrics
- **Test completion** - Records test results and coverage
- **Security scans** - Saves vulnerability findings
- **Code changes** - Tracks modifications and fixes
- **Session context** - Preserves current state and progress

### ✅ Intelligent Memory Retrieval
- **Semantic search** - Find relevant memories by meaning
- **Category filtering** - Browse by technical, security, project, etc.
- **Tag-based search** - Find memories by specific tags
- **Time-based queries** - Get memories from specific periods
- **Importance ranking** - Prioritize critical information

### ✅ Cross-Session Persistence
- **Automatic context saving** - No manual save required
- **Session restoration** - Pick up where you left off
- **Knowledge accumulation** - Build comprehensive project knowledge
- **Pattern recognition** - Identify recurring issues and solutions

## Installation

The integration is already set up in your Forge project. All scripts are in the `scripts/` directory.

## Usage

### Command Line Interface

```bash
# Save current context
npm run memory:save

# Restore context (most recent)
npm run memory:restore

# Restore context with query
npm run memory:restore '{"query": "security vulnerability"}'

# View recent memories
npm run memory:recent

# Search memories
npm run memory:search

# Get memory statistics
npm run memory:stats

# View context history
npm run memory:history

# Enable auto-save (every 5 minutes)
npm run memory:autosave
```

### Automatic Triggers

The following events automatically trigger memory capture:

1. **Git Commits**
   ```bash
   git commit -m "Fix security vulnerability"
   # Automatically captured via post-commit hook
   ```

2. **Build Completion**
   ```bash
   npm run build
   # Automatically captures build results
   ```

3. **Test Completion**
   ```bash
   npm test
   # Automatically captures test results
   ```

4. **Security Scans**
   ```bash
   npm run security:scan
   # Automatically captures security findings
   ```

### Programmatic Usage

```javascript
const { MempalaceClient } = require('./scripts/mempalace-client');
const { MemoryHooks } = require('./scripts/memory-hooks');
const { ContextManager } = require('./scripts/context-manager');

// Store a memory
const client = new MempalaceClient();
await client.storeMemory({
  category: 'security',
  type: 'fix',
  importance: 'critical',
  summary: 'Fixed axios authentication bypass',
  content: 'Updated axios to 1.15.2 to resolve vulnerability',
  tags: ['security', 'axios', 'authentication'],
  related_files: ['package.json'],
  outcomes: ['Zero vulnerabilities remaining']
});

// Retrieve memories
const memories = await client.retrieveMemories({
  query: 'security vulnerability',
  category: 'security',
  limit: 5
});

// Use hooks for automatic capture
const hooks = new MemoryHooks();
await hooks.onVulnerabilityFix({
  package: 'axios',
  severity: 'high',
  cve: 'CVE-2025-62718',
  oldVersion: '1.15.0',
  newVersion: '1.15.2',
  description: 'Authentication bypass via prototype pollution',
  files: ['package.json']
});

// Manage context
const contextManager = new ContextManager();
await contextManager.saveContext();
const restoredContext = await contextManager.restoreContext();
```

## Memory Categories

### Technical
- Code changes and commits
- Bug fixes and solutions
- API implementations
- Architecture decisions

### Security
- Vulnerability findings
- Security fixes and patches
- Audit results
- Compliance status

### Project
- Feature implementations
- Requirements and decisions
- Project milestones
- Team collaboration

### Performance
- Build metrics
- Test results
- Performance benchmarks
- Optimization results

### Learning
- Lessons learned
- Best practices
- Patterns and solutions
- Knowledge gaps

### Context
- Current session state
- Progress tracking
- Blockers and issues
- Next steps

## Memory Structure

Each memory contains:

```json
{
  "id": "mem_1715038400000_abc123def",
  "timestamp": "2026-05-06T21:30:00Z",
  "project": "forge",
  "session_id": "session_uuid",
  "category": "security",
  "type": "fix",
  "importance": "critical",
  "summary": "Fixed axios authentication bypass",
  "content": "Full content...",
  "tags": ["security", "axios", "authentication"],
  "related_files": ["package.json"],
  "outcomes": ["Zero vulnerabilities remaining"],
  "next_steps": ["Monitor for issues"],
  "metadata": {
    "package": "axios",
    "old_version": "1.15.0",
    "new_version": "1.15.2",
    "cve": "CVE-2025-62718"
  }
}
```

## Configuration

Configuration is stored in `.mempalace-forge.json`:

```json
{
  "mempalace_path": "/home/carlos/.mempalace",
  "project": "forge",
  "auto_capture": {
    "enabled": true,
    "triggers": [
      "git_commit",
      "build_complete",
      "test_complete",
      "security_scan",
      "session_end"
    ]
  },
  "categories": {
    "technical": {
      "keywords": ["code", "bug", "fix", "function", "api"],
      "importance": "high"
    },
    "security": {
      "keywords": ["vulnerability", "security", "audit", "patch"],
      "importance": "critical"
    }
  }
}
```

## File Structure

```
Forge/
├── .memory/
│   ├── project-profile.md
│   ├── memory-index.json
│   ├── current-context.json
│   └── context-history.json
├── scripts/
│   ├── mempalace-client.js
│   ├── memory-hooks.js
│   ├── context-manager.js
│   ├── postbuild-memory.js
│   ├── posttest-memory.js
│   └── security-memory.js
├── .git/
│   └── hooks/
│       └── post-commit
└── package.json (updated with memory scripts)
```

## Benefits

### For Development
- **No manual context saving** - Everything captured automatically
- **Instant context restoration** - Get back to work quickly
- **Comprehensive knowledge base** - All project knowledge in one place
- **Pattern recognition** - Learn from past experiences

### For Collaboration
- **Shared knowledge** - Team can access accumulated knowledge
- **Faster onboarding** - New members get instant context
- **Decision tracking** - Understand why decisions were made
- **Best practices** - Learn from team's experiences

### For Productivity
- **Reduced repetition** - Don't solve the same problem twice
- **Faster problem-solving** - Access relevant solutions instantly
- **Better decisions** - Learn from past decisions
- **Continuous improvement** - Build on previous work

## Examples

### Example 1: Security Vulnerability Fix

```bash
# After fixing a vulnerability, it's automatically captured
npm audit fix
# Memory automatically stored with:
# - Vulnerability details
# - Package versions
# - Fix applied
# - Outcomes achieved
```

### Example 2: Feature Implementation

```javascript
// Programmatically capture feature completion
const hooks = new MemoryHooks();
await hooks.onFeatureImplementation({
  name: 'User authentication',
  type: 'feature',
  category: 'security',
  description: 'Implemented OAuth2 authentication',
  files: ['src/auth/oauth.js', 'src/components/Login.tsx'],
  outcomes: ['Users can now authenticate with OAuth2'],
  next_steps: ['Add more providers', 'Improve error handling']
});
```

### Example 3: Context Restoration

```bash
# Start new session and restore context
npm run memory:restore '{"query": "security vulnerabilities"}'

# Get recent security-related memories
npm run memory:search '{"category": "security", "limit": 10}'
```

## Troubleshooting

### Memory Not Being Captured

1. Check if hooks are executable:
   ```bash
   ls -la .git/hooks/post-commit
   ```

2. Verify mempalace is accessible:
   ```bash
   ls -la /home/carlos/.mempalace
   ```

3. Check memory directory permissions:
   ```bash
   ls -la .memory/
   ```

### Context Not Restoring

1. Verify memories exist:
   ```bash
   npm run memory:stats
   ```

2. Check memory index:
   ```bash
   cat .memory/memory-index.json
   ```

3. Try specific query:
   ```bash
   npm run memory:restore '{"query": "your search term"}'
   ```

### Performance Issues

1. Memory index too large - consider pruning old memories
2. Too many auto-save triggers - adjust frequency
3. Slow semantic search - limit search results

## Advanced Usage

### Custom Memory Categories

Add custom categories in `.mempalace-forge.json`:

```json
{
  "categories": {
    "custom": {
      "keywords": ["custom", "specific", "terms"],
      "importance": "medium"
    }
  }
}
```

### Custom Hooks

Create custom hooks in `scripts/custom-hooks.js`:

```javascript
const { MemoryHooks } = require('./memory-hooks');

class CustomHooks extends MemoryHooks {
  async onCustomEvent(data) {
    const memory = {
      category: 'custom',
      type: 'custom-event',
      importance: 'medium',
      summary: data.summary,
      content: data.content,
      tags: data.tags || []
    };
    
    await this.client.storeMemory(memory);
  }
}
```

### Batch Memory Operations

```javascript
// Store multiple memories
const memories = [
  { summary: 'Memory 1', content: 'Content 1', ... },
  { summary: 'Memory 2', content: 'Content 2', ... },
  { summary: 'Memory 3', content: 'Content 3', ... }
];

for (const memory of memories) {
  await client.storeMemory(memory);
}

// Retrieve and process multiple memories
const allSecurity = await client.searchByCategory('security', 50);
allSecurity.forEach(memory => {
  // Process each memory
});
```

## Best Practices

1. **Use descriptive summaries** - Make memories easy to find
2. **Add relevant tags** - Improve searchability
3. **Set appropriate importance** - Prioritize critical information
4. **Include outcomes** - Track results and achievements
5. **Document next steps** - Maintain momentum
6. **Review regularly** - Clean up outdated memories
7. **Use categories consistently** - Maintain organization
8. **Link related memories** - Build knowledge connections

## Future Enhancements

Planned features for future versions:

- [ ] Knowledge graph visualization
- [ ] Machine learning for relevance scoring
- [ ] Automatic pattern detection
- [ ] Collaborative memory sharing
- [ ] Advanced search with filters
- [ ] Memory export/import
- [ ] Web dashboard interface
- [ ] VS Code extension
- [ ] Integration with other tools
- [ ] Performance optimization

## Support

For issues or questions:

1. Check this README
2. Review `MEMPALACE_INTEGRATION_PLAN.md`
3. Examine script source code
4. Check memory logs in `.memory/`

## License

This integration is part of the Forge project and follows the same license.

---

**Status:** ✅ Active and Ready to Use
**Version:** 1.0.0
**Last Updated:** May 6, 2026