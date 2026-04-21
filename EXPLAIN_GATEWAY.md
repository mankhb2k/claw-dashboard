# OpenClaw Gateway Architecture Explained (ELI5)

**Simplified guide to understand: worker, vps-worker, vps-heavy, and backend communication**

---

## The Big Picture (Dễ hiểu nhất)

Imagine a restaurant:

```mermaid
graph TB
    Backend["🏢 Railway Backend<br/>(Control Center)<br/>- Takes orders<br/>- Manages reservations<br/>- Tracks progress"]
    
    Worker["👨‍🍳 Worker/Gateway<br/>(Chef in Kitchen)<br/>- Runs INSIDE container<br/>- Prepares food<br/>- Own workspace<br/>- One per customer"]
    
    VPSWorker["🚚 VPS Worker<br/>(Manager)<br/>- Manages kitchens<br/>- Opens/closes<br/>- Monitors health<br/>- Reports status"]
    
    VPSHeavy["🍳 VPS Heavy<br/>(Special Equipment)<br/>- Heavy machinery<br/>- Expensive ops<br/>- Separate<br/>- Processes bulk"]
    
    Backend -->|Orders jobs| VPSWorker
    Backend -->|Orders jobs| VPSHeavy
    VPSWorker -->|Spawns| Worker
    VPSWorker -->|Reports| Backend
    VPSHeavy -->|Reports| Backend
    
    style Backend fill:#e3f2fd
    style Worker fill:#fff9c4
    style VPSWorker fill:#c8e6c9
    style VPSHeavy fill:#ffe0b2
```

---

## Real Architecture Mapping

```mermaid
graph TB
    User["🍽️ Customer (You)"]
    
    subgraph Backend["🏢 Railway Backend :3001"]
        API["API endpoints"]
        DB["PostgreSQL<br/>(orders)"]
        Redis["Redis<br/>(queues)"]
    end
    
    subgraph Queue["📦 Redis Queues"]
        ContainerOps["container-ops<br/>(spawn/stop)"]
        HeavyTasks["heavy-tasks<br/>(bulk jobs)"]
    end
    
    subgraph VPSWorker["👨‍💼 VPS Worker :3002 (Contabo)"]
        BullMQ1["BullMQ Consumer"]
        Docker["Docker SDK"]
        Containers["40-50 Containers<br/>openclaw-user-*:3000"]
        Traefik["Traefik<br/>(routing)"]
        Storage1["/data/users/"]
    end
    
    subgraph VPSHeavy["🍳 VPS Heavy :3003 (Contabo)"]
        BullMQ2["BullMQ Consumer"]
        FFmpeg["FFmpeg<br/>(video)"]
        Playwright["Playwright<br/>(screenshots)"]
        TTS["TTS/STT<br/>(audio)"]
        Storage2["/data/users/.../heavy-tasks/"]
    end
    
    User -->|HTTPS| API
    API --> Redis
    Redis --> ContainerOps
    Redis --> HeavyTasks
    
    ContainerOps --> BullMQ1
    HeavyTasks --> BullMQ2
    
    BullMQ1 --> Docker
    Docker --> Containers
    Containers --> Traefik
    Containers --> Storage1
    
    BullMQ2 --> FFmpeg
    BullMQ2 --> Playwright
    BullMQ2 --> TTS
    FFmpeg --> Storage2
    Playwright --> Storage2
    TTS --> Storage2
    
    BullMQ1 -->|PUT /api/internal/status| API
    BullMQ2 -->|PUT /api/internal/job/:id/result| API
    
    style Backend fill:#e3f2fd
    style Queue fill:#fff9c4
    style VPSWorker fill:#c8e6c9
    style VPSHeavy fill:#ffe0b2
```

---

## Three Services Explained

### 1. 👨‍🍳 WORKER (Gateway Application)

**What it is:**
- OpenClaw gateway app that runs INSIDE user containers
- Provided by upstream OpenClaw project
- Not built by us, we just pull upstream updates

**Where it lives:**
```
worker/src/          ← Source code from upstream
  ├─ gateway/        ← HTTP server
  ├─ channels/       ← Telegram, Discord, etc integrations
  ├─ agents/         ← AI logic
  └─ ...
  
↓ docker build worker/
↓ (creates image)

📦 Docker Image Registry
   openclaw-gateway:2026.4.5
   (1.2GB, ready to run)
```

**What it does (at runtime):**
```
User sends message via Telegram
  ↓
Message reaches backend
  ↓
Backend routes to container via Traefik
  ↓
👨‍🍳 Gateway app processes message
  ├─ Parse intent
  ├─ Call AI models
  ├─ Generate response
  └─ Save to SQLite
  ↓
Response sent back to user
```

**Environment:**
```
Gateway container runs at :3000
Port :3000 (internal, inside container)
  ↓ NOT accessible directly
  ↓ Only via Traefik routing (user1.openclaw.ai → container:3000)
```

**Database:**
```
Each container has own SQLite at:
/data/users/{userId}/db/messages.db
  ├─ User messages history
  ├─ Sessions
  ├─ Config
  └─ Isolated from other users ✅
```

**Control-UI Dashboard:**
```
Gateway also serves the web dashboard
GET user1.openclaw.ai/
  ↓
Gateway serves /vendor/control-ui/ (static files)
  ├─ index.html (built by Vite)
  ├─ src/main.ts (JS app)
  └─ ...assets
  ↓
Browser runs control-ui (frontend)
  ↓
control-ui calls /api/* endpoints
  ↓
Gateway processes requests
```

---

### 2. 🟢 VPS-WORKER (Container Orchestrator)

**What it is:**
- Service that MANAGES containers
- Runs on Contabo VPS Worker (12vCPU, 48GB RAM)
- Our code (not upstream)
- Listens to Redis queue for container operations

**What it does:**

#### A. Spawn (Create Container)

```mermaid
flowchart TD
    A["User: POST /api/projects"] --> B["Backend: Enqueue spawn job"]
    B --> C["vps-worker: Pull from Redis"]
    C --> D["docker.createContainer<br/>Image: openclaw-gateway:2026.4.5<br/>memory: 1GB, cpuQuota: 50000"]
    D --> E["mkdir /data/users/user-abc"]
    E --> F["docker.start()"]
    F --> G["Wait :3000/health OK"]
    G --> H["Backend: status = running"]
    H --> I["✅ User can access<br/>user-abc.openclaw.ai"]
    
    style A fill:#e3f2fd
    style B fill:#bbdefb
    style H fill:#c8e6c9
    style I fill:#a5d6a7
```

#### B. Wake (Start Stopped Container)

```mermaid
flowchart TD
    A["User: POST /api/projects/{id}/start"] --> B["Backend: Enqueue wake job"]
    B --> C["vps-worker: Pull from Redis"]
    C --> D["docker.getContainer<br/>openclaw-user-abc"]
    D --> E["container.start()"]
    E --> F["Wait for healthy"]
    F --> G["Backend: status = running"]
    
    style A fill:#e3f2fd
    style G fill:#c8e6c9
```

#### C. Stop (Graceful Shutdown)

```mermaid
flowchart TD
    A["Idle timeout triggered"] --> B["Backend: Enqueue stop job"]
    B --> C["vps-worker: Pull from Redis"]
    C --> D["container.stop{t: 10}"]
    D --> E{Stopped?}
    E -->|Yes| F["Save logs"]
    E -->|No| G["Send SIGKILL"]
    G --> F
    F --> H["Preserve /data/users/{userId}"]
    H --> I["Backend: status = stopped"]
    I --> J["✅ User: 'Your project sleeping'"]
    
    style A fill:#fff9c4
    style I fill:#ffcdd2
    style J fill:#ffb74d
```

#### D. Destroy (Delete Container)

```mermaid
flowchart TD
    A["User: DELETE /api/projects/{id}"] --> B["Backend: Enqueue destroy job"]
    B --> C["vps-worker: Pull from Redis"]
    C --> D["container.stop{t: 5}"]
    D --> E["container.remove{force: true}"]
    E --> F["fs.rm(/data/users/{userId})"]
    F --> G["Delete all data"]
    G --> H["Backend: status = destroyed"]
    H --> I["✅ Project gone"]
    
    style A fill:#e3f2fd
    style F fill:#ffcdd2
    style I fill:#c8e6c9
```

**Network Architecture:**

```mermaid
graph TB
    subgraph Traefik["🔄 Traefik :80/:443"]
        HTTP["Port :80<br/>(HTTP)"]
        HTTPS["Port :443<br/>(HTTPS + LetsEncrypt)"]
    end
    
    HTTP --> Routing["Read Docker Labels<br/>Match Host header"]
    HTTPS --> Routing
    
    Routing -->|Host: abc.*| C1["📱 openclaw-user-abc:3000"]
    Routing -->|Host: def.*| C2["📱 openclaw-user-def:3000"]
    Routing -->|Host: xyz.*| C3["📱 openclaw-user-xyz:3000"]
    
    style Traefik fill:#90caf9
    style C1 fill:#a5d6a7
    style C2 fill:#a5d6a7
    style C3 fill:#a5d6a7
```

**Storage:**

```mermaid
graph TB
    Root["/data/users/"]
    
    Root --> U1["user-abc/"]
    Root --> U2["user-def/"]
    Root --> U3["..."]
    
    U1 --> U1DB["db/messages.db"]
    U1 --> U1Config["config/"]
    U1 --> U1Heavy["heavy-tasks/<br/>video_*.mp4<br/>screenshot_*.png"]
    
    U2 --> U2DB["db/messages.db"]
    U2 --> U2Config["config/"]
    U2 --> U2Heavy["heavy-tasks/"]
    
    Info["Total: 250GB NVMe<br/>Per user: 4GB quota<br/>Cleanup: 30 days TTL"]
    
    style Root fill:#f1f8e9
    style U1 fill:#c8e6c9
    style U2 fill:#c8e6c9
    style Info fill:#fff9c4
```

---

### 3. 🔴 VPS-HEAVY (Expensive Processor)

**What it is:**
- Separate service for CPU-intensive tasks
- Runs on Contabo VPS Heavy (12vCPU, 48GB RAM)
- Our code (not upstream)
- Listens to Redis queue for heavy-tasks

**What it does:**

```mermaid
flowchart TD
    A["User Container<br/>POST /api/heavy/submit<br/>tool: ffmpeg"]
    
    B["Backend validates"]
    B1["Check: Quota OK?"]
    B2["Check: Storage 4GB?"]
    
    C["Enqueue heavy-tasks job"]
    
    D["vps-heavy: Pull from Redis"]
    
    E{Tool type?}
    
    F["ffmpeg:<br/>Download input<br/>ffmpeg -i ...<br/>Wait 300s<br/>Save .mp4<br/>Calculate checksum"]
    
    G["playwright:<br/>Launch Chromium<br/>Navigate URL<br/>Screenshot/PDF<br/>Wait 120s<br/>Save .png<br/>Close browser"]
    
    H["tts:<br/>Call API or stub<br/>Generate WAV<br/>Save"]
    
    I["stt:<br/>Call API or stub<br/>Transcribe<br/>Save"]
    
    J["PUT /api/internal/job/{jobId}/result<br/>status: done<br/>resultPath<br/>size, checksum"]
    
    K["Backend updates DB<br/>heavy_jobs.status = done"]
    
    L["User polls<br/>GET /api/heavy/status/{jobId}"]
    
    M["User downloads<br/>GET /storage/..."]
    
    N["✅ File downloaded"]
    
    A --> B
    B --> B1
    B --> B2
    B1 --> C
    B2 --> C
    C --> D
    D --> E
    
    E -->|ffmpeg| F
    E -->|playwright| G
    E -->|tts| H
    E -->|stt| I
    
    F --> J
    G --> J
    H --> J
    I --> J
    
    J --> K
    K --> L
    L --> M
    M --> N
    
    style A fill:#fff9c4
    style B fill:#bbdefb
    style K fill:#c8e6c9
    style N fill:#a5d6a7
```

**Concurrency:**
```
Max 3 concurrent jobs (configurable)
Each job gets timeout:
  FFmpeg: 300s (5 min)
  Playwright: 120s (2 min)
  TTS: 120s (2 min)
  STT: 300s (5 min)

If job times out:
  ├─ Process killed
  ├─ Callback: {status: 'failed', error: 'timeout'}
  └─ User can retry (counts toward quota)
```

---

## Communication Flow (Complete)

### Scenario: User Creates Project

```mermaid
sequenceDiagram
    participant User
    participant Backend as 🏢 Backend API
    participant Redis as 📦 Redis Queue
    participant VPSWorker as 🟢 vps-worker
    participant Docker as 🐳 Docker
    
    User->>Backend: POST /api/projects<br/>{name: "My Bot", plan: "free"}
    
    Backend->>Backend: Check quota<br/>Create project (creating)
    
    Backend->>Redis: Enqueue spawn job<br/>{type: spawn, userId, plan}
    
    Backend-->>User: {projectId, domain}
    
    VPSWorker->>Redis: Pull spawn job
    VPSWorker->>Docker: docker.createContainer<br/>Image: openclaw-gateway:2026.4.5
    Docker->>Docker: mkdir /data/users/user-abc
    VPSWorker->>Docker: docker.start()
    VPSWorker->>Docker: Wait :3000/health → OK
    
    VPSWorker->>Backend: PUT /api/internal/status<br/>{status: running}
    
    Backend->>Backend: Update: status = running
    
    User->>User: ✅ Can now visit<br/>abc.openclaw.ai
```

### Scenario: User Submits Heavy Job

```mermaid
sequenceDiagram
    participant User as 👤 User<br/>in Gateway
    participant Backend as 🏢 Backend API
    participant Redis as 📦 Redis Queue
    participant VPSHeavy as 🔴 vps-heavy
    participant Storage as 💾 Storage
    
    User->>Backend: POST /api/heavy/submit<br/>{tool: ffmpeg}
    
    Backend->>Backend: Check quota (3/day)<br/>Check storage (4GB)
    
    Backend->>Redis: Enqueue heavy-tasks<br/>{jobId, tool, params}
    
    Backend-->>User: {jobId, estimatedTime}
    
    VPSHeavy->>Redis: Pull job
    VPSHeavy->>VPSHeavy: Validate params
    VPSHeavy->>VPSHeavy: Download input
    VPSHeavy->>VPSHeavy: ffmpeg -i input...<br/>Wait 300s
    VPSHeavy->>Storage: Save result<br/>job_123.mp4
    VPSHeavy->>VPSHeavy: Calculate SHA256
    
    VPSHeavy->>Backend: PUT /api/internal/job/{id}/result<br/>{status: done, path, size}
    
    Backend->>Backend: Update: status = done
    
    User->>Backend: GET /api/heavy/status/{jobId}
    Backend-->>User: {status: done, path}
    
    User->>Storage: GET /storage/job_123.mp4
    Storage-->>User: ✅ File downloaded
```

---

## Key Separation of Concerns

```mermaid
graph TB
    subgraph Backend["🏢 Backend (Railway)"]
        B1["API endpoints<br/>(user-facing)"]
        B2["Job queueing<br/>(Redis)"]
        B3["Database<br/>(PostgreSQL)"]
        B4["User auth"]
        B5["Quota tracking"]
    end
    
    subgraph Gateway["👨‍🍳 Gateway (worker/)"]
        G1["Message processing"]
        G2["AI logic"]
        G3["Channel integrations<br/>(Telegram, etc)"]
        G4["User workspace"]
        G5["SQLite per-user"]
    end
    
    subgraph VPSWorker["⚙️ vps-worker"]
        W1["Container lifecycle"]
        W2["Docker management"]
        W3["Traefik routing"]
        W4["Health checks"]
        W5["Callback reporting"]
    end
    
    subgraph VPSHeavy["🔧 vps-heavy"]
        H1["FFmpeg processing"]
        H2["Playwright automation"]
        H3["TTS/STT execution"]
        H4["Timeout management"]
        H5["Result storage"]
    end
    
    Backend --> VPSWorker
    Backend --> VPSHeavy
    VPSWorker --> Gateway
    
    style Backend fill:#e3f2fd
    style Gateway fill:#fff9c4
    style VPSWorker fill:#c8e6c9
    style VPSHeavy fill:#ffe0b2
```

---

## Important: They Don't Import Each Other

```
❌ WRONG:
vps-worker/package.json imports worker/src
vps-heavy/package.json imports vps-worker/src

✅ RIGHT:
worker/     → built to Docker image (independent)
vps-worker  → references image by NAME only
vps-heavy   → standalone service
backend     → manages all via queues

Communication: Redis queues + HTTP webhooks only!
```

---

## Summary Table

| Component | Runs On | Language | Purpose | Talks To |
|-----------|---------|----------|---------|----------|
| **worker** | User Container | TypeScript | Process messages | Backend (API calls) |
| **vps-worker** | VPS Worker | TypeScript | Manage containers | Redis, Docker, Backend |
| **vps-heavy** | VPS Heavy | TypeScript | Heavy processing | Redis, Backend |
| **backend** | Railway | NestJS | Control plane | All services, Users |

---

## Visual: Complete Message Flow

```mermaid
graph TD
    subgraph UserFlow["Message Processing Flow"]
        U1["👤 User sends message<br/>(Telegram/Web)"]
        A1["🏢 Backend routes<br/>to container"]
        G1["👨‍🍳 Gateway processes<br/>AI logic"]
        R1["Response sent back"]
    end
    
    subgraph HeavyFlow["Heavy Processing Flow"]
        U2["👤 User requests<br/>video processing"]
        A2["🏢 Backend checks<br/>quota & storage"]
        H1["🔴 VPS Heavy<br/>processes video"]
        S1["💾 Saves result"]
        R2["Notifies backend"]
    end
    
    subgraph ResultFlow["Download Flow"]
        A3["🏢 Backend updates DB"]
        U3["👤 User polls<br/>for result"]
        D["User downloads"]
        F["✅ Happy!"]
    end
    
    U1 --> A1
    A1 --> G1
    G1 --> R1
    R1 --> U1
    
    U2 --> A2
    A2 --> H1
    H1 --> S1
    S1 --> R2
    R2 --> A3
    
    A3 --> U3
    U3 --> D
    D --> F
    
    style UserFlow fill:#e8f5e9
    style HeavyFlow fill:#fff3e0
    style ResultFlow fill:#e3f2fd
    style F fill:#c8e6c9
```

---

**Next Steps:**
- Read: [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) for detailed diagrams
- Read: [UPSTREAM_UPDATE_GUIDE.md](./UPSTREAM_UPDATE_GUIDE.md) for updating gateway
- Read: [vps-worker/README.md](./vps-worker/README.md) for container details
- Read: [vps-heavy/README.md](./vps-heavy/README.md) for processing details
