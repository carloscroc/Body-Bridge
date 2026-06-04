# 🗂️ File Organization Script

This script helps organize the Body-Bridge project by moving files to their proper locations.

## Usage

```powershell
# Run the organization script
.\scripts\organize-project.ps1

# Or execute individual sections
.\scripts\organize-project.ps1 -Phase "structure"
.\scripts\organize-project.ps1 -Phase "migration"
.\scripts\organize-project.ps1 -Phase "cleanup"
```

## Organization Mapping

### Files to Move to docs/planning/
- `IMPLEMENTATION_PLAN.md` → `docs/planning/implementation-plan.md`
- `MEMPALACE_INTEGRATION_PLAN.md` → `docs/planning/mempalace-integration.md`
- `RELEASE_EXECUTION_PLAN.md` → `docs/planning/release-execution.md`
- `RELEASE_PREPARATION_GUIDE.md` → `docs/planning/release-preparation.md`
- `regression-test-requirements.md` → `docs/planning/regression-testing.md`

### Files to Move to docs/security/
- `SECURITY_COMPLETION_REPORT.md` → `docs/security/completion-report.md`
- `SECURITY_VULNERABILITY_REPORT.md` → `docs/security/vulnerability-report.md`
- `security-patch-documentation.md` → `docs/security/patch-documentation.md`
- `dependency-security-report.md` → `docs/security/dependency-report.md`
- `GITHUB_SECRETS_SETUP.md` → `docs/security/github-secrets.md`
- `DEEPSEC_FULL_TRIAGE_PLAN.md` → `docs/security/deepsec-triage.md`

### Files to Move to docs/operations/
- `DEPLOYMENT_GUIDE.md` → `docs/operations/deployment-guide.md`
- `DEPLOYMENT_QUICK_REFERENCE.md` → `docs/operations/deployment-quick-ref.md`
- `CLOUD_DATABASE_SETUP_COMPLETE.md` → `docs/operations/database-setup.md`
- `CLOUD_DATABASE_USAGE.md` → `docs/operations/database-usage.md`
- `CLOUD_DEPLOYMENT_COMPLETE.md` → `docs/operations/cloud-deployment.md`
- `CONVEX_CLOUD_DEPLOYMENT.md` → `docs/operations/convex-deployment.md`
- `STANDALONE-VERIFICATION.md` → `docs/operations/standalone-verification.md`
- `MEMPALACE_README.md` → `docs/operations/mempalace-usage.md`
- `NAME_CHANGE_COMPLETE.md` → `docs/operations/name-change-complete.md`
- `QUICK_NAME_CHANGE.md` → `docs/operations/quick-name-change.md`
- `RENAME-SUMMARY.md` → `docs/operations/rename-summary.md`

### Files to Move to docs/guides/
- `APP_CONFIGURATION.md` → `docs/guides/app-configuration.md`
- `IMPORT_GUIDE.md` → `docs/guides/data-import.md`
- `README-dependency-security.md` → `docs/guides/dependency-security.md`
- `ANDROID_DEV_PROMPT.md` → `docs/guides/android-development.md`
- `ANDROID_BUILD_ISSUE_JAVA_VERSION.md` → `docs/guides/android-build-fix.md`
- `HYBRID_APP_PROMPT.md` → `docs/guides/hybrid-app-development.md`
- `workout-detail.md` → `docs/guides/workout-detail.md`
- `workout-playing.md` → `docs/guides/workout-playing.md`

### Files to Move to docs/implementation/
- `IMPLEMENTATION_COMPLETE.md` → `docs/implementation/implementation-complete.md`
- `MEMPALACE_IMPLEMENTATION_COMPLETE.md` → `docs/implementation/mempalace-complete.md`
- `P4_IMPLEMENTATION_COMPLETE.md` → `docs/implementation/p4-complete.md`
- `P4_IMPLEMENTATION_PROGRESS.md` → `docs/implementation/p4-progress.md`
- `PROJECT_COMPLETION_REPORT.md` → `docs/implementation/project-complete.md`

## Symphony Integration Setup

### Move Symphony Integration Plan
Move the comprehensive plan to:
```
C:\Users\thebe\Downloads\symphony-plane-so-integration-plan.md
→ symphony-integration/spec/main-integration-plan.md
```

### Create Symphony Integration Structure
```
symphony-integration/
├── spec/
│   ├── main-integration-plan.md
│   ├── technical-requirements.md
│   ├── architecture.md
│   └── api-mapping.md
├── implementation/
│   ├── plane-so-adapter/
│   ├── symphony-modified/
│   ├── agent-skills/
│   └── workflow-configs/
├── docs/
│   ├── setup-guide.md
│   ├── user-guide.md
│   └── troubleshooting.md
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── scripts/
    ├── setup/
    ├── deployment/
    └── monitoring/
```

## Files to Keep in Root
Only these files should remain in the root directory:
- `README.md`
- `AGENTS.md`
- `WORKFLOW.md`
- `OPENCODE_INSTRUCTIONS.md`
- `PROJECT_ORGANIZATION.md`

## Benefits of This Organization

### 1. Clear Separation
- Planning documents in `docs/planning/`
- Implementation details in `docs/implementation/`
- Operational procedures in `docs/operations/`
- Security information in `docs/security/`

### 2. Easy Navigation
- Logical folder structure
- Categorized by purpose
- Scalable for future growth

### 3. Symphony Integration Focus
- Dedicated `symphony-integration/` folder
- Self-contained development environment
- Clean separation from main project

### 4. Professional Structure
- Industry-standard organization
- Easy onboarding for new team members
- Better version control

## Execution Steps

### Step 1: Backup Current State
```powershell
# Create backup directory
New-Item -ItemType Directory -Force -Path "backup-before-organization-$(Get-Date -Format 'yyyyMMdd')"

# Backup all markdown files
Get-ChildItem -Filter "*.md" | Copy-Item -Destination "backup-before-organization-$(Get-Date -Format 'yyyyMMdd')\"
```

### Step 2: Create Directory Structure
```powershell
# Create all required directories
$directories = @(
    "docs\planning",
    "docs\architecture",
    "docs\operations",
    "docs\api",
    "docs\security",
    "docs\guides",
    "docs\implementation",
    "symphony-integration\spec",
    "symphony-integration\implementation",
    "symphony-integration\docs",
    "symphony-integration\test",
    "symphony-integration\scripts",
    "skills\plane-so-operations",
    "skills\code-manipulation",
    "skills\testing",
    "skills\documentation",
    "tools\symphony"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Write-Host "Created directory: $dir" -ForegroundColor Green
}
```

### Step 3: Move Files According to Plan
```powershell
# Move planning documents
$fileMoves = @{
    "IMPLEMENTATION_PLAN.md" = "docs\planning\implementation-plan.md"
    "MEMPALACE_INTEGRATION_PLAN.md" = "docs\planning\mempalace-integration.md"
    "RELEASE_EXECUTION_PLAN.md" = "docs\planning\release-execution.md"
    "RELEASE_PREPARATION_GUIDE.md" = "docs\planning\release-preparation.md"
    "regression-test-requirements.md" = "docs\planning\regression-testing.md"
}

foreach ($file in $fileMoves.Keys) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination $fileMoves[$file] -Force
        Write-Host "Moved: $file → $($fileMoves[$file])" -ForegroundColor Yellow
    }
}
```

### Step 4: Move Symphony Integration Plan
```powershell
# Move Symphony plan to proper location
$symphonyPlanPath = "C:\Users\thebe\Downloads\symphony-plane-so-integration-plan.md"
$symphonyDestination = "symphony-integration\spec\main-integration-plan.md"

if (Test-Path $symphonyPlanPath) {
    Move-Item -Path $symphonyPlanPath -Destination $symphonyDestination -Force
    Write-Host "Moved Symphony plan to: $symphonyDestination" -ForegroundColor Green
}
```

### Step 5: Verify Organization
```powershell
# Check root directory for remaining files
Write-Host "`n=== Files remaining in root directory ===" -ForegroundColor Cyan
Get-ChildItem -Filter "*.md" | ForEach-Object {
    Write-Host $_.Name -ForegroundColor White
}

# Check Symphony integration structure
Write-Host "`n=== Symphony integration structure ===" -ForegroundColor Cyan
Get-ChildItem -Path "symphony-integration" -Recurse -File | ForEach-Object {
    Write-Host $_.FullName.Replace((Get-Location).Path + "\", "") -ForegroundColor White
}
```

## Next Steps After Organization

1. **Update References**: Search for and update any broken file references
2. **Update README**: Modify README.md to reflect new structure
3. **Update CI/CD**: Update any scripts that reference old file paths
4. **Test Builds**: Ensure build processes still work with new structure
5. **Commit Changes**: Commit the organizational changes with a descriptive message

## Rollback Plan

If something goes wrong, you can rollback from the backup:

```powershell
# Restore from backup
$backupDir = "backup-before-organization-YYYYMMDD"
Copy-Item -Path "$backupDir\*" -Destination "." -Force -Recurse

# Verify restoration
Write-Host "Files restored from backup: $backupDir"
```

## Success Criteria

The organization is successful when:
1. ✅ Root directory contains only 5 essential markdown files
2. ✅ All planning documents are in `docs/planning/`
3. ✅ All security documents are in `docs/security/`
4. ✅ All operational documents are in `docs/operations/`
5. ✅ All guides are in `docs/guides/`
6. ✅ Symphony integration plan is in `symphony-integration/spec/main-integration-plan.md`
7. ✅ No broken file references
8. ✅ All build processes still work correctly

This organization will make your project much more professional and maintainable!