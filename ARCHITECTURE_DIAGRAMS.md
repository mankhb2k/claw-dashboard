# OpenClaw SaaS — Architecture Diagrams (Mermaid)

---

## 1. System Architecture Overview (MVP)

```mermaid
graph TB
    User["👤 User<br/>(Web/App)"]
    CDN["🌐 Cloudflare<br/>DNS + CDN + DDoS"]
    
    subgraph Railway["Railway (Control Plane)"]
        API["🔵 NestJS API<br/>Fastify + TypeORM"]
        DB["🗄️ PostgreSQL<br/>Projects, Users, Jobs"]
        Redis["📦 Redis Managed<br/>BullMQ Queue"]
    end
    
    subgraph "VPS Worker (Management)"
        Worker["🟢 openclaw-worker<br/>Job dispatcher"]
        Traefik["🔄 Traefik v3<br/>SSL + Routing"]
        Docker["🐳 Docker Engine<br/>Container spawner"]
        
        subgraph "User Containers"
            Container1["📱 openclaw-usr_abc<br/>1GB/0.5vCPU/4GB"]
            Container2["📱 openclaw-usr_def<br/>1GB/0.5vCPU/4GB"]
            ContainerN["📱 ... (40-50 total)"]
        end
        
        Storage["💾 /data/users<br/>250GB NVMe<br/>Volumes + SQLite"]
    end
    
    subgraph "VPS Heavy (Compute)"
        Heavy["🔴 openclaw-heavy<br/>Job processor"]
        FFmpeg["🎬 FFmpeg<br/>Video encoding"]
        Playwright["🌐 Playwright<br/>Screenshot/PDF"]
        Tools["🔧 TTS/STT<br/>Media tools"]
        JobStorage["💾 /data/jobs<br/>Temp + results"]
    end
    
    User -->|HTTPS| CDN
    CDN -->|api.openclaw.ai| API
    CDN -->|*.openclaw.ai| Traefik
    
    API -->|Read/Write| DB
    API -->|Enqueue job| Redis
    Worker -->|Pull job| Redis
    
    Worker -->|Control| Docker
    Docker -->|Spawn/Stop| Container1
    Docker -->|Spawn/Stop| Container2
    Docker -->|Spawn/Stop| ContainerN
    
    Container1 -->|Chat/API| Traefik
    Container2 -->|Chat/API| Traefik
    ContainerN -->|Chat/API| Traefik
    
    Traefik -->|HTTP :3000| Container1
    Container1 -->|Store| Storage
    
    Worker -->|Push heavy job| Redis
    Heavy -->|Pull job| Redis
    
    Heavy -->|Execute| FFmpeg
    Heavy -->|Execute| Playwright
    Heavy -->|Execute| Tools
    FFmpeg -->|Save| JobStorage
    Playwright -->|Save| JobStorage
    
    Heavy -->|Callback| Worker
    JobStorage -->|Upload| Storage
    
    Container1 -->|GET result| Storage
    
    style Railway fill:#e1f5ff
    style VPS_Worker fill:#f3e5f5
    style VPS_Heavy fill:#fff3e0
    style User fill:#c8e6c9
    style CDN fill:#ffe0b2
```

---

## 2. User Container Lifecycle

```mermaid
sequenceDiagram
    actor User as 👤 User
    participant API as 🔵 Railway API
    participant Queue as 📦 Redis Queue
    participant Worker as 🟢 Worker VPS
    participant Docker as 🐳 Docker
    participant Container as 📱 Container
    participant Storage as 💾 Storage
    
    User->>API: POST /api/projects (create)
    API->>API: Check quota (free: 1 project)
    API->>Queue: Enqueue 'spawn' job
    API-->>User: {projectId, domain}
    
    Worker->>Queue: Pull 'spawn' job
    Worker->>Docker: docker create openclaw-gateway:latest
    Docker->>Storage: mkdir /data/users/{userId}
    Docker->>Container: docker start
    Container->>Container: Health check :3000/health
    
    Worker->>API: PUT /api/internal/status (running)
    API->>API: Update project.status = 'running'
    
    User->>Container: Send message via Telegram
    Container->>Container: Process via OpenClaw
    Container->>Storage: Save state to SQLite
    
    Note over Container: Idle for 10 min
    
    API->>API: Idle scheduler detects (last_active > 10min)
    API->>Queue: Enqueue 'stop' job
    Worker->>Docker: docker stop (graceful)
    Worker->>API: PUT /api/internal/status (stopped)
    
    User->>API: GET /api/projects/{id}/health
    API-->>User: {status: 'stopped', lastActive}
    User->>API: POST /api/projects/{id}/start
    API->>Queue: Enqueue 'wake' job
    Worker->>Docker: docker start
    Worker->>API: PUT /api/internal/status (running)
    
    User->>Container: Send message
    Container->>User: Response instant
```

---

## 3. Heavy Task Processing Flow

```mermaid
sequenceDiagram
    participant Container as 📱 User Container
    participant API as 🔵 Railway API
    participant Queue as 📦 Redis Queue
    participant Heavy as 🔴 Heavy VPS
    participant FFmpeg as 🎬 FFmpeg
    participant Storage as 💾 Storage
    
    Container->>API: POST /api/heavy/submit<br/>{tool: 'ffmpeg', params...}
    API->>API: Check quota (free: 3/day)
    API->>API: Check daily usage
    alt Quota OK
        API->>Queue: Enqueue heavy-tasks job
        API-->>Container: {jobId, estimatedTime: '2-5min'}
    else Quota Exceeded
        API-->>Container: Error 429
    end
    
    Heavy->>Queue: Pull job from heavy-tasks
    Heavy->>Heavy: Validate params
    Heavy->>Heavy: Download input file (if URL)
    
    par Processing
        Heavy->>FFmpeg: ffmpeg -i input.mp4 -c:v libx264 ...
        FFmpeg->>FFmpeg: Encode (CPU intensive)
        FFmpeg-->>Heavy: output.mp4 (200MB)
    end
    
    Heavy->>Storage: Upload /data/users/{userId}/heavy-tasks/
    Heavy->>API: PUT /api/internal/job/{jobId}/result<br/>{status: 'done', resultPath}
    API->>API: Update heavy_jobs table (status=done)
    
    Container->>API: GET /api/heavy/status/{jobId} (polling)
    API-->>Container: {status: 'done', resultPath}
    
    Container->>Storage: GET /storage/heavy-tasks/output.mp4
    Storage-->>Container: File stream (download)
    
    alt After 30 days
        API->>Storage: Auto-delete expired results
        Storage->>Storage: rm /heavy-tasks/old_*
    end
```

---

## 4. Version Management & Update Workflow

```mermaid
graph LR
    subgraph "Month 1"
        Check["📅 Week 1<br/>Monitor upstream<br/>git log origin/main"]
        Review["📋 Week 2<br/>Review changes<br/>git diff"]
        Build["🔨 Week 3<br/>Build images<br/>./build.sh 2026.5.0"]
        Test["✅ Week 3<br/>Test locally<br/>docker run"]
        Deploy["🚀 Week 4<br/>Deploy to prod<br/>./deploy.sh"]
    end
    
    Check -->|Found v2026.5.0| Review
    Review -->|Approved| Build
    Build -->|Success| Test
    Test -->|Pass| Deploy
    
    subgraph "Images"
        WorkerImg["🟢 openclaw-worker<br/>v2026.5.0<br/>~400MB"]
        HeavyImg["🔴 openclaw-heavy<br/>v2026.5.0<br/>~800MB"]
    end
    
    Build -->|Create| WorkerImg
    Build -->|Create| HeavyImg
    
    subgraph "Deployment"
        PushReg["📤 Push to registry"]
        DeployWorker["🟢 Deploy Worker VPS"]
        DeployHeavy["🔴 Deploy Heavy VPS"]
        Monitor["📊 Monitor 24h"]
        Done["✨ Complete"]
    end
    
    Deploy -->|Push| PushReg
    PushReg -->|docker pull| DeployWorker
    DeployWorker -->|docker pull| DeployHeavy
    DeployHeavy -->|Health check| Monitor
    Monitor -->|No issues| Done
    
    subgraph "Rollback"
        Issue["⚠️ Issue found"]
        Rollback["🔄 Rollback 2026.4.5"]
        Alert["🚨 Post-mortem"]
    end
    
    Monitor -->|Failure| Issue
    Issue -->|./rollback.sh| Rollback
    Rollback -->|Fix + retest| Alert
    
    style WorkerImg fill:#c3e9ff
    style HeavyImg fill:#ffe0b2
    style Done fill:#c8e6c9
    style Issue fill:#ffcdd2
```

---

## 5. Storage & Quota Management

```mermaid
graph TB
    User["👤 User<br/>Free tier"]
    
    subgraph "Container Storage (4GB)"
        SQLite["📊 SQLite<br/>Messages<br/>Sessions<br/>~50MB"]
        Config["⚙️ Config<br/>Bot tokens<br/>API keys<br/>~5MB"]
        HeavyResults["🎬 Heavy Results<br/>Videos<br/>Screenshots<br/>~3GB"]
    end
    
    subgraph "Quota Tracking"
        QuotaUI["📊 UI: 3.2GB / 4GB used"]
        DeleteBtn["🗑️ Delete old files"]
        Storage["⏱️ Auto-expire<br/>30 days"]
    end
    
    subgraph "Timeline"
        Week1["Week 1<br/>~400MB used<br/>10% quota"]
        Week2["Week 2<br/>~800MB used<br/>20% quota"]
        Week3["Week 3<br/>~1.2GB used<br/>30% quota"]
        Week4["Week 4<br/>~1.6GB used<br/>40% quota"]
        Week6["Week 6<br/>~2.4GB used<br/>60% quota"]
        Week8["Week 8<br/>~3.2GB used<br/>80% quota"]
    end
    
    User -->|3 calls/day<br/>3 months later| Week8
    
    Week1 -->|+1 video<br/>+screenshot| Week2
    Week2 -->|+1 video| Week3
    Week3 -->|+2 videos| Week4
    Week4 -->|Moderate<br/>use| Week6
    Week6 -->|Casual<br/>use| Week8
    
    Week8 -->|User action| QuotaUI
    QuotaUI -->|Manual or<br/>Auto-expire| DeleteBtn
    DeleteBtn -->|Delete old<br/>files| Storage
    Storage -->|Frees space<br/>for more| Week1
    
    SQLite -->|Persistent| User
    Config -->|Persistent| User
    HeavyResults -->|Temporary<br/>30-day TTL| Storage
    
    style User fill:#c8e6c9
    style HeavyResults fill:#fff3e0
    style QuotaUI fill:#bbdefb
    style Week8 fill:#ffccbc
```

---

## 6. Scaling: MVP → Multi-VPS

```mermaid
graph TB
    subgraph "Phase 1: MVP (50-150 users)"
        Phase1["Single VPS Worker<br/>+ Single VPS Heavy<br/>Cost: ~$80/mo"]
    end
    
    subgraph "Phase 2: Growth (150-500 users)"
        Phase2["2-3 VPS Worker<br/>+ 1-2 VPS Heavy<br/>Load balanced<br/>Cost: ~$200/mo"]
    end
    
    subgraph "Phase 3: Scale (500-5000 users)"
        Phase3["4-6 VPS Worker<br/>+ 2-4 VPS Heavy<br/>Dedicated Redis VPS<br/>Cost: ~$500/mo"]
    end
    
    subgraph "Phase 4: Enterprise (5000+ users)"
        Phase4["8-12 VPS Worker<br/>+ 4-8 VPS Heavy<br/>Redis Sentinel<br/>Kubernetes (optional)<br/>Cost: $1000+/mo"]
    end
    
    Phase1 -->|More signups| Phase2
    Phase2 -->|CPU/Storage<br/>saturated| Phase3
    Phase3 -->|Reliability<br/>needed| Phase4
    
    subgraph "Node Selector"
        Algo["Algorithm:<br/>Choose VPS with<br/>lowest load<br/>(containers/<br/>max_capacity)"]
    end
    
    Phase2 -->|Need| Algo
    Algo -->|Used by| Phase3
    
    subgraph "Database Migration"
        DB1["SQLite<br/>(single node)"]
        DB2["PostgreSQL<br/>(Railway)"]
    end
    
    Phase1 -->|State| DB1
    Phase2 -->|Upgrade| DB2
    
    style Phase1 fill:#c8e6c9
    style Phase2 fill:#bbdefb
    style Phase3 fill:#ffe0b2
    style Phase4 fill:#f8bbd0
```

---

## 7. Database Schema Relationships

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : owns
    USERS ||--o{ HEAVY_JOBS : submits
    PROJECTS ||--o{ HEAVY_JOBS : references
    PLANS ||--o{ PROJECTS : defines
    
    USERS {
        uuid id PK
        string email UK
        string name
        timestamp created_at
    }
    
    PLANS {
        uuid id PK
        string name UK "free|pro|business"
        int max_projects
        int ram_mb
        decimal cpu_vcpu
        int storage_gb
        int heavy_jobs_per_day
    }
    
    PROJECTS {
        uuid id PK
        uuid user_id FK
        uuid plan_id FK
        string subdomain UK
        string status "creating|running|stopped|error"
        string container_name
        int storage_used_mb
        int heavy_quota_used "today"
        timestamp last_active_at
        timestamp created_at
    }
    
    HEAVY_JOBS {
        string id PK "job_xyz"
        uuid user_id FK
        uuid project_id FK
        string tool "ffmpeg|playwright|tts|stt"
        jsonb params
        string status "pending|processing|done|failed"
        string result_path
        int result_size_mb
        text error_message
        timestamp submitted_at
        timestamp completed_at
        timestamp expires_at "30-day TTL"
    }
```

---

## 8. Request Flow: Submit Heavy Job

```mermaid
flowchart TD
    Start["User submit<br/>heavy job"]
    
    Start -->|POST /api/heavy/submit| Check1{"Quota<br/>OK?"}
    
    Check1 -->|No| Error1["❌ 429<br/>Daily limit exceeded"]
    Check1 -->|Yes| Check2{"Storage<br/>4GB<br/>enough?"}
    
    Check2 -->|No| Error2["❌ 507<br/>Storage full"]
    Check2 -->|Yes| Enqueue["✅ Enqueue job<br/>to Redis"]
    
    Enqueue -->|Return| Response["jobId<br/>estimatedTime"]
    Response -->|User polls| Poll["GET /api/heavy/status/{jobId}"]
    
    Poll -->|Meanwhile| PullJob["🔴 Heavy VPS<br/>pulls job"]
    PullJob -->|Validate| Validate{"Input<br/>OK?"}
    
    Validate -->|No| FailJob["❌ Job FAILED<br/>error_message"]
    Validate -->|Yes| Process["⏱️ Process<br/>timeout check"]
    
    Process -->|Timeout| Timeout["❌ Job TIMEOUT"]
    Process -->|Success| Upload["✅ Upload result<br/>to /data/users/"]
    
    Upload -->|Callback| Callback["PUT /api/internal/job/{jobId}/result"]
    Callback -->|Update DB| Done["✅ heavy_jobs.status='done'"]
    
    Done -->|User next poll| Result["GET /api/heavy/status/{jobId}<br/>returns: done + resultPath"]
    Result -->|Download| Download["GET /storage/heavy-tasks/output.mp4"]
    
    FailJob -->|Notify| PollFail["GET returns error"]
    Timeout -->|Notify| PollTimeout["GET returns timeout"]
    
    PollFail -->|User can retry| Retry["POST /api/heavy/submit again"]
    Retry -->|If quota| Requeue["Enqueue 2nd attempt"]
    
    style Start fill:#e3f2fd
    style Response fill:#c8e6c9
    style Done fill:#c8e6c9
    style Error1 fill:#ffcdd2
    style Error2 fill:#ffcdd2
    style FailJob fill:#ffcdd2
```

---

## 9. Idle Detection & Auto-Wake

```mermaid
timeline
    title Container Lifecycle with Idle Detection
    
    section Day 1
    00:00 : Container created : Status: running
    08:00 : User chat : last_active_at updated
    12:00 : User idle (4h) : Still running
    
    section Day 2
    06:00 : Idle check (last_active > 10min) : Scheduler runs
    06:05 : Auto-stop triggered : docker stop (graceful)
          : Status changed to: stopped
    
    section Day 3
    10:00 : User returns : GET /health
          : Status: stopped
    10:01 : User action : POST /projects/{id}/start
          : docker start (10s)
    10:02 : Container healthy : Status: running
    10:03 : User instant response : Chat works
    
    section Day 4
    (repeat idle → stop → wake cycle)
```

---

## 10. Cost Breakdown (MVP Phase)

```mermaid
pie title "Monthly Cost - 100 Free Users"
    "VPS Worker (12 vCPU)" : 40
    "VPS Heavy (12 vCPU)" : 50
    "Storage (400GB)" : 5
    "Railway API" : 10
    "Cloudflare" : 0
    "Ops/Monitoring" : 5
    
pie title "Cost Per User (Monthly)"
    "Infrastructure" : 1.1
    "Margin" : 3.9
    "Target (Free)" : 0
```

---

## 11. Error Handling & Retry Logic

```mermaid
stateDiagram-v2
    [*] --> Submitted: POST /submit
    
    Submitted --> Queued: Enqueued to Redis
    Queued --> Processing: Worker pulls job
    
    Processing --> Success: Job completes
    Processing --> Timeout: >5min (FFmpeg)
    Processing --> Failed: Error (codec, OOM, etc)
    
    Success --> Done: Result uploaded
    Timeout --> Failed: Retry? (user decision)
    Failed --> Retryable: User retries<br/>(counts quota)
    
    Retryable --> Queued: Resubmit job
    
    Done --> [*]: Download result
    
    Failed --> [*]: Show error
    
    note right of Timeout
        User sees:
        "Job timeout after 5min"
        Can retry now or later
    end
    
    note right of Failed
        User sees:
        Error details from Heavy VPS
        Example: "Unsupported codec H.265"
    end
```

---

Generated: April 18, 2026  
All diagrams are Mermaid-compatible  
Copy-paste directly into:
- GitHub README
- Mermaid Live Editor (mermaid.live)
- Notion, Confluence, etc
