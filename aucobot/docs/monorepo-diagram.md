# AucoBot monorepo — sơ đồ luồng

Tài liệu trực quan bổ sung cho [`monorepoplan.md`](./monorepoplan.md).  
Mỗi mục dùng **Mermaid** (render trên GitHub, VS Code, Cursor).

---

## Mục lục

| # | Chủ đề | Trạng thái |
|---|--------|------------|
| 1 | [Runtime (OSS vs Cloud)](#1-runtime-oss-vs-cloud) | ✅ |
| 2 | [Database / Prisma](#2-database--prisma) | ✅ |
| 3 | Workspace sync → OpenClaw | 🔜 |
| 3b | [Connectors MCP](#3b-connectors-mcp) | ✅ |
| 4 | Auth + session (web ↔ api) | 🔜 |
| 5 | Full stack compose | 🔜 |

---

## 1. Runtime (OSS vs Cloud)

### 1.1 Câu hỏi chung & ai trả lời

Mọi mode đều cần biết: **project này nói với Gateway ở đâu?** (HTTP/WS URL + token).

```mermaid
flowchart TB
  subgraph question["Câu hỏi"]
    Q["Gateway endpoint cho project?<br/>httpBaseUrl · wsBaseUrl · token"]
  end

  subgraph contracts["packages/runtime-contracts"]
    direction TB
    C1["GatewayEndpoint"]
    C2["GatewayEndpointResolver"]
    C3["PlanGuard · RuntimeMode"]
  end

  subgraph oss["packages/runtime-oss"]
    direction TB
    O1["resolveOssGatewayEndpoint()"]
    O2["waitForGatewayHealth() → GET /healthz"]
    O3["Env: OPENCLAW_GATEWAY_URL · TOKEN"]
  end

  subgraph cloud["cloud/packages/fleet — Phase 4"]
    direction TB
    F1["DockerPerProjectProvisioner"]
    F2["hostPort + gatewayToken từ DB"]
    F3["dockerode spawn / stop"]
  end

  subgraph api["apps/api — wiring only"]
    A["RUNTIME_MODE=oss → runtime-oss<br/>RUNTIME_MODE=cloud → fleet"]
  end

  Q --> contracts
  contracts --> oss
  contracts --> cloud
  oss --> api
  cloud --> api
```

### 1.2 Vị trí trong monorepo

```text
aucobot/
├── apps/
│   ├── api/          ← import runtime-oss + contracts; HTTP/Nest
│   └── web/
├── packages/
│   ├── runtime-contracts/   ← interface (OSS + cloud dùng chung)
│   └── runtime-oss/           ← implementation OSS only
├── cloud/
│   ├── api/                   ← import contracts; KHÔNG import runtime-oss
│   └── packages/
│       └── fleet/             ← implementation Cloud (sau)
└── deploy/                    ← gateway = pull image openclaw-worker:*
```

### 1.3 OSS vs Cloud — so sánh

| | **OSS** (`runtime-oss`) | **Cloud** (`cloud/fleet`) |
|---|-------------------------|---------------------------|
| Gateway | **1 shared** `:18789` | **1 container / project** |
| URL | `OPENCLAW_GATEWAY_URL` (env) | `http://127.0.0.1:{hostPort}` |
| Token | `OPENCLAW_GATEWAY_TOKEN` (env) | `project.gatewayToken` (DB) |
| Docker spawn | ❌ | ✅ |
| Package | `@aucobot/runtime-oss` | `@aucobot-cloud/fleet` |

### 1.4 Dependency import

```mermaid
flowchart LR
  web["apps/web"]
  api["apps/api"]
  rc["@aucobot/runtime-contracts"]
  ro["@aucobot/runtime-oss"]
  ca["cloud/api"]
  fl["@aucobot-cloud/fleet"]

  web -->|"HTTP + cookies"| api
  api --> rc
  api --> ro
  ro --> rc
  ca --> rc
  ca --> fl
  fl --> rc

  style rc fill:#e3f2fd,stroke:#1565c0
  style ro fill:#e8f5e9,stroke:#2e7d32
  style fl fill:#fff3e0,stroke:#ef6c00
```

`runtime-oss` và `fleet` **song song** — cùng implement contracts, **không** import lẫn nhau.

### 1.5 Luồng OSS: tạo project → gateway sẵn sàng

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant W as apps/web
  participant A as apps/api
  participant RO as runtime-oss
  participant DB as Postgres
  participant V as Volume openclaw_data
  participant G as Gateway :18789

  U->>W: Setup / tạo project
  W->>A: POST /api/projects
  A->>DB: insert project
  A->>RO: resolveOssGatewayEndpoint()
  RO-->>A: http://gateway:18789 + token
  A->>RO: waitForGatewayHealth()
  RO->>G: GET /healthz (poll)
  G-->>RO: 200 OK
  A->>V: sync openclaw.json, agents, skills…
  Note over G,V: Gateway entrypoint chờ openclaw.json<br/>rồi bind --bind lan
  G->>V: đọc cùng volume
  U->>W: Chat
  W->>A: WS /api/projects/:id/chat/ws
  A->>G: proxy WebSocket
```

### 1.6 Luồng Cloud (dự kiến — Phase 4)

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant CA as cloud/api
  participant FL as cloud/fleet
  participant D as Docker
  participant GW as openclaw-worker container

  U->>CA: POST /api/projects
  CA->>FL: provision(projectId)
  FL->>D: spawnWorker(image, mounts)
  D-->>GW: container running
  GW-->>FL: hostPort + health
  FL->>CA: update project.hostPort, gatewayToken
  CA-->>U: project status = running
```

### 1.7 Code map (hiện tại)

| Package / file | Vai trò |
|----------------|---------|
| `packages/runtime-contracts/src/runtime-mode.ts` | `RUNTIME_MODE`, `isOssRuntime()` |
| `packages/runtime-contracts/src/gateway-endpoint.ts` | Types + `GatewayConfigError` |
| `packages/runtime-oss/src/oss-gateway.ts` | OSS URL/token resolve |
| `packages/runtime-oss/src/gateway-health.ts` | Poll `/healthz` |
| `apps/api/.../runtime/gateway-endpoint.ts` | Cloud branch + map lỗi → `BadRequestException` |
| `apps/api/.../projects.service.ts` | Gọi resolver + health khi create/start |

---

## 3b. Connectors MCP

Hosted MCP service ở sibling [`../mcp/`](../mcp/) — service thứ 5 trong OSS compose.

```mermaid
flowchart LR
  API[apps/api] -->|sync url + JWT| VOL[openclaw.json]
  VOL --> GW[gateway]
  GW -->|POST streamable-http| MCP[mcp :8388]
  MCP -->|X-Mcp-Service-Secret| API
  MCP --> GOOG[Google APIs]
```

| Thành phần | Path |
|------------|------|
| MCP server | `mcp/src/main.ts` |
| Connectors | `mcp/src/connectors/google/*` |
| Internal secrets API | `apps/api/src/features/internal/mcp-internal.controller.ts` |
| Remote sync | `packages/workspace-sync/src/connector-mcp.ts` |
| Token signing | `packages/control-plane-core/src/mcp/mcp-project-token.ts` |

Unset `AUCOMCP_BASE_URL` on API → fallback `npx` MCP on gateway volume.

---

## 2. Database / Prisma

Package **`@aucobot/database`** = schema + migrations + generated client.  
Nest **`apps/api`** injects **`PrismaService`** (thin wrapper) — business logic stays in services.

### 2.1 Package layout & build

```mermaid
flowchart LR
  subgraph pkg["packages/database"]
    SCHEMA["prisma/schema.prisma"]
    MIG["prisma/migrations/*"]
    SEED["prisma/seed.ts"]
    SRC["src/index.ts<br/>re-export types + factory"]
    GEN["prisma generate"]
  end

  subgraph store["PostgreSQL"]
    PG[(postgres :5432)]
  end

  SCHEMA --> GEN
  GEN --> CLIENT["@prisma/client<br/>(pnpm store)"]
  CLIENT --> SRC
  MIG -->|"migrate deploy / dev"| PG
  SEED -->|"db seed"| PG
```

| Script (root) | Command |
|---------------|---------|
| Migrate dev | `pnpm db:migrate` |
| Seed templates | `pnpm db:seed` |
| Docker start | `pnpm --filter @aucobot/database exec prisma migrate deploy` |

### 2.2 Nest wiring — how `apps/api` gets DB access

```mermaid
flowchart TB
  ENV["DATABASE_URL env"]
  PKG["@aucobot/database<br/>PrismaClient · types · createPrismaPgAdapter"]

  subgraph api["apps/api"]
    PM["PrismaModule<br/>(global export)"]
    PS["PrismaService extends PrismaClient"]
    MW["DbHealthMiddleware<br/>SELECT 1"]
    SVC["Domain services<br/>Auth · Projects · Agents · …"]
    CTRL["Controllers"]
  end

  ENV --> PS
  PKG --> PS
  PM --> PS
  PS --> SVC
  SVC --> CTRL
  PS --> MW
  PS -->|"PrismaPg adapter"| PG[(PostgreSQL)]
```

```typescript
// apps/api/src/core/database/prisma.service.ts — only Nest-specific DB code
PrismaService extends PrismaClient {
  constructor() {
    super({ adapter: createPrismaPgAdapter(process.env.DATABASE_URL!) });
  }
}
```

**Import rules:**

| Import from | Used for |
|-------------|----------|
| `@aucobot/database` | Types, enums (`Project`, `ProjectStatus`, …) |
| `PrismaService` (local) | All queries (`this.prisma.project.findMany`, …) |

### 2.3 ER — OSS tables (current schema)

```mermaid
erDiagram
  User ||--o{ RefreshToken : has
  User ||--o| Project : owns

  Project ||--o{ ProjectAgent : has
  Project ||--o{ ProjectSkill : has
  Project ||--o{ ProjectProviderKey : has
  Project ||--o{ ProjectConnector : has
  Project ||--o{ ProjectChannel : has

  ProjectConnector ||--o{ ProjectConnectorSecret : has
  ProjectChannel ||--o{ ProjectChannelSecret : has

  AgentTemplate {
    string slug PK
  }

  User {
    string id PK
    string login UK
  }

  Project {
    string id PK
    string userId UK
    string gatewayToken
    enum status
  }
```

| Domain | Tables | Service in `apps/api` |
|--------|--------|------------------------|
| Auth | `users`, `refresh_tokens` | `AuthService`, `DefaultUserService` |
| Project shell | `projects` | `ProjectsService` |
| Agents | `agent_templates`, `project_agents` | `ProjectAgentsService` |
| Skills | `project_skills` | `ProjectSkillsService` |
| AI keys | `project_provider_keys` | `ProviderKeysService` |
| Connectors (MCP/OAuth) | `project_connectors`, `…_secrets` | `ProjectConnectorsService` |
| Channels (Telegram, …) | `project_channels`, `…_secrets` | *(schema ready — API TBD)* |

### 2.4 Sequence — create project (DB + disk)

```mermaid
sequenceDiagram
  participant Web
  participant Ctrl as ProjectsController
  participant PS as ProjectsService
  participant WS as ProjectWorkspaceService
  participant Prisma as PrismaService
  participant PG as PostgreSQL
  participant Disk as OPENCLAW_DATA_ROOT

  Web->>Ctrl: POST /api/projects
  Ctrl->>PS: create(userId, dto)
  PS->>Prisma: project.create(CREATING)
  Prisma->>PG: INSERT projects
  PS->>PS: gatewayTokenForNewProject()<br/>env or random
  PS->>WS: bootstrapProjectWorkspace(token)
  WS->>Disk: openclaw.json + workspace/
  PS->>Prisma: project.update(RUNNING, gatewayToken)
  Prisma->>PG: UPDATE projects
  PS-->>Web: ProjectDto
```

**Gateway token resolution at runtime** (not a separate table):

```mermaid
flowchart LR
  ENV["OPENCLAW_GATEWAY_TOKEN env"]
  DB["projects.gateway_token"]
  RES["resolveOssGatewayToken()"]
  CHAT["Chat proxy WS"]
  UI["GET …/gateway-token"]

  ENV -->|"1 priority"| RES
  DB -->|"2 fallback"| RES
  RES --> CHAT
  RES --> UI
```

### 2.5 Sequence — sync config (read DB → write disk)

```mermaid
sequenceDiagram
  participant Svc as Agents/Skills/Connectors service
  participant Prisma as PrismaService
  participant PG as PostgreSQL
  participant WS as ProjectWorkspaceService
  participant Disk as project volume

  Svc->>Prisma: findMany / upsert (project_*)
  Prisma->>PG: SQL
  Svc->>WS: syncProjectRuntime(projectId)
  WS->>Prisma: projectProviderKey, projectAgent,<br/>projectConnector (+ secrets)
  Prisma->>PG: SELECT
  WS->>Disk: merge → openclaw.json
```

DB holds **source of truth** for dashboard config; **OpenClaw gateway** reads **`openclaw.json`** on shared volume — not Prisma directly.

---

## 3. Workspace sync → OpenClaw

🔜 *Sẽ bổ sung khi tách `@aucobot/workspace-sync`.*

---

## 4. Auth + session (web ↔ api)

🔜 *Sẽ bổ sung (cookie, `API_INTERNAL_URL`, middleware).*

---

## 5. Full stack compose

🔜 *Sẽ bổ sung (postgres, api, web, gateway pull).*

---

*Cập nhật diagram: thêm section mới vào mục lục + nội dung tương ứng.*
