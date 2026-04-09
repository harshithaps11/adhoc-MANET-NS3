$ErrorActionPreference = 'Stop'

Write-Host 'Installing workspace dependencies (safe, local project only)...' -ForegroundColor Cyan

Push-Location "$PSScriptRoot\..\backend"
if (Test-Path package.json) {
  npm install
}
Pop-Location

Push-Location "$PSScriptRoot\..\frontend"
if (Test-Path package.json) {
  npm install
}
Pop-Location

Write-Host ''
Write-Host 'Setup complete.' -ForegroundColor Green
Write-Host 'Next:'
Write-Host '  1) Run scripts\start-web.ps1 for frontend + backend'
Write-Host '  2) If NS-3 required, run scripts\install-ns3-ubuntu.ps1 -Proceed (admin + reboot may be needed)'
