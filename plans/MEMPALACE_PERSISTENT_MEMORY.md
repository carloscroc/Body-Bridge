# Mempalace: Persistent AI Memory Implementation Plan

## Problem
When you start a new opencode session, the AI has no awareness of:
- What was worked on in previous sessions
- What features are in progress
- What decisions were made
- What files were modified
- What needs to happen next

## Solution
Extend mempalace to **automatically restore context** when opencode starts a new session, giving the AI awareness of recent work.

## Phase 1: Context Summary Format
**Create a structured context summary that the AI can ingest at session start**

### 1.1 Define context summary schema
Create `scripts/context-schema.js`:
- `project_name`: Name of the project
- `session_id`: Current session ID
- `last_session_summary`: Brief summary of last session
- `active_features`: Features currently being built (with status)
- `key_decisions`: Recent architecture/technical decisions
- `modified_files`: Files changed in last session
- `next_steps`: What needs to be done next
- `blocked_on`: Any blockers or dependencies
- `achievements`: What was completed recently

### 1.2 Create context summary generator
Update `scripts/context-manager.js`:
- Add `generateContextSummary()` function
- Pulls recent memories from mempalace
- Synthesizes into AI-friendly format
- Returns structured summary object

### 1.3 Store summaries alongside session memories
When a session ends:
- Generate context summary
- Store as a "context-summary" type memory
- Mark with "context-source" tag for easy retrieval

## Phase 2: Automatic Context Restoration
**Hook into opencode's session lifecycle to auto-load context**

### 2.1 Extend session plugin
Update `~/.config/opencode/plugins/mempalace-session.js`:
- On `session.created`: 
  - Load most recent context summary from `.memory/`
  - Generate a summary string
  - **Inject this into the session context** (need opencode API for this)

### 2.2 Determine injection method
Research opencode's API for injecting initial context:
- Option A: `client.session.setContext()` (if exists)
- Option B: Emit a custom event with context data
- Option C: Use a "system message" injection
- Option D: Store in session metadata that AI can query

### 2.3 Create context resume skill
Create `.opencode/skills/context-resume/SKILL.md`:
- Trigger: `/resume` or "what was I working on?"
- Loads recent context summary from mempalace
- Presents to AI as "Here's what you were working on: [summary]"

## Phase 3: AI Awareness Integration
**Make the restored context visible to the AI at session start**

### 3.1 Create session context file
Generate `.memory/current-context.md` on session start:
- Auto-generated summary
- Recent achievements
- Next steps
- Key decisions

### 3.2 Add to opencode's context
Update `AGENTS.md` or similar to reference the context file:
- "Before starting work, always read `.memory/current-context.md`"

### 3.3 Create CLI command
Add to `package.json`:
```json
"memory:resume": "node scripts/context-manager.js resume"
```

## Phase 4: Context Evolution
**Keep the context alive across the session**

### 4.1 Periodic context updates
During a session:
- Every 30 min or after major actions
- Update `current-context.md` with progress
- Add to mempalace as "context-update" memories

### 4.2 End-of-session context save
When session ends:
- Generate final context summary
- Update next steps based on session outcome
- Store for next session's startup

### 4.3 Smart context retrieval
- Load only relevant context (last 3 sessions, or same feature)
- Detect if switching projects/features
- Adapt context accordingly

## Phase 5: Cross-Project Context
**Handle work across multiple projects**

### 5.1 Global context index
Store in `~/.mempalace/context-index.json`:
- All projects with recent sessions
- Last activity timestamp
- Summary of recent work per project

### 5.2 Multi-project resume
When starting in a project:
- Ask user: "Resume from Body-Bridge (2 days ago), Other-Project (5 days ago), or start fresh?"
- Auto-load the selected project's context

## Implementation Order

1. **Week 1: Core functionality**
   - Create context schema (`scripts/context-schema.js`)
   - Build context summary generator (`scripts/context-manager.js`)
   - Update session plugin to generate summaries on session end

2. **Week 2: Auto-restore**
   - Research opencode's context injection API
   - Extend session plugin to load summaries on `session.created`
   - Create `.memory/current-context.md` generation

3. **Week 3: AI integration**
   - Create context resume skill (`/resume`)
   - Add context file to AGENTS.md/project context
   - Test end-to-end: start session → AI knows what was done

4. **Week 4: Refinement**
   - Add periodic context updates
   - Implement smart context retrieval
   - Add cross-project support

## Key Files to Create/Modify

### New files:
- `scripts/context-schema.js` - Context summary schema
- `.opencode/skills/context-resume/SKILL.md` - Resume skill
- `.memory/current-context.md` - Auto-generated context (created at session start)

### Modified files:
- `~/.config/opencode/plugins/mempalace-session.js` - Add context load on session.created
- `scripts/context-manager.js` - Add `generateContextSummary()` and `resume()`
- `package.json` - Add `memory:resume` command
- `AGENTS.md` - Add context file reference

## Testing Plan

1. Start a session, do some work, end it
2. Start a new session in the same project
3. Verify AI asks "Resume work on [feature] from last session?"
4. Verify AI knows what files were modified
5. Verify AI knows next steps
6. Test across different projects
7. Test with gaps in time (1 day, 1 week)

## Expected Outcome

✅ When you start a new opencode session, the AI automatically says:
```
Welcome back! Last session you were working on [feature], completed [X], 
and were about to [next step]. Continue from there or start fresh?
```

✅ AI has full awareness of recent work without you having to explain it

✅ Zero manual commands needed for memory restoration

✅ Works across any project where mempalace is installed