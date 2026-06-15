$nodePath = "C:\Users\acer\AppData\Local\ms-playwright-go\1.57.0\node.exe"
if (Test-Path $nodePath) {
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  PhishGuard Backend & Static Server Launcher" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "Starting server..." -ForegroundColor Green
    Write-Host "Dashboard will be served at http://localhost:5000" -ForegroundColor Yellow
    Write-Host "Backend API is active on http://localhost:5000/api" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Red
    Write-Host "-----------------------------------------------"
    & $nodePath backend/server.js
} else {
    Write-Error "Could not locate embedded Node.exe at $nodePath."
}
