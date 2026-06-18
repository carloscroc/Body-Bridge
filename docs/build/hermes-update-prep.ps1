<#
.SYNOPSIS
  Safely prepares Hermes for update by cleaning up processes and locked files.
.DESCRIPTION
  Prevents "Access denied" errors during Hermes bootstrap by:
  1. Killing all Hermes and Python processes cleanly
  2. Removing the venv directory completely
  3. Clearing logs for a fresh start
  Run this BEFORE clicking "Update" or "Repair" in Hermes.
.NOTES
  Requires PowerShell to run as Administrator for reliable cleanup.
#>

param(
    [switch]$Force,
    [switch]$WhatIf
)

$ErrorActionPreference = "Stop"
$hermesRoot = "$env:LOCALAPPDATA\hermes"
$hermesAgent = "$hermesRoot\hermes-agent"

Write-Host "🔧 Hermes Update Prep - v1.0" -ForegroundColor Cyan
Write-Host "This script safely prepares your environment for Hermes updates." -ForegroundColor Gray
Write-Host ""

# Step 1: Kill Hermes processes
Write-Host "📌 Step 1: Terminating Hermes processes..." -ForegroundColor Yellow
$processesToKill = @("hermes", "hermes-gateway", "hermes-backend")
foreach ($procName in $processesToKill) {
    $procs = Get-Process -Name $procName -ErrorAction SilentlyContinue
    if ($procs) {
        Write-Host "  → Found $($procs.Count) $procName process(es)" -ForegroundColor Gray
        if (-not $WhatIf) {
            Stop-Process -Id $procs.Id -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host "  [WHATIF] Would kill: $($procs.Id)" -ForegroundColor Cyan
        }
    }
}

# Step 2: Kill Python processes (especially those from Hermes venv)
Write-Host "📌 Step 2: Terminating Python processes..." -ForegroundColor Yellow
$pythonProcs = Get-Process -Name "python", "pythonw" -ErrorAction SilentlyContinue
if ($pythonProcs) {
    Write-Host "  → Found $($pythonProcs.Count) Python process(es)" -ForegroundColor Gray
    
    foreach ($proc in $pythonProcs) {
        # Check if this Python is from Hermes venv
        $path = $proc.Path
        if ($path -and $path -like "*hermes-agent\venv*") {
            Write-Host "  → Killing Hermes Python (PID $($proc.Id)): $path" -ForegroundColor Gray
            if (-not $WhatIf) {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            } else {
                Write-Host "  [WHATIF] Would kill: $($proc.Id)" -ForegroundColor Cyan
            }
        } else {
            Write-Host "  ⚠ Skipping non-Hermes Python (PID $($proc.Id)): $path" -ForegroundColor DarkYellow
        }
    }
}

# Step 3: Wait for file handles to release
Write-Host "📌 Step 3: Waiting for file handles to release..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Step 4: Remove venv directory
Write-Host "📌 Step 4: Removing venv directory..." -ForegroundColor Yellow
$venvPath = "$hermesAgent\venv"
if (Test-Path $venvPath) {
    Write-Host "  → Found venv at: $venvPath" -ForegroundColor Gray
    if (-not $WhatIf) {
        try {
            Remove-Item $venvPath -Recurse -Force -ErrorAction Stop
            Write-Host "  ✓ venv removed successfully" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Failed to remove venv: $_" -ForegroundColor Red
            Write-Host "  💡 Try running this script as Administrator" -ForegroundColor Yellow
            
            if ($Force) {
                Write-Host "  🔓 Force mode: Taking ownership..." -ForegroundColor Cyan
                takeown /F $venvPath /R /D Y 2>&1 | Out-Null
                icacls $venvPath /grant "$($env:USERNAME):(F)" /T /C 2>&1 | Out-Null
                Remove-Item $venvPath -Recurse -Force -ErrorAction Stop
                Write-Host "  ✓ venv removed successfully (forced)" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  [WHATIF] Would remove: $venvPath" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ℹ venv not found, skipping" -ForegroundColor Gray
}

# Step 5: Clear logs (optional)
Write-Host "📌 Step 5: Clearing logs..." -ForegroundColor Yellow
$logPath = "$hermesRoot\logs"
if (Test-Path $logPath) {
    if (-not $WhatIf) {
        Remove-Item "$logPath\*.log" -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Logs cleared" -ForegroundColor Green
    } else {
        Write-Host "  [WHATIF] Would clear logs" -ForegroundColor Cyan
    }
}

# Step 6: Verify cleanup
Write-Host "📌 Step 6: Verifying cleanup..." -ForegroundColor Yellow
$remainingProcs = Get-Process -Name "hermes", "python" -ErrorAction SilentlyContinue | 
                  Where-Object { $_.Path -like "*hermes*" }
if ($remainingProcs) {
    Write-Host "  ⚠ Still running: $($remainingProcs.Count) process(es)" -ForegroundColor DarkYellow
    $remainingProcs | Format-Table Id, ProcessName, Path -AutoSize
} else {
    Write-Host "  ✓ All Hermes processes stopped" -ForegroundColor Green
}

if (Test-Path $venvPath) {
    Write-Host "  ⚠ venv still exists at: $venvPath" -ForegroundColor DarkYellow
    Write-Host "  💡 Close any file explorers/terminals in that path and retry" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ venv removed" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Preparation complete! Now run Hermes update." -ForegroundColor Green
if ($WhatIf) {
    Write-Host "  (Run without -WhatIf to execute)" -ForegroundColor Gray
}