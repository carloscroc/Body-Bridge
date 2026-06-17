---
tracker:
  kind: plane
  workspace_slug: body-bridge
  project_slug: body-bridge
  project_id: 88c6aa6b-3fb8-4049-9c14-502fa5639587
  base_url: http://10.0.0.112:3300
  api_key: $PLANE_API_KEY
  issues_url: http://10.0.0.112:3300/body-bridge/projects/88c6aa6b-3fb8-4049-9c14-502fa5639587/issues/
  active_states:
    - Backlog
    - Unstarted
    - Started
  terminal_states:
    - Done
    - Cancelled
  state_transitions:
    todo: In Progress
    in_progress: Human Review
    human_review: Merging
    merging: Done

workspace:
  root: ~/code/symphony-workspaces
  hooks:
    after_create: |
      # Clone Body-Bridge repository
      git clone --depth 1 https://github.com/carloscroc/Body-Bridge.git .
      # Install dependencies
      npm ci
      # Setup Convex local development
      cp .env.local.dev .env.local
      # Verify environment
      echo "Environment setup complete for issue: {{ issue.identifier }}"

agent:
  max_concurrent_agents: 3
  max_turns: 20
  timeout_minutes: 30

codex:
  command: codex app-server
  approval_policy:
    reject:
      sandbox_approval: true
      rules: true
      mcp_elicitations: true
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    read:
      - "**"
    write:
      - "src/**"
      - "convex/**"
      - "server/**"
      - "tests/**"
      - "package.json"
      - "*.config.*"

# Plane.so-specific configuration for agent skills
plane:
  base_url: http://10.0.0.112:3300
  api_key: $PLANE_API_KEY
  project_slug: body-bridge
  workspace_slug: body-bridge

---

# Body-Bridge Development Workflow

You are working on Body-Bridge issue {{ issue.identifier }}.

## Issue Details
**Title**: {{ issue.title }}
**Description**: {{ issue.description }}
**Priority**: {{ issue.priority }}
**State**: {{ issue.state }}
**Labels**: {{ issue.labels | join(", ") }}

## Project Overview
Body-Bridge (Forge Fitness) is a fitness and workout application built with React, TypeScript, and Convex.

### Technology Stack
- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: Express.js (port 3001)
- **Database**: Convex (cloud database)
- **Testing**: Playwright (E2E testing)
- **AI Integration**: OpenAI, OpenRouter, Z.AI support

### Key Components
- `/src` - React frontend components and screens
- `/convex` - Convex backend functions and database schema
- `/server` - Express API server
- `/tests` - Playwright E2E tests
- `/scripts` - Build and deployment scripts

## Your Task

You are to implement the requested changes for this issue following this workflow:

### 1. Planning Phase
1. **Analyze the issue** - Understand the requirements clearly
2. **Create a detailed implementation plan** - Break down into small, testable steps
3. **Identify affected components** - List all files that need modification
4. **Consider edge cases** - Think about potential issues and how to handle them

### 2. Implementation Phase
1. **Make incremental changes** - Work on one small task at a time
2. **Test each change** - Run relevant tests to ensure functionality
3. **Update documentation** - Keep code comments and docs in sync
4. **Maintain code quality** - Follow TypeScript best practices

### 3. Testing Phase
1. **Run unit tests** - Execute test suite for modified components
2. **Run E2E tests** - Use Playwright for end-to-end validation
3. **Manual testing** - Test the changes in the running application
4. **Video recording** - Capture evidence of working functionality

### 4. Verification Phase
1. **Code review checklist**:
   - Does the code follow TypeScript conventions?
   - Are there any obvious bugs or edge cases?
   - Is the code well-documented?
   - Does it pass all tests?
2. **Create test evidence** - Record video of functionality working
3. **Document any issues** - Note any limitations or known problems

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions in the project
- Add meaningful comments for complex logic
- Keep functions focused and manageable

### Convex Integration
- All backend logic goes in `/convex` directory
- Follow existing function patterns in `convex/*.ts`
- Test Convex functions with `npx convex dev`
- Use proper error handling and validation

### Frontend Components
- Components go in `/src/components` or `/src/screens`
- Use existing UI patterns and components
- Maintain responsive design principles
- Test component changes with Playwright

### Testing Requirements
- Write tests for new functionality
- Update existing tests when modifying behavior
- Ensure E2E tests cover user workflows
- Test error scenarios and edge cases

## Required Commands

### Environment Setup
```bash
# Install dependencies
npm ci

# Copy environment config
cp .env.local.dev .env.local

# Start development server
npm run dev
```

### Testing
```bash
# Run E2E tests
npx playwright test

# Run specific test
npx playwright test tests/your-test.spec.ts

# Run with video recording
npx playwright test --video=on
```

### Build & Deploy
```bash
# Build for production
npm run build

# Deploy Convex functions
npx convex deploy
```

## Definition of Done

An issue is considered complete when:

1. **Code Quality**
   - All code changes are implemented and tested
   - TypeScript compilation succeeds without errors
   - Code follows project conventions and style

2. **Testing**
   - All relevant tests pass
   - E2E tests validate the functionality
   - Video evidence captures the working feature

3. **Documentation**
   - Code is properly commented
   - Any API changes are documented
   - Complex logic is explained

4. **Verification**
   - The feature works as specified in the issue
   - No obvious bugs or edge cases
   - Performance is acceptable

5. **Cleanup**
   - No console errors or warnings
   - No temporary or debug code left
   - Git history is clean

## Communication with Plane.so

You should update the plane.so ticket as follows:

1. **Start of work**: Update ticket state to "In Progress"
2. **Progress updates**: Add comments every 5-10 minutes with status
3. **Questions**: Ask for clarification if requirements are unclear
4. **Completion**: Update state to "Human Review" with completion summary
5. **Evidence**: Upload video recordings and test results

### Comment Format
```
Progress: [Step X of Y]
- What you're working on
- Any issues encountered
- Next steps planned
```

### Video Evidence Format
When uploading video evidence, describe what the video demonstrates:
```
Video evidence showing:
- [Specific functionality tested]
- [Test scenarios covered]
- [Expected vs actual behavior]
```

## Error Handling

If you encounter issues:

1. **Document the problem** - Be specific about what's wrong
2. **Research the solution** - Check docs, similar code, ask for help
3. **Create minimal reproducible example** - Isolate the problem
4. **Update the ticket** - Add comment describing the blocker
5. **Request help** - Set ticket to appropriate state for human intervention

## Success Criteria

This issue will be considered successful when:

- The implementation meets all requirements from the issue description
- All tests pass (unit and E2E)
- Video evidence demonstrates the functionality working correctly
- Code review criteria are met
- The feature is ready for human review and potential deployment

Now proceed with implementing this issue. Start with the planning phase, then move through implementation, testing, and verification phases. Update the plane.so ticket regularly with your progress.