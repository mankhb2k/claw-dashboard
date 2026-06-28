# Build aucobot-desktop.zip for GitHub Releases
# Usage: .\build-zip.ps1 [-Version "1.0.0"]

param(
  [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"
$BundleDir = Split-Path $PSScriptRoot -Parent
$DistDir = Join-Path (Split-Path $BundleDir -Parent) "dist"
$ZipName = "aucobot-desktop-$Version.zip"
$StagingName = "aucobot-desktop"
$StagingDir = Join-Path $env:TEMP $StagingName
$ZipPath = Join-Path $DistDir $ZipName

$Include = @(
  "docker-compose.yml",
  ".env.example",
  "Setup-AucoBot.bat",
  "Dung-AucoBot.bat",
  "HUONG-DAN.md",
  "scripts\gateway-entrypoint.sh",
  "scripts\start-aucobot.sh",
  "scripts\stop-aucobot.sh"
)

function Convert-ToLf([string]$Path) {
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  $text = [System.Text.Encoding]::UTF8.GetString($bytes)
  $text = $text -replace "`r`n", "`n" -replace "`r", "`n"
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($Path, $text, $utf8NoBom)
}

if (Test-Path $StagingDir) {
  Remove-Item -Recurse -Force $StagingDir
}
New-Item -ItemType Directory -Path $StagingDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StagingDir "scripts") -Force | Out-Null

foreach ($rel in $Include) {
  $src = Join-Path $BundleDir $rel
  if (-not (Test-Path $src)) {
    throw "Missing file: $src"
  }
  $dest = Join-Path $StagingDir $rel
  $destParent = Split-Path $dest -Parent
  if (-not (Test-Path $destParent)) {
    New-Item -ItemType Directory -Path $destParent -Force | Out-Null
  }
  Copy-Item $src $dest -Force
  if ($rel -like "*.sh") {
    Convert-ToLf $dest
  }
}

if (-not (Test-Path $DistDir)) {
  New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
}
if (Test-Path $ZipPath) {
  Remove-Item -Force $ZipPath
}

Compress-Archive -Path $StagingDir -DestinationPath $ZipPath -Force
Remove-Item -Recurse -Force $StagingDir

Write-Host ""
Write-Host "Created: $ZipPath"
Write-Host ""
Write-Host "Next: upload to GitHub Release"
Write-Host "  gh release create desktop-v$Version `"$ZipPath`" --title `"AucoBot Desktop $Version`""
