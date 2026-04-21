# OpenClaw SaaS — Architecture Diagrams (Updated)

Updated: April 21, 2026 | Based on actual implementation

---

## 1. System Architecture (Current Implementation)

```mermaid
graph TB
    User["👤 User<br/>(Telegram/Web)"]
    CDN["🌐 Cloudflare<br/>DNS + CDN + DDoS"]
    
    subgraph Railway["Railway (Control Plane) :3001"]
        API["🔵 NestJS API<br/>Port 3001<br/>Projects | Users | Jobs"]
        DB["🗄️ PostgreSQL<br/>projects | users | heavy_jobs"]
        Redis["📦 Redis Managed<br/>container-ops queue<br/>heavy-tasks queue"]
    end
    
    subgraph Worker["VPS Worker (Contabo Ubuntu 22.04)"]
        VPSWorker["🟢 vps-worker :3002<br/>BullMQ Consumer<br/>container-ops"]
        DockerEngine["🐳 Docker Engine<br/>spawn/wake/stop/destroy"]
        Traefik["🔄 Traefik v3 :80/:443<br/>SSL + Routing<br/>*.openclaw.ai"]
        Storage1["💾 /data/users<br/>250GB NVMe<br/>~40-50 containers"]
        
        subgraph Containers["User Containers (isolated)"]
            C1["📱 openclaw-user1<br/>Image: openclaw-gateway<br/>1GB / 0.5vCPU / 4GB"]
            C2["📱 openclaw-user2<br/>..."]
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

## 2. Monorepo Directory Structure

```mermaid
graph TD
    Root["openclaw-saas/"]
    
    Root --> Backend["backend/ <br/>(Railway Control Plane)"]
    Root --> Frontend["frontend/ <br/>(Cloudflare Pages)"]
    Root --> Worker["worker/ <br/>(OpenClaw Gateway)"]
    Root --> VPSWorker["vps-worker/ <br/>(Container Orchestrator)"]
    Root --> VPSHeavy["vps-heavy/ <br/>(Media Processor)"]
    
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

## 3. Queue & Job Flow

```mermaid
sequenceDiagram
    participant User as 👤 User<br/>(Telegram)
    participant API as 🔵 Backend<br/>:3001
    participant Redis as 📦 Redis<br/>Queues
    participant Worker as 🟢 VPS Worker<br/>:3002
    participant Docker as 🐳 Docker
    participant Container as 📱 User<br/>Container
    participant Heavy as 🔴 VPS Heavy<br/>:3003
    participant Storage as 💾 Storage

    Note over API,Heavy: === CONTAINER LIFECYCLE ===
    
    User->>API: POST /api/projects (create)
    API->>Redis: Enqueue {type: 'spawn', userId, plan}
    API-->>User: {projectId, domain}
    
    Worker->>Redis: Pull container-ops job
    Worker->>Docker: docker.createContainer(openclaw-gateway)
    Docker->>Storage: mkdir /data/users/{userId}
    Docker->>Container: docker start
    Container->>Container: Health check :3000
    
    Worker->>API: PUT /api/internal/status {status: running}
    API->>API: project.status = 'running'
    
    Note over User,API: === HEAVY JOB SUBMISSION ===
    
    Container->>API: POST /api/heavy/submit {tool: ffmpeg}
    API->>API: Check quota (3/day free)
    API->>Redis: Enqueue {type: 'ffmpeg', jobId, params}
    API-->>Container: {jobId, estimatedTime}
    
    Note over Heavy,Storage: === HEAVY PROCESSING ===
    
    Heavy->>Redis: Pull heavy-tasks job
    Heavy->>Heavy: Download input (if URL)
    Heavy->>Heavy: Process (FFmpeg/Playwright/TTS/STT)
    Heavy->>Storage: Save result /data/users/{userId}/heavy-tasks/
    Heavy->>API: PUT /api/internal/job/{jobId}/result {resultPath}
    
    API->>API: heavy_jobs.status = 'done'
    Container->>API: GET /api/heavy/status/{jobId}
    API-->>Container: {status: done, resultPath}
    Container->>Storage: Download result
```

---

## 4. Container Spawn Detailed Flow

```mermaid
flowchart TD
    A["Backend API<br/>POST /api/projects"] --> B["Check quota<br/>Free: 1 project"]
    B --> C["Enqueue spawn job<br/>container-ops queue"]
    C --> D["Return projectId<br/>+ domain"]
    
    E["VPS Worker<br/>BullMQ processor"] --> F["Pull spawn job<br/>from Redis"]
    F --> G["Parse: userId, plan,<br/>projectId"]
    
    G --> H["Check quota:<br/>Free=1GB<br/>Pro=2GB"]
    
    H --> I["docker.createContainer<br/>openclaw-gateway:2026.4.5"]
    
    I --> J["Set resource limits<br/>memory, cpu quota"]
    
    J --> K["Set Traefik labels<br/>for routing<br/>openclaw-{userId}..."]
    
    K --> L["mkdir /data/users/{userId}"]
    
    L --> M["docker start"]
    
    M --> N["Wait container healthy<br/>GET :3000/health<br/>timeout 30s"]
    
    N --> O{Healthy?}
    
    O -->|Yes| P["PUT /api/internal/status<br/>{status: running,<br/>containerName}"]
    
    O -->|No| Q["PUT /api/internal/status<br/>{status: error,<br/>reason: timeout}"]
    
    P --> R["Update project<br/>status=running"]
    Q --> S["Update project<br/>status=error"]
    
    R --> T["User can access<br/>user1.openclaw.ai"]
    
    style A fill:#e3f2fd
    style E fill:#e8f5e9
    style P fill:#c8e6c9
    style Q fill:#ffcdd2
```

---

## 5. Heavy Job Processing Detailed Flow

```mermaid
flowchart TD
    A["Container<br/>POST /api/heavy/submit<br/>{tool: ffmpeg, params}"] --> B["Backend checks:<br/>Quota OK?<br/>Storage OK?"]
    
    B --> C{Both OK?}
    C -->|No| D["❌ Error 429/507"]
    C -->|Yes| E["✅ Enqueue heavy-tasks"]
    
    E --> F["Return jobId<br/>estimatedTime"]
    
    G["VPS Heavy<br/>BullMQ processor"] --> H["Pull heavy-tasks job"]
    H --> I["Validate tool type<br/>& params"]
    
    I --> J{Tool?}
    
    J -->|ffmpeg| K["ffmpeg.tool.process<br/>convert format/encode"]
    J -->|playwright| L["playwright.tool.capture<br/>screenshot or PDF"]
    J -->|tts| M["tts.tool.synthesize<br/>Google/ElevenLabs API"]
    J -->|stt| N["stt.tool.transcribe<br/>OpenAI/Deepgram API"]
    
    K --> O["Save output<br/>/data/users/{userId}<br/>/heavy-tasks/"]
    L --> O
    M --> O
    N --> O
    
    O --> P["Calculate SHA256<br/>checksum"]
    
    P --> Q["Check quota:<br/>4GB per user<br/>30-day TTL"]
    
    Q --> R{Quota OK?}
    
    R -->|Yes| S["PUT /api/internal/job/{jobId}/result<br/>{status: done,<br/>resultPath, size,<br/>checksum}"]
    
    R -->|No| T["Clean old files<br/>Try again"]
    
    S --> U["Update heavy_jobs<br/>status=done<br/>result_path set"]
    
    U --> V["Container polls<br/>GET /api/heavy/status/{jobId}"]
    V --> W["Returns done +<br/>resultPath"]
    
    W --> X["Download result<br/>GET /storage/..."]
    
    style A fill:#fff9c4
    style G fill:#fff3e0
    style S fill:#c8e6c9
    style T fill:#ffcdd2
```

---

## 6. vps-worker Docker Compose Stack

```mermaid
graph TB
    subgraph "vps-worker/docker-compose.yml"
        Redis["📦 Redis:7-alpine<br/>:6379 (internal)<br/>maxmemory: 512mb<br/>requirepass: REDIS_PASSWORD"]
        
        Traefik["🔄 Traefik v3<br/>:80, :443 (user containers)<br/>:8080 (dashboard)<br/>volumes:<br/>docker.sock<br/>acme.json"]
        
        Worker["🟢 vps-worker service<br/>port :3002 (health check)<br/>volumes:<br/>docker.sock → Docker SDK<br/>/data/users → NVMe storage<br/>depends_on: [redis]"]
        
        Docker["🐳 Docker Socket<br/>/var/run/docker.sock<br/>(host Docker daemon)"]
    end
    
    subgraph "Host System"
        Store["💾 Host Storage<br/>/data/users/<br/>(250GB NVMe)"]
        Host["Ubuntu 22.04 Host<br/>Contabo VPS<br/>12vCPU / 48GB RAM"]
    end
    
    Redis -->|network| Worker
    Traefik -->|network| Worker
    Worker -->|unix socket| Docker
    Docker -->|bind mount| Store
    Traefik -->|bind mount| Store
    
    Host -.->|Runs| Redis
    Host -.->|Runs| Traefik
    Host -.->|Runs| Worker
    
    style Redis fill:#ffe082
    style Traefik fill:#90caf9
    style Worker fill:#a5d6a7
    style Docker fill:#ffab91
```

---

## 7. vps-heavy Docker Compose Stack

```mermaid
graph TB
    subgraph "vps-heavy/docker-compose.yml"
        Redis2["📦 Redis:7-alpine<br/>:6379 (internal)<br/>maxmemory: 512mb"]
        
        Heavy["🔴 vps-heavy service<br/>port :3003 (health check)<br/>CONCURRENT_JOBS: 3<br/>FFMPEG_TIMEOUT: 300s<br/>PLAYWRIGHT_TIMEOUT: 120s<br/>volumes:<br/>/data/users → results<br/>depends_on: [redis]"]
        
        Tools["🎬 Installed tools<br/>ffmpeg (video/audio)<br/>playwright (chromium)<br/>python3 (TTS/STT)<br/>libvips (image ops)"]
    end
    
    subgraph "Host System"
        Store2["💾 Host Storage<br/>/data/users/...<br/>/heavy-tasks/<br/>(shared NFS or local)"]
        Host2["Ubuntu 22.04 Host<br/>Contabo VPS<br/>12vCPU / 48GB RAM"]
    end
    
    Redis2 -->|network| Heavy
    Heavy -->|execute| Tools
    Tools -->|write| Store2
    Heavy -->|write| Store2
    
    Host2 -.->|Runs| Redis2
    Host2 -.->|Runs| Heavy
    
    style Redis2 fill:#ffe082
    style Heavy fill:#ffcc80
    style Tools fill:#ffab91
```

---

## 8. API Endpoints Reference

```mermaid
graph LR
    subgraph "Backend API :3001"
        A["🔵 Control Plane<br/>(Railway)"]
    end
    
    subgraph "Public Endpoints"
        P1["POST /api/projects<br/>→ Queue spawn job"]
        P2["GET /api/projects/:id<br/>→ Get project status"]
        P3["POST /api/heavy/submit<br/>→ Queue heavy job"]
        P4["GET /api/heavy/status/:jobId<br/>→ Check job status"]
        P5["GET /storage/heavy-tasks/:path<br/>→ Download result"]
    end
    
    subgraph "Internal Webhook Endpoints"
        I1["PUT /api/internal/status<br/>← VPS Worker callback<br/>payload: {status, containerName}"]
        I2["PUT /api/internal/job/:jobId/result<br/>← VPS Heavy callback<br/>payload: {status, resultPath, size}"]
    end
    
    A --> P1
    A --> P2
    A --> P3
    A --> P4
    A --> P5
    
    A --> I1
    A --> I2
    
    Worker["🟢 VPS Worker"] -.->|Auth: Bearer| I1
    Heavy["🔴 VPS Heavy"] -.->|Auth: Bearer| I2
    
    style A fill:#e3f2fd
    style P1 fill:#c8e6c9
    style P2 fill:#c8e6c9
    style P3 fill:#c8e6c9
    style P4 fill:#c8e6c9
    style P5 fill:#c8e6c9
    style I1 fill:#bbdefb
    style I2 fill:#bbdefb
```

---

## 9. Job Payload Schemas

```mermaid
graph TD
    subgraph "container-ops Queue"
        S1["spawn:<br/>{<br/>  userId: string<br/>  projectId: string<br/>  plan: free|pro<br/>  imageTag: 2026.4.5<br/>}"]
        
        S2["wake:<br/>{<br/>  userId: string<br/>  projectId: string<br/>}"]
        
        S3["stop:<br/>{<br/>  userId: string<br/>  projectId: string<br/>}"]
        
        S4["destroy:<br/>{<br/>  userId: string<br/>  projectId: string<br/>}"]
    end
    
    subgraph "heavy-tasks Queue"
        H1["ffmpeg:<br/>{<br/>  jobId: string<br/>  userId: string<br/>  tool: ffmpeg<br/>  params: {<br/>    inputUrl?: string<br/>    format: mp4|webm|avi<br/>    quality: low|med|high<br/>    codec?: h264|vp9<br/>  }<br/>}"]
        
        H2["playwright:<br/>{<br/>  jobId: string<br/>  userId: string<br/>  tool: playwright<br/>  params: {<br/>    url?: string<br/>    html?: string<br/>    format: png|pdf<br/>    viewport: {w, h}<br/>  }<br/>}"]
        
        H3["tts:<br/>{<br/>  jobId: string<br/>  userId: string<br/>  tool: tts<br/>  params: {<br/>    text: string<br/>    voice: en|vi<br/>    provider: google|elevenlabs<br/>  }<br/>}"]
        
        H4["stt:<br/>{<br/>  jobId: string<br/>  userId: string<br/>  tool: stt<br/>  params: {<br/>    inputUrl: string<br/>    language: en|vi<br/>    provider: openai|deepgram<br/>  }<br/>}"]
    end
    
    style S1 fill:#c8e6c9
    style S2 fill:#c8e6c9
    style S3 fill:#c8e6c9
    style S4 fill:#c8e6c9
    
    style H1 fill:#fff9c4
    style H2 fill:#fff9c4
    style H3 fill:#fff9c4
    style H4 fill:#fff9c4
```

---

## 10. Storage Architecture

```mermaid
graph TB
    subgraph "VPS Worker"
        Root1["/data/users/"]
        User1["user1/"]
        User2["user2/"]
        
        U1State["sqlite/<br/>messages, sessions<br/>~100MB"]
        U1Config["config/<br/>bot tokens, keys<br/>~5MB"]
        U1Heavy["heavy-tasks/<br/>video/image results<br/>~3GB (4GB quota)"]
    end
    
    subgraph "VPS Heavy"
        Root2["/data/users/"]
        UserH1["user1/"]
        UserH2["user2/"]
        
        UH1Jobs["heavy-tasks/<br/>job_xyz_2026-04-21.mp4<br/>job_abc_2026-04-21.png<br/>job_def_2026-04-21.txt"]
    end
    
    Root1 --> User1
    Root1 --> User2
    
    User1 --> U1State
    User1 --> U1Config
    User1 --> U1Heavy
    
    Root2 --> UserH1
    Root2 --> UserH2
    
    UserH1 --> UH1Jobs
    
    Note["⏱️ Results auto-expire<br/>30 days (configurable)<br/>Quota: 4GB per user<br/>On quota exceed:<br/>- Auto-delete oldest<br/>- Or error 507"]
    
    style Root1 fill:#f1f8e9
    style Root2 fill:#fff3e0
    style U1Heavy fill:#c8e6c9
    style UH1Jobs fill:#ffcc80
```

---

## 11. Deployment Timeline

```mermaid
timeline
    title MVP → Production Pipeline
    
    section Phase 1: Dev
    Local Test : vps-worker dev mode :3002
           : vps-heavy dev mode :3003
           : Manual job queueing via Redis CLI
           : All on localhost
    
    section Phase 2: Docker Build
    Build Worker : docker build vps-worker/
                 : tag: openclaw-worker:2026.4.5
    Build Heavy  : docker build vps-heavy/
                 : tag: openclaw-heavy:2026.4.5
    Build Gateway: docker build worker/
                 : tag: openclaw-gateway:2026.4.5
    
    section Phase 3: Staging
    Deploy Worker : docker-compose up (staging)
    Deploy Heavy  : docker-compose up (staging)
    Deploy API    : Railway push (staging)
    Test Full Flow: POST /api/projects → container spawn
                  : POST /api/heavy/submit → ffmpeg
    
    section Phase 4: Production
    Prod Worker   : Deploy to Contabo VPS Worker
    Prod Heavy    : Deploy to Contabo VPS Heavy
    Prod API      : Railway production
    Monitor       : Health checks every 30s
                  : Log aggregation (ELK or Grafana)
                  : On-call alerts (pagerduty)
```

---

## 12. Container Resource Limits

```mermaid
graph TB
    subgraph "Free Plan"
        F["1 project<br/>1GB RAM<br/>0.5 vCPU<br/>4GB storage<br/>3 heavy/day"]
    end
    
    subgraph "Pro Plan"
        P["3 projects<br/>2GB RAM<br/>1.0 vCPU<br/>8GB storage<br/>10 heavy/day"]
    end
    
    subgraph "Business Plan"
        B["Unlimited<br/>4GB RAM<br/>2.0 vCPU<br/>20GB storage<br/>50 heavy/day"]
    end
    
    subgraph "Implementation"
        Impl["vps-worker/docker/docker.service.ts<br/>createContainer({<br/>  MemoryLimit: 1GB|2GB|4GB<br/>  CpuQuota: 50000|100000|200000<br/>  HostConfig.Binds: volumes<br/>})"]
    end
    
    F --> Impl
    P --> Impl
    B --> Impl
    
    style F fill:#c8e6c9
    style P fill:#bbdefb
    style B fill:#fff9c4
```

---

## Quick Reference Table

| Component | Port | Host | Timeout | Status |
|-----------|------|------|---------|--------|
| Backend API | 3001 | Railway | - | ✅ Done |
| VPS Worker | 3002 | Contabo | - | ✅ Impl |
| VPS Heavy | 3003 | Contabo | - | ✅ Impl |
| Traefik (user containers) | 80/443 | VPS Worker | - | ✅ Impl |
| Redis (worker) | 6379 | Localhost | - | ✅ Setup |
| Redis (heavy) | 6379 | Localhost | - | ✅ Setup |
| FFmpeg timeout | - | VPS Heavy | 300s | ✅ Config |
| Playwright timeout | - | VPS Heavy | 120s | ✅ Config |
| Container health check | 3000 | User Container | 30s | ✅ Impl |

---

## Status: ARCHITECTURE_DIAGRAMS.md

✅ **Diagrams are mostly accurate** for:
- System architecture (components, connections)
- Queue structure (container-ops, heavy-tasks)
- API endpoints

⚠️ **Need updates for:**
- [x] Actual port numbers (3001, 3002, 3003)
- [x] Queue names (container-ops, heavy-tasks)
- [x] Storage paths (/data/users, /data/users/.../heavy-tasks/)
- [x] Docker-compose stacks details
- [x] Timeout values (FFmpeg 300s, Playwright 120s)
- [x] Job payload schemas
- [x] Monorepo structure diagram

**This file has been updated ✅ on April 21, 2026**

---

## 13. Upstream Version Update Workflow

```mermaid
graph TB
    subgraph "Month 1"
        Check["📅 Week 1<br/>Monitor upstream<br/>git log openclaw/main"]
        Review["📋 Week 2<br/>Review changes<br/>git diff v2026.4.5..v2026.5.0"]
        Build["🔨 Week 3<br/>Build new image<br/>docker build worker/<br/>→ openclaw-gateway:2026.5.0"]
    end
    
    subgraph "Month 2"
        Test["✅ Week 3<br/>Test locally<br/>docker run + curl :3000"]
        Staging["🚀 Week 4<br/>Deploy to staging<br/>vps-worker-staging"]
        Monitor["📊 Week 4<br/>Monitor 24h<br/>Check logs + metrics"]
    end
    
    subgraph "Month 3"
        Update["🔄 Update env<br/>OPENCLAW_IMAGE:<br/>2026.4.5 → 2026.5.0"]
        Deploy["🟢 Deploy production<br/>New containers use v2026.5.0"]
        RollingWait["⏱️ Wait 48h<br/>Keep old containers running<br/>New spawns = v2026.5.0"]
    end
    
    Check -->|Found v2026.5.0| Review
    Review -->|Approved| Build
    Build -->|Success| Test
    Test -->|Pass| Staging
    Staging -->|OK| Monitor
    Monitor -->|No issues| Update
    
    Update --> Deploy
    Deploy --> RollingWait
    
    subgraph "Rollback (if issue)"
        Issue["⚠️ Issue detected<br/>in v2026.5.0"]
        RollbackEnv["🔄 Revert env<br/>2026.5.0 → 2026.4.5"]
        RollbackContainers["🟢 Restart affected<br/>containers with old image"]
        PostMortem["📝 Post-mortem<br/>Fix issue in upstream"]
    end
    
    Monitor -->|Failure| Issue
    Issue --> RollbackEnv
    RollbackEnv --> RollbackContainers
    RollbackContainers --> PostMortem
    
    style Check fill:#fff9c4
    style Review fill:#fff9c4
    style Build fill:#ffcc80
    style Test fill:#ffab91
    style Staging fill:#ef9a9a
    style Monitor fill:#f48fb1
    style Update fill:#ce93d8
    style Deploy fill:#c8e6c9
    style RollingWait fill:#a5d6a7
    style Issue fill:#ffcdd2
    style RollbackEnv fill:#ffcdd2
    style RollbackContainers fill:#ef9a9a
    style PostMortem fill:#bbdefb
```

### Version Update Checklist:

```
Pre-Update:
☐ Review upstream CHANGELOG
☐ Test locally (docker run)
☐ Check for breaking changes
☐ Update dependencies if needed

During Update:
☐ Build new Docker image
☐ Tag: openclaw-gateway:YYYY.MM.DD
☐ Push to registry
☐ Update docker-compose.yml / env var
☐ Document changes in DEPLOY_LOG.md

Post-Update (First 48h):
☐ Monitor application logs
☐ Check container health metrics
☐ Monitor user reports (Slack/email)
☐ Verify no data loss
☐ CPU/Memory usage normal?

If Issue Found:
☐ Revert OPENCLAW_IMAGE env var
☐ Restart containers (they pull old image)
☐ Verify users can access
☐ Post-mortem: what went wrong?
☐ Coordinate with upstream for fix
```

---

## 14. Image Versioning Strategy

```mermaid
graph TD
    subgraph "Versioning Scheme"
        Upstream["openclaw (upstream)<br/>v2026.5.0<br/>v2026.6.0<br/>v2026.7.0"]
        
        Gateway["openclaw-gateway<br/>(Docker image)<br/>2026.5.0<br/>2026.6.0<br/>2026.7.0"]
        
        Note1["Matches upstream version<br/>Easy tracking<br/>One-to-one mapping"]
    end
    
    subgraph "Current & Previous"
        Current["CURRENT (prod)<br/>openclaw-gateway:2026.5.0<br/>OPENCLAW_IMAGE=2026.5.0"]
        
        Previous["PREVIOUS (fallback)<br/>openclaw-gateway:2026.4.5<br/>Kept in registry<br/>30 days retention"]
        
        Old["OLD (cleanup)<br/>openclaw-gateway:2026.3.0<br/>Deleted after<br/>30 days"]
    end
    
    subgraph "Docker Compose Config"
        Env["vps-worker/docker-compose.yml<br/>environment:<br/>  OPENCLAW_IMAGE=2026.5.0<br/>  # Change this to deploy new version"]
    end
    
    Upstream --> Gateway
    Gateway --> Note1
    Current --> Env
    Previous --> Current
    Old -.->|deleted| Previous
    
    style Upstream fill:#fff9c4
    style Gateway fill:#ffcc80
    style Current fill:#c8e6c9
    style Previous fill:#bbdefb
    style Old fill:#ccc
    style Env fill:#e8f5e9
```

---

Generated by: claude-code | Last updated: April 21, 2026
