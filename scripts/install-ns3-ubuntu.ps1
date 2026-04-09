param(
  [switch]$Proceed
)

if (-not $Proceed) {
  Write-Host 'Dry run only. This script can install Ubuntu in WSL and NS-3 packages.' -ForegroundColor Yellow
  Write-Host 'Run with: scripts\install-ns3-ubuntu.ps1 -Proceed' -ForegroundColor Yellow
  exit 0
}

Write-Host 'Installing Ubuntu distro for WSL (may require admin/restart)...' -ForegroundColor Cyan
$wslList = wsl -l -q
if ($wslList -notcontains 'Ubuntu') {
  wsl --install -d Ubuntu
  Write-Host 'Ubuntu was installed. Complete first-launch setup if prompted, then re-run this script.' -ForegroundColor Yellow
  exit 0
}

Write-Host 'If Ubuntu was just installed, reboot may be required. Re-run this script after first Ubuntu setup if needed.' -ForegroundColor Yellow

Write-Host 'Running NS-3 installation commands in Ubuntu...' -ForegroundColor Cyan
wsl -d Ubuntu -u root -- bash -lc "set -e; apt update"
wsl -d Ubuntu -u root -- bash -lc "set -e; apt install -y build-essential cmake ninja-build git python3 python3-pip g++ pkg-config"
wsl -d Ubuntu -u root -- bash -lc "set -e; if [ ! -d /home/harshitha_p_salian/ns-3-dev ]; then git clone https://gitlab.com/nsnam/ns-3-dev.git /home/harshitha_p_salian/ns-3-dev; fi"
wsl -d Ubuntu -u root -- bash -lc "set -e; chown -R harshitha_p_salian:harshitha_p_salian /home/harshitha_p_salian/ns-3-dev"
wsl -d Ubuntu -- bash -lc "set -e; cd ~/ns-3-dev; ./ns3 configure"
wsl -d Ubuntu -- bash -lc "set -e; cd ~/ns-3-dev; ./ns3 build"

Write-Host 'NS-3 setup attempt completed inside WSL Ubuntu.' -ForegroundColor Green
Write-Host 'NS-3 root in WSL: ~/ns-3-dev' -ForegroundColor Green
