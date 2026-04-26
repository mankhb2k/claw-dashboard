# OpenClaw VPS Worker

Docker container orchestration service for OpenClaw SaaS. Consumes the `container-ops` queue from Redis and manages user container lifecycle (spawn, wake, stop, destroy).

## Architecture

```
Backend (Railway)
  ├─ Control Plane API
  └─ Redis Queue (container-ops)
       │
       ▼
VPS Worker (This Service)
  ├─ BullMQ Consumer
  ├─ Docker SDK
  ├─ Traefik (routing)
  └─ User Containers
       ├─ openclaw-<project-slug>   (one per project, slug from DB)
       └─ ... (concurrency bound by your VPS)
```

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Redis URL and secrets

# Run in dev mode (watch + rebuild)
npm run dev
```

**In another terminal, start Redis + Docker:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
docker network create openclaw-net
```

## Production Deployment (Docker Compose)

```bash
# Configure environment
cp .env.example .env
nano .env  # Set REDIS_PASSWORD, CONTROL_PLANE_URL, etc.

# Start all services (Redis, Traefik, Worker)
docker-compose up -d

# View logs
docker-compose logs -f vps-worker

# Stop
docker-compose down
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REDIS_URL` | ✅ | Redis connection: `redis://default:password@host:6379` |
| `CONTROL_PLANE_URL` | ✅ | Backend API: `https://api.openclaw.ai` |
| `VPS_WORKER_SECRET` | ✅ | Shared secret for webhook authentication |
| `OPENCLAW_IMAGE` | ⬜ | Fallback image if a job has no `imageVersion` (prefer setting `OPENCLAW_IMAGE` in the control plane) |
| `APP_DOMAIN` | ⬜ | Public domain for Traefik `Host()`: e.g. `clawsandbox.cloud` → `Host(\`slug.clawsandbox.cloud\`)` |
| `DATA_DIR` | ⬜ | Base path; per-project data is at `<DATA_DIR>/<userId>/<projectId>` |
| `PORT` | ⬜ | Health check port: `3002` |
| `DEBUG` | ⬜ | Enable debug logging: `true/false` |

## API Endpoints

### Health Check
```
GET /health
→ 200 OK { "status": "ok", "timestamp": "..." }
```

## How It Works

### Job Processing

1. **Backend enqueues spawn job:**
   ```
   POST /api/projects → QueueService.enqueueSpawn()
   ```

2. **VPS Worker processes:**
   - Creates Docker container with resource limits
   - Applies Traefik labels for automatic routing
   - Waits for health check (30s timeout)
   - Calls back to backend via `/api/internal/status`

3. **Traefik routes traffic:**
   - Automatically detects containers with labels
   - Routes `https://{subdomain}.{APP_DOMAIN}` (default `clawsandbox.cloud`) → container:3000

4. **Project lifecycle:**
   ```
   spawn   → CREATING → RUNNING
   wake    → STARTING → RUNNING
   stop    → STOPPING → STOPPED
   destroy → Delete container + data
   ```

## Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point: Redis connection, processor initialization |
| `src/processors/container.processor.ts` | BullMQ job handlers (spawn/wake/stop/destroy) |
| `src/docker/docker.service.ts` | Dockerode wrapper for container operations |
| `src/control-plane/callback.service.ts` | Axios client for backend callbacks |
| `src/logger.ts` | Logging utility |
| `Dockerfile` | Production image (Node 24 + Docker CLI) |
| `docker-compose.yml` | Full stack (Redis, Traefik, Worker) |

## Testing

### Local Test (Docker Mock)

```bash
# Start services
docker-compose up -d

# Enqueue a test job manually (requires Redis CLI)
redis-cli -p 6379
> LPUSH bull:container-ops:1000:${timestamp}:${data} '{"name":"spawn","data":{"projectId":"test-1","userId":"user-1","subdomain":"test-1","imageVersion":"openclaw-gateway:latest","plan":"free"}}'

# Check logs
docker-compose logs -f vps-worker

# Verify container created
docker ps | grep openclaw
```

### Integration Test (with Backend)

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start vps-worker
cd vps-worker && npm run dev

# Terminal 3: Create project via API
curl -X POST http://localhost:3001/api/projects \
  -H "Cookie: sessionToken=..." \
  -H "Content-Type: application/json"

# Check container spawned
docker ps | grep openclaw
```

## Monitoring

### Queue Status
```bash
redis-cli
> LLEN bull:container-ops:1000  # Pending jobs
> LRANGE bull:container-ops:active 0 -1  # Active jobs
```

### Container Health
```bash
docker ps --filter "label=openclaw.userId"
docker stats openclaw-usr_abc
docker logs openclaw-usr_abc
```

### VPS Worker Health
```bash
curl http://localhost:3002/health
```

## Troubleshooting

### Container fails to start

```bash
# Check container logs
docker logs openclaw-usr_abc

# Verify image exists
docker images | grep openclaw-gateway

# Check resource limits
docker inspect openclaw-usr_abc | grep -A 10 "HostConfig"

# Test health endpoint manually
curl http://openclaw-usr_abc:3000/health
```

### Worker can't connect to Redis

```bash
# Test Redis connection
redis-cli -h redis -p 6379 PING

# Check Docker network
docker network inspect openclaw-net

# Verify REDIS_URL in env
echo $REDIS_URL
```

### Traefik not routing traffic

```bash
# Check Traefik logs
docker logs openclaw-traefik

# Verify container labels
docker inspect openclaw-usr_abc | grep -A 20 Labels

# Test curl to container directly
curl http://openclaw-usr_abc:3000
```

## Security Checklist

- [ ] `VPS_WORKER_SECRET` is random, not in git
- [ ] Docker socket only accessible to openclaw user
- [ ] Firewall restricts ports: 80 (HTTP), 443 (HTTPS) only
- [ ] SSH key-only authentication
- [ ] Redis password set (`REDIS_PASSWORD`)
- [ ] Traefik dashboard disabled (`--api=false`)
- [ ] `/data/users` mount permissions: 700 (openclaw:openclaw)

## Scaling

### Adding More VPS Workers

When users > ~100:

1. Deploy 2nd VPS identical setup
2. Update `VPS_NODE_ID=vps-2` in env
3. Both workers share same Redis queue (round-robin consumption)
4. DNS: load balance `*.openclaw.ai` via Cloudflare LB or separate subdomains

### Increasing Concurrent Containers

Edit `docker-compose.yml` `vps-worker.concurrency` and rebuild.

Default: 5 concurrent job processors (can handle ~20-30 concurrent containers depending on resource availability).

## References

- [Architecture](../worker.md)
- [Backend Control Plane](../backend/README.md)
- [BullMQ Docs](https://docs.bullmq.io)
- [Dockerode Docs](https://github.com/apocas/dockerode)
- [Traefik v3 Docs](https://doc.traefik.io/traefik/v3.0/)
