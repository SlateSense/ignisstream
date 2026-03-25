# Restart Development Server Script

Write-Host "=== IgnisStream Dev Server Restart ===" -ForegroundColor Cyan
Write-Host ""

# Kill all node processes
Write-Host "Stopping all Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Clear Next.js cache
Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "Cache cleared!" -ForegroundColor Green
}

# Clear node_modules/.cache if exists
if (Test-Path node_modules/.cache) {
    Remove-Item -Recurse -Force node_modules/.cache
    Write-Host "Node cache cleared!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Starting Development Server ===" -ForegroundColor Cyan
Write-Host "Please wait for compilation to complete..." -ForegroundColor Yellow
Write-Host ""

# Start dev server
npm run dev
