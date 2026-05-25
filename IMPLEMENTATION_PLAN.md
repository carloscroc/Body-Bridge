# Automated Issue→PR Workflow Implementation Plan

## Overview
Implement a 100% free, unlimited workflow using minimal GitHub Actions + OpenCode CLI operations.

## Workflow Summary
1. Create GitHub Issue
2. Issue auto-added to Project Board (GitHub Action)
3. OpenCode reads issue and creates branch
4. OpenCode implements fix
5. OpenCode commits and creates PR
6. PR status syncs to Project Board (GitHub Action)
7. You review and merge

---

## Files to Create

### 1. `.github/workflows/issue-to-project.yml`
- **Purpose:** Auto-add new issues to project board
- **Trigger:** `issues.opened`
- **Cost:** ~1 minute per new issue

### 2. `.github/workflows/project-pr-sync.yml`
- **Purpose:** Update project board status based on PR events
- **Triggers:** `pull_request.opened`, `pull_request.merged`, `pull_request.closed`
- **Cost:** ~1 minute per PR event

### 3. `.github/pull_request_template.md`
- **Purpose:** Standardized PR description template

### 4. `.opencode/skills/issue-workflow/SKILL.md`
- **Purpose:** OpenCode skill to orchestrate issue→PR flow

---

## Implementation Order

### Phase 1: GitHub Actions (DONE)
- [x] Create `issue-to-project.yml`
- [x] Create `project-pr-sync.yml`

### Phase 2: PR Template (DONE)
- [x] Create `pull_request_template.md`

### Phase 3: OpenCode Skill (DONE)
- [x] Create `issue-workflow` skill

### Phase 4: Testing
- [ ] Test issue→project flow
- [ ] Test OpenCode issue workflow
- [ ] Test PR→project status sync

### Phase 5: Cleanup
- [ ] Delete this plan file

---

## Project Board Details
- **Project:** Body Bridge Fitness
- **Owner:** carloscroc
- **Project Number:** 5
- **Project ID:** PVT_kwHOA1QRQc4BYo6p
- **Status Field:** Status (single-select)

## Cost Analysis
- **GitHub Actions:** ~2 workflows, minimal runs
- **gh CLI:** Free, no rate limits for authenticated ops
- **OpenCode:** Local execution, no cloud costs
- **Total:** FREE & UNLIMITED

---

## Last Updated: 2026-05-24