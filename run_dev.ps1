# ErgoVision PowerShell Launcher
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "      ErgoVision - AI Desk Ergonomics Guardian" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Project Directory: $scriptDir"

# Start Backend
Write-Host "[1/2] Starting FastAPI Backend on Port 8000..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k cd /d ""$scriptDir\backend"" && python -m uvicorn main:app --reload --port 8000"

# Start Frontend
Write-Host "[2/2] Starting Vite Frontend on Port 5173..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k cd /d ""$scriptDir\frontend"" && npm run dev"

Start-Sleep -Seconds 3
Write-Host "Opening http://localhost:5173 in default browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"
