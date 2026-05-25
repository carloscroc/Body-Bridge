name: issue-workflow
description: Automated issue→branch→PR workflow for GitHub. Reads issues, creates branches, implements fixes, commits changes, and opens PRs. Use when asked to "work on an issue", "fix an issue", "create PR from issue", "start working", or when picking up GitHub issues to implement.
trigger: ["work on an issue", "fix an issue", "create PR from issue", "start working", "pick up issue", "handle issue"]

# Workflow Steps

## Step 1: List Open Issues
Use `gh` CLI to fetch open issues from the repository:

```bash
gh issue list --repo carloscroc/Body-Bridge --state open --limit 20
```

Display the issues in a numbered list for easy selection.

## Step 2: User Selects Issue
Present the issues to the user and ask which one to work on, OR auto-select the first unassigned issue.

If asking for selection:
- Format: "Select an issue to work on:"
- Show: issue number, title, labels, assignee
- Options: 1-N for issues, or "skip" to exit

## Step 3: Fetch Issue Details
Once issue is selected, fetch full details:

```bash
gh issue view [ISSUE_NUMBER] --repo carloscroc/Body-Bridge
```

This shows:
- Title
- Body/description
- Labels
- Assignees
- Created date

## Step 4: Create Feature Branch
Create a branch named: `issue/[NUMBER]-[short-title]`

```bash
git checkout -b issue/[NUMBER]-[slugified-title]
```

Example: For "Fix user picture upload" (issue #3)
```
git checkout -b issue/3-fix-user-picture-upload
```

## Step 5: Analyze Requirements
Read the issue body carefully and identify:
- What needs to be fixed/implemented
- Any acceptance criteria mentioned
- Related files that might need changes
- Questions to clarify (ask user if needed)

## Step 6: Implement the Fix
Based on the issue requirements:
1. Explore the codebase to understand the relevant code
2. Make necessary changes
3. Follow existing code patterns and style
4. Add comments only where necessary

## Step 7: Run Tests
Run relevant tests to verify the fix:

```bash
npm run test
```

Or run specific tests:
```bash
npx playwright test
```

If tests fail, fix the issues before proceeding.

## Step 8: Commit Changes
Create a commit with conventional message format:

```
fix #[ISSUE_NUMBER]: [descriptive title]

[Optional: brief description of changes made]
```

Example:
```
fix #3: Fix user picture upload functionality

- Add file upload handling to user profile endpoint
- Store uploaded image in database
- Return image URL after successful upload
```

## Step 9: Push Branch
Push the branch to remote:

```bash
git push -u origin issue/[NUMBER]-[slugified-title]
```

## Step 10: Create Pull Request
Create a PR using the template:

```bash
gh pr create --repo carloscroc/Body-Bridge \
  --title "fix #[NUMBER]: [issue title]" \
  --body "$(cat .github/pull_request_template.md)" \
  --assignee "@me"
```

Update the template:
- Replace `#` with actual issue number
- Fill in the description section
- Mark the type of change
- Document testing performed
- Add screenshots if UI changes

## Step 11: Verify Project Board Update
The GitHub Actions workflow should automatically:
- Move project item to "In Progress" when PR is opened
- Move to "Done" when PR is merged
- Move to "Cancelled" if PR is closed without merge

Verify this happened:
```bash
gh project item-list 5 --owner carloscroc
```

## Step 12: Report Completion
Inform the user:
- PR created successfully
- Link to the PR
- Project board should auto-update
- Ask for review/merge

---

## Important Notes

1. **Always use `gh` CLI** - It's free, authenticated, and has no rate limits for CLI operations
2. **Respect branch naming** - Always use `issue/[NUMBER]-[slug]` format
3. **Use the PR template** - It ensures consistent PR descriptions
4. **Test before committing** - Don't push broken code
5. **Ask for clarification** - If issue is unclear, ask user before proceeding
6. **Link issue in PR** - Use "Fixes #NUMBER" or "Closes #NUMBER" in PR body

---

## Error Handling

If `gh` commands fail:
- Check authentication: `gh auth status`
- Check repository access: `gh repo view carloscroc/Body-Bridge`
- Verify issue exists: `gh issue view [NUMBER]`

If push fails:
- Check git remote: `git remote -v`
- Ensure branch name is valid

If PR creation fails:
- Check branch exists on remote
- Verify template file exists
- Try without template first

---

## Quick Reference

- **Repository:** carloscroc/Body-Bridge
- **Project Board:** Body Bridge Fitness (#5)
- **Project ID:** PVT_kwHOA1QRQc4BYo6p
- **Main branch:** main