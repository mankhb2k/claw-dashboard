# AucoBot — Kế hoạch Monorepo (pnpm)

> **Tên dự án:** AucoBot  
> **Cập nhật:** 2026-05-23  
> **Tham chiếu:** `openclaw-architecture.md`, `workflow.md`, `billing-plan.md`  
> **Mô hình thị trường:** Engine mở (OSS self-host) + Cloud trả phí (Supabase / n8n style)

---

## 1. Tóm tắt

AucoBot là monorepo **pnpm** gồm:

| Sản phẩm | Ai vận hành | Runtime gateway |
| -------- | ----------- | ----------------- |
| **OSS** | Người dùng tự host (`docker compose up`) | **Một** service `gateway` cố định cổng **18789** — cùng stack với API, DB, UI |
| **Cloud** | Nhà cung cấp (hosted) | **Một container OpenClaw / project** — spawn qua Docker API / fleet |

**Điểm quan trọng (đã chỉnh so với sketch cũ trong `workflow.md`):**

- **Spawn container per project = chỉ Cloud.** Code hiện tại (`DockerService.spawnWorker`, `hostPort` động) là mô hình Cloud.
- **OSS = Supabase-style:** `docker compose` dựng **hết** service (`postgres`, `api`, `web`, `gateway`); backend **không** cần `docker.sock`, truy cập gateway qua `OPENCLAW_GATEWAY_URL` (ví dụ `http://gateway:18789`).
- **Sync file DB → volume** giữ nguyên cho cả OSS và Cloud (Phase 1 — `openclaw-architecture.md` §4.7).

> **OSS compose = 4 services:** `web` + `api` (AucoBot) + `gateway` + `postgres` (upstream pull). **+1 volume** `openclaw_data`. Không Redis / BullMQ / fleet. LLM / OAuth / kênh chat = cấu hình + API bên ngoài.

---

## 2. Ranh giới service OSS (4 container + volume)

OSS self-host **đủ** với **bốn container** trong `docker compose`. Chỉ **`web`** (frontend) và **`api`** (backend) là **code AucoBot** — build từ repo. **`postgres`** và **`gateway`** (OpenClaw) **pull image upstream**; fork để pin tag/commit, **không sửa** runtime upstream.

### 2.1 Bốn service compose

| Service | Tên compose gợi ý | Image | Sở hữu | Port mặc định | Vai trò |
| ------- | ----------------- | ----- | ------- | ------------- | ------- |
| Dashboard | `web` | Build `frontend/` | **AucoBot** | 3000 | UI; gọi API (`NEXT_PUBLIC_API_URL`) |
| Control plane | `api` | Build `backend/` | **AucoBot** | 3001 | JWT, CRUD, sync file, proxy WS chat → gateway |
| Gateway | `gateway` | Pull OpenClaw (fork pin) | **Upstream** | **18789** | Agent, kênh chat, đọc volume |
| Database | `postgres` | `postgres:16-alpine` | **Upstream** | 5432 | Users, projects, skills metadata… |

```mermaid
flowchart LR
    U[Browser] --> WEB[web]
    WEB -->|REST /api| API[api]
    API --> DB[(postgres)]
    API -->|sync| VOL[openclaw_data]
    API -->|OPENCLAW_GATEWAY_URL| GW[gateway :18789]
    VOL --> GW
    GW <-->|channels| EXT[Internet]
```

- **Frontend không** kết nối trực tiếp `:18789` — chat đi **web → api → gateway**.
- **API không** mount `docker.sock` trên OSS — spawn per project thuộc **Cloud**.

### 2.2 Không phải service — nhưng bắt buộc

| Thành phần | Mô tả |
| ---------- | ----- |
| **Volume `openclaw_data`** | `api` ghi `{OPENCLAW_DATA_ROOT}/{projectId}/…`; `gateway` đọc cùng dữ liệu (`openclaw.json`, `workspace/`). Thiếu volume chung → gateway chạy nhưng không thấy config. |
| **Env nối stack** | `DATABASE_URL`, `JWT_SECRET`, `OPENCLAW_GATEWAY_URL=http://gateway:18789`, `OPENCLAW_GATEWAY_TOKEN` (khớp `gateway.auth`), `OPENCLAW_DATA_ROOT`, `NEXT_PUBLIC_API_URL` |

### 2.3 Ranh giới sở hữu code

```text
AucoBot (build image)
├── frontend/  → service web
└── backend/   → service api (+ Prisma migrate/seed)

Upstream (pull image — fork pin, không patch runtime)
├── postgres:16-alpine
└── openclaw/openclaw (tag cố định)  → service gateway

Compose / hạ tầng (bạn viết, không phải app logic)
├── deploy/oss/docker-compose.yml
├── volume openclaw_data
└── .env
```

- Thư mục `openclaw-worker/` (hoặc `workers/openclaw/` sau migrate) trong monorepo: **chỉ để pin upstream** / tài liệu — runtime OSS **pull image**, không build custom OpenClaw trừ khi đổi tag.
- `skill-hub/`: catalog skill mẫu — **không** chạy như container.

### 2.4 Không có trong compose OSS (MVP)

| Hạng mục | OSS MVP |
| -------- | ------- |
| Redis / BullMQ / `vps-worker` | Không |
| Traefik / ingress fleet | Không bắt buộc (tuỳ chọn production) |
| Docker socket trên `api` | Không |
| Service `skill-hub` | Không |
| Mail server, MinIO, object storage riêng | Không (trừ khi tự thêm sau) |

### 2.5 Phụ thuộc bên ngoài stack (không container AucoBot)

| Tính năng | Cần gì | Bắt buộc? |
| --------- | ------ | --------- |
| Chat AI | API key LLM (OpenAI, Anthropic, …) — sync vào `openclaw.json` | Có nếu dùng chat |
| Connectors Google | `GOOGLE_OAUTH_*` + Google Cloud Console | Chỉ khi bật Drive/Calendar |
| Telegram, Discord, … | Token kênh — cấu hình trong gateway (sync qua api) | Tuỳ user |
| HTTPS công khai | Caddy / Nginx / Traefik phía trước | Tuỳ triển khai |

### 2.6 Tuỳ chọn production (không đếm service app thứ 5)

| Lớp | Vai trò |
| --- | ------- |
| Reverse proxy | TLS, một domain cho web + api |
| Backup Postgres | `pg_dump` / snapshot volume DB |
| `prisma migrate` | Init/mỗi deploy — thường entrypoint `api` |

### 2.7 Dev local vs OSS production

| Môi trường | Stack |
| ---------- | ----- |
| **OSS production (đích)** | 4 service + volume |
| **Dev nhanh** | `postgres` container (`docker-compose.deps.yml`) + `api`/`web` trên host + `gateway` container hoặc local `:18789` |

### 2.8 Checklist “còn thiếu service không?”

| Câu hỏi | Trả lời |
| ------- | ------- |
| Đủ 4 container? | **Có** |
| Thiếu Redis/queue? | **Không** (OSS) |
| Thiếu volume api ↔ gateway? | **Cần** (không phải container) |
| Code repo đã khớp? | **Chưa** — `backend/` vẫn spawn Docker; Phase 2: `RUNTIME_MODE=oss` + compose `gateway` |

---

## 3. Mental model

```mermaid
flowchart TB
    subgraph OSS["AucoBot OSS — docker compose"]
        FE["web :3000"]
        API["api :3001"]
        DB[("postgres")]
        GW["gateway :18789"]
        VOL["volume openclaw_data"]
        FE --> API --> DB
        API -->|"JWT, CRUD, sync file"| VOL
        API -->|"WS/HTTP proxy"| GW
        VOL --> GW
        GW <-->|channels| CHAT[Chat apps]
    end

    subgraph CLOUD["AucoBot Cloud — hosted"]
        FE2["cloud-web"]
        API2["cloud-api"]
        DB2[("managed postgres")]
        ORC["fleet / orchestrator"]
        API2 --> DB2
        API2 --> ORC
        ORC -->|"spawn per project"| C1["worker project A"]
        ORC --> C2["worker project B"]
    end
```

### Quy tắc một dòng

| Gateway cần thấy để chạy? | Chỉ tính năng app (billing, tenant…)? |
| ------------------------- | ------------------------------------- |
| **Sync DB → volume / `openclaw.json`** | **Giữ trên DB** — API đọc trực tiếp |

- **Control plane** = PostgreSQL + Nest API + Dashboard (JWT).
- **OpenClaw worker** không đọc PostgreSQL — chỉ đọc file + `openclaw.json` trên volume.
- **Auth:** JWT (dashboard) ≠ `gateway.auth` (operator worker).

---

## 4. OSS vs Cloud — bảng so sánh

| Tiêu chí | OSS (community, public) | Cloud (hosted, proprietary) |
| -------- | ------------------------ | ---------------------------- |
| **Triển khai** | `docker compose up` một lần | Đăng ký cloud, không tự cài worker |
| **Gateway** | Service `gateway` trong compose, **18789** cố định | Container riêng / project, port động |
| **Backend → gateway** | `OPENCLAW_GATEWAY_URL=http://gateway:18789` | `http://127.0.0.1:{hostPort}` từ DB |
| **Docker socket trên API** | **Không** | **Có** (hoặc remote Docker) |
| **DB `container_id` / `host_port`** | Không dùng (nullable) | Bắt buộc |
| **API start/stop/respawn project** | Không (restart stack / `compose restart gateway`) | Có |
| **`vps-worker` / BullMQ / billing** | Không trong OSS core | Có |
| **Mã nguồn** | Monorepo public | Package/repo đóng import lõi OSS |

---

## 5. Cấu trúc monorepo AucoBot

```text
aucobot/                              # root monorepo (repo public OSS)
├── pnpm-workspace.yaml
├── package.json                        # scripts: dev, build, lint, docker:*
├── pnpm-lock.yaml
├── turbo.json                          # (khuyến nghị) pipeline build
├── .npmrc
│
├── apps/
│   ├── oss-api/                        # ← migrate từ backend/ (NestJS)
│   ├── oss-web/                        # ← migrate từ frontend/ (Next.js)
│   ├── cloud-api/                      # PRIVATE — Nest, import @aucobot/*
│   └── cloud-web/                      # PRIVATE — shell branded / extend oss-web
│
├── packages/
│   ├── shared/                         # types, constants, API client FE ↔ BE
│   ├── database/                       # Prisma schema + client
│   ├── control-plane-core/             # auth, crypto, projects, sync, chat proxy
│   ├── runtime-contracts/              # RuntimeProvisioner, GatewayEndpoint, PlanGuard
│   ├── runtime-oss/                    # StaticGateway — URL cố định :18789, không dockerode
│   ├── workspace-sync/               # agent compile, openclaw.json, skills sync
│   ├── ui-kit/                         # (tuỳ chọn) components dùng chung
│   │
│   └── cloud/                          # PRIVATE — không publish npm
│       ├── billing/                    # Stripe, plans, credits (billing-plan.md)
│       ├── fleet/                      # DockerPerProjectProvisioner, vps-worker
│       ├── quota/                      # PlanGuard impl
│       └── ingress/                    # Traefik, worker callbacks
│
├── workers/
│   └── openclaw/                       # ← openclaw-worker/ (nested pnpm workspace)
│       ├── pnpm-workspace.yaml
│       ├── ui/
│       ├── packages/*
│       └── extensions/*
│
├── deploy/
│   ├── oss/
│   │   ├── docker-compose.yml          # postgres + api + web + gateway
│   │   ├── docker-compose.deps.yml       # chỉ postgres (dev local)
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.web
│   │   └── Dockerfile.gateway          # build từ workers/openclaw
│   └── cloud/                          # PRIVATE — K8s, fleet templates
│
├── catalogs/
│   └── skill-hub/                      # ← skill-hub/ (skill mẫu OSS)
│
└── docs/
    ├── openclaw-architecture.md
    ├── workflow.md
    ├── billing-plan.md
    └── monorepoplan.md                 # file này
```

### Mapping từ repo hiện tại (`openclaw-saas`)

| Hiện tại | Sau migrate (AucoBot) |
| -------- | ------------------------ |
| `backend/` | `apps/oss-api` + tách `packages/*` |
| `frontend/` | `apps/oss-web` |
| `openclaw-worker/` | `workers/openclaw/` |
| `skill-hub/` | `catalogs/skill-hub/` |
| Docs root | `docs/` |
| Cloud (chưa có) | `apps/cloud-*` + `packages/cloud/*` hoặc repo `aucobot-cloud` riêng |

---

## 6. `pnpm-workspace.yaml` (root)

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "packages/cloud/*"          # chỉ clone nội bộ / submodule private
  - "workers/openclaw"
  - "workers/openclaw/ui"
  - "workers/openclaw/packages/*"
  - "workers/openclaw/extensions/*"
```

**Lưu ý:**

- Giữ **nested workspace** của OpenClaw — không flatten `extensions/*` lên root.
- Scope package gợi ý: `@aucobot/shared`, `@aucobot/database`, `@aucobot/control-plane-core`, …
- Cloud private: `@aucobot-cloud/billing`, `@aucobot-cloud/fleet`.

---

## 7. Package graph & quy tắc dependency

```mermaid
flowchart TB
    subgraph apps
        OSS_API[oss-api]
        OSS_WEB[oss-web]
        CLOUD_API[cloud-api]
    end

    subgraph oss_pkg["OSS (public)"]
        CP[control-plane-core]
        DB[database]
        RC[runtime-contracts]
        RO[runtime-oss]
        WS[workspace-sync]
        SH[shared]
    end

    subgraph cloud_pkg["Cloud (private)"]
        BILL[billing]
        FLEET[fleet]
        QUOTA[quota]
    end

    OSS_API --> CP --> DB
    OSS_API --> RO --> RC
    CP --> WS
    OSS_WEB --> SH

    CLOUD_API --> CP
    CLOUD_API --> FLEET --> RC
    CLOUD_API --> BILL
    CLOUD_API --> QUOTA --> RC
```

| Quy tắc | Mô tả |
| ------- | ----- |
| `packages/cloud/*` | **Không** được import bởi package OSS public |
| `control-plane-core` | Không biết Docker vs static gateway — chỉ gọi `RuntimeProvisioner` |
| `oss-api` | Wire `StaticGatewayProvisioner` + `NoopPlanGuard`; **không** `dockerode` |
| `cloud-api` | Wire `DockerPerProjectProvisioner` + `StripePlanGuard` |
| `workspace-sync` | Một implementation — OSS và Cloud chỉ khác volume path / orchestration |

---

## 8. Runtime contracts

### 8.1 `RuntimeProvisioner`

```typescript
// packages/runtime-contracts

export interface RuntimeProvisioner {
  /** OSS: sync disk + đợi gateway compose healthy. Cloud: tạo container. */
  provision(projectId: string, opts: ProvisionOpts): Promise<RuntimeHandle>;
  start(handle: RuntimeHandle): Promise<void>;
  stop(handle: RuntimeHandle): Promise<void>;
  destroy(handle: RuntimeHandle): Promise<void>;
  getStatus(handle: RuntimeHandle): Promise<RuntimeStatus>;
}

export interface GatewayEndpoint {
  /** http://gateway:18789 hoặc http://127.0.0.1:54321 */
  baseUrl: string;
  token: string;
}
```

| Implementation | Package | Dùng bởi |
| -------------- | ------- | -------- |
| `StaticGatewayProvisioner` | `@aucobot/runtime-oss` | `oss-api` — ping `OPENCLAW_GATEWAY_URL`, không Docker API |
| `DockerPerProjectProvisioner` | `@aucobot-cloud/fleet` | `cloud-api` — logic `DockerService.spawnWorker` hiện tại |
| `NoopPlanGuard` | `runtime-contracts` hoặc `oss-api` | OSS — không quota |
| `StripePlanGuard` | `@aucobot-cloud/quota` | Cloud — `billing-plan.md` |

### 8.2 `GatewayEndpointResolver`

Chat proxy và health check dùng resolver thay vì `project.hostPort` trực tiếp:

| Mode | Nguồn endpoint |
| ---- | -------------- |
| `RUNTIME_MODE=oss` | `process.env.OPENCLAW_GATEWAY_URL` + `OPENCLAW_GATEWAY_TOKEN` |
| `RUNTIME_MODE=cloud` | `project.hostPort` + `project.gatewayToken` từ DB |

---

## 9. OSS — Docker Compose (Supabase-style)

### 9.1 Services

| Service | Port | Vai trò |
| ------- | ---- | ------- |
| `postgres` | 5432 | Nguồn sự thật app |
| `api` | 3001 | NestJS control plane |
| `web` | 3000 | Next.js dashboard |
| `gateway` | **18789** | OpenClaw worker (image từ `workers/openclaw`) |

### 9.2 `deploy/oss/docker-compose.yml` (sketch)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    healthcheck: ...

  gateway:
    image: ${OPENCLAW_IMAGE:-aucobot-gateway:local}
    container_name: aucobot-gateway
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan"]
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
    volumes:
      - openclaw_data:/home/node/.openclaw
    ports:
      - "18789:18789"
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O- http://127.0.0.1:18789/healthz || exit 1"]

  api:
    build: ...
    depends_on:
      postgres: { condition: service_healthy }
      gateway: { condition: service_healthy }
    environment:
      RUNTIME_MODE: oss
      DATABASE_URL: ...
      OPENCLAW_DATA_ROOT: /data/projects
      OPENCLAW_GATEWAY_URL: http://gateway:18789
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
    volumes:
      - openclaw_data:/data/projects
    # KHÔNG mount /var/run/docker.sock

  web:
    depends_on: [api]

volumes:
  openclaw_data:
```

### 9.3 Volume & sync

- Backend ghi: `{OPENCLAW_DATA_ROOT}/{projectId}/` → `openclaw.json`, `workspace/skills/…`, `AGENTS.md`, …
- Gateway đọc cùng volume (mount vào `/home/node/.openclaw`).
- **MVP OSS:** 1 user ≈ 1 project — volume có thể map 1:1 project subfolder hoặc root volume cho instance đơn giản.
- **Sync khi:** user lưu / bật skill / đổi config — **không** sync mỗi tin nhắn chat.

### 9.4 Luồng tạo project (OSS)

```mermaid
sequenceDiagram
    participant U as User
    participant API as oss-api
    participant DB as PostgreSQL
    participant Disk as Volume
    participant GW as gateway:18789

    U->>API: POST /projects
    API->>DB: INSERT project
    API->>Disk: bootstrap openclaw.json + workspace
    API->>GW: GET /healthz
    API->>DB: status=RUNNING (không container_id)
```

- Token gateway OSS: dùng `OPENCLAW_GATEWAY_TOKEN` **global** từ compose (không random per project trừ khi sau này multi-gateway).
- Không endpoint `respawn` / start-stop container trên OSS (hoặc trả 501 + hướng dẫn `docker compose restart gateway`).

### 9.5 Env OSS (`apps/oss-api`)

```env
RUNTIME_MODE=oss
DATABASE_URL=postgresql://...
OPENCLAW_GATEWAY_URL=http://gateway:18789
OPENCLAW_GATEWAY_TOKEN=...
OPENCLAW_DATA_ROOT=/data/projects
JWT_SECRET=...
FRONTEND_URL=http://localhost:3000

# Dev trên host (không compose): OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
# KHÔNG dùng trên OSS: OPENCLAW_IMAGE spawn, docker.sock
```

---

## 10. Cloud — Hosted

| Thành phần | Gợi ý |
| ---------- | ----- |
| Control plane | API + DB managed; tenant isolation |
| Runtime | `DockerPerProjectProvisioner` — 1 container / project |
| Kinh doanh | `packages/cloud/billing` — `billing-plan.md` |
| Queue / heavy | `vps-heavy`, BullMQ (tuỳ sản phẩm) |
| Mã nguồn | Import `@aucobot/control-plane-core`; fleet/billing **proprietary** |

```mermaid
flowchart TB
    User[User] --> FE2[cloud-web]
    FE2 --> API2[cloud-api]
    API2 --> DB2[(postgres)]
    API2 --> Q[Queues]
    Q --> ORC[Orchestrator]
    ORC --> Pool[Worker pool per project]
    Pool <-->|hostPort động| API2
```

### Env Cloud (sketch)

```env
RUNTIME_MODE=cloud
OPENCLAW_IMAGE=...
# Docker socket hoặc DOCKER_HOST remote
OPENCLAW_SPAWN_TIMEOUT_MS=60000
```

---

## 11. Apps

### 11.1 `apps/oss-api` (public)

- Nest `AppModule` + `@aucobot/control-plane-core`.
- Providers: `StaticGatewayProvisioner`, `NoopPlanGuard`.
- Không dependency `dockerode` trong production OSS build.

### 11.2 `apps/oss-web` (public)

- Dashboard self-host đầy đủ.
- Chat WS proxy tới API → gateway cố định.

### 11.3 `apps/cloud-api` / `apps/cloud-web` (private)

- Composition root mỏng: import OSS core + override provisioner/plan guard.
- UI: branding + billing + quota; có thể extend `oss-web` qua feature flags / route groups.

---

## 12. Repo & license

| Artifact | Repo | License |
| -------- | ---- | ------- |
| Monorepo OSS AucoBot | `aucobot` (public, rename từ `openclaw-saas`) | Apache-2.0 / MIT |
| `packages/cloud/*`, `apps/cloud-*` | Cùng monorepo (git submodule) **hoặc** `aucobot-cloud` riêng | Proprietary |

**Khuyến nghị:**

- **Giai đoạn 1:** OSS monorepo sạch; Cloud repo riêng `pnpm link` / GitHub Packages `@aucobot/*`.
- **Giai đoạn 2:** Submodule `packages/cloud` nếu team nhỏ muốn một clone.

---

## 13. Dev workflow (root scripts)

```json
{
  "scripts": {
    "dev": "turbo run dev --parallel --filter=@aucobot/oss-api --filter=@aucobot/oss-web",
    "dev:deps": "docker compose -f deploy/oss/docker-compose.deps.yml up -d",
    "dev:stack": "docker compose -f deploy/oss/docker-compose.yml up",
    "build": "turbo run build",
    "build:gateway-image": "docker build -f deploy/oss/Dockerfile.gateway -t aucobot-gateway:local .",
    "db:migrate": "pnpm --filter @aucobot/database exec prisma migrate dev"
  }
}
```

**Dev local (không full compose):**

1. `pnpm dev:deps` — Postgres.
2. Chạy gateway riêng hoặc `docker compose up gateway` — port **18789**.
3. `pnpm dev` — api + web; `OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789`.

---

## 14. Lộ trình migrate

### Phase 0 — Chuẩn bị (1–2 ngày)

- [ ] Root `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `turbo.json`
- [ ] Chuyển frontend/backend sang **pnpm**; bỏ `package-lock.json`
- [ ] CI: `pnpm install --frozen-lockfile`

### Phase 1 — Di chuyển cơ học (3–5 ngày)

- [ ] `backend/` → `apps/oss-api`
- [ ] `frontend/` → `apps/oss-web`
- [ ] `openclaw-worker/` → `workers/openclaw`
- [ ] `skill-hub/` → `catalogs/skill-hub`
- [ ] Docs → `docs/`
- [ ] Compose → `deploy/oss/`

### Phase 2 — Runtime OSS vs Cloud (1 tuần) — **ưu tiên**

- [ ] `RUNTIME_MODE` + `GatewayEndpointResolver`
- [ ] `packages/runtime-contracts` + `packages/runtime-oss`
- [ ] OSS: bỏ spawn trong `ProjectsService.create`; healthcheck gateway URL
- [ ] Chat proxy: `OPENCLAW_GATEWAY_URL` thay `hostPort` khi `oss`
- [ ] Compose OSS: service `gateway` :18789; api **không** mount docker.sock
- [ ] Cập nhật `.env.example` (khối OSS / Cloud)
- [ ] Cập nhật `workflow.md` §3–§6 (OSS ≠ 1 container/project)

### Phase 3 — Tách packages OSS (1–2 tuần)

- [ ] `packages/database` (Prisma)
- [ ] `packages/workspace-sync`
- [ ] `packages/control-plane-core`
- [ ] `packages/shared`
- [ ] `oss-api` chỉ còn bootstrap + wiring

### Phase 4 — Cloud skeleton (private)

- [ ] `packages/cloud/fleet` — port `DockerService` hiện tại
- [ ] `packages/cloud/billing` — theo `billing-plan.md`
- [ ] `apps/cloud-api` import `@aucobot/control-plane-core`

### Phase 5 — Polish

- [ ] Publish `@aucobot/control-plane-core` (optional)
- [ ] E2E checklist skills (`workflow.md`)
- [ ] Rename repo / branding AucoBot trên UI và README

---

## 15. Refactor code hiện tại (ghi chú)

**Trước migrate monorepo**, có thể làm ngay trên `backend/`:

| File / vùng | Thay đổi OSS |
| ----------- | ------------ |
| `projects.service.ts` | `create`: bootstrap disk only; không `docker.spawnWorker` khi `RUNTIME_MODE=oss` |
| `docker.service.ts` | Chỉ load module Cloud; hoặc guard `RUNTIME_MODE !== 'oss'` |
| `chat.gateway-proxy.service.ts` | Resolver URL từ env |
| `gateway-upstream.ts` | Hỗ trợ `baseUrl` thay chỉ `hostPort: number` |
| Prisma `Project` | `containerId`, `hostPort` optional — OSS không ghi |
| `.env.example` | Tách block OSS / Cloud |

---

## 16. Rủi ro & quyết định

| Chủ đề | Quyết định |
| ------ | ---------- |
| Nested `workers/openclaw` | Giữ workspace con; không merge extensions lên root |
| Prisma schema | Một schema OSS; Cloud thêm bảng billing hoặc schema riêng |
| Multi-project OSS | Một gateway + multi-agent / workspace path — không spawn N container |
| `workflow.md` “1 project = 1 container” | Chỉ áp dụng **Cloud** |
| FE Cloud | Bắt đầu extend `oss-web`; tách `ui-kit` khi >3 màn hình khác biệt |

---

## 17. Kết quả mong đợi

Sau khi hoàn tất Phase 2+:

```bash
git clone https://github.com/<org>/aucobot
cd aucobot
pnpm install
cp deploy/oss/.env.example .env
docker compose -f deploy/oss/docker-compose.yml up
```

→ **Postgres + API + Dashboard + Gateway :18789** chạy cùng nhau; user không cần Docker socket trên máy để spawn worker.

Team Cloud thêm repo/package riêng, **import lõi AucoBot OSS**, không fork logic sync file.

---

## 18. Liên kết tài liệu

| Chủ đề | File |
| ------ | ---- |
| Gateway, channels, skills sync | `openclaw-architecture.md` |
| Luồng vận hành OSS / Cloud | `workflow.md` §2 |
| Billing Cloud | `billing-plan.md` |
| Kế hoạch monorepo (file này) | `monorepoplan.md` §2 (4 service) |

---

*AucoBot — OSS: 4 services (`web`, `api`, `gateway`, `postgres`) + volume `openclaw_data`; chỉ web/api là code AucoBot. Cloud: spawn per project. Monorepo pnpm tách package public và `packages/cloud` proprietary.*
