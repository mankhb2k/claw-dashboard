param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$IMAGE = "mankhb2k/clawsaas-be"
$TAG   = $Version

# 1. Build Docker image
Write-Host "Building $IMAGE`:$TAG ..." -ForegroundColor Cyan
docker build -t "$IMAGE`:$TAG" -t "$IMAGE`:latest" .
if (-not $?) { Write-Host "Build failed" -ForegroundColor Red; exit 1 }

# 2. Push to Docker Hub
Write-Host "Pushing $IMAGE`:$TAG to Docker Hub ..." -ForegroundColor Cyan
docker push "$IMAGE`:$TAG"
if (-not $?) { Write-Host "Push $TAG failed" -ForegroundColor Red; exit 1 }

docker push "$IMAGE`:latest"
if (-not $?) { Write-Host "Push latest failed" -ForegroundColor Red; exit 1 }

Write-Host "Done! Pushed $IMAGE`:$TAG and $IMAGE`:latest to Docker Hub" -ForegroundColor Green
Write-Host "Pull with: docker pull $IMAGE`:$TAG" -ForegroundColor Yellow
