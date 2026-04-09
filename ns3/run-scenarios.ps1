param(
  [string]$Ns3Root = "C:\ns-3-dev",
  [string]$Program = "manet-aodv",
  [double[]]$Speeds = @(2, 6, 10, 14)
)

$sourceFile = Join-Path $PSScriptRoot "$Program.cc"
$scratchFile = Join-Path $Ns3Root "scratch\$Program.cc"

if (!(Test-Path $Ns3Root)) {
  Write-Error "NS-3 root not found: $Ns3Root"
  exit 1
}

if (!(Test-Path $sourceFile)) {
  Write-Error "Source file not found: $sourceFile"
  exit 1
}

Copy-Item $sourceFile $scratchFile -Force

Push-Location $Ns3Root

foreach ($speed in $Speeds) {
  $cmd = ".\ns3 run \"scratch/$Program --nNodes=20 --simTime=60 --txRange=120 --nodeSpeed=$speed --packetSize=512 --dataRate=256kbps\""
  Write-Host "`nRunning scenario for nodeSpeed=$speed m/s"
  Invoke-Expression $cmd
}

Pop-Location
