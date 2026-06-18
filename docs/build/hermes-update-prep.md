# Hermes Update Preparation

## Problem
Hermes updates fail with "Access denied" when trying to delete `venv\Lib\site-packages\brotlicffi\_brotlicffi.pyd`. This happens because:
1. Hermes crashes on previous startup
2. Python process stays alive, keeping the `.pyd` file locked
3. Windows cannot delete locked files during venv recreation

## Solution
Use `hermes-update-prep.ps1` before updating Hermes. It:
1. Kills all Hermes processes cleanly
2. Kills Hermes Python processes (only those in venv, not others)
3. Removes the venv directory
4. Clears logs for fresh start

## Usage

### Option 1: Quick test (no changes)
```powershell
.\hermes-update-prep.ps1 -WhatIf
```

### Option 2: Standard cleanup
```powershell
.\hermes-update-prep.ps1
```

### Option 3: Force cleanup (Admin required)
```powershell
.\hermes-update-prep.ps1 -Force
```

### Option 4: Via npm (from Body-Bridge directory)
```powershell
npm run hermes:prep
```

## Workflow
1. Run the prep script
2. Click "Update" or "Repair" in Hermes
3. Success!

## Why This Is Better Than Manual Fixes
- ✅ Only kills Hermes processes (preserves other Python apps)
- ✅ Verifies cleanup before exiting
- ✅ Force mode with ownership fallback for stubborn files
- ✅ WhatIf mode to preview changes
- ✅ Available in your workspace at `C:\Users\thebe\Downloads\Body-Bridge\`

## Root Cause Prevention
To reduce the likelihood of this happening:
1. Close Hermes properly (use Quit, not just closing the window)
2. Check Task Manager before updating if Hermes was acting up
3. This script handles the rest!