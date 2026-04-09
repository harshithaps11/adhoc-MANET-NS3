Write-Host 'Checking prerequisites...' -ForegroundColor Cyan

function Check-Cmd($name) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if ($cmd) { Write-Host "[OK] $name found" -ForegroundColor Green }
  else { Write-Host "[MISSING] $name" -ForegroundColor Yellow }
}

Check-Cmd node
Check-Cmd npm
Check-Cmd python
Check-Cmd wsl

Write-Host ''
Write-Host 'WSL distros:' -ForegroundColor Cyan
wsl -l -v

Write-Host ''
if (Test-Path 'C:\ns-3-dev') {
  Write-Host '[OK] C:\ns-3-dev exists' -ForegroundColor Green
} else {
  Write-Host '[INFO] C:\ns-3-dev not found (NS-3 not installed there yet)' -ForegroundColor Yellow
}
