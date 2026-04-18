# OpenClaw SaaS — VPS Heavy (Compute Plane)

**Purpose:** Dedicated VPS for async heavy task processing  
**Tools:** FFmpeg, Playwright, TTS/STT, media processing  
**Spec:** Contabo 12 vCPU / 48GB RAM / 100GB SSD (CPU-only, no GPU)  
**Cost:** ~$50/mo

---

## 1. Architecture Overview

### Role in System
```
User Container (VPS Worker)
    │ POST /api/heavy/submit
    │ {tool, params, userId}
    ▼
VPS Worker (BullMQ Queue)
    │ enqueue job
    ▼
VPS Heavy (BullMQ Consumer)
    │ process job
    ├─ FFmpeg: encode video
    ├─ Playwright: screenshot/PDF
    ├─ TTS/STT: speech processing
    └─ Upload result to /data/users/{userId}/
    │
    ▼
Callback to Worker
    PUT /api/internal/job/{jobId}/result
    {status, resultPath, size}
    │
    ▼
User Container (polling/WebSocket)
    GET /storage/{resultPath}
```

### Why Separate?

| If in user container | In separate heavy VPS |
|---|---|
| FFmpeg blocks chat | FFmpeg runs independently |
| 1GB RAM → OOM risk | 48GB available |
| 0.5 vCPU → slow encoding | 12 vCPU dedicated |
| User sees lag | User sees instant response |

---

## 2. Heavy VPS Setup

### 2.1 OS & Base Installation

```bash
# SSH to VPS Heavy
ssh openclaw@vps-heavy

# Update system
apt update && apt upgrade -y

# Firewall (only internal from worker + SSH)
ufw allow 22/tcp          # SSH
ufw allow from VPS_WORKER_IP to any port 6379    # Redis
ufw allow from VPS_WORKER_IP to any port 3001    # Health check
ufw enable

# Install base tools
apt install -y \
  curl git lsof openssl ca-certificates \
  ffmpeg \
  libwebp-dev libvips-dev \
  python3 python3-pip

# Verify FFmpeg
ffmpeg -version  # v7.0+
```

### 2.2 Directory Structure

```bash
mkdir -p /opt/heavy
mkdir -p /data/jobs/{queue,processing,done}
mkdir -p /var/log/openclaw-heavy

chown -R openclaw:openclaw /opt/heavy
chown -R openclaw:openclaw /data/jobs
chown -R openclaw:openclaw /var/log/openclaw-heavy

chmod 755 /opt/heavy
chmod 755 /data/jobs
chmod 755 /var/log/openclaw-heavy
```

### 2.3 Docker Setup

```bash
# Already installed on Contabo
docker --version  # Verify

# Create network (shared with worker if co-located, or separate)
docker network create openclaw-heavy-net
```

---

## 3. openclaw-heavy-worker Image

### Dockerfile.heavy

```dockerfile
# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE="node:24-bookworm"
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

# Copy from upstream + custom modifications
COPY .tmp-openclaw-upstream/package.json \
     .tmp-openclaw-upstream/pnpm-lock.yaml \
     ./

RUN corepack enable && \
    pnpm install --frozen-lockfile

COPY .tmp-openclaw-upstream/src ./src
COPY .tmp-openclaw-upstream/dist ./dist

# Build
RUN pnpm build:docker || echo "Pre-built dist available"

# ── Runtime ──
FROM ${NODE_IMAGE}

WORKDIR /app

# Install heavy dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      curl git lsof openssl \
      ffmpeg \
      libwebp-dev libvips-dev \
      python3 python3-pip \
      ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Playwright (optional, defer to first run if space-tight)
ARG INSTALL_PLAYWRIGHT=1
RUN if [ "$INSTALL_PLAYWRIGHT" = "1" ]; then \
      npm install -g @playwright/cli && \
      playwright install chromium; \
    fi

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .

ENV NODE_ENV=production
ENV OPENCLAW_ROLE=heavy-worker
ENV CONCURRENT_JOBS=3

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/worker/heavy.js"]
```

### docker-compose.heavy.yml

```yaml
version: '3.8'

services:
  openclaw-heavy:
    image: openclaw-heavy-worker:2026.5.0
    container_name: openclaw-heavy
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      REDIS_URL: redis://redis-cluster:6379  # Worker VPS Redis
      CONTROL_PLANE_URL: http://vps-worker:3000
      OPENCLAW_ROLE: heavy-worker
      CONCURRENT_JOBS: 3
      LOG_LEVEL: info
      
      # Heavy tool configs
      FFMPEG_TIMEOUT: 300  # 5 minutes (seconds)
      PLAYWRIGHT_TIMEOUT: 120  # 2 minutes
      MAX_OUTPUT_SIZE: 500000000  # 500MB per job
      JOBS_DIR: /data/jobs
    
    volumes:
      - /data/jobs:/data/jobs
      - /data/users:/data/users:ro  # Read-only access to storage
      - /var/log/openclaw-heavy:/var/log/openclaw-heavy
    
    networks:
      - openclaw-heavy-net
    
    restart: unless-stopped
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  openclaw-heavy-net:
    driver: bridge
```

---

## 4. Heavy Job Processing

### 4.1 Supported Tools

| Tool | Timeout | Input | Output | Size |
|------|---------|-------|--------|------|
| **FFmpeg** | 5 min | Video, audio | MP4, WAV, etc | 100-500MB |
| **Playwright** | 2 min | URL, HTML | PNG, PDF | 2-50MB |
| **ImageMagick** | 1 min | Image | Resized image | 1-100MB |
| **TTS** | 2 min | Text | MP3, WAV | 1-10MB |
| **STT** | 5 min | Audio | Transcript | <1MB |

### 4.2 Job Queue Schema

```typescript
// BullMQ job format
interface HeavyJob {
  id: string;                    // job_xyz
  userId: string;                // abc123
  tool: 'ffmpeg' | 'playwright' | 'tts' | 'stt';
  params: Record<string, any>;   // tool-specific
  submittedAt: number;
  timeout: number;               // milliseconds
  maxRetries: number;
  
  // Internal
  status?: 'pending' | 'processing' | 'done' | 'failed';
  workerId?: string;
  startedAt?: number;
  completedAt?: number;
  result?: {
    filePath: string;
    size: number;
    format: string;
    checksum: string;
  };
  error?: string;
}
```

### 4.3 Job Processing Flow

```typescript
// pseudocode
async function processHeavyJob(job: HeavyJob) {
  const timeout = job.timeout || defaultTimeout[job.tool];
  const deadline = Date.now() + timeout;
  
  try {
    // 1. Download input (if needed)
    const input = await downloadInput(job.params.inputUrl);
    
    // 2. Process
    let result;
    switch(job.tool) {
      case 'ffmpeg':
        result = await ffmpegProcess(input, job.params, deadline);
        break;
      case 'playwright':
        result = await playwrightProcess(input, job.params, deadline);
        break;
      // ...
    }
    
    // 3. Validate result
    if (result.size > MAX_OUTPUT_SIZE) {
      throw new Error('Output too large');
    }
    
    // 4. Upload to user storage
    const uploadPath = `/data/users/${job.userId}/heavy-tasks/`;
    const filePath = await uploadToStorage(result, uploadPath);
    
    // 5. Callback to worker
    await axios.put(
      `${CONTROL_PLANE_URL}/api/internal/job/${job.id}/result`,
      {
        status: 'done',
        resultPath: filePath,
        size: result.size,
        checksum: result.checksum
      }
    );
    
  } catch (error) {
    // Retry logic
    if (job.retries < job.maxRetries) {
      await job.retry();
    } else {
      // Callback with error
      await axios.put(
        `${CONTROL_PLANE_URL}/api/internal/job/${job.id}/result`,
        {
          status: 'failed',
          error: error.message
        }
      );
    }
  }
}
```

---

## 5. Resource Benchmarks

### FFmpeg Encoding (1080p H.264)

```
Input: 1080p @30fps, 5 minute video (~1.5GB)
Codec: libx264, quality: high (crf=20)

Resource usage:
├─ CPU: ~100% × 1 vCPU (single-threaded, can parallelize with -threads)
├─ RAM: ~200MB
├─ Duration: ~5-8 minutes (real-time encoding)
└─ Output: ~150-200MB

On 12 vCPU VPS:
├─ Can run 3-5 concurrent encodes (1 vCPU each)
├─ Plus 7-9 vCPU spare for Playwright, TTS
└─ Very comfortable for 3 jobs/day quota
```

### Playwright Screenshot

```
Input: URL (load, render, screenshot)
Resolution: 1920×1080

Resource usage:
├─ CPU: ~30% × 1 vCPU
├─ RAM: ~500MB per instance (Chromium)
├─ Duration: ~10-30 seconds
└─ Output: ~2-5MB

On 12 vCPU VPS:
├─ Can run 20+ concurrent browsers
├─ RAM becomes bottleneck before CPU (48GB = ~50 browsers)
└─ Very light compared to FFmpeg
```

### TTS (Text-to-Speech via API)

```
Input: "Hello world" (100 characters)
Provider: ElevenLabs API

Resource usage:
├─ CPU: <5% (just API call + network)
├─ RAM: <10MB
├─ Duration: ~2-5 seconds (API latency)
└─ Output: ~0.5MB

Note: Most computation on provider side, not VPS
```

---

## 6. Monitoring & Logging

### 6.1 Logs

```bash
# Real-time logs
docker logs -f openclaw-heavy

# Persistent logs (logrotate)
/var/log/openclaw-heavy/
├── heavy.log (rotated daily, kept 7 days)
├── jobs.log (job submissions & results)
└── errors.log (failures)

# Log rotation config
# /etc/logrotate.d/openclaw-heavy
/var/log/openclaw-heavy/*.log {
  daily
  rotate 7
  compress
  missingok
  notifempty
}
```

### 6.2 Monitoring Metrics

```bash
# CPU usage
docker stats openclaw-heavy --no-stream | awk '{print $3}'

# Job queue depth
redis-cli LLEN openclaw:heavy:queue

# Job success rate
redis-cli GET heavy:jobs:total
redis-cli GET heavy:jobs:success
redis-cli GET heavy:jobs:failed

# Storage usage
du -sh /data/jobs
du -sh /data/users

# Cron: Monitor every 5 minutes
*/5 * * * * /opt/scripts/monitor-heavy.sh
```

### 6.3 Alerts

```bash
#!/bin/bash
# /opt/scripts/alert-heavy.sh

# CPU > 80% for 5 min?
cpu=$(docker stats --no-stream | grep heavy | awk '{print $3}' | tr -d '%')
if [ $cpu -gt 80 ]; then
  curl -X POST "$ALERT_WEBHOOK" -d "VPS Heavy CPU $cpu% — scaling needed"
fi

# Job failure rate > 10%?
failures=$(redis-cli GET heavy:jobs:failed)
total=$(redis-cli GET heavy:jobs:total)
rate=$((failures * 100 / total))
if [ $rate -gt 10 ]; then
  curl -X POST "$ALERT_WEBHOOK" -d "VPS Heavy failure rate $rate%"
fi

# Storage > 80% full?
usage=$(df /data/jobs | tail -1 | awk '{print $5}' | tr -d '%')
if [ $usage -gt 80 ]; then
  curl -X POST "$ALERT_WEBHOOK" -d "VPS Heavy storage $usage% — cleanup needed"
fi
```

---

## 7. Scaling & Maintenance

### 7.1 When to Scale

| Signal | Action |
|--------|--------|
| Queue depth > 50 jobs | Add 2nd heavy VPS |
| CPU consistently > 80% | Add 2nd heavy VPS |
| RAM > 80% | Increase Playwright timeouts (reduce concurrent) |
| Storage > 80% | Implement job result cleanup (30-day retention) |

### 7.2 Multi-Heavy VPS Architecture

```
When > 20 concurrent users:

VPS Worker (Redis + Queue)
    ├─ Push job → Redis queue
    │
    ├─ Heavy-1 (consumer, 3 concurrent jobs)
    │   └─ ffmpeg + playwright
    │
    ├─ Heavy-2 (consumer, 3 concurrent jobs)
    │   └─ ffmpeg + playwright
    │
    └─ Heavy-3 (consumer, auto-scale on demand)
        └─ ffmpeg + playwright

Each heavy pulls from same Redis queue (round-robin).
```

### 7.3 Update Strategy

See: **[ARCHITECTURE_DECOUPLING_STRATEGY.md](ARCHITECTURE_DECOUPLING_STRATEGY.md)**

```bash
# When new OpenClaw version released:

# 1. Update base
cd .tmp-openclaw-upstream
git checkout v2026.5.0

# 2. Rebuild heavy image
./build.sh 2026.5.0

# 3. Test locally
docker run openclaw-heavy-worker:2026.5.0 --version

# 4. Deploy
./deploy.sh 2026.5.0 openclaw@vps-heavy

# 5. Monitor
docker logs -f openclaw-heavy
```

---

## 8. Troubleshooting

### Job Hangs (Timeout)

```bash
# Check job in Redis
redis-cli HGET openclaw:job:xyz status  # should be 'processing'

# If stuck > 10 min:
# 1. Check heavy container
docker ps -a | grep openclaw-heavy

# 2. Check FFmpeg process
ps aux | grep ffmpeg

# 3. Kill stuck job
redis-cli DEL openclaw:job:xyz
pkill -f ffmpeg

# 4. Check error logs
docker logs openclaw-heavy | grep -i error
```

### Out of Memory

```bash
# Check memory usage
free -h

# If 48GB -> 45GB used:
# 1. Check Playwright browsers
ps aux | grep chromium | wc -l

# 2. Reduce concurrent Playwright jobs
# Edit docker-compose.yml:
# CONCURRENT_JOBS=2 (reduce from 3)
# docker-compose up -d

# 3. Kill old Chromium processes
pkill -f chromium
```

### Slow FFmpeg

```bash
# Check FFmpeg CPU usage
docker stats openclaw-heavy --no-stream

# If CPU < 50% (underutilized):
# - Network bottleneck? Check disk I/O
# - Codec inefficient? Use `-preset fast` instead of `-preset slow`

# If CPU = 100% (maxed):
# - Normal, expected behavior
# - Parallelize jobs: split input video into chunks
# - Or use hardware acceleration (NVIDIA NVENC, if GPU available)
```

---

## 9. Checklist: Launch Heavy VPS

- [ ] Contabo VPS ordered (12 vCPU, 48GB RAM, 100GB SSD)
- [ ] OS hardening (firewall, SSH key-only, auto-updates)
- [ ] Docker installed & network created
- [ ] FFmpeg & Playwright installed & tested
- [ ] Directories created (/opt/heavy, /data/jobs)
- [ ] Dockerfile.heavy built & tested locally
- [ ] docker-compose.heavy.yml configured
- [ ] Redis connection verified (to worker VPS)
- [ ] Health check endpoint working
- [ ] Logging configured (logrotate)
- [ ] Monitoring scripts deployed (/opt/scripts/)
- [ ] Alert webhooks configured
- [ ] Rollback procedure documented
- [ ] Integration tested with worker VPS
- [ ] Load tested with 5+ concurrent jobs

---

Generated: April 18, 2026  
Role: Compute plane for async heavy tasks  
Status: Ready for MVP deployment
