# OpenClaw VPS Heavy

Async heavy task processor for OpenClaw SaaS. Consumes the `heavy-tasks` queue from Redis and processes media/browser operations (FFmpeg, Playwright, TTS, STT).

## Architecture

```
Backend (Railway)
  ├─ Control Plane API
  └─ Redis Queue (heavy-tasks)
       │
       ▼
VPS Heavy (This Service)
  ├─ BullMQ Consumer
  ├─ Tool Processors
  │   ├─ FFmpeg (video/audio)
  │   ├─ Playwright (screenshots/PDF)
  │   ├─ TTS (text-to-speech)
  │   └─ STT (speech-to-text)
  └─ Storage Service
       └─ /data/users/{userId}/heavy-tasks/
```

## Stack

- **Node.js 24** + **TypeScript**
- **bull** (BullMQ) — consume jobs from `heavy-tasks` queue
- **ffmpeg** — video/audio encoding
- **playwright** — headless Chromium for screenshots/PDF
- **axios** — callbacks to backend `/api/internal/job/:jobId/result`

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with Redis URL and API keys (optional)

# Run in dev mode
npm run dev
```

**Requires Redis running:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

## Production Deployment (Docker Compose)

```bash
# Configure
cp .env.example .env
nano .env

# Start services (Redis + Heavy Worker)
docker-compose up -d

# View logs
docker-compose logs -f vps-heavy

# Stop
docker-compose down
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REDIS_URL` | ✅ | Redis: `redis://default:password@host:6379` |
| `CONTROL_PLANE_URL` | ✅ | Backend: `https://api.openclaw.ai` |
| `VPS_WORKER_SECRET` | ✅ | Shared secret for webhook auth |
| `DATA_DIR` | ⬜ | User data mount: `/data/users` |
| `CONCURRENT_JOBS` | ⬜ | Max parallel jobs (default: 3) |
| `FFMPEG_TIMEOUT` | ⬜ | Timeout seconds (default: 300 = 5min) |
| `PLAYWRIGHT_TIMEOUT` | ⬜ | Timeout seconds (default: 120 = 2min) |
| `OPENAI_API_KEY` | ⬜ | For STT via OpenAI Whisper |
| `GOOGLE_TTS_API_KEY` | ⬜ | For TTS via Google Cloud |
| `ELEVENLABS_API_KEY` | ⬜ | For TTS via ElevenLabs |
| `DEEPGRAM_API_KEY` | ⬜ | For STT via Deepgram |
| `PORT` | ⬜ | Health check port (default: 3003) |

## API Endpoints

### Health Check
```
GET /health
→ 200 OK { "status": "ok", "timestamp": "..." }
```

## How It Works

### Job Processing Flow

1. **Backend enqueues heavy job:**
   ```
   POST /api/heavy/submit { tool: "ffmpeg", params: {...} }
   → QueueService.enqueueFFmpeg()
   ```

2. **VPS Heavy consumer processes:**
   - Retrieves job from Redis queue
   - Notifies backend (status: PROCESSING)
   - Runs tool (FFmpeg/Playwright/TTS/STT)
   - Saves result to `/data/users/{userId}/heavy-tasks/`
   - Calculates SHA256 checksum
   - Calls back to backend via `/api/internal/job/:jobId/result`

3. **Backend stores result metadata:**
   - Updates HeavyJob record
   - User can download via `/api/heavy/results/:jobId`

### Timeouts

| Tool | Timeout | Notes |
|------|---------|-------|
| FFmpeg | 5 minutes | 1080p encoding is slow |
| Playwright | 2 minutes | Screenshot/PDF generation |
| TTS | 2 minutes | API call + synthesis |
| STT | 5 minutes | Long audio files |

### Storage Structure

```
/data/users/{userId}/heavy-tasks/
├── job_xyz_2026-04-21T10-30-45.mp4
├── job_abc_2026-04-21T10-25-12.png
└── job_def_2026-04-21T10-20-00.txt
```

**Quota**: 4GB per user (configurable via backend)

## Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry: Redis connection, processor init |
| `src/processors/heavy.processor.ts` | Job handlers (ffmpeg/playwright/tts/stt) |
| `src/tools/ffmpeg.tool.ts` | FFmpeg wrapper (video/audio encoding) |
| `src/tools/playwright.tool.ts` | Playwright wrapper (screenshots/PDF) |
| `src/tools/tts.tool.ts` | TTS providers (Google, ElevenLabs, local) |
| `src/tools/stt.tool.ts` | STT providers (OpenAI, Google, Deepgram, local) |
| `src/storage/storage.service.ts` | Save results to disk, quota tracking |
| `src/control-plane/callback.service.ts` | Axios client for backend callbacks |
| `src/logger.ts` | Logging utility |

## Testing

### Local Test (with Docker)

```bash
# Start services
docker-compose up -d

# Enqueue test job (requires Redis CLI)
redis-cli -p 6379
> LPUSH bull:heavy-tasks:1000:${ts}:${data} '{"name":"ffmpeg","data":{"jobId":"test-1","userId":"user-1","tool":"ffmpeg","params":{"inputPath":"/tmp/input.mp4","format":"mp4"}}}'

# Check logs
docker-compose logs -f vps-heavy

# Verify result saved
ls -la /data/users/user-1/heavy-tasks/
```

### Integration Test (with Backend)

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: VPS Heavy
cd vps-heavy && npm run dev

# Terminal 3: Create heavy job
curl -X POST http://localhost:3001/api/heavy/submit \
  -H "Cookie: sessionToken=..." \
  -H "Content-Type: application/json" \
  -d '{"tool":"FFMPEG","params":{"inputUrl":"https://..."}}'

# Check logs
docker logs openclaw-vps-heavy

# Verify result
curl http://localhost:3001/api/heavy/status/job-xyz
```

## Monitoring

### Queue Status
```bash
redis-cli
> LLEN bull:heavy-tasks:1000  # Pending jobs
> LRANGE bull:heavy-tasks:active 0 -1  # Active jobs
> LLEN bull:heavy-tasks:failed  # Failed jobs
```

### Job Progress
```bash
# Via logs
docker logs -f openclaw-vps-heavy | grep "Heavy progress"

# Via Redis monitoring
redis-cli MONITOR
```

### Resource Usage
```bash
# CPU, Memory
docker stats openclaw-vps-heavy

# Disk usage
du -sh /data/users
```

## Troubleshooting

### Job Timeout

```bash
# Check if job is still running
ps aux | grep ffmpeg
ps aux | grep chromium

# Check logs for timeout error
docker logs openclaw-vps-heavy | grep -i timeout

# If stuck, kill the process
pkill -f ffmpeg
pkill -f chromium
```

### Out of Memory (Playwright)

```bash
# Check memory
free -h

# Reduce concurrent jobs
# Edit docker-compose.yml:
# CONCURRENT_JOBS=2
docker-compose up -d
```

### Storage Full

```bash
# Check quota
du -sh /data/users
du -sh /data/users/*/heavy-tasks

# Clean old results (keep last 7 days)
find /data/users/*/heavy-tasks -mtime +7 -delete
```

### API Key Not Configured

```bash
# OpenAI Whisper (STT) not working?
# Edit .env:
# OPENAI_API_KEY=sk-...
docker-compose up -d

# Check logs for "OPENAI_API_KEY not configured"
docker logs openclaw-vps-heavy
```

## Scaling

### Add More Heavy VPS Instances

When queue depth > 50 jobs or CPU > 80%:

1. Deploy 2nd VPS identical setup
2. Both workers share same Redis queue (auto load-balanced)
3. One worker can go down without blocking jobs

### Increase Concurrent Jobs

Edit `docker-compose.yml`:
```yaml
environment:
  CONCURRENT_JOBS: 5  # was 3
```

⚠️ **Beware RAM**: 48GB VPS can handle ~6-8 concurrent FFmpeg jobs max (2-3 concurrent Playwright + 3-5 FFmpeg).

## Security Checklist

- [ ] `VPS_WORKER_SECRET` is random, not in git
- [ ] Redis password set (`REDIS_PASSWORD`)
- [ ] `/data/users` mount permissions: 700 (openclaw:openclaw)
- [ ] Firewall restricts port 3003 to internal only
- [ ] SSH key-only authentication
- [ ] Log rotation enabled (`/etc/logrotate.d/openclaw-heavy`)

## References

- [Architecture](../worker.md)
- [Heavy VPS Spec](../heavy.md)
- [Backend Control Plane](../backend/README.md)
- [BullMQ Docs](https://docs.bullmq.io)
- [FFmpeg Docs](https://ffmpeg.org/documentation.html)
- [Playwright Docs](https://playwright.dev)
