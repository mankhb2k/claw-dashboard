# AucoBot — Workflow & kiến trúc vận hành

> **Cập nhật:** 2026-05-31  
> **SSOT tính năng AucoBot** (control plane, API, sync, chat proxy, channels) — file này.  
> **SSOT OpenClaw worker** (gateway, kênh upstream, RPC, skills load) — [`openclaw-architecture.md`](openclaw-architecture.md).  
> **Tên sản phẩm / monorepo:** AucoBot (`aucobot/`, xem `aucobot/docs/monorepoplan.md`)  
> **Phân kỳ:**  
> - **OSS (mã nguồn mở):** một **`docker compose`** dựng **đủ stack** giống **[Supabase](https://supabase.com)** self-host: **frontend**, **backend**, **PostgreSQL**, và **một service gateway OpenClaw** (cổng **18789**). User chạy `docker compose up` — **không** spawn container qua Docker API khi tạo project. Backend **sync file** lên volume dùng chung và **proxy chat** tới `OPENCLAW_GATEWAY_URL` (ví dụ `http://gateway:18789`).  
> - **Cloud SaaS (hosted thương mại):** bạn **bán** bản cloud (đa tenant, vận hành thay khách). Runtime **mỗi project = một container** OpenClaw — backend **provision** qua Docker API / fleet (`vps-worker`, quota, billing). OSS **không** phải bản demo của Cloud — OSS là **sản phẩm gốc** cho community; Cloud **tái dùng** lõi OSS qua package/module, phần kinh doanh có thể **repo đóng**.  
> **Tham chiếu:** `openclaw-architecture.md` (worker), `aucobot/docs/monorepoplan.md`, `billing-plan.md` (Cloud SaaS), `proxy-guide.md`.

---

## Vai trò tài liệu

| Thuộc (`workflow.md`) | Không thuộc (→ file khác) |
| ----- | ----------- |
| Luồng vận hành **OSS / Cloud**, sync DB → volume, **merge openclaw.json**, chat WS proxy, channels API | Chi tiết gateway RPC, channel plugin upstream (→ `openclaw-architecture.md`) |
| Phase 1 / 2 tích hợp control plane ↔ worker | Schema Prisma từng bảng (→ `packages/database/`) |
| Sketch **Cloud SaaS** (cloud bạn bán) | Giá/credit hosted (→ `billing-plan.md`) |
| Ranh OSS vs Cloud / proprietary | Danh sách sprint (→ `roadmap-plan.md`) |
| Cấu trúc monorepo, **4 service OSS** | → `aucobot/docs/monorepoplan.md` §2 |

**Thuật ngữ**

- **Project:** đơn vị trong dashboard (cấu hình agent, workspace, bí mật, secrets). Metadata **lưu trong DB**; cấu hình runtime cho gateway qua **sync file** trên volume (`openclaw.json`, `AGENTS.md`, …).
- **Worker / Gateway:** tiến trình OpenClaw (image `openclaw-worker`).  
  - **OSS:** **một** gateway trong compose, cổng **18789** — dùng chung cho instance (MVP thường **1 user ≈ 1 project**).  
  - **Cloud:** **một container gateway / project** — spawn động, `hostPort` lưu DB.
- **Control plane:** App NestJS + Next.js + PostgreSQL — **không** đọc channel trực tiếp; điều phối DB, sync, proxy WS.

---

## 1. OSS và Cloud SaaS

Cộng đồng và team muốn **UI + persistence** cho project/bot đa kênh, **không** phụ thuộc black box — đồng thời muốn **engine mở** và **cloud trả phí** song song.

| Sản phẩm | Ai vận hành | Mô hình runtime gateway |
| -------- | ----------- | ------------------------ |
| **OSS** | Người dùng / tổ chức tự deploy | **Compose** bật sẵn `gateway:18789`; API **không** cần `docker.sock` |
| **Cloud SaaS** | Nhà cung cấp (bạn) | **Spawn 1 container / project** trên hạ tầng hosted + fleet, billing, quota |

| Sản phẩm | Ai vận hành control plane | Mô hình sản phẩm |
| -------- | -------------------------- | ---------------- |
| **OSS** | Người dùng tự host | Self-host, fork, PR, source công khai |
| **Cloud SaaS** | Bạn | Hosted trả phí — provisioning, SLA, scale |

- **OSS:** “**một nguồn thật trong DB**” + **sync file** volume (§5.6, Phase 1; gateway watch file — `openclaw-architecture.md` §4.5.1). Auth API: **JWT**. Gateway: **`gateway.auth`** / `OPENCLAW_GATEWAY_TOKEN` — chat dashboard qua **proxy WS** (§5.7), không JWT thẳng vào `:18789`.
- **Cloud:** Cùng sync file + thêm orchestration fleet, billing, multi-tenant — phần proprietary **repo đóng** import lõi OSS.

---

## 2. Ranh giới service OSS (4 container + volume)

OSS self-host **đủ** với **bốn container** trong `docker compose`. Chỉ **frontend** (`web`) và **backend** (`api`) là **code AucoBot**. **PostgreSQL** và **OpenClaw** (`gateway`) **pull image upstream** — fork để pin tag, **không sửa** runtime.

> **Tóm tắt:** `web` + `api` (bạn build) + `gateway` + `postgres` (pull) **+ volume** `openclaw_data`. Không Redis / BullMQ / fleet. Chi tiết: `monorepoplan.md` §2.

### 2.1 Bốn service

| Service | Image | Sở hữu | Port | Vai trò |
| ------- | ----- | ------- | ---- | ------- |
| `web` | Build `frontend/` | **AucoBot** | 3000 | Dashboard → API |
| `api` | Build `backend/` | **AucoBot** | 3001 | DB, sync file, proxy chat → gateway |
| `gateway` | Pull OpenClaw | **Upstream** | **18789** | Kênh chat, agent (đọc volume) |
| `postgres` | `postgres:16-alpine` | **Upstream** | 5432 | Metadata app |

- Chat: **web → api → gateway** — FE **không** gọi thẳng `:18789`.
- `api` **không** cần `docker.sock` (spawn = Cloud).

### 2.2 Volume & env (bắt buộc, không phải container thứ 5)

| Thành phần | Ghi chú |
| ---------- | ------- |
| Volume `openclaw_data` | `api` ghi sync; `gateway` đọc — cùng mount |
| `OPENCLAW_GATEWAY_URL` | `http://gateway:18789` (trong compose) |
| `OPENCLAW_GATEWAY_TOKEN` | Khớp token gateway; ≠ JWT dashboard |
| `OPENCLAW_DATA_ROOT` | Đường ghi file trên volume |
| `DATABASE_URL` | → `postgres` |

### 2.3 Không có trong compose OSS

Redis, BullMQ, `vps-worker`, Traefik (tuỳ chọn prod), `skill-hub` (catalog tĩnh), Docker socket trên `api`.

### 2.4 Ngoài stack (integration)

LLM API keys, Google OAuth (connectors), token kênh Telegram/Discord, reverse proxy TLS — **không** phải service container AucoBot.

### 2.5 Sở hữu code

```text
AucoBot:     frontend/ + backend/
Upstream:    postgres image + openclaw image (fork pin)
Compose:     docker-compose.yml + volume + .env
```

`openclaw-worker/` trong repo: pin upstream / docs — runtime OSS **pull image**.

---

## 3. Tư duy vận hành — Control plane vs OpenClaw

App = **control plane (DB + API + dashboard)** + **runtime OpenClaw (gateway)**.  
OpenClaw **không đọc PostgreSQL** — chỉ đọc **file + `openclaw.json`** trên volume.

### OSS (một gateway trong compose)

```mermaid
flowchart TB
    U["👤 User"]

    subgraph COMPOSE["docker compose — OSS"]
        FE["Frontend"]
        API["Backend API"]
        DB[("PostgreSQL")]
        GW["Gateway :18789\nopenclaw-worker"]
        VOL["Volume openclaw_data\nopenclaw.json · workspace/…"]
        FE --> API --> DB
        API -->|"ghi file sync"| VOL
        API -->|"WS/HTTP proxy\nOPENCLAW_GATEWAY_URL"| GW
        VOL --> GW
        GW <-->|"lưu lượng bot"| CH["Kênh chat"]
    end

    U --> FE
```

### Cloud (gateway per project — spawn động)

```mermaid
flowchart TB
    U["👤 User"]

    subgraph APP["Control plane"]
        FE["Frontend cloud"]
        API["Backend API"]
        DB[("PostgreSQL")]
        FE --> API --> DB
    end

    subgraph FLEET["Fleet / Docker"]
        C1["Container ← project A"]
        C2["Container ← project B"]
    end

    API -->|"spawn / start / stop\nDocker API"| FLEET
    API -->|"sync file"| VOL["Volume per project"]
    VOL --> C1
    VOL --> C2
    U --> FE
    FE -.->|"chat proxy\nhostPort từ DB"| C1
```

### Quy tắc một dòng

| OpenClaw gateway **phải thấy** để chạy? | Chỉ tính năng **app** (billing, UI, tenant…)? |
| -------------------------------------- | --------------------------------------------- |
| **Sync DB → volume / `openclaw.json`** | **Giữ trên DB** — API đọc trực tiếp |

### Ví dụ nhanh

| Sync sang OpenClaw (volume) | Chỉ DB (app) |
| --------------------------- | ------------ |
| API key provider → `env` trong `openclaw.json` | User, JWT, plan, invoice |
| Skill `enabled` → `workspace/skills/<slug>/SKILL.md` | Skill draft chưa publish |
| Agent workspace → `AGENTS.md`, `SOUL.md`, … | Danh sách project, slug hiển thị |
| Channel token (khi map workspace) | — |
| — | **OSS:** không lưu `container_id` / `host_port` |
| — | **Cloud:** `container_id`, `host_port`, Docker lifecycle |

**Khi user chat:** không inject config từng tin — file đã sync; gateway **watch** + build prompt (`openclaw-architecture.md` §11.5; skills AucoBot §5.3).

**Sync khi nào:** khi user **lưu / bật / đổi** cấu hình — **không** sync mỗi tin nhắn.

---

## 4. OSS — Kiến trúc tổng quan

**Self-host một lần:** `docker compose up` khởi chạy **bốn service** (xem §2): **web** + **api** (build AucoBot), **postgres** + **gateway** (pull upstream). Repo `openclaw-worker/` chỉ để pin image — runtime OSS không build custom OpenClaw.

```mermaid
flowchart TB
    subgraph Compose["docker compose — OSS (Supabase-style)"]
        FE["Next.js frontend\n:3000"]
        API["NestJS backend\n:3001"]
        DB[("PostgreSQL\n:5432")]
        GW["OpenClaw gateway\n:18789"]
        VOL["volume openclaw_data"]
        FE --> API --> DB
        API --> VOL
        API -->|"OPENCLAW_GATEWAY_URL"| GW
        VOL --> GW
    end

    U["👤 User"] --> FE
    GW <-->|channels| CHAT["Telegram · WebChat · …"]
```

**Nguyên tắc OSS**

1. **Một stack compose = một gateway** trên **18789** (service name `gateway` trong mạng Docker). Backend truy cập `http://gateway:18789` (trong compose) hoặc `http://127.0.0.1:18789` (dev host).
2. **Không** spawn container per project qua Docker API; **không** mount `docker.sock` vào service `api`.
3. **PostgreSQL** = nguồn sự thật **app**. OpenClaw chỉ đọc **volume** — sync có chọn lọc (§3).
4. Tạo project trên OSS = **INSERT DB** + **bootstrap/sync file** + (tuỳ chọn) ping `GET /healthz` — **không** `docker create`.
5. **Không** bắt buộc BullMQ, `vps-worker`, billing trong OSS core (`NoopPlanGuard`).
6. **MVP:** thường **1 user ≈ 1 project**; volume `openclaw_data` mount chung cho api + gateway.

**Env OSS (api)**

```env
RUNTIME_MODE=oss
OPENCLAW_GATEWAY_URL=http://gateway:18789
OPENCLAW_GATEWAY_TOKEN=...
OPENCLAW_DATA_ROOT=/data/projects
```

---

## 5. OSS — Luồng vận hành (theo người dùng)

### 5.1 Đăng ký / đăng nhập

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API
    participant DB as PostgreSQL

    U->>FE: Đăng ký / đăng nhập
    FE->>API: POST /auth/* (credential)
    API->>DB: user record
    API-->>FE: JWT (access ± refresh)
    FE-->>U: Session; Bearer cho API
```

- **Auth OSS:** **JWT**. Gateway **không** dùng JWT dashboard — dùng `gateway.auth` / token compose.

### 5.2 Khởi động stack & tạo project

**Bước 0 — User (hoặc admin) bật stack:**

```bash
docker compose -f deploy/oss/docker-compose.yml up -d
# postgres + gateway (healthz) + api + web
```

```mermaid
sequenceDiagram
    participant Admin as Admin / User
    participant Compose as docker compose
    participant GW as gateway :18789
    participant API as Backend API

    Admin->>Compose: up -d
    Compose->>GW: start gateway
    GW-->>Compose: /healthz OK
    Compose->>API: start api (depends_on gateway)
```

**Bước 1 — Tạo project (không spawn container):**

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API
    participant DB as PostgreSQL
    participant Disk as Volume
    participant GW as gateway :18789

    U->>FE: Tạo project
    FE->>API: POST /projects (+ JWT)
    API->>DB: INSERT project
    API->>Disk: bootstrap openclaw.json + workspace/
    API->>GW: GET /healthz (optional)
    API->>DB: status=RUNNING
    API-->>FE: project id, slug
```

- Volume: `{OPENCLAW_DATA_ROOT}/{projectId}/` — api **ghi**, gateway **đọc** (cùng mount `openclaw_data`).
- Token gateway OSS: **`OPENCLAW_GATEWAY_TOKEN`** global từ compose (đồng bộ vào `openclaw.json` khi bootstrap).
- **Không** lưu `container_id` / `host_port` trên OSS (hoặc để null).
- Restart gateway: `docker compose restart gateway` — không có API “respawn project” trên OSS.

### 5.3 Soạn trên dashboard → lưu DB → sync file (OpenClaw)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API
    participant DB as PostgreSQL
    participant Disk as Volume (shared)
    participant GW as gateway

    U->>FE: Save agent editor
    FE->>FE: compile workspace
    FE->>API: PUT /projects/:id/workspace
    API->>DB: revision
    API->>Disk: sync skills, openclaw.json, AGENTS.md…
    Note over Disk,GW: Gateway watch → lượt chat sau
```

- Agent compiler: `packages/workspace-sync/src/agent-workspace-compile.ts` — bootstrap markdown (`AGENTS.md`, `SOUL.md`, …) per agent; runtime merge qua `syncProjectRuntime` (§5.6). Agent `main` implicit trong `agents.list`. Skill → `SKILL.md`.
- **Cloud:** cùng sync; có thể thêm `config.patch` RPC (Phase 2 — §5.6).

### 5.4 Tóm tắt lưu lượng realtime

1. **OSS:** Một gateway trong compose — channel cấu hình trong volume project (`openclaw.json`).
2. Tin nhắn **không** đi qua body HTTP sync; xem §5.7 (dashboard WS vs kênh bot).
3. API lo: auth JWT, CRUD, sync file — **không** lifecycle Docker trên OSS.

### 5.5 Channels — Control plane vs OpenClaw worker (Telegram, Discord, …)

**Channels** (Telegram, Discord, Zalo…) khác **connectors** (Google Drive, Calendar MCP). Cả hai lưu DB + sync file; **runtime chat** chỉ trong **openclaw-worker** (gateway — `openclaw-architecture.md` §3.3).

| Lớp | Nơi làm | Vai trò |
| --- | ------- | ------- |
| **Runtime channel** | `openclaw-worker` | Nhận/gửi tin, pairing, RPC `channels.*` |
| **Control plane** | `apps/api` + `@aucobot/workspace-sync` | UI, DB, mã hóa secret, test token, ghi `openclaw.json` |

Backend **không inject code channel** vào worker — chỉ **cấu hình JSON** trên volume. Gateway **watch** file → plugin chạy.

```mermaid
flowchart LR
  subgraph aucobot["AucoBot"]
    UI["Dashboard channel/*"]
    SVC["ChannelsService"]
    REG["channel-registry adapters"]
    SYNC["workspace-sync mergeChannelsIntoConfig"]
  end

  subgraph volume["Volume openclaw_data"]
    JSON["openclaw.json channels.*"]
  end

  subgraph worker["openclaw-worker :18789"]
    PLG["Channel plugins"]
  end

  UI --> SVC --> REG
  SVC --> SYNC --> JSON
  JSON -->|file watch| PLG
  Internet((Chat apps)) <--> PLG
```

| Kênh | Backend MVP |
| ---- | ------------- |
| **Telegram** | `bot_token` → `channels.telegram.botToken` |
| **Discord** | `bot_token` → `channels.discord.token` |

```mermaid
sequenceDiagram
  participant UI as Web /channel/telegram
  participant API as ChannelsController
  participant SVC as ChannelsService
  participant DB as PostgreSQL
  participant Disk as openclaw.json

  UI->>API: POST create · PUT secrets/bot_token
  UI->>API: POST …/test · PATCH enabled=true
  SVC->>DB: CONNECTED
  SVC->>Disk: mergeChannelsIntoConfig
```

**REST:** `GET /api/projects/channels/definitions` · `GET|POST|PATCH|DELETE /api/projects/:id/channels` · `PUT|DELETE …/secrets/:key` · `POST …/test`

### 5.6 Sync DB ↔ disk (`syncProjectRuntime`)

| Giai đoạn | Đồng bộ với worker | Auth |
| --------- | ------------------- | ---- |
| **Phase 1** | Ghi file volume (`openclaw.json`, workspace, skills) — gateway **watch** (§4.5.1 upstream) | **JWT** cho API SaaS; worker dùng **`gateway.auth.token`** |
| **Phase 2** | Tuỳ chọn RPC `config.patch` / `POST /tools/invoke` | Map JWT → operator credential nội bộ |

**Hai lớp dữ liệu:** Postgres (SSOT UI) → `WorkspaceService.syncProjectRuntime()` → disk → gateway đọc.

```
{OPENCLAW_DATA_ROOT}/{projectId}/
  openclaw.json
  workspace-{slug}/     # AGENTS.md, SOUL.md, IDENTITY.md, TOOLS.md (per agent)
  workspace/            # shared / main
  skills/{slug}/SKILL.md
```

**Package merge:** `@aucobot/workspace-sync` (`packages/workspace-sync/`). Orchestrator: `apps/api/.../workspace/workspace.service.ts`. Dev: `pnpm dev:runtime` (`aucobot/package.json`).

#### Khi nào gọi sync

| Sự kiện | Service | Ghi disk |
| ------- | ------- | -------- |
| Lưu / bật / tắt / xóa agent | `AgentService` | `syncAgentToDisk` (bootstrap markdown) + `syncProjectRuntime` |
| Đổi provider key / default model | `ProviderKeysService` | `syncProjectRuntime` |
| Bật / sửa channel | `ChannelsService` | `syncProjectRuntime` |
| Bật / sửa connector | `ProjectConnectorsService` | `syncProjectRuntime` |
| CLI dev | `apps/api/scripts/sync-project-runtime.mjs` | `syncProjectRuntime` |

Tin nhắn chat **không** trigger sync — chỉ thay đổi cấu hình (§3, §5.4).

#### Pipeline merge `openclaw.json`

```mermaid
flowchart TD
  DB[(PostgreSQL)] --> SVC["WorkspaceService.syncProjectRuntime"]
  SVC --> R["readOpenClawConfigJson"]
  R --> G["mergeGatewayBlockIfMissing"]
  G --> P["mergeProviderKeysIntoConfig"]
  P --> A["mergeAgentsIntoConfig"]
  A --> T["mergeAgentTeamToolsIntoConfig\n(tools.agentToAgent)"]
  A --> C["mergeConnectorsIntoConfig"]
  C --> CH["mergeChannelsIntoConfig"]
  CH --> CL["cleanupStaleMainAgentModels"]
  CL --> W["writeOpenClawConfigJson"]
  W --> GW["Gateway watch → reload"]
```

**Thứ tự thực thi** (trong `workspace.service.ts`):

1. `mergeGatewayBlockIfMissing` — đảm bảo `gateway.auth` (OSS token).
2. `mergeProviderKeysIntoConfig` — `env.*`, `agents.defaults.model.primary`, `plugins.entries` (google/openai).
3. `mergeAgentsIntoConfig` — `agents.list`, `agents.defaults.workspace`; cuối hàm gọi `mergeAgentTeamToolsIntoConfig`.
4. `mergeConnectorsIntoConfig` — `mcp.servers` (+ file credential Google trên disk nếu cần).
5. `mergeChannelsIntoConfig` — `channels.*`, `plugins.entries` (telegram/discord).
6. `cleanupStaleMainAgentModels` — dọn model legacy trên volume.
7. `writeOpenClawConfigJson` + `removeLegacyDotEnv`.

| Hàm merge | Nhánh `openclaw.json` | Nguồn DB | File |
| --------- | ---------------------- | -------- | ---- |
| `mergeProviderKeysIntoConfig` | `env.*`, `agents.defaults.model`, `plugins.entries` (provider) | `ProjectProviderKey` | `openclaw-config-merge.ts` |
| `mergeAgentsIntoConfig` | `agents.list[]`, `agents.defaults.workspace` | `ProjectAgent` (enabled) | `openclaw-config-merge.ts` |
| `mergeAgentTeamToolsIntoConfig` | `tools.agentToAgent` | `ProjectAgent.formData` (`teamEnabled`, `allowedAgentSlugs`) | `agent-team.ts` |
| `mergeConnectorsIntoConfig` | `mcp.servers` | `ProjectConnector` + secrets | `merge-connectors-into-config.ts` |
| `mergeChannelsIntoConfig` | `channels.*`, `plugins.entries` (channel) | `ProjectChannel` + secrets | `merge-channels-into-config.ts` |

**Nguyên tắc merge:** đọc config hiện có → ghi đè **nhánh do AucoBot quản lý**; giữ key ngoài phạm vi (managed ids) nếu user/host đã có sẵn trên volume.

#### Bootstrap agent (ngoài `openclaw.json`)

Khi agent create/update/delete, `AgentService.syncAgentToDisk` ghi markdown bootstrap:

| File | Compiler |
| ---- | -------- |
| `workspace-{slug}/AGENTS.md` | `compileAgentsMd` |
| `workspace-{slug}/SOUL.md` | `compileSoulMd` |
| `workspace-{slug}/IDENTITY.md` | `compileIdentityMd` |
| `workspace-{slug}/TOOLS.md` | `compileToolsMd` |

Patch runtime per agent trong `agents.list`: `compileOpenClawAgentConfig` (model, sandbox) — **không** ghi team policy vào từng entry; team nằm ở `tools.agentToAgent` (global).

#### Team / sub-agent calling (`tools.agentToAgent`)

**UI:** Card Team trên agent editor — `teamEnabled`, `allowedAgentSlugs` (lưu `ProjectAgent.formData`).

**Validation (API):** `validateAgentTeamSettings` / `applyAgentTeamSettings` (`agent-team.ts`, gọi từ `AgentService`):

- Bật team phải chọn ≥1 peer enabled (không tự gọi, không `main`, slug hợp lệ).
- Xóa agent → gỡ slug khỏi `allowedAgentSlugs` của peer.

**Merge runtime:** `buildAgentToAgentAllowList(enabledAgents)` → ghi `openclaw.json`:

```json5
{
  tools: {
    agentToAgent: {
      enabled: true,
      allow: ["agent-a", "agent-b", "main"]  // sorted union
    }
  }
}
```

**Quy tắc build allow list (AucoBot):**

| Điều kiện | Kết quả |
| --------- | ------- |
| Không agent nào `teamEnabled` | `{ enabled: false, allow: [] }` |
| Có ≥1 agent `teamEnabled` | `enabled: true`; `allow` = union của `main`, slug caller bật team, và peer trong `allowedAgentSlugs` **chỉ khi peer đang enabled** trong project |

**Global whitelist (OpenClaw):** `tools.agentToAgent.allow` là **một list chung** cho cả gateway — không phải đồ thị hướng từng agent. UI chọn peer theo từng agent chỉ quyết định **ai được đưa vào list**; OpenClaw coi các slug trong list có thể dùng tool agent-to-agent (`sessions_send`, `sessions_spawn`, …). Chi tiết worker: `openclaw-architecture.md` §25.8.

> **Hạn chế hiện tại:** UI gợi ý “A chỉ gọi B”, runtime là **mesh** (B cũng nằm trong allow nếu A chọn B). Directed one-way cần lớp logic khác — OpenClaw config không hỗ trợ trực tiếp.

**Khác `subagents.allowAgents`:** key per-agent trong `agents.list[]` — scope spawn sub-agent của agent đó; **khác** `tools.agentToAgent.allow` (global messaging). Xem `openclaw-architecture.md` §25.6 vs §25.8.

### 5.7 Hai luồng chat — Dashboard WS proxy vs kênh bot

Cùng một gateway; **ingress** khác nhau.

```mermaid
flowchart TB
  subgraph ingress["Ingress"]
    WS_UI["Dashboard chat"]
    CH_APP["Telegram / Discord"]
  end
  subgraph api["apps/api"]
    PROXY["ChatWsRegistrar + ChatGatewayProxyService"]
    CH["ChannelsService REST"]
    SYNC["WorkspaceService"]
  end
  subgraph gw["Gateway :18789"]
    AG["Agent → LLM"]
  end
  WS_UI -->|JWT WS /api/projects/:id/chat/ws| PROXY
  PROXY -->|openGatewayUpstream| gw
  CH_APP <--> gw
  CH --> SYNC --> gw
```

| Luồng | Vào gateway | Nest tham gia? |
| ----- | ----------- | -------------- |
| **Dashboard chat** | WS proxy → `chat.send`, `chat.history`, … | Có (JWT + RPC whitelist) |
| **Kênh bot** | Plugin + `bot_token` trên disk | Chỉ **setup** REST; tin nhắn không qua Nest |

`bot_token` **không** gọi LLM — chỉ đăng nhập bot; model từ `env.*` + `agents.*`.

**Dashboard — WS 2 tầng** (`web → api → gateway`, không nối thẳng `:18789`):

```mermaid
sequenceDiagram
  participant UI as ProjectChatClient
  participant API as ChatWsRegistrar
  participant GW as Gateway
  participant LLM as LLM provider

  UI->>API: REST chat/status, chat/model
  UI->>API: WS /api/projects/:id/chat/ws
  API->>GW: openGatewayUpstream
  UI->>API: chat.send
  API->>GW: forward whitelist
  GW->>LLM: Agent
  GW-->>UI: event:chat
```

**RPC whitelist** (`packages/control-plane-core/chat/chat-rpc-whitelist.ts`): `chat.history`, `chat.send`, `chat.abort`, `agents.list`. `connect` do proxy xử lý; `config.patch` **không** từ browser (Phase 1 REST + sync).

| Thành phần | Path |
| ---------- | ---- |
| WS client | `apps/web/lib/chat/project-chat-client.ts` |
| Registrar / proxy | `apps/api/.../chat/chat-ws.registrar.ts`, `chat.gateway-proxy.service.ts` |
| Upstream | `packages/control-plane-core/chat/gateway-upstream.ts` |
| Channels | `apps/api/.../channels/channels.service.ts` |

Sơ đồ compose: `aucobot/docs/monorepo-diagram.md` §1.5.

---

## 6. OSS — Phạm vi backend (“có” / “chưa”)

| Hạng mục | OSS |
| -------- | --- |
| Auth JWT, user, session | Có |
| CRUD project, metadata, revision workspace trong DB | Có |
| Service **gateway** trong compose, proxy tới **:18789** | **Có** (mô hình đích) |
| Ghi workspace xuống volume gateway đọc | Có |
| **Spawn container per project** (Docker API) | **Không** |
| Mount **docker.sock** trên api | **Không** |
| API start/stop/respawn container project | **Không** (restart stack / gateway) |
| Mã hóa bí mật lưu trữ (SecretCrypto) | Khuyến nghị |
| Health DB + gateway `/healthz` | Có |
| Traefik wildcard, ingress fleet, autoscale | Chủ yếu **Cloud** |
| BullMQ / `vps-worker` / idle-shutdown | **Không** OSS core |
| Heavy jobs (FFmpeg, Playwright) + credits | **Không** (Cloud) |

> **Ghi chú triển khai:** Code `backend/` hiện tại vẫn có `DockerService.spawnWorker` — đó là **hành vi Cloud**; OSS đích dùng `RUNTIME_MODE=oss` + `StaticGatewayProvisioner` (xem `monorepoplan.md` §14 Phase 2).

---

## 7. Cấu trúc mã — OSS public vs Cloud (Supabase-style)

| Repo / package | License | Nội dung |
| -------------- | ------- | -------- |
| **AucoBot / `openclaw-saas` (public)** | Apache-2.0 / MIT | `frontend/`, `backend/`, `openclaw-worker/`, compose OSS |
| **`aucobot-cloud` (private)** hoặc `packages/cloud/` | Proprietary | Billing, fleet, quota — **import** `@aucobot/control-plane-core` |

```text
aucobot/                            # PUBLIC — self-host
├── apps/oss-web/                   # Dashboard
├── apps/oss-api/                   # NestJS — RUNTIME_MODE=oss
├── workers/openclaw/               # Image gateway
├── deploy/oss/docker-compose.yml   # postgres + api + web + gateway:18789
└── packages/
    ├── control-plane-core/
    ├── runtime-oss/                # StaticGateway — URL cố định
    └── runtime-contracts/

aucobot-cloud/                      # PRIVATE
├── apps/cloud-api/                 # RUNTIME_MODE=cloud, docker.sock
└── packages/cloud/
    ├── fleet/                      # DockerPerProjectProvisioner
    └── billing/
```

**Tái dùng kỹ thuật:**

| Interface | OSS | Cloud |
| --------- | --- | ----- |
| `RuntimeProvisioner` | `StaticGatewayProvisioner` — health + sync only | `DockerPerProjectProvisioner` — spawn/stop |
| `PlanGuard` | `NoopPlanGuard` | Stripe / quota |
| Sync file → OpenClaw | **Chung** — không copy CRUD project |

Chi tiết monorepo: **`monorepoplan.md`**.

---

## 8. Cloud SaaS — Hosted (bạn bán)

**Mục tiêu:** khách đăng ký cloud, trả phí / free tier — **không** tự `docker compose` worker; bạn lo spawn, scale, backup.

| Thành phần | Gợi ý |
| ---------- | ----- |
| **Control plane** | API + DB managed; tenant isolation |
| **Runtime** | **1 container OpenClaw / project** — Docker API, `vps-worker` / K8s, ingress |
| **Backend → gateway** | `http://127.0.0.1:{hostPort}` — lưu DB per project |
| **Kinh doanh** | `billing-plan.md` |
| **Heavy / queue** | `vps-heavy`, BullMQ |
| **Mã nguồn** | Import lõi OSS; fleet + billing **proprietary** |

```mermaid
flowchart TB
    subgraph CLOUD["Cloud SaaS — hosted"]
        FE2[Frontend cloud]
        API2[cloud-api\nRUNTIME_MODE=cloud]
        Q[Queues spawn / heavy]
        Orc[Orchestrator]
        Pool["Worker pool\n1 container / project"]
        FE2 --> API2
        API2 --> Q --> Orc --> Pool
    end
    User2[User] --> FE2
    Chat[Chat apps] <--> Pool
```

### Cloud — Tạo project (spawn container)

```mermaid
sequenceDiagram
    participant U as User
    participant API as cloud-api
    participant DB as PostgreSQL
    participant D as Docker Engine
    participant W as Worker container

    U->>API: POST /projects
    API->>DB: INSERT project
    API->>D: create container\nimage OpenClaw, volume project_id
    D-->>API: container_id, hostPort
    API->>DB: runtime metadata
    API->>W: sync file → volume mount
    API-->>U: project RUNNING
```

**OSS ↔ Cloud:** Cùng **project + sync file**; Cloud thêm **spawn per project**, billing, fleet, SLA. Khách cloud không chạy stack OSS tại nhà song song; migrate/import là luồng riêng.

---

## 9. Bảng so sánh nhanh

| Tiêu chí | OSS (community) | Cloud SaaS (hosted) |
| -------- | ----------------- | --------------------- |
| **Mô hình** | Self-host `docker compose up` | Đăng ký cloud, trả phí |
| **Tương tự thị trường** | Supabase self-host / n8n self-host | Supabase Cloud / n8n Cloud |
| **Gateway** | **1 service** stack, **:18789** cố định | **1 container / project**, port động |
| **Ai bật worker** | Compose (cùng lúc với api, db, web) | Orchestrator / Docker API |
| **docker.sock trên api** | **Không** | **Có** (hoặc remote Docker) |
| **Đồng bộ cấu hình** | DB + ghi file volume chung | DB + ghi file + spawn |
| **Auth API** | JWT | JWT + billing |
| `vps-worker` / `vps-heavy` | Không bắt buộc | Thường có |
| **Mã nguồn** | Repo public | OSS core + package đóng |

---

## 10. Liên kết tài liệu

| Chủ đề | File |
| ------ | ---- |
| Gateway upstream (RPC, channels, skills load) | `openclaw-architecture.md` |
| Agent-to-agent tools (`sessions_send`, …) — worker | `openclaw-architecture.md` §25.8 |
| Sync DB → disk, merge `openclaw.json`, team allow list (AucoBot) | `workflow.md` §5.6 |
| Sync, chat proxy, channels API (AucoBot) | `workflow.md` §5.5–5.7 |
| Merge implementation | `aucobot/packages/workspace-sync/` |
| Monorepo AucoBot, **4 service OSS**, compose, Phase migrate | `monorepoplan.md` §2, §14 |
| Giá, credit, quota (Cloud) | `billing-plan.md` |
| Proxy / ingress an toàn | `proxy-guide.md` |

---

*OSS: **4 services** (`web`, `api`, `gateway`, `postgres`) + volume — chỉ web/api là code AucoBot; gateway/postgres pull upstream. Cloud: **1 project = 1 container**. Skills: sync `{OPENCLAW_DATA_ROOT}/<projectId>/workspace/skills/<slug>/SKILL.md`.*

### E2E checklist — Skills (OSS)

1. Stack đang chạy: `gateway` healthy tại `:18789`.
2. Tạo skill trên dashboard → `POST /api/projects/:id/skills`.
3. Soạn body → `PUT` debounced → bật **Bật & sync**.
4. Kiểm tra file: `{OPENCLAW_DATA_ROOT}/<projectId>/workspace/skills/<slug>/SKILL.md`.
5. Trong gateway container: `openclaw skills list --eligible` (hoặc chat sau `/new`).
6. Tắt skill → xóa thư mục skill khỏi volume; agent không thấy ở lượt sau.
