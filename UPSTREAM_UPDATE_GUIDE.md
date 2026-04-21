# OpenClaw Upstream Update Guide

**Version:** April 21, 2026  
**For:** VPS Worker & Heavy maintenance

---

## Overview

`worker/src/` contains upstream OpenClaw gateway code pulled from the official repository. When new versions are released, we need to:

1. **Merge** upstream changes into `worker/src/`
2. **Build** new Docker image: `openclaw-gateway:YYYY.MM.DD`
3. **Test** locally
4. **Deploy** with zero downtime
5. **Rollback** if issues found

---

## Directory Structure

```
worker/
├── src/                    ← Current production code (from upstream)
│   ├── gateway/            ← Gateway server
│   ├── agents/             ← AI agents
│   ├── channels/           ← Chat integrations
│   └── ...
├── .tmp-openclaw-upstream/ ← Temp dir for tracking upstream
│   └── (clone of upstream repo)
├── control-ui/             ← Pure frontend (Vite)
├── Dockerfile              ← Build gateway image
├── package.json
└── tsconfig.json
```

---

## Step-by-Step Update Procedure

### Phase 1: Monitor & Review (Weekly)

```bash
cd worker/.tmp-openclaw-upstream

# Check upstream for new releases
git fetch origin main
git log --oneline origin/main -20

# Current version in production
cat ../package.json | grep '"version"'
# Expected: "version": "2026.4.5"

# See what changed since last update
git diff v2026.4.5..origin/main -- package.json CHANGELOG.md
```

**Output:**
```
Commit history shows v2026.5.0 was released
Changes: New AI models, bug fixes, performance improvements
Breaking changes: None detected ✅
```

**Decision:**
- ✅ Update recommended (v2026.5.0)
- ❌ Wait (too risky, breaking changes)

---

### Phase 2: Merge Upstream (If approved)

```bash
cd worker

# Get the latest upstream code
cd .tmp-openclaw-upstream
git fetch origin
git checkout v2026.5.0  # or origin/main if no tags

# Copy to worker/src
cd ..
rm -rf src
cp -r .tmp-openclaw-upstream src

# Update version in package.json
sed -i 's/"version": "2026.4.5"/"version": "2026.5.0"/' package.json

# Commit changes
git add src/ package.json
git commit -m "chore: upstream OpenClaw v2026.5.0

- New AI models support
- Bug fixes
- Performance improvements

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

**Verify:**
```bash
# Check package.json is correct
cat package.json | grep version

# Verify node_modules won't conflict
npm ci --dry-run
```

---

### Phase 3: Build Docker Image (Local)

```bash
# Build gateway image with new version
docker build -t openclaw-gateway:2026.5.0 \
  -f worker/Dockerfile \
  worker/

# Verify build succeeded
docker image ls | grep openclaw-gateway

# Should see:
# openclaw-gateway   2026.5.0   sha256:abc123...   1.2GB
```

**Troubleshooting:**
```bash
# Build failed? Check logs
docker build --progress=plain -t openclaw-gateway:2026.5.0 worker/ 2>&1 | tail -50

# Common issues:
# - npm install failed → Check network
# - tsc compilation error → Check TypeScript version
# - Dockerfile syntax error → Validate Dockerfile
```

---

### Phase 4: Test Locally (24 hours)

```bash
# Start fresh docker-compose
cd vps-worker
docker-compose down -v

# Update docker-compose.yml to use new image
# (Or use environment override)
export OPENCLAW_IMAGE=openclaw-gateway:2026.5.0

# Start services
docker-compose up -d

# Wait for healthy
sleep 10

# Test 1: Health check
curl http://localhost:3002/health
# Expected: {"status": "ok", "timestamp": "..."}

# Test 2: Spawn test container
redis-cli -p 6379
> LPUSH bull:container-ops:1000:... '{"name":"spawn","data":{...}}'

# Test 3: Monitor logs
docker logs -f openclaw-vps-worker | grep -E "spawn|running|error"

# Test 4: Check container created
docker ps | grep openclaw-usr

# Test 5: Heavy job test
docker logs -f openclaw-vps-heavy | head -20
```

**Monitor during 24h:**
```bash
# CPU/Memory usage
docker stats openclaw-vps-worker openclaw-vps-heavy

# Error rates
docker logs openclaw-vps-worker | grep -i error | wc -l

# Job processing
redis-cli
> LLEN bull:container-ops:1000      # Pending
> LRANGE bull:container-ops:active 0 -1  # Processing
> LLEN bull:container-ops:completed      # Completed
```

**Success Criteria:**
- ✅ No crashes (container running 24h)
- ✅ Job processing working
- ✅ No memory leaks (stable memory)
- ✅ No new error logs
- ✅ User containers spawn correctly

---

### Phase 5: Deploy to Production

#### Step 1: Push Image to Registry

```bash
# Tag for registry
docker tag openclaw-gateway:2026.5.0 \
  your-registry.com/openclaw-gateway:2026.5.0

# Push to registry
docker push your-registry.com/openclaw-gateway:2026.5.0

# Verify push
docker manifest inspect your-registry.com/openclaw-gateway:2026.5.0
```

#### Step 2: Update Production Environment

```bash
# SSH to vps-worker
ssh ubuntu@vps-worker.ip

# Update docker-compose env
cd openclaw-saas/vps-worker
nano docker-compose.yml
# Change: OPENCLAW_IMAGE=openclaw-gateway:2026.4.5
# To:     OPENCLAW_IMAGE=openclaw-gateway:2026.5.0

# Or via .env file
echo "OPENCLAW_IMAGE=openclaw-gateway:2026.5.0" > .env.prod

# Pull new image
docker pull your-registry.com/openclaw-gateway:2026.5.0

# NO RESTART YET - new containers will use new image
```

#### Step 3: Deploy Rolling Update (Zero Downtime)

```bash
# New containers spawned = use 2026.5.0
# Existing containers = still use 2026.4.5 (keep running)
# After 48h = old containers naturally get recreated

# Monitor new containers
docker ps | grep openclaw-usr | head -10

# Check image version
docker inspect $(docker ps -q -f ancestor=openclaw-gateway) \
  --format='{{index .Config.Image}}'
```

**Timeline:**
```
T+0h:  Update OPENCLAW_IMAGE env var ✅
       New containers = v2026.5.0
       Old containers = v2026.4.5 (keep running)

T+24h: Monitor for issues
       - No errors? Continue
       - Issues found? → Rollback (below)

T+48h: Old containers auto-stop (idle timeout)
       All containers now = v2026.5.0 ✅
```

---

### Phase 6: Monitor (Critical!)

```bash
# Set up monitoring for 48 hours

# 1. Watch logs
docker logs -f openclaw-vps-worker | grep -E "error|spawn|crash"

# 2. Monitor job queue
watch -n 5 'redis-cli LLEN bull:container-ops:1000'

# 3. CPU/Memory
watch -n 5 'docker stats --no-stream'

# 4. Check error rate
# (Via your monitoring: Datadog/Grafana/etc)
```

**Alert triggers for Rollback:**
- ❌ CPU usage > 80% sustained
- ❌ Memory usage > 40GB (48GB VPS)
- ❌ More than 5 job failures/hour
- ❌ Container spawn time > 60 seconds
- ❌ User complaints (Slack, email)

---

## Rollback Procedure (If Issue Found)

**If problems detected in v2026.5.0:**

```bash
# Step 1: Revert environment
cd vps-worker
echo "OPENCLAW_IMAGE=openclaw-gateway:2026.4.5" > .env.prod

# Pull old image (should be cached)
docker pull your-registry.com/openclaw-gateway:2026.4.5

# Step 2: Restart vps-worker container
docker-compose restart vps-worker

# Step 3: Containers now spawn with v2026.4.5
# Existing v2026.5.0 containers keep running (safe)

# Step 4: Manually stop v2026.5.0 containers (optional)
docker ps | grep openclaw-usr | awk '{print $1}' | xargs docker stop

# Step 5: Verify old image in use
docker ps | grep openclaw-usr -m1 | grep openclaw-gateway:2026.4.5

# Step 6: Post-mortem
# - What went wrong?
# - Report to upstream
# - Do not retry v2026.5.0 until fix available
```

**Document in ROLLBACK_LOG.md:**
```markdown
## Rollback: v2026.5.0 → v2026.4.5

**Date:** 2026-05-15 14:30 UTC

**Issue:** Memory leak in FFmpeg tool
- Memory grew from 8GB → 40GB over 24h
- Job processing slowed down significantly

**Rollback steps:**
1. Reverted OPENCLAW_IMAGE env var
2. Restarted vps-worker container
3. Manually stopped 3 v2026.5.0 containers
4. Verified all new containers using v2026.4.5

**Result:** ✅ Stable after 1h

**Next:** Await upstream fix in v2026.6.0
```

---

## Handling New Heavy Tools (from Upstream)

When upstream releases new tools, check if they need **vps-heavy** support:

### Step 1: Identify Tool Type

```bash
# Check upstream CHANGELOG or built-in-tools doc
cat worker/.tmp-openclaw-upstream/docs/TOOLS.md

# Ask: Does this tool require SERVER-SIDE processing?
# - Image resize/crop → YES (vps-heavy)
# - Video transcoding → YES (vps-heavy)  
# - PDF generation → YES (vps-heavy)
# - Markdown preview → NO (browser only)
# - Text formatting → NO (browser only)
```

### Step 2: If Light Tool (Browser-side)
```
❌ vps-heavy update NOT needed
✅ Only update:
   - worker/ (gateway code)
   - control-ui (frontend UI)
```

### Step 3: If Heavy Tool (Server-side)

**Update vps-heavy in 3 steps:**

#### A. Implement Tool Handler

```bash
# Create new tool file
touch vps-heavy/src/tools/newtool.tool.ts

# Example: image-resize tool
cat > vps-heavy/src/tools/image-resize.tool.ts << 'EOF'
import sharp from 'sharp';

export class ImageResizeTool {
  async process(inputPath: string, params: any, deadline: number) {
    const timeout = Math.max(deadline - Date.now(), 1000);
    
    return Promise.race([
      sharp(inputPath)
        .resize(params.width, params.height)
        .toFile(outputPath),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  }
}
EOF
```

#### B. Update Processor

```typescript
// vps-heavy/src/processors/heavy.processor.ts

async processJob(job) {
  const { tool, params } = job.data;
  
  switch (tool) {
    case 'ffmpeg':
      return await ffmpegTool.process(...);
    case 'playwright':
      return await playwrightTool.capture(...);
    case 'tts':
      return await ttsTool.synthesize(...);
    case 'stt':
      return await sttTool.transcribe(...);
    case 'image-resize':  // ← NEW
      return await imageResizeTool.process(...);
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}
```

#### C. Install Dependencies

```bash
cd vps-heavy

# Check what npm package is needed
npm search sharp  # or imagemagick, etc

# Install
npm install sharp

# Update Dockerfile if needs system libs
cat >> Dockerfile << 'EOF'
# For image processing
RUN apt-get install -y --no-install-recommends \
    libvips-dev \
    libjpeg-dev && \
    rm -rf /var/lib/apt/lists/*
EOF

# Rebuild
docker build -t vps-heavy:2026.5.0 .
```

### Step 4: Test New Tool

```bash
# Local test with heavy job
redis-cli
> LPUSH bull:heavy-tasks:1000:... '{
  "jobId":"test-1",
  "tool":"image-resize",
  "params":{"width":800,"height":600}
}'

# Monitor
docker logs -f openclaw-vps-heavy | grep image-resize

# Verify result
ls -la /data/users/user-1/heavy-tasks/
```

### Example: Adding CUDA-based Tool

If upstream adds GPU inference tool:

```dockerfile
# Dockerfile (update base image)
FROM nvidia/cuda:12.4-runtime-ubuntu22.04

WORKDIR /app

# Install Node
RUN apt-get update && apt-get install -y nodejs npm

# Install GPU packages
RUN npm install onnxruntime-gpu

# Original setup
COPY package.json .
RUN npm install
```

```yaml
# docker-compose.yml (add GPU support)
services:
  vps-heavy:
    build: .
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### Checklist: New Heavy Tool

```
□ Review upstream CHANGELOG/docs
□ Identify: Is it server-side (heavy)?
□ If heavy:
  □ Create src/tools/newtool.tool.ts
  □ Add case in heavy.processor.ts
  □ npm install <dependencies>
  □ Update Dockerfile if needed (system libs, CUDA, etc)
  □ Test locally (24h monitoring)
  □ Deploy to staging
  □ Monitor (24h)
  □ Deploy to production
  □ Update DEPLOY_LOG.md
```

---

## Automation (Optional)

### Auto-update Script

```bash
#!/bin/bash
# scripts/update-upstream.sh

set -e

VERSION=$1  # e.g., v2026.5.0

if [ -z "$VERSION" ]; then
  echo "Usage: ./update-upstream.sh v2026.5.0"
  exit 1
fi

cd worker/.tmp-openclaw-upstream
git fetch origin
git checkout $VERSION

cd ..
rm -rf src
cp -r .tmp-openclaw-upstream src

VERSION_NUM=${VERSION:1}  # Remove 'v' prefix
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION_NUM\"/" package.json

echo "✅ Upstream updated to $VERSION"
echo "Next: docker build -t openclaw-gateway:$VERSION_NUM ."
```

**Usage:**
```bash
chmod +x scripts/update-upstream.sh
./scripts/update-upstream.sh v2026.5.0
```

### Health Check Script

```bash
#!/bin/bash
# scripts/check-health.sh

echo "=== VPS Worker Health Check ==="
curl -s http://localhost:3002/health | jq .

echo -e "\n=== VPS Heavy Health Check ==="
curl -s http://localhost:3003/health | jq .

echo -e "\n=== Queue Stats ==="
redis-cli LLEN bull:container-ops:1000
redis-cli LLEN bull:heavy-tasks:1000

echo -e "\n=== Docker Containers ==="
docker ps --filter="name=openclaw-" --format="table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

---

## Checklist for Version Update

```
Pre-Update:
☐ Review upstream CHANGELOG
☐ Check for breaking changes
☐ Test locally (24h)
☐ Get team approval (Slack)

Build & Deploy:
☐ Build Docker image
☐ Push to registry
☐ Update env var (OPENCLAW_IMAGE)
☐ No restart (zero downtime)

Monitoring (48h):
☐ Watch logs for errors
☐ Monitor queue depth
☐ Monitor CPU/Memory
☐ Check health endpoint
☐ Verify job processing works

Post-Deploy (72h):
☐ All containers migrated to new version
☐ No rollback needed
☐ Update DEPLOY_LOG.md
☐ Document any issues
☐ Celebrate! 🎉
```

---

## FAQ

**Q: Can I update in the middle of the day?**
A: Yes, new containers will use new image, old ones keep running. But wait for quiet hours (~2-6 AM) to minimize impact of any issues.

**Q: What if a user is on v2026.4.5 and sees features from v2026.5.0?**
A: This shouldn't happen - each container is isolated. But if it does, user's container needs restart to get consistent version.

**Q: How long to keep old Docker images?**
A: Keep 2-3 versions in registry. Delete after 30 days. Cost is minimal (~2GB per image).

**Q: Can I auto-update from upstream daily?**
A: Not recommended. Manual review once/week is safer. Breaking changes might slip through.

**Q: What if upstream releases security patch?**
A: Fast-track the update. Still test locally, but can deploy same day if tests pass.

---

## References

- [OpenClaw Upstream Repo](https://github.com/openclaw-ai/openclaw)
- [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) - Diagram 13
- [Docker Image Registry](https://your-registry.com)
- [Deployment Log](./DEPLOY_LOG.md)

---

Generated: April 21, 2026
Maintained by: Infrastructure Team
