$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3001/api'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Unwrap($json) {
  if ($json.success -eq $true -and $null -ne $json.data) { return $json.data }
  if ($json.error) { throw $json.error.message }
  return $json
}

Write-Host ''
Write-Host '=== Login admin ===' -ForegroundColor Cyan
$loginRaw = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body '{"login":"admin","password":"admin123"}' -ContentType 'application/json' -WebSession $session
$login = Unwrap $loginRaw
Write-Host "User: $($login.user.login) ($($login.user.id))"

Write-Host ''
Write-Host '=== GET projects/mine ===' -ForegroundColor Cyan
$mineRaw = Invoke-RestMethod -Uri "$base/projects/mine" -WebSession $session
$projects = @(Unwrap $mineRaw)
if ($projects.Count -eq 0) {
  Write-Host 'Creating project...'
  $createRaw = Invoke-RestMethod -Uri "$base/projects" -Method Post -Body '{"displayName":"Spawn Test"}' -ContentType 'application/json' -WebSession $session -TimeoutSec 200
  $projects = @(Unwrap $createRaw)
}
$p = $projects[0]
Write-Host "id=$($p.id) status=$($p.status) subdomain=$($p.subdomain) missing=$($p.containerMissing)"
if ($p.errorMessage) { Write-Host "errorMessage: $($p.errorMessage)" -ForegroundColor Red }

Write-Host ''
Write-Host '=== POST agents/sync-all (fix openclaw.json) ===' -ForegroundColor Cyan
try {
  $syncRaw = Invoke-RestMethod -Uri "$base/projects/$($p.id)/agents/sync-all" -Method Post -WebSession $session -TimeoutSec 60
  $sync = Unwrap $syncRaw
  Write-Host "synced=$($sync.synced) failed=$($sync.failed)"
} catch {
  Write-Host "sync-all skipped or failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ''
Write-Host "=== POST respawn (max 200s) ===" -ForegroundColor Cyan
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
  $respRaw = Invoke-RestMethod -Uri "$base/projects/$($p.id)/respawn" -Method Post -WebSession $session -TimeoutSec 200
  $respawned = Unwrap $respRaw
  $sw.Stop()
  Write-Host "OK in $([math]::Round($sw.Elapsed.TotalSeconds,1))s status=$($respawned.status)" -ForegroundColor Green
  $respawned | ConvertTo-Json -Depth 3
}
catch {
  $sw.Stop()
  Write-Host "FAIL in $([math]::Round($sw.Elapsed.TotalSeconds,1))s" -ForegroundColor Red
  if ($_.ErrorDetails.Message) {
    try {
      $errJson = $_.ErrorDetails.Message | ConvertFrom-Json
      Write-Host $errJson.error.message
    } catch {
      Write-Host $_.ErrorDetails.Message
    }
  } else {
    Write-Host $_.Exception.Message
  }
}

Write-Host ''
Write-Host '=== Health ===' -ForegroundColor Cyan
$healthRaw = Invoke-RestMethod -Uri "$base/projects/$($p.id)/health" -WebSession $session
$health = Unwrap $healthRaw
$health | ConvertTo-Json

Write-Host ''
Write-Host '=== Docker ===' -ForegroundColor Cyan
docker ps -a --filter "name=oc-$($p.subdomain)"

Write-Host ''
Write-Host "=== healthz probe ===" -ForegroundColor Cyan
$cname = "oc-$($p.subdomain)"
$portOut = (docker port $cname 2>&1) -join "`n"
Write-Host $portOut
if ($portOut -match '127\.0\.0\.1:(\d+)') {
  $hp = $Matches[1]
  try {
    $hz = Invoke-WebRequest -Uri "http://127.0.0.1:$hp/healthz" -TimeoutSec 5 -UseBasicParsing
    Write-Host "healthz HTTP $($hz.StatusCode)" -ForegroundColor Green
  } catch {
    Write-Host "healthz failed: $($_.Exception.Message)" -ForegroundColor Red
  }
}
