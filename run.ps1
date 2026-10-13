# CampusNet Monitor - Windows PowerShell Start Script
# Runs Flask backend and launches browser

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " CampusNet Monitor - Campus Congestion & Traffic Control " -ForegroundColor Cyan
Write-Host " Course Based Project (CBP) - B.Tech Computer Networks   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Install / verify dependencies if needed
Write-Host "`n[1/3] Verifying Python dependencies..." -ForegroundColor Yellow
python -m pip install -r requirements.txt --quiet

# 2. Build frontend if dist doesn't exist
if (-not (Test-Path "frontend\dist")) {
    Write-Host "`n[2/3] Building React + Tailwind frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    npm run build
    Set-Location ..
} else {
    Write-Host "`n[2/3] Frontend build found in frontend\dist." -ForegroundColor Green
}

# 3. Launch Server
Write-Host "`n[3/3] Launching CampusNet Server on http://127.0.0.1:5000 ..." -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate the server.`n" -ForegroundColor Gray

Start-Process "http://127.0.0.1:5000"

python backend\app.py
