$projectRoot = Resolve-Path "$PSScriptRoot\.."
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'

Write-Host 'Starting backend and frontend in separate terminals...' -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; npm run start"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm run dev"

Write-Host 'Launched. Backend: http://localhost:5000, Frontend: Vite URL in new terminal.' -ForegroundColor Green
