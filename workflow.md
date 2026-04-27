# OpenClaw SaaS — Workflow & Architecture

> **Updated:** 2026-04-27
> **MVP scope:** Free tier · Pro tier · multi-project/user · idle-shutdown · auto-wake
> **Related docs:** Billing policy in `billing-plan.md`; execution checklist in `roadmap-plan.md`

## Document Role

- **Purpose:** Kiến trúc hệ thống và runtime flow end-to-end.
- **Owns:** topology, lifecycle, queue flow, deployment phases.
- **Does not own:** pricing/quota policy chi tiết (xem `billing-plan.md`), checklist thực thi sprint (xem `roadmap-plan.md`).
- **Terminology note:** Dùng `project` làm đơn vị sản phẩm; runtime hiện tại map 1:1, tức **1 project = 1 container worker**.

---

## 1. Vấn đề cần giải quyết

Người dùng muốn chạy bot nhắn tin (Telegram, Zalo, WhatsApp, Discord, Slack, LINE) với AI tự động trả lời — không cần quản lý server. OpenClaw SaaS tổ chức theo đơn vị **project**; mỗi project có state riêng và được map tới worker runtime tương ứng.

> **Ghi chú chuẩn thuật ngữ:** Trong hệ thống hiện tại, **1 project = 1 container worker** (OpenClaw gateway runtime).

---

## 2. System Architecture

```mermaid
graph TB
    User["👤 User<br/>(Telegram/Web)"]
    CDN["🌐 Cloudflare<br/>DNS + CDN + DDoS"]

    subgraph Railway["Railway (Control Plane) :3001"]
        API["🔵 NestJS API<br/>Port 3001<br/>Projects | Users | Jobs"]
        DB["🗄️ PostgreSQL<br/>projects | users | heavy_jobs<br/>subscriptions | plans"]
        Redis["📦 Redis Managed<br/>container-ops queue<br/>heavy-tasks queue"]
    end

    subgraph Worker["VPS Worker (Contabo Ubuntu 22.04)"]
        VPSWorker["🟢 vps-worker :3002<br/>BullMQ Consumer<br/>container-ops"]
        DockerEngine["🐳 Docker Engine<br/>spawn/wake/stop/destroy"]
        Traefik["🔄 Traefik v3 :80/:443<br/>SSL + Routing<br/>*.openclaw.ai"]
        Storage1["💾 /data/users<br/>250GB NVMe<br/>~40-50 containers"]

        subgraph Containers["User Containers (isolated)"]
            C1["📱 openclaw-{subdomain}<br/>Image: openclaw-gateway<br/>Free: 1GB/0.5vCPU · Pro: 2GB/1vCPU"]
            C2["📱 openclaw-{subdomain2}<br/>..."]
        end
    end

    subgraph Heavy["VPS Heavy (Separate)"]
        VPSHeavy["🔴 vps-heavy :3003<br/>BullMQ Consumer<br/>heavy-tasks"]
        FFmpeg["🎬 FFmpeg<br/>video/audio encode"]
        Playwright["🌐 Playwright<br/>screenshot/PDF"]
        Tools["🔧 TTS/STT<br/>media synthesis"]
        Storage2["💾 /data/users<br/>heavy-tasks/<br/>job results"]
    end

    User -->|HTTPS| CDN
    CDN -->|api.openclaw.ai| API
    CDN -->|user1.openclaw.ai| Traefik

    API -->|Read/Write| DB
    API -->|Enqueue| Redis

    VPSWorker -->|Pull| Redis
    VPSWorker -->|Docker SDK| DockerEngine
    DockerEngine -->|spawn/stop| Containers
    Containers -->|:3000/health| Traefik
    Traefik -->|route| Containers
    Containers -->|store state| Storage1

    VPSHeavy -->|Pull| Redis
    VPSHeavy -->|execute| FFmpeg
    VPSHeavy -->|execute| Playwright
    VPSHeavy -->|execute| Tools
    FFmpeg -->|save| Storage2
    Playwright -->|save| Storage2
    Tools -->|save| Storage2

    VPSWorker -->|PUT /api/internal/status| API
    VPSHeavy -->|PUT /api/internal/job/:id/result| API

    style Railway fill:#e3f2fd
    style Worker fill:#f3e5f5
    style Heavy fill:#fff3e0
    style Containers fill:#f1f8e9
```

---

## 3. Monorepo Directory Structure

```mermaid
graph TD
    Root["openclaw-saas/"]

    Root --> Backend["backend/<br/>(Railway Control Plane)"]
    Root --> Frontend["frontend/<br/>(Cloudflare Pages)"]
    Root --> Worker["worker/<br/>(OpenClaw Gateway)"]
    Root --> VPSWorker["vps-worker/<br/>(Container Orchestrator)"]
    Root --> VPSHeavy["vps-heavy/<br/>(Media Processor)"]

    Backend --> BEFiles["src/<br/>├─ projects/<br/>├─ heavy/<br/>├─ queue/<br/>└─ internal/"]

    Frontend --> FEFiles["src/<br/>├─ pages/<br/>├─ components/<br/>└─ api/"]

    Worker --> WFiles["src/ (upstream)<br/>├─ gateway/<br/>├─ channels/<br/>└─ agents/<br/><br/>control-ui/ (pure frontend)<br/>├─ src/<br/>└─ vite.config.ts<br/><br/>vendor/control-ui/<br/>(build output)"]

    VPSWorker --> VWFiles["src/<br/>├─ processors/container.ts<br/>├─ docker/docker.service.ts<br/>├─ control-plane/callback.ts<br/>└─ health/health.ts<br/><br/>docker-compose.yml<br/>.env.example"]

    VPSHeavy --> VHFiles["src/<br/>├─ processors/heavy.ts<br/>├─ tools/<br/>│  ├─ ffmpeg.tool.ts<br/>│  ├─ playwright.tool.ts<br/>│  ├─ tts.tool.ts<br/>│  └─ stt.tool.ts<br/>├─ storage/storage.service.ts<br/>└─ control-plane/callback.ts<br/><br/>docker-compose.yml<br/>.env.example"]

    style Root fill:#fafafa
    style Backend fill:#e3f2fd
    style Frontend fill:#f3e5f5
    style Worker fill:#fff9c4
    style VPSWorker fill:#e8f5e9
    style VPSHeavy fill:#fff3e0
```

---

## 4. Kiến trúc theo giai đoạn scale

### Giai đoạn 1 — MVP (≤ ~500 users)

```
┌─────────────────────────────────────────────────┐
│  LAYER 1 — CONTROL  (Railway)                   │
│  NestJS/Fastify API + PostgreSQL                │
│  Redis managed (Railway) ← BullMQ broker        │
└──────────────────┬──────────────────────────────┘
                   │ BullMQ + REST API
        ┌──────────┴──────────┐
        │                     │
┌───────▼──────────┐  ┌──────▼─────────────┐
│ VPS WORKER       │  │ VPS HEAVY          │
│ (Mgmt Plane)     │  │ (Compute Plane)    │
│                  │  │                    │
│ openclaw-worker  │  │ openclaw-heavy     │
│ Traefik v3       │  │                    │
│ User containers  │  │ ├─ FFmpeg          │
│ ├─ 1-2GB/0.5-1vC │  │ ├─ Playwright      │
│ ├─ 4-10GB SSD    │  │ ├─ TTS/STT         │
│ × 40-50 ctnr     │  │ └─ Job processor   │
│ /data/users/     │  │                    │
│ /250GB NVMe      │  │ /100GB SSD         │
│                  │  │                    │
│ Contabo 12vCPU   │  │ Contabo 12vCPU     │
│ 48GB RAM         │  │ 48GB RAM           │
│ $40-50/mo        │  │ $40-50/mo          │
└──────────────────┘  └────────────────────┘
        │                     │
        └──────────┬──────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  CLOUDFLARE (DNS + CDN + DDoS)                  │
│  *.openclaw.ai  → VPS Worker IP                 │
│  app.openclaw.ai → Cloudflare Pages             │
└─────────────────────────────────────────────────┘
```

### Giai đoạn 2 — Multi-VPS (≤ ~10,000 users)

```
┌─────────────────────────────────────────────────┐
│  LAYER 1 — CONTROL  (Railway)                   │
│  NestJS API · PostgreSQL                        │
│  + Scheduler: chọn VPS node có capacity         │
│  Redis managed (Railway) ← vẫn dùng            │
└─────────┬──────────────────────┬────────────────┘
          │                      │
┌─────────▼────────┐   ┌─────────▼────────┐
│  VPS #1          │   │  VPS #2          │   ...
│  Worker          │   │  Worker          │
│  Traefik         │   │  Traefik         │
│  Containers      │   │  Containers      │
│  /data/users/    │   │  /data/users/    │
└──────────────────┘   └──────────────────┘
```

### Giai đoạn 3 — High Scale (> 10,000 users)

```
Thêm: 1 VPS Redis riêng (Redis Sentinel 1 master + 2 replica)
Thêm: Cloudflare Workers + KV routing (subdomain → VPS)
Thêm: Cloudflare Tunnels (không expose port VPS)
Thay đổi: chỉ đổi REDIS_URL trong worker env → không refactor code
```

---

## 5. Capacity Planning

```
VPS Contabo: 12 vCPU / 48GB RAM / 250GB NVMe

Reserved:
  OS + system:       ~1.0 GB
  Traefik:           ~100 MB
  openclaw-worker:   ~200 MB
  Buffer:            ~1.7 GB
  ──────────────────────────
  Available:         ~45 GB

Free container:  1GB RAM / 0.5vCPU
Pro container:   2GB RAM / 1.0vCPU

Với 100% Free users, idle-shutdown 10 phút (15% active rate):
  45 / 1GB = 45 đồng thời → 45/0.15 = ~300 users/VPS

Với 100% Pro users, idle-shutdown 60 phút (30% active rate):
  45 / 2GB = 22 đồng thời → 22/0.3 = ~73 users/VPS

Mixed thực tế (80% free + 20% pro):
  ~200 users/VPS thoải mái

Storage: 200 users × avg 200MB = 40GB → 250GB đủ cho MVP
```

---

## 6. Tech Stack

| Layer | Công nghệ | Spec | Ghi chú |
|---|---|---|---|
| **Frontend** | Next.js + Cloudflare Pages | Static | |
| **API** | NestJS + Fastify | Railway | Module hóa, type-safe |
| **Auth** | Better-Auth | Railway | OAuth2, session, magic link |
| **Database** | PostgreSQL | Railway | ACID, transaction |
| **Queue** | BullMQ + Redis | Railway MVP | Async job dispatch |
| **Queue (Scale)** | BullMQ + Redis Sentinel | Dedicated VPS | Khi >10k users |
| **Proxy** | Traefik v3 | VPS Worker | Auto-discover, wildcard SSL |
| **User Containers** | Docker image | Free: 1GB/0.5vCPU · Pro: 2GB/1.0vCPU | OpenClaw gateway |
| **User Storage** | Docker Volume + NVMe | /data/users/ | SQLite, config, 4-10GB quota |
| **Heavy Tasks** | Separate VPS | VPS Heavy | FFmpeg, Playwright, async |
| **DNS/CDN** | Cloudflare | Global | Wildcard SSL, DDoS, cache |

---

## 7. Billing, Quota, và Schema tham chiếu

Phần policy billing/quota và data model đã được tách riêng để tránh lặp:

- Xem **billing source of truth** tại `billing-plan.md`
- Xem **schema chi tiết backend** tại `backend-architecture.md`

Nguyên tắc áp dụng trong workflow này:

- Đơn vị runtime là `project`
- **1 project = 1 container worker**
- Heavy usage dùng **credit wallet theo user** (cross-project)

---

## 9. Container Lifecycle Flows

### 9.1 Spawn Container (user tạo project)

```mermaid
flowchart TD
    A["POST /api/projects"] --> B["Resolve user plan<br/>user → subscription → plan"]
    B --> C["Validate: count(projects) < plan.maxProjects"]
    C --> D["Validate: count(RUNNING) < plan.maxConcurrentRunning"]
    D --> E["Tạo Project {status: CREATING}<br/>Tạo ContainerInstance<br/>snapshot cpuLimit, ramLimit từ plan"]
    E --> F["Enqueue 'spawn' job<br/>{projectId, cpuLimit, ramLimit, idleTimeoutMin}"]
    F --> G["Return {projectId, domain, status: creating}"]

    H["VPS Worker pull spawn job"] --> I["docker run openclaw-gateway<br/>--memory={ramLimit}m<br/>--cpus={cpuLimit}<br/>--label traefik... "]
    I --> J["Wait healthy :3000/health<br/>timeout 30s"]
    J --> K{Healthy?}
    K -->|Yes| L["PUT /api/internal/status<br/>{status: running}"]
    K -->|No| M["PUT /api/internal/status<br/>{status: error}"]

    style A fill:#e3f2fd
    style H fill:#e8f5e9
    style L fill:#c8e6c9
    style M fill:#ffcdd2
```

### 9.2 Idle Detection & Auto-Stop

```
Scheduler chạy mỗi 1 phút:
  → Query projects WHERE status=RUNNING
              AND lastActiveAt < NOW() - plan.idleTimeoutMin
              AND keepAlive = false
  → Với mỗi project stale:
      → Update Project.status = STOPPING
      → Enqueue "stop" job (priority thấp)

VPS Worker consume "stop":
  → docker stop openclaw-{subdomain}
  → POST /api/internal/status {status: stopped}
  → ContainerInstance.stoppedAt = NOW()

Container heartbeat (mỗi 5 phút khi có activity):
  → POST /api/internal/heartbeat {projectId}
  → Update Project.lastActiveAt = NOW() → reset idle timer
```

### 9.3 Auto Wake

**MVP — user bấm nút:**
```
Frontend → POST /api/projects/:id/start
  → Check Project.status = STOPPED
  → Update Project.status = STARTING
  → Tạo ContainerInstance mới
  → Enqueue "wake" (priority=1 — cao nhất)
  → Frontend poll GET /api/projects/:id/health mỗi 2s
  → Worker: docker start → health check pass
  → DB: {status: running} → Frontend tự reload
```

**V2 — Traefik wake-proxy (transparent):**
```
Request đến {sub}.openclaw.ai, container stopped
  → Traefik: không tìm thấy backend → route đến wake-proxy
  → wake-proxy: buffer request, trả 202 Accepted ngay
  → wake-proxy: POST /api/internal/wake/{projectId}
  → wake-proxy: trả HTML loading page (auto-refresh 3s)
  → ~3-5s container healthy → Traefik route bình thường
  → Refresh tự động → request pass through
```

| Giai đoạn | Cơ chế | Effort | UX |
|---|---|---|---|
| MVP | Frontend polling + nút "Start" | 2 giờ | Phải bấm nút, chờ ~5s |
| V2 | wake-proxy + Traefik fallback | 1 ngày | Tự động, loading page |
| V3 | Pre-warm pool trước idle timeout | 3 ngày | Zero cold start |

---

## 10. Queue & Job Flow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant API as 🔵 Backend :3001
    participant Redis as 📦 Redis
    participant Worker as 🟢 VPS Worker :3002
    participant Docker as 🐳 Docker
    participant Container as 📱 User Container
    participant Heavy as 🔴 VPS Heavy :3003
    participant Storage as 💾 Storage

    Note over API,Heavy: === CONTAINER LIFECYCLE ===

    User->>API: POST /api/projects (create)
    API->>API: Resolve plan via subscription
    API->>API: Validate maxProjects + maxConcurrentRunning
    API->>Redis: Enqueue {type: 'spawn', cpuLimit, ramLimit, idleTimeoutMin}
    API-->>User: {projectId, domain}

    Worker->>Redis: Pull container-ops job
    Worker->>Docker: docker.createContainer(openclaw-gateway)
    Docker->>Storage: mkdir /data/users/{subdomain}
    Docker->>Container: docker start
    Container->>Container: Health check :3000
    Worker->>API: PUT /api/internal/status {status: running}

    Note over User,API: === HEAVY JOB SUBMISSION ===

    Container->>API: POST /api/heavy/submit {tool: ffmpeg, projectId}
    API->>API: Resolve credit cost theo tool<br/>Check wallet monthly+purchased balance
    API->>API: Atomic deduct wallet + create heavy_job + log credit_transaction
    API->>Redis: Enqueue {type: 'ffmpeg', jobId, params}
    API-->>Container: {jobId, estimatedTime}

    Note over Heavy,Storage: === HEAVY PROCESSING ===

    Heavy->>Redis: Pull heavy-tasks job
    Heavy->>Heavy: Process (FFmpeg/Playwright/TTS/STT)
    Heavy->>Storage: Save result /data/users/{userId}/heavy-tasks/
    Heavy->>API: PUT /api/internal/job/{jobId}/result {resultPath}
    Container->>API: GET /api/heavy/status/{jobId}
    API-->>Container: {status: done, resultPath}
```

---

## 11. Queue Priority & Job Payloads

### Queue Priority

| Job | Priority | Retry | Lý do |
|---|---|---|---|
| wake | 1 (cao nhất) | 2 lần | User đang chờ |
| spawn | 5 | 3 lần exponential | Tạo mới, chấp nhận chờ |
| stop | 10 (thấp nhất) | 1 lần | Background, không gấp |
| destroy | 5 | KHÔNG retry | Tránh xóa nhầm 2 lần |

### Job Payload Schemas

**container-ops queue:**
```typescript
// spawn
{ projectId, userId, subdomain, imageVersion, cpuLimit, ramLimit, idleTimeoutMin }

// wake
{ projectId, userId }

// stop
{ projectId, userId }

// destroy
{ projectId, userId }
```

**heavy-tasks queue:**
```typescript
// ffmpeg
{ jobId, userId, projectId, tool: 'ffmpeg',
  params: { inputUrl?, format: 'mp4|webm|avi', quality: 'low|med|high', codec? } }

// playwright
{ jobId, userId, projectId, tool: 'playwright',
  params: { url?, html?, format: 'png|pdf', viewport: {w, h} } }

// tts
{ jobId, userId, projectId, tool: 'tts',
  params: { text, voice: 'en|vi', provider: 'google|elevenlabs' } }

// stt
{ jobId, userId, projectId, tool: 'stt',
  params: { inputUrl, language: 'en|vi', provider: 'openai|deepgram' } }
```

---

## 12. Storage Architecture

```mermaid
graph TB
    subgraph "VPS Worker — /data/users/"
        U1["{subdomain}/"]
        U1 --> U1S["sqlite/<br/>messages, sessions ~100MB"]
        U1 --> U1C["config/<br/>bot tokens, keys ~5MB"]
        U1 --> U1H["heavy-tasks/<br/>video/image results<br/>4GB quota (Free)<br/>10GB quota (Pro)"]
    end

    subgraph "VPS Heavy — /data/users/"
        UH1["{userId}/heavy-tasks/"]
        UH1 --> UH1J["job_xyz_2026-04-27.mp4<br/>job_abc_2026-04-27.png<br/>job_def_2026-04-27.txt"]
    end

    Note["⏱️ Results auto-expire 30 ngày<br/>Quota exceed: error 507<br/>Storage quota: per project"]

    style U1H fill:#c8e6c9
    style UH1J fill:#ffcc80
```

---

## 13. Docker Compose Stacks

### VPS Worker Stack

```mermaid
graph TB
    subgraph "vps-worker/docker-compose.yml"
        Redis["📦 Redis:7-alpine<br/>:6379 (internal)<br/>maxmemory: 512mb<br/>requirepass: REDIS_PASSWORD"]
        Traefik["🔄 Traefik v3<br/>:80, :443 (user containers)<br/>:8080 (dashboard)<br/>volumes: docker.sock + acme.json"]
        Worker["🟢 vps-worker :3002<br/>volumes:<br/>docker.sock → Docker SDK<br/>/data/users → NVMe storage"]
    end

    Redis -->|network| Worker
    Traefik -->|network| Worker
    Worker -->|unix socket| Docker["🐳 Docker Socket"]

    style Redis fill:#ffe082
    style Traefik fill:#90caf9
    style Worker fill:#a5d6a7
```

### VPS Heavy Stack

```mermaid
graph TB
    subgraph "vps-heavy/docker-compose.yml"
        Redis2["📦 Redis:7-alpine<br/>:6379 (internal)"]
        Heavy["🔴 vps-heavy :3003<br/>CONCURRENT_JOBS: 3<br/>FFMPEG_TIMEOUT: 300s<br/>PLAYWRIGHT_TIMEOUT: 120s<br/>volumes: /data/users → results"]
        Tools["🎬 Tools installed<br/>ffmpeg · playwright (chromium)<br/>python3 (TTS/STT) · libvips"]
    end

    Redis2 -->|network| Heavy
    Heavy -->|execute| Tools
    Tools -->|write| Store["💾 /data/users/"]

    style Redis2 fill:#ffe082
    style Heavy fill:#ffcc80
```

---

## 14. Version Management

### Update Cycle (~monthly)

```
Week 1: Monitor
  └─ git log origin/main → spot v2026.5.0 released

Week 2: Review
  └─ git diff v2026.4.5..v2026.5.0 → assess breaking changes

Week 3: Build
  ├─ git checkout v2026.5.0
  ├─ docker build worker/ → openclaw-gateway:2026.5.0
  └─ Quick smoke test locally

Week 4: Deploy (low-traffic window)
  ├─ Update OPENCLAW_IMAGE env var on VPS
  └─ Monitor 24h
```

### Upstream Version Update Workflow

```mermaid
graph TB
    Check["📅 Monitor upstream<br/>git log openclaw/main"] -->|Found new version| Review
    Review["📋 Review changes<br/>git diff"] -->|Approved| Build
    Build["🔨 Build image<br/>openclaw-gateway:2026.5.0"] -->|Success| Test
    Test["✅ Test locally"] -->|Pass| Staging
    Staging["🚀 Deploy staging"] -->|OK| Monitor
    Monitor["📊 Monitor 24h"] -->|No issues| Deploy
    Deploy["🟢 Update OPENCLAW_IMAGE<br/>New containers use v2026.5.0"]

    Monitor -->|Failure| Rollback["🔄 Revert env<br/>2026.5.0 → 2026.4.5<br/>Restart affected containers"]

    style Build fill:#ffcc80
    style Deploy fill:#c8e6c9
    style Rollback fill:#ffcdd2
```

**Version checklist:**
```
Pre-Update:
  ☐ Review upstream CHANGELOG
  ☐ Test locally (docker run + curl :3000)
  ☐ Check for breaking changes

During Update:
  ☐ docker build + tag: openclaw-gateway:YYYY.MM.DD
  ☐ Push to registry
  ☐ Update OPENCLAW_IMAGE env var
  ☐ Document in DEPLOY_LOG.md

Post-Update (48h):
  ☐ Monitor logs + container health
  ☐ CPU/Memory usage normal?
  ☐ Verify no data loss
```

---

## 15. Multi-VPS Architecture (Phase 2 — ≤ 10,000 users)

```mermaid
graph TB
    User["👤 User"]
    CF["🌐 Cloudflare<br/>Per-project A records<br/>abc → VPS-1 IP<br/>xyz → VPS-2 IP"]

    subgraph Railway["Railway (Control Plane)"]
        API["🔵 NestJS API"]
        DB["🗄️ PostgreSQL<br/>projects.vps_id<br/>projects.dns_record_id<br/>vps_nodes table"]
        Redis["📦 Redis<br/>Queue: jobs:vps-1<br/>Queue: jobs:vps-2"]
        CFAPI["☁️ Cloudflare API<br/>Create DNS on spawn<br/>Delete DNS on destroy"]
    end

    subgraph VPS1["VPS Worker #1"]
        W1["🟢 vps-worker<br/>VPS_NODE_ID=vps-1<br/>Subscribe: jobs:vps-1"]
        T1["🔄 Traefik"] --> C1["📱 Containers"]
    end

    subgraph VPS2["VPS Worker #2"]
        W2["🟢 vps-worker<br/>VPS_NODE_ID=vps-2<br/>Subscribe: jobs:vps-2"]
        T2["🔄 Traefik"] --> C2["📱 Containers"]
    end

    User -->|abc.openclaw.ai| CF
    CF -->|VPS-1 IP| T1
    API -->|Enqueue jobs:vps-1| Redis
    API -->|Create A record| CFAPI
    W1 -->|Pull jobs:vps-1| Redis
    W2 -->|Pull jobs:vps-2| Redis

    style Railway fill:#e3f2fd
    style VPS1 fill:#f3e5f5
    style VPS2 fill:#e8f5e9
```

---

## 16. High Scale Architecture (Phase 3 — > 10,000 users)

```mermaid
graph TB
    User["👤 User<br/>abc.openclaw.ai"]

    subgraph CF["Cloudflare Edge"]
        Worker["⚡ CF Workers<br/>extract subdomain → KV lookup<br/><1ms routing"]
        KV["🗃️ CF KV Store<br/>abc → vps-1<br/>xyz → vps-3"]
        Tunnel1["🔒 CF Tunnel vps-1"]
        Tunnel3["🔒 CF Tunnel vps-3"]
    end

    subgraph Railway["Railway (Control Plane)"]
        API["🔵 NestJS API<br/>Update KV on spawn/destroy"]
    end

    subgraph Redis_VPS["Redis Sentinel (Dedicated VPS)"]
        RSentinel["🔴 Redis Sentinel<br/>1 Master + 2 Replicas<br/>~$20/mo · ~1ms latency"]
    end

    User -->|*.openclaw.ai| Worker
    Worker -->|KV lookup| KV
    KV -->|abc = vps-1| Tunnel1
    API -->|Update KV| KV
    API -->|Enqueue| RSentinel

    style CF fill:#fff3e0
    style Redis_VPS fill:#ffcdd2
```

### So sánh 3 phases

| Tiêu chí | Phase 1 MVP | Phase 2 Multi-VPS | Phase 3 High Scale |
|---|---|---|---|
| **Users** | ≤ 500 | ≤ 10,000 | > 10,000 |
| **DNS routing** | Wildcard `*` | Per-project A record | CF Workers + KV |
| **Queue** | 1 queue | N queues (per VPS) | N queues (per VPS) |
| **Redis** | Railway managed | Railway managed | Redis Sentinel (dedicated) |
| **Port exposed** | 80/443 | 80/443 | Không (CF Tunnel) |
| **DNS propagation** | Wildcard (instant) | 1-5 min (TTL) | <1ms (KV lookup) |
| **Infra cost/mo** | ~$80 | ~$200-500 | ~$700+ |

---

## 17. API Endpoints Reference

| Category | Endpoint | Mô tả |
|---|---|---|
| **Auth** | POST /api/auth/register | Email + password |
| | POST /api/auth/login | |
| | GET /api/auth/sign-in/google | OAuth redirect |
| **Projects** | GET /api/projects/mine | List user's projects |
| | POST /api/projects | Tạo project (validate plan) |
| | POST /api/projects/:id/start | Manual wake |
| | POST /api/projects/:id/stop | Manual stop |
| | GET /api/projects/:id/health | Status + domain |
| | DELETE /api/projects/:id | Destroy + cleanup |
| **Heavy** | POST /api/heavy/submit | Submit job (quota check cross-project) |
| | GET /api/heavy/status/:jobId | Poll status |
| | GET /api/credits/wallet | `{monthlyBalance, purchasedBalance, monthlyResetAt}` |
| | GET /api/credits/history | Credit transaction history |
| | GET /api/heavy/history | List jobs (filter by projectId) |
| **Internal** | POST /api/internal/status | VPS Worker callback |
| | POST /api/internal/heartbeat | Container activity ping |
| | PUT /api/internal/job/:jobId/result | VPS Heavy callback |

---

## 18. Quick Reference

| Component | Port | Host | Timeout |
|---|---|---|---|
| Backend API | 3001 | Railway | - |
| VPS Worker | 3002 | Contabo | - |
| VPS Heavy | 3003 | Contabo | - |
| Traefik (containers) | 80/443 | VPS Worker | - |
| Container health check | 3000 | User Container | 30s |
| FFmpeg job | - | VPS Heavy | 300s |
| Playwright job | - | VPS Heavy | 120s |
| TTS/STT job | - | VPS Heavy | 120s |

---

*Last updated: 2026-04-27*
