# Mempalace: True Conversational Memory Plan

## The Goal
When you start a new opencode session and ask the AI:
- "Do you remember X?" → AI can answer from past conversations
- "What did we decide about Y?" → AI recalls the decision
- "What are my preferences?" → AI knows from past chats

**Not automatic resumption - but queryable conversational memory.**

## Core Problem
Each opencode session is stateless. The AI has no access to past conversations. We need to:
1. Capture conversations as they happen
2. Store them in a queryable format
3. Retrieve relevant context when the AI is asked

## Phase 1: Conversation Capture
**Store each conversation as mempalace memories**

### 1.1 Hook into conversation events
Research opencode's conversation lifecycle:
- `message.created` - When user sends a message
- `message.updated` - When AI responds
- `session.updated` - Throughout the conversation

### 1.2 Create conversation memory format
Each stored memory should capture:
```javascript
{
  category: "conversation",
  type: "user-preference" | "decision" | "context" | "fact" | "opinion",
  summary: "Short one-line summary (for quick scanning)",
  content: "Full conversation excerpt or context",
  tags: ["ui-preferences", "dark-mode"],  // Searchable keywords
  metadata: {
    session_id: "sess_123",
    timestamp: "2026-06-03T...",
    project: "body-bridge",
    importance: "medium",
    related_files: ["src/components/Header.tsx"],  // If relevant
    emotion: "frustrated" | "excited" | "neutral"  // Optional sentiment
  }
}
```

### 1.3 Create memory capture plugin
Update `~/.config/opencode/plugins/mempalace-session.js`:
- Hook into `message.updated` (when AI responds)
- Analyze the conversation pair (user question + AI response)
- Extract key information:
  - User preferences stated
  - Decisions made
  - Context shared (files, requirements, constraints)
  - Important facts or opinions
- Store each as a separate memory in `./.memory/memory-index.json`

### 1.4 Memory classification logic
When storing a memory, classify its type:
- **user-preference**: "I prefer X over Y"
- **decision**: "We decided to use React instead of Vue"
- **context**: "The frontend uses Vite, not Webpack"
- **fact**: "The database is Convex, not Firebase"
- **opinion**: "This approach feels cleaner"

## Phase 2: Memory Querying
**Allow the AI to retrieve relevant memories**

### 2.1 Create query tool
Create `scripts/memory-query.js` with functions:
```javascript
// Search memories by keywords
async function searchMemories(query) {
  // Returns all memories matching the query
}

// Get recent user preferences
async function getUserPreferences(projectName) {
  // Returns all user-preference type memories
}

// Get recent decisions
async function getRecentDecisions(projectName, limit = 10) {
  // Returns recent decision type memories
}

// Get context about a specific topic
async function getContextAbout(topic, projectName) {
  // Returns all memories related to the topic
}
```

### 2.2 Create opencode tool
Create `.opencode/tools/memory-query.js`:
- Expose query functions as opencode tools
- AI can call: `tool: memory_search("UI preferences")`
- Returns relevant memories in AI-friendly format

### 2.3 Add npm scripts
Update `package.json`:
```json
"memory:search": "node scripts/memory-query.js search",
"memory:preferences": "node scripts/memory-query.js preferences",
"memory:decisions": "node scripts/memory-query.js decisions",
"memory:about": "node scripts/memory-query.js about <topic>"
```

## Phase 3: AI Awareness
**Make memories accessible during conversations**

### 3.1 Create "memory check" skill
Create `.opencode/skills/memory/SKILL.md`:
- Trigger: When user asks about past conversations
  - "Do you remember..."
  - "What did we decide..."
  - "What are my preferences..."
  - "What was said about..."
- Action: Query mempalace for relevant memories
- Output: Present memories to AI in conversational format

### 3.2 Auto-suggest memory queries
When user mentions:
- "I prefer" → Store as user-preference memory
- "Let's use" → Store as decision memory
- "The app uses" → Store as context memory
- "I think" → Store as opinion memory

### 3.3 Memory presentation format
When memories are retrieved, present them as:
```
From previous conversation [2 days ago]:
- You stated: "I prefer dark mode and hate popups"
- We decided: "Use React instead of Vue"
- Context: "The frontend uses Vite, not Webpack"
```

## Phase 4: Memory Quality
**Ensure memories are useful and accurate**

### 4.1 Deduplication
- Before storing, check for similar existing memories
- Merge similar memories
- Update existing memories instead of creating duplicates

### 4.2 Relevance scoring
- When querying, rank memories by:
  - Recency (more recent = higher score)
  - Importance (critical > high > medium > low)
  - Keyword match (more matches = higher score)
  - Related files (if discussing a file, prioritize memories about it)

### 4.3 Memory expiration
- Tag memories with confidence level
- Periodically review and clean up low-confidence memories
- Keep high-importance memories longer

### 4.4 Cross-project memory
- Some memories are project-specific (e.g., "Use React")
- Some are user-specific (e.g., "Prefer dark mode")
- Store in appropriate location:
  - Project-specific: `<project>/.memory/memory-index.json`
  - User-specific: `~/.mempalace/user-preferences.json`

## Phase 5: Testing & Refinement

### 5.1 Test scenarios
1. Chat 1: "I prefer dark mode and hate popups"
2. End session
3. Chat 2: "Do you remember my UI preferences?"
   → AI: "Yes, you prefer dark mode and hate popups"

4. Chat 1: "Let's use React for the frontend"
5. End session
6. Chat 2: "What framework did we decide on?"
   → AI: "React"

7. Chat 1: "The database is Convex, not Firebase"
8. End session
9. Chat 2: "What database are we using?"
   → AI: "Convex"

### 5.2 Performance testing
- Query response time should be < 500ms
- Should handle 1000+ memories without slowdown
- Memory file size should stay reasonable

## Implementation Order

1. **Week 1: Foundation**
   - Create memory classification logic
   - Hook into `message.updated` to capture conversations
   - Build basic memory storage

2. **Week 2: Querying**
   - Create memory query functions
   - Expose as opencode tool
   - Add npm scripts for manual queries

3. **Week 3: AI Integration**
   - Create "memory check" skill
   - Test query-triggered memory retrieval
   - Refine memory presentation format

4. **Week 4: Quality**
   - Add deduplication
   - Implement relevance scoring
   - Add cross-project memory support
   - Performance optimization

## Key Files to Create/Modify

### New files:
- `scripts/memory-classifier.js` - Classify conversation content
- `scripts/memory-query.js` - Query memories by topic/type
- `.opencode/tools/memory-query.js` - Opencode tool for queries
- `.opencode/skills/memory/SKILL.md` - Memory retrieval skill

### Modified files:
- `~/.config/opencode/plugins/mempalace-session.js` - Hook into message events
- `scripts/mempalace-client.js` - Add deduplication/relevance scoring
- `package.json` - Add query scripts

## Expected Outcome

✅ When you ask "Do you remember X?", the AI retrieves relevant past conversations

✅ Memories are automatically captured and stored (no manual input needed)

✅ Memories are queryable by topic, type, recency, importance

✅ Works across projects and sessions

✅ User-specific memories (preferences) persist across all projects

## Examples

```
User: "Do you remember my opinion on testing?"

AI: (queries mempalace for opinions about testing)
     "From 3 days ago, you said: 'I think manual testing is sufficient for now,
     but we should add E2E tests before launch'."
```

```
User: "What did we decide about the auth system?"

AI: (queries mempalace for decisions about auth)
     "We decided to use Convex Auth with JWT tokens, stored in convex/auth.config.ts"
```

```
User: "What are my UI preferences?"

AI: (queries mempalace for user-preference memories)
     "You prefer:
      - Dark mode
      - No popups
      - Minimalist design
      - Fast load times"
```

## Key Difference From Previous Plan

| ❌ Wrong Plan | ✅ Correct Plan |
|---------------|-----------------|
| Auto-resume work | Query past conversations |
| Track coding sessions | Store conversational context |
| Say "welcome back" | Answer "do you remember" |
| Project-specific only | Project + user-specific memories |
| Session lifecycle | Message lifecycle |