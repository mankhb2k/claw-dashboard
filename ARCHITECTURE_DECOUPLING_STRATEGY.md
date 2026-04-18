# Architecture Decoupling Strategy: Worker + Heavy VPS

**Design**: 2-tier architecture with manual version control  
**Source**: `.tmp-openclaw-upstream` (manually tracked)  
**Approach**: Pin to specific version, rebuild on-demand  

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User's SaaS                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐      ┌────────────────────┐  │
│  │   VPS WORKER        │      │   VPS HEAVY        │  │
│  │  (Management)       │      │  (Compute)         │  │
│  │                     │      │                    │  │
│  │ openclaw-worker:    │      │ openclaw-heavy:    │  │
│  │ ├─ User containers  │      │ ├─ FFmpeg          │  │
│  │ ├─ Job queue (BQ)   │      │ ├─ Playwright      │  │
│  │ ├─ API gateway      │      │ ├─ Image gen       │  │
│  │ ├─ Auth/sessions    │      │ ├─ Video gen       │  │
│  │ ├─ Redis broker     │      │ ├─ BullMQ worker   │  │
│  │ └─ Storage mgmt     │      │ └─ Callback HTTP   │  │
│  │                     │      │                    │  │
│  │ Docker image: 400MB │      │ Docker image: 800MB│  │
│  │ RAM: 2GB base       │      │ RAM: 4GB           │  │
│  │ Uptime: 24/7 (prod) │      │ Idle-able (scale)  │  │
│  └─────────────────────┘      └────────────────────┘  │
│           │ POST /job              │ process job       │
│           │─────────────────────────→                  │
│           │                         │                  │
│           │ PUT /job/{id}/result    │                  │
│           │←─────────────────────────                  │
│           │                                            │
│  ┌─────────────────────────────────────────────────┐  │
│  │           User Container (1GB/0.5vCPU)        │  │
│  │  ├─ OpenClaw gateway logic                     │  │
│  │  ├─ Channels (Discord, Slack, etc)            │  │
│  │  ├─ Chat API                                   │  │
│  │  └─ Sessions                                   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Image Breakdown

### **VPS Worker Image** (`openclaw-worker`)

**What's included:**
```
├─ Node.js 24
├─ pnpm
├─ OpenClaw core (channels, gateway, API)
├─ BullMQ consumer (job dispatcher)
├─ Docker SDK (spawn user containers)
├─ Redis client
└─ ~400MB total

Does NOT include:
❌ FFmpeg
❌ Playwright
❌ Video/image generation tools
```

**Used by:**
- VPS Worker container itself
- User containers (spawned inside worker VPS)

**Update frequency:** 1-2x per quarter (core logic stable)

---

### **VPS Heavy Image** (`openclaw-heavy-worker`)

**What's included:**
```
├─ Node.js 24
├─ pnpm
├─ OpenClaw core (minimal)
├─ BullMQ consumer (job processor)
├─ FFmpeg (latest stable)
├─ Playwright (Chromium)
├─ Video generation providers (Runway, FAL, etc)
├─ Image generation (DALL-E, Midjourney, etc)
├─ TTS providers
└─ ~800MB-1.2GB total

Optimized for:
✅ Long-running jobs
✅ Resource-intensive tools
✅ Large file processing
```

**Used by:**
- VPS Heavy container only
- Processes async jobs from queue

**Update frequency:** When new tools added or versions bump

---

## 🔄 Version Management Workflow

### **Step 1: Track Upstream**

```bash
# In your project (periodically, e.g., weekly)
cd worker/.tmp-openclaw-upstream
git fetch origin
git log --oneline -20  # Check for new releases

# Check version in package.json
jq .version package.json
# Output: "2026.4.5"

# If new version available, note it
# Example: v2026.5.0 released
```

### **Step 2: Merge Upstream (When Ready)**

```bash
# When you decide to upgrade (manual)
cd worker/.tmp-openclaw-upstream
git fetch origin main
git merge origin/main  # or cherry-pick specific commits

# OR: update to specific tag
git checkout v2026.5.0

# Check what changed
git diff v2026.4.5..HEAD -- extensions/ skills/
```

### **Step 3: Identify Changes**

```bash
# What changed in OpenClaw?
git diff v2026.4.5..v2026.5.0 --stat

# Example output:
# extensions/openai/package.json         | 3 +
# extensions/ffmpeg/index.ts             | 15 ++
# skills/video-frames/index.ts           | 8 ++
# docs/                                  | 50 ++
```

### **Step 4: Update Your Images**

Create custom `Dockerfile.worker` and `Dockerfile.heavy` from upstream:

```bash
# Check current versions
cat worker/.tmp-openclaw-upstream/Dockerfile | head -20

# If Dockerfile changed significantly, update yours:
# Dockerfile.worker (based on upstream, customized)
# Dockerfile.heavy (extracted from upstream + additions)
```

### **Step 5: Rebuild & Tag**

```bash
# Rebuild worker image
docker build -f Dockerfile.worker \
  -t openclaw-worker:2026.5.0 \
  -t openclaw-worker:latest \
  .

# Rebuild heavy image
docker build -f Dockerfile.heavy \
  -t openclaw-heavy-worker:2026.5.0 \
  -t openclaw-heavy-worker:latest \
  .

# Tag for registry (if using)
docker tag openclaw-worker:2026.5.0 \
  your-registry/openclaw-worker:2026.5.0
```

### **Step 6: Deploy (Manual, Phased)**

```bash
# 1. Test on development first (if you have one)
docker run --rm openclaw-worker:2026.5.0 --version

# 2. Push to registry
docker push your-registry/openclaw-worker:2026.5.0
docker push your-registry/openclaw-heavy-worker:2026.5.0

# 3. Update VPS Worker (controlled)
# Connect to VPS worker:
ssh openclaw@vps-worker

# Update docker-compose
nano /opt/worker/docker-compose.yml
# Change: openclaw-worker:2026.4.5 → 2026.5.0

# Restart with new image
cd /opt/worker
docker-compose pull openclaw-worker
docker-compose up -d openclaw-worker

# Verify health
sleep 10
curl http://localhost:3000/health

# 4. Update VPS Heavy (can wait, less critical)
ssh openclaw@vps-heavy
cd /opt/heavy
# Same process as above
```

---

## 📋 Dockerfile Templates

### **Dockerfile.worker** (Management plane)

```dockerfile
# syntax=docker/dockerfile:1.7

# Based on: openclaw upstream
# Version: 2026.5.0
# Changes: Removed FFmpeg, Playwright, media generation tools
# Purpose: Lightweight API + job manager

ARG NODE_IMAGE="node:24-bookworm-slim@sha256:..."
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

# Copy from upstream
COPY .tmp-openclaw-upstream/package.json \
     .tmp-openclaw-upstream/pnpm-lock.yaml \
     .tmp-openclaw-upstream/pnpm-workspace.yaml \
     ./

COPY .tmp-openclaw-upstream/patches ./patches
COPY .tmp-openclaw-upstream/scripts/postinstall-bundled-plugins.mjs ./scripts/

# Install only core dependencies
RUN corepack enable && \
    pnpm install --frozen-lockfile && \
    pnpm prune --prod

# Copy source
COPY .tmp-openclaw-upstream/src ./src
COPY .tmp-openclaw-upstream/dist ./dist

# Build (if needed)
RUN pnpm build:docker || echo "Pre-built dist available"

# ── Runtime ──
FROM ${NODE_IMAGE}

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      curl git lsof && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/gateway/index.js"]
```

### **Dockerfile.heavy** (Compute plane)

```dockerfile
# syntax=docker/dockerfile:1.7

# Based on: openclaw upstream
# Version: 2026.5.0
# Changes: Added FFmpeg, Playwright, media generation
# Purpose: Heavy task execution engine

ARG NODE_IMAGE="node:24-bookworm@sha256:..."
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

COPY .tmp-openclaw-upstream/package.json \
     .tmp-openclaw-upstream/pnpm-lock.yaml \
     ./

RUN corepack enable && \
    pnpm install --frozen-lockfile

COPY .tmp-openclaw-upstream/src ./src
COPY .tmp-openclaw-upstream/dist ./dist

RUN pnpm build:docker || echo "Pre-built dist available"

# ── Runtime ──
FROM ${NODE_IMAGE}

WORKDIR /app

# Install heavy dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      curl git lsof \
      ffmpeg \
      python3 python3-pip \
      ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install Playwright browsers (optional, can defer to first run)
ARG INSTALL_PLAYWRIGHT=1
RUN if [ "$INSTALL_PLAYWRIGHT" = "1" ]; then \
      npm install -g @playwright/cli && \
      playwright install chromium firefox webkit; \
    fi

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .

ENV NODE_ENV=production
ENV OPENCLAW_ROLE=heavy-worker

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/worker/heavy.js"]
```

---

## 🚀 Build & Deploy Scripts

### **build.sh** (Local build)

```bash
#!/bin/bash
set -e

VERSION=${1:-"2026.5.0"}
REGISTRY=${2:-"docker.io/your-org"}

echo "Building OpenClaw images v$VERSION"

# Build worker
echo "[1/2] Building openclaw-worker:$VERSION..."
docker build -f Dockerfile.worker \
  --build-arg NODE_IMAGE="node:24-bookworm-slim" \
  -t openclaw-worker:$VERSION \
  -t openclaw-worker:latest \
  -t $REGISTRY/openclaw-worker:$VERSION \
  .

# Build heavy
echo "[2/2] Building openclaw-heavy-worker:$VERSION..."
docker build -f Dockerfile.heavy \
  --build-arg NODE_IMAGE="node:24-bookworm" \
  --build-arg INSTALL_PLAYWRIGHT=1 \
  -t openclaw-heavy-worker:$VERSION \
  -t openclaw-heavy-worker:latest \
  -t $REGISTRY/openclaw-heavy-worker:$VERSION \
  .

echo "✅ Build complete"
echo "  Worker:  openclaw-worker:$VERSION"
echo "  Heavy:   openclaw-heavy-worker:$VERSION"
echo ""
echo "Next: docker push $REGISTRY/openclaw-worker:$VERSION"
```

### **deploy.sh** (To VPS)

```bash
#!/bin/bash
set -e

VERSION=${1:-"latest"}
VPS_WORKER=${2:-"openclaw@vps-worker"}
VPS_HEAVY=${3:-"openclaw@vps-heavy"}

echo "Deploying v$VERSION"

# 1. Push to registry (or load directly if private)
echo "[1/3] Pushing images..."
docker push openclaw-worker:$VERSION
docker push openclaw-heavy-worker:$VERSION

# 2. Update worker VPS
echo "[2/3] Updating VPS Worker..."
ssh $VPS_WORKER << EOF
  cd /opt/worker
  sed -i "s/openclaw-worker:.*/openclaw-worker:$VERSION/g" docker-compose.yml
  docker-compose pull openclaw-worker
  docker-compose up -d openclaw-worker
  sleep 10
  curl -f http://localhost:3000/health && echo "✅ Worker healthy"
EOF

# 3. Update heavy VPS
echo "[3/3] Updating VPS Heavy..."
ssh $VPS_HEAVY << EOF
  cd /opt/heavy
  sed -i "s/openclaw-heavy-worker:.*/openclaw-heavy-worker:$VERSION/g" docker-compose.yml
  docker-compose pull openclaw-heavy-worker
  docker-compose up -d openclaw-heavy-worker
  sleep 10
  curl -f http://localhost:3001/health && echo "✅ Heavy healthy"
EOF

echo "✅ Deployment complete"
```

---

## 📝 Version Pinning Strategy

### **File: `.version`** (Track current version)

```text
# Current production version
OPENCLAW_VERSION=2026.5.0
WORKER_IMAGE=openclaw-worker:2026.5.0
HEAVY_IMAGE=openclaw-heavy-worker:2026.5.0

# Last 3 versions (for rollback)
PREVIOUS_1=2026.4.5
PREVIOUS_2=2026.4.3

# Next candidate (being tested)
CANDIDATE=2026.5.1-rc1
```

### **File: `VERSION_CHANGELOG.md`** (Track changes per version)

```markdown
# Version History

## 2026.5.0 (Deployed: 2026-04-20)

### Worker Image
- Updated core OpenClaw to 2026.5.0
- No breaking changes
- Deploy: smooth

### Heavy Image
- FFmpeg upgraded to 7.0
- Playwright updated to 1.45
- New: Runway v3 API support
- Notes: Took 2h to process backlog during deploy

---

## 2026.4.5 (Current Prod)
- Stable
- No known issues
```

---

## 🔄 Update Workflow (Step-by-step)

### **Timeline: Monthly Update Cycle (Example)**

```
Week 1:
  └─ Check upstream releases
     git log --oneline origin/main | head -20
     # Spot: v2026.5.0 released 2026-04-15

Week 2:
  └─ Review changes
     git diff v2026.4.5..v2026.5.0 --stat
     # Decision: Include? Yes (small, safe changes)

Week 3:
  ├─ Merge upstream
  │  git checkout v2026.5.0
  │  # OR cherry-pick specific commits
  │
  ├─ Build locally
  │  ./build.sh 2026.5.0
  │
  └─ Test image
     docker run -it openclaw-worker:2026.5.0 --version
     # Verify: no errors

Week 4:
  ├─ Deploy to staging (if you have)
  │  OR: deploy during low-traffic window (Sunday 2am)
  │
  ├─ ./deploy.sh 2026.5.0 \
  │      openclaw@vps-worker \
  │      openclaw@vps-heavy
  │
  └─ Monitor
     # Check logs, queue depth, health
     ssh vps-worker "docker logs openclaw-worker"
```

---

## 📊 Version Tracking Files

Create in your repo:

### **`docker-compose.worker.yml`**

```yaml
version: '3.8'
services:
  openclaw-worker:
    image: openclaw-worker:2026.5.0  # <- Update here
    ports:
      - "3000:3000"
    environment:
      REDIS_URL: redis://redis:6379
      CONTROL_PLANE_URL: http://localhost:3000
    networks:
      - openclaw-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    networks:
      - openclaw-net

networks:
  openclaw-net:
    external: true
```

### **`docker-compose.heavy.yml`**

```yaml
version: '3.8'
services:
  openclaw-heavy:
    image: openclaw-heavy-worker:2026.5.0  # <- Update here
    ports:
      - "3001:3001"
    environment:
      REDIS_URL: redis://redis-cluster:6379
      CONTROL_PLANE_URL: http://vps-worker:3000
      OPENCLAW_ROLE: heavy-worker
      CONCURRENT_JOBS: 3
    networks:
      - openclaw-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  openclaw-net:
    external: true
```

---

## 🛠️ Maintenance Checklist

### **When Updating (Before Deploy)**

- [ ] Check `.tmp-openclaw-upstream` for new version
- [ ] Review `git diff` for breaking changes
- [ ] Update `Dockerfile.worker` if build process changed
- [ ] Update `Dockerfile.heavy` if tools added/removed
- [ ] Build locally: `./build.sh X.X.X`
- [ ] Test image locally (quick smoke test)
- [ ] Update `.version` file
- [ ] Update `VERSION_CHANGELOG.md`
- [ ] Tag git commit: `git tag v-worker-2026.5.0`

### **During Deploy**

- [ ] Deploy during low-traffic window (e.g., Sunday 2am)
- [ ] Worker VPS first (less impact if fails)
- [ ] Wait 10 min, monitor logs
- [ ] Heavy VPS second (non-critical)
- [ ] Wait 10 min, monitor job queue
- [ ] Quick sanity test: submit test job, verify result

### **After Deploy**

- [ ] Monitor logs for errors: `docker logs -f`
- [ ] Check queue depth: `redis-cli LLEN openclaw:queue`
- [ ] Verify jobs processing
- [ ] No user complaints after 24h
- [ ] Then: clear `CANDIDATE` version in `.version`

---

## 🚨 Rollback Strategy

### **If Deploy Goes Wrong**

```bash
# 1. Identify last stable version
cat .version
# PREVIOUS_1=2026.4.5

# 2. Quick rollback
./deploy.sh 2026.4.5 openclaw@vps-worker openclaw@vps-heavy

# 3. Verify
curl http://vps-worker:3000/health
curl http://vps-heavy:3001/health

# 4. Post-mortem
# - What broke?
# - Update Dockerfile to fix
# - Re-test before next deploy attempt
```

---

## 📦 Directory Structure (Recommended)

```
openclaw-saas/
├─ worker/
│  ├─ .tmp-openclaw-upstream/    # Upstream repo (git managed)
│  │  ├─ .git
│  │  ├─ package.json            # v2026.5.0
│  │  ├─ extensions/
│  │  ├─ skills/
│  │  └─ Dockerfile              # Original upstream
│  │
│  ├─ docker/
│  │  ├─ Dockerfile.worker       # Customized
│  │  ├─ Dockerfile.heavy        # Custom (heavy tools)
│  │  └─ build.sh
│  │
│  ├─ compose/
│  │  ├─ docker-compose.worker.yml
│  │  └─ docker-compose.heavy.yml
│  │
│  ├─ deploy/
│  │  ├─ deploy.sh
│  │  ├─ rollback.sh
│  │  └─ .version
│  │
│  └─ docs/
│     ├─ VERSION_CHANGELOG.md
│     └─ UPDATE_PROCEDURE.md
│
└─ docs/
   └─ ARCHITECTURE_DECOUPLING_STRATEGY.md (this file)
```

---

## ✅ Summary

### **Your Update Workflow**

1. **Monitor** `.tmp-openclaw-upstream` (manual, monthly check)
2. **Merge** when you decide (cherry-pick or full merge)
3. **Build** with `./build.sh X.X.X`
4. **Test** locally (quick sanity check)
5. **Deploy** with `./deploy.sh X.X.X`
6. **Monitor** logs for 24h
7. **Rollback** if needed (2 min via rollback script)

### **Key Benefits**

✅ **Decoupled**: Worker + Heavy can update independently  
✅ **Manual control**: You decide when to update  
✅ **Version pinned**: Easy to track, rollback, reproduce  
✅ **Minimal changes**: Core stays OpenClaw, you just reorganize  
✅ **Scalable**: Can add more heavy instances as needed  

### **Next Steps**

1. Create the 2 Dockerfiles (based on templates above)
2. Create `build.sh` script
3. Create `deploy.sh` script
4. Test build & run locally
5. Deploy to staging/prod

---

Generated: April 18, 2026  
Architecture: 2-tier (Worker + Heavy)  
Update strategy: Manual version pinning
