param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$IMAGE = "mankhb2k/clawsaas-vps-worker"
$TAG   = $VERSION

Write-Host "Building $IMAGE`:$TAG ..." -ForegroundColor Cyan
docker build -t "$IMAGE`:$TAG" .
if (-not $?) { Write-Host "Build failed" -ForegroundColor Red; exit 1 }

Write-Host "Pushing $IMAGE`:$TAG ..." -ForegroundColor Cyan
docker push "$IMAGE`:$TAG"
if (-not $?) { Write-Host "Push failed" -ForegroundColor Red; exit 1 }

Write-Host "Tagging as latest ..." -ForegroundColor Cyan
docker tag "$IMAGE`:$TAG" "$IMAGE`:latest"
docker push "$IMAGE`:latest"
if (-not $?) { Write-Host "Push latest failed" -ForegroundColor Red; exit 1 }

Write-Host "Done: $IMAGE`:$TAG + latest" -ForegroundColor Green
