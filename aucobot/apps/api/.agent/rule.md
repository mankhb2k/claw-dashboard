# Nguyên tắc Phát triển Backend — AucoBot API

> Áp dụng cho `aucobot/apps/api/`. Mọi code do AI tạo phải tuân thủ.  
> Monorepo: đọc thêm `aucobot/AGENTS.md`, `workflow.md` (root), `aucobot/docs/monorepoplan.md` khi task chạm runtime/sync/cloud.

---

## Tổng quan 6 nhóm (ưu tiên)

| # | Nhóm | Mục tiêu |
|---|------|----------|
| 1 | **Bảo mật** | Auth, phân quyền project, secrets, gateway boundary |
| 2 | **Tái sử dụng & packages** | Logic thuần → package; Nest wiring mỏng ở `apps/api` |
| 3 | **Cấu trúc thư mục** | `core/` vs `features/`, module theo domain |
| 4 | **Data & sync** | DB = nguồn sự thật app; volume = runtime OpenClaw |
| 5 | **API & NestJS** | Controller/DTO/Service, response envelope, validation |
| 6 | **Phạm vi task** | OSS vs Cloud, scope, verify |

---

## 1. Bảo mật

> Checklist khi viết endpoint, service, sync file, proxy WS.

### 1.1 Xác thực (Auth)

- Dashboard dùng **JWT** (access + refresh) — logic token/cookie trong `@aucobot/control-plane-core`.
- Access token: **cookie `httpOnly`** hoặc `Authorization: Bearer` — guard `JwtAuthGuard` trên mọi route protected.
- Production **bắt buộc** `JWT_SECRET` (`main.ts` fail-fast).
- **Cấm** trả refresh token trong body JSON khi đã dùng cookie flow.
- Route public chỉ: `/api/auth/*`, `/api/health`, OAuth callback có thiết kế rõ.

### 1.2 Phân quyền (Authorization) — project-scoped

- Mọi route `/api/projects/:id/*` **phải** gọi `ProjectsService.assertOwned(userId, projectId)` (hoặc `requireOwned` nội bộ service) **trước** khi đọc/ghi dữ liệu.
- Trả `404 Project not found` khi không thuộc user — **không** leak tồn tại project của user khác.
- **Cấm** tin `projectId` / `userId` từ body khi đã có trong JWT — lấy `user.sub` từ `@CurrentUser()`.
- Resource con (attachment, agent slug, provider key): kiểm tra `projectId` + `userId` trong query Prisma.

### 1.3 Ranh giới token — JWT ≠ Gateway token

| Token | Dùng cho | Lưu ở đâu |
|-------|----------|-----------|
| **JWT dashboard** | REST API, WS proxy `/api/projects/:id/chat/ws` | Cookie / Bearer — **không** gửi thẳng gateway `:18789` |
| **Gateway token** | OpenClaw `gateway.auth` | DB `project.gatewayToken` + env `OPENCLAW_GATEWAY_TOKEN` (OSS) + sync `openclaw.json` |

- Chat flow: **web → api (JWT) → gateway (gateway token)** — xem `workflow.md` §5.7.
- WS proxy: xác thực JWT trong `ChatWsRegistrar` trước khi `bridge()` — **cấm** gateway token trong query string từ client.

### 1.4 Secrets & mã hóa

- API key provider, channel token, connector OAuth: **mã hóa at-rest** qua `encryptSecret` / `decryptSecret` (`@aucobot/control-plane-core`).
- List API: chỉ trả **masked** (`maskSecret`); endpoint `reveal` chỉ sau `assertOwned`.
- **Cấm** log plaintext secret, JWT, gateway token, refresh token.
- Env: `PROVIDER_KEY_ENCRYPTION_SECRET` (hoặc fallback `JWT_SECRET`) — không commit `.env`.
- **Cấm** ghi secret vào log Pino, response error, Swagger example.

### 1.5 Validate input & output

- Global `ValidationPipe`: `whitelist`, `forbidNonWhitelisted`, `transform` — **không tắt**.
- Mọi body/query: DTO + `class-validator` + `@ApiProperty` (Swagger).
- **Cấm `any`**; **cấm `@ts-ignore`** — dùng type rõ hoặc `unknown` + narrow.
- Upload (`@fastify/multipart`): giới hạn size (`AVATAR_MAX_BYTES` từ contracts); validate MIME/type trong service.

### 1.6 SQL & Prisma

- Chỉ truy vấn qua **Prisma** — **cấm** raw SQL string interpolation.
- `findFirst({ where: { id, userId } })` cho ownership — không `findUnique` chỉ theo `id` rồi check sau.
- Transaction khi cần atomic (create project + bootstrap): bọc `prisma.$transaction` nếu nhiều bước DB.

### 1.7 Exec / sandbox / shell policy

- Chính sách thực thi lệnh (exec-policy, sandbox) là **ranh giới bảo mật** — sync xuống `openclaw.json`, không chỉ UI.
- Thay đổi policy: validate DTO, `assertOwned`, sync qua `WorkspaceService` — gateway đọc file, không bypass API.

### 1.8 Gateway RPC & chat proxy

- RPC tới gateway: whitelist `CHAT_RPC_WHITELIST` / `isAllowedChatRpc` (`control-plane-core`) — **cấm** forward RPC tùy ý từ client.
- Upstream WS: dùng helper `openGatewayUpstream` — không tự handshake bỏ qua device auth.

### 1.9 CORS, cookie, transport

- CORS: `credentials: true`, origin từ `FRONTEND_URL` — không `*` khi dùng cookie.
- Production: HTTPS + cookie `Secure`, `SameSite` (set trong auth cookie util).
- **Cấm** stack trace / internal path trong response — `HttpExceptionFilter` trả message chung cho 500.

### 1.10 OAuth & redirect

- Connector OAuth (`adapters/google/google-oauth.ts`): validate `state`, chống open redirect.
- Callback URL cố định từ env — không reflect `redirect_uri` từ client.

### 1.11 OSS vs Cloud attack surface

| OSS | Cloud (tương lai) |
|-----|-------------------|
| **Cấm** mount `docker.sock` vào `api` | Spawn qua fleet — **không** đưa vào OSS package |
| Một gateway chung `:18789` | Container per project |
| `RUNTIME_MODE=oss` | `RUNTIME_MODE=cloud` + proprietary fleet |

- Code spawn Docker / billing / multi-tenant **không** thêm vào OSS path trừ khi user yêu cầu rõ.

### 1.12 Logging & error

- Pino (`nestjs-pino`): structured log — **redact** fields nhạy cảm.
- `HttpException`: message user-safe; `internal_error` cho lỗi không mong đợi.
- WebSocket non-HTTP exception: log warn — không leak qua HTTP body.

---

## 2. Tái sử dụng code & packages

> Nguyên tắc: **Discover → Reuse → Extract (package) → Extend**. `apps/api` giữ **mỏng**.

### 2.1 Phân tầng — ai làm gì

| Layer | Path | Được chứa | Cấm |
|-------|------|-----------|-----|
| **Nest wiring** | `apps/api/src/` | Module, Controller, Guard, Pipe, Filter, `@Injectable` service gọi Prisma | Logic thuần không Nest có thể tách |
| **Control plane thuần** | `packages/control-plane-core` | JWT, crypto, gateway upstream, chat whitelist | `@nestjs/*`, Prisma |
| **Workspace sync** | `packages/workspace-sync` | `openclaw.json` merge, compile agent, fs layout | Nest, HTTP |
| **Runtime OSS** | `packages/runtime-oss` | Gateway URL cố định, health poll | Docker spawn |
| **Contracts** | `packages/runtime-contracts` | Types, limits, interfaces | Implementation |
| **Database** | `packages/database` | Prisma schema/client | Business logic |

**Luồng phụ thuộc (cấm đảo ngược):**

```text
Controller  →  Service (apps/api)  →  Prisma / WorkspaceService
                    ↓
              @aucobot/control-plane-core | workspace-sync | runtime-oss
```

- Package **không** import `apps/api` hoặc `apps/web`.
- Nest exception (`BadRequestException`) map tại **boundary** `apps/api` — package throw error thuần.

### 2.2 Workflow trước khi viết code mới

1. Search codebase — endpoint, service, util tương tự
2. Kiểm tra `packages/control-plane-core`, `workspace-sync` đã có helper chưa
3. **Extend** service/controller hiện có trước khi tạo module mới
4. Logic >~50 dòng, không Nest → cân nhắc extract package (Phase 3 — `AGENTS.md`)

### 2.3 Registry pattern (channels, connectors, providers)

- Catalog định nghĩa tại `*-registry.ts` — adapter implement interface chung.
- Controller **không** switch/case theo `providerId` — gọi `resolveProvider` / `resolveChannel`.
- Thêm kênh/provider mới: adapter + registry entry + sync merge — không sửa controller lõi.

### 2.4 Anti-pattern

- Copy `encryptSecret` vào service → import `control-plane-core`
- Ghi `openclaw.json` trực tiếp trong controller → `WorkspaceService`
- Business logic trong guard/interceptor (trừ auth extract)
- `forwardRef` không cần thiết — refactor dependency thay vì vòng tròn

---

## 3. Cấu trúc thư mục

### 3.A — Sơ đồ tổng quan `apps/api/src/`

```text
apps/api/src/
├── main.ts                 # Bootstrap Fastify, global pipe/filter, Swagger
├── app.module.ts           # Root imports
├── app.controller.ts       # /api/health
├── core/                   # Hạ tầng cross-cutting
│   ├── auth/               # AuthModule, JwtAuthGuard, DTO auth, SeedUser
│   ├── database/           # PrismaModule, PrismaService
│   ├── users/              # Profile, avatar upload
│   ├── logging/            # Pino module
│   └── common/
│       ├── decorators/     # @CurrentUser
│       ├── filters/        # HttpExceptionFilter
│       ├── interceptors/   # ResponseInterceptor
│       └── middleware/     # DbHealthMiddleware
└── features/
    └── projects/           # Domain chính — mọi thứ project-scoped
        ├── projects.controller.ts / .module.ts
        ├── services/               # projects.service + spec
        ├── dto/
        ├── workspace/      # Sync DB → volume
        ├── runtime/        # gateway-endpoint, runtime-mode (OSS/Cloud branch tạm)
        ├── agents/
        ├── skills/
        ├── channels/
        ├── connectors/
        ├── ai-providers/
        ├── chat/           # REST + WS registrar + gateway proxy
        ├── cron/
        ├── heartbeat/
        ├── sandbox/
        ├── exec-policy/
        ├── nodes/
        ├── overview/
        ├── agent-ai-editor/
        └── skill-ai-editor/
```

Docker per-project spawn → **`cloud/packages/fleet`** (`@aucobot-cloud/fleet`). **Không** có `docker/` trong OSS `apps/api`.

### 3.B — Quy ước feature module

Mỗi subdomain trong `features/projects/<domain>/`:

**Root strict:** chỉ `*.controller.ts` + `*.module.ts`. Mọi implementation detail vào folder con.

```text
<domain>/
├── <domain>.module.ts
├── <domain>.controller.ts  # Mỏng: guard + assertOwned + delegate
├── services/<service-name>/  # Business logic + unit test
├── dto/
├── lib/                    # constants, types, prompt, util thuần
└── providers/              # (tuỳ) adapter LLM/provider — registry + openai/gemini
```

Ví dụ `agent-ai-editor/` (pilot):

```text
agent-ai-editor/
├── agent-ai-editor.module.ts
├── agent-ai-editor.controller.ts
├── dto/
├── lib/
│   ├── agent-ai-editor.constants.ts
│   ├── agent-ai-editor.types.ts
│   ├── agent-ai-editor.prompt.ts
│   └── agent-ai-editor.prompt.spec.ts
├── providers/
│   ├── agent-ai-editor-registry.ts
│   ├── openai-agent.provider.ts
│   └── gemini-agent.provider.ts
└── services/agent-ai-editor/
    ├── agent-ai-editor.service.ts
    └── agent-ai-editor.service.spec.ts
```

Ví dụ `skill-ai-editor/` (cùng pattern):

```text
skill-ai-editor/
├── skill-ai-editor.module.ts
├── skill-ai-editor.controller.ts
├── dto/
├── lib/
│   ├── skill-ai-editor.constants.ts
│   ├── skill-ai-editor.types.ts
│   ├── skill-ai-editor.prompt.ts
│   └── skill-ai-editor.prompt.spec.ts
├── providers/
│   ├── skill-ai-editor-registry.ts
│   ├── model-id.util.ts
│   ├── openai-assistant.provider.ts
│   └── gemini-assistant.provider.ts
└── services/skill-ai-editor/
    ├── skill-ai-editor.service.ts
    └── skill-ai-editor.service.spec.ts
```

Ví dụ `agents/` (multi-controller + shared model resolve):

```text
agents/
├── agents.module.ts
├── agent.controller.ts
├── agent-api-keys.controller.ts
├── collaboration.controller.ts
├── dto/
├── lib/
│   └── agent-slug.ts
└── services/
    ├── agent/
    ├── agent-api-keys/
    └── collaboration/
```

Catalog types + `resolveEffectiveAgentModel` → **`@aucobot/shared`** (`packages/shared/src/models/`). Loader `loadProjectModelCatalog` vẫn ở `chat/lib/project-model-catalog.ts` (Prisma/Workspace).

Ví dụ `ai-providers/`:

```text
ai-providers/
├── ai-providers.module.ts
├── provider-keys.controller.ts
├── providers-catalog.controller.ts
├── dto/
├── lib/
│   ├── provider-registry.types.ts
│   ├── provider-registry.ts
│   └── provider-key-test.ts
├── adapters/
│   ├── openai/
│   └── gemini/
└── services/provider-keys/
```

`OPENAI_CHAT_MODELS`, `GEMINI_CHAT_MODELS` + `*.types.ts` → **`@aucobot/shared`**. Root strict: chỉ module + controller.

Ví dụ `channels/`:

```text
channels/
├── channels.module.ts
├── channels.controller.ts
├── channels-catalog.controller.ts
├── dto/
├── lib/
│   ├── channel-adapter.types.ts
│   ├── channel-registry.ts
│   └── channels.types.ts
├── adapters/
│   ├── telegram/
│   └── discord/
└── services/channels/
```

`OPENCLAW_CHANNEL_DEFS` (skeleton id/docs/kind) + access validation helpers → **`@aucobot/shared`**. `CHANNEL_REGISTRY` (API) chỉ gồm adapter đã implement. `ChannelsModule` exports `ChannelsService`; `ProjectsModule` re-export `ChannelsModule`.

Ví dụ `connectors/`:

```text
connectors/
├── connectors.module.ts
├── connectors.controller.ts
├── connectors-catalog.controller.ts
├── connectors-oauth.controller.ts
├── dto/
├── lib/
│   ├── connector-adapter.types.ts
│   ├── connector-registry.ts
│   └── connectors.types.ts
├── adapters/
│   └── google/
│       ├── google-oauth.ts
│       ├── google-drive.connector.ts
│       └── google-calendar.connector.ts
└── services/project-connectors/
```

`ConnectorKind` → **`@aucobot/shared`**. `CONNECTOR_REGISTRY` (API) chỉ gồm adapter đã implement. `ConnectorsModule` exports `ProjectConnectorsService`; `ProjectsModule` re-export `ConnectorsModule`.

Ví dụ `chat/`:

```text
chat/
├── chat.module.ts
├── chat.controller.ts
├── chat-attachments.controller.ts
├── dto/
├── lib/
│   ├── chat.types.ts
│   ├── project-model-catalog.ts
│   ├── chat-attachment-upload.util.ts
│   └── chat-ws/
│       ├── chat-ws.registrar.ts
│       └── chat-ws.registrar.spec.ts
├── storage/
│   ├── chat-attachment-storage.provider.ts
│   └── local-chat-attachment.storage.ts
└── services/
    ├── chat-agents/
    ├── chat-model/
    ├── chat-attachments/
    └── chat-gateway-proxy/
```

Shell `features/projects/` (project CRUD):

```text
features/projects/
├── services/projects/
│   ├── projects.service.ts
│   └── projects.service.spec.ts
├── projects.controller.ts
├── projects.module.ts
└── dto/
```

**Import service:** `from './services/chat-agents/chat-agents.service'` (cùng domain) hoặc `from '../agents/services/agent/agent.service'` (cross-domain). Từ `services/<name>/` lên `core/` hoặc domain khác: thêm một `../` so với khi file nằm trực tiếp trong `services/`.

| File | Vai trò |
|------|---------|
| **Controller** | HTTP map, `@UseGuards(JwtAuthGuard)`, `assertOwned`, không Prisma trực tiếp |
| **Service** | Logic, Prisma, gọi `WorkspaceService.sync*`, gateway RPC |
| **DTO** | Input validation — không logic |
| **Module** | `imports: [AuthModule, WorkspaceModule, …]`, `exports` service cần share |

### 3.C — Đặt tên route

- Global prefix: `api` (`main.ts`)
- Project routes: `@Controller('projects')` + `@Get(':id/agents')` — **nhất quán** `:id` = projectId
- Swagger: `@ApiTags`, `@ApiBearerAuth` trên controller protected

### 3.D — `core/` — không feature logic

- `core/auth`, `core/users`: identity toàn app
- `core/common`: decorator, filter, interceptor dùng global
- **Cấm** đặt logic agent/skill/channel vào `core/`

---

## 4. Data & sync (DB ↔ volume)

> SSOT vận hành: `workflow.md` §3, §5.6.

### 4.1 Hai nguồn sự thật

| Lưu DB (PostgreSQL) | Sync sang volume (OpenClaw đọc) |
|---------------------|----------------------------------|
| User, JWT, project metadata | `openclaw.json` (providers, channels, gateway.auth) |
| Agent formData, skill draft | `AGENTS.md`, `SOUL.md`, `workspace/skills/*/SKILL.md` |
| Encrypted secrets (ciphertext) | Plain env trong `openclaw.json` (gateway process) |
| UI state, revision | Heartbeat files, cron config merge |

- **Khi user Save** → ghi DB → **sync file** (`WorkspaceService`) — **không** sync mỗi tin nhắn chat.
- OpenClaw **không đọc PostgreSQL** — chỉ file trên `OPENCLAW_DATA_ROOT`.

### 4.1.1 LLM API keys — **chỉ** qua `openclaw.json` (`env`)

> **Chính sách cố định:** AUCOBOT có **một** đường đưa foundation provider API key xuống OpenClaw gateway — block `env` trong `{projectId}/openclaw.json`. **Không** dùng cơ chế song song.

#### Luồng chuẩn (bắt buộc)

```text
UI Save provider key
  → DB project_provider_keys (ciphertext, ProviderKeysService)
  → WorkspaceService.syncProjectRuntime()
  → mergeProviderKeysIntoConfig() (@aucobot/workspace-sync)
  → openclaw.json → "env": { "DEEPSEEK_API_KEY": "sk-...", ... }
  → Gateway load openclaw.json → inject env vào process (OpenClaw config/io)
  → resolveApiKeyForProvider() đọc DEEPSEEK_API_KEY từ process.env
```

- **SSOT app:** PostgreSQL `project_provider_keys` (mã hóa at-rest).
- **SSOT runtime OpenClaw:** `openclaw.json` → `env` — gateway **không** đọc DB.
- **Mapping env key:** `provider-registry.ts` field `envKey` trên mỗi `ProviderDefinition` (ví dụ `deepseek` → `DEEPSEEK_API_KEY`). Danh sách key được merge: `packages/workspace-sync/src/config/provider-env-keys.ts` (`PROVIDER_ENV_KEYS`).
- **Ghi file:** chỉ qua `writeOpenClawConfigJson` sau `mergeProviderKeysIntoConfig` — **cấm** controller/service ghi plaintext key ra path khác.
- Provider **disabled** hoặc xóa key → merge **gỡ** entry tương ứng khỏi `env` (không để key cũ sót lại).

#### Ví dụ trên volume

```json
{
  "env": {
    "DEEPSEEK_API_KEY": "sk-...",
    "OPENAI_API_KEY": "sk-..."
  },
  "agents": { "defaults": { "model": { "primary": "deepseek/deepseek-v4-flash" } } },
  "plugins": { "entries": { "deepseek": { "enabled": true } } }
}
```

#### Cấm — không dùng các cách khác cho LLM API key

| Cách | Lý do cấm |
|------|-----------|
| `agents/{agentId}/agent/auth-profiles.json` | Trùng nguồn sự thật; OpenClaw CLI/onboard path — **không** sync từ AUCOBOT |
| `models.providers.*.apiKey` plaintext trong config | Trùng với `env`; khó rotate và audit một chỗ |
| File `.env` / `dotenv` trong project volume | Legacy — `removeLegacyDotEnv` xóa khi sync; **cấm** tái giới thiệu |
| Gắn `DEEPSEEK_API_KEY` trực tiếp vào Docker `environment` gateway (ngoài config project) | Không per-project; lệch `OPENCLAW_DATA_ROOT` |
| OAuth / onboard CLI (`openclaw onboard`) trong SaaS | User-facing flow khác; credential không thuộc dashboard DB |

**Lưu ý OpenClaw worker:** `resolveApiKeyForProvider` vẫn *có thể* đọc auth profile nếu file tồn tại (thứ tự profile-first). AUCOBOT **không tạo/không ghi** `auth-profiles.json` — chỉ dựa vào `openclaw.json` `env` sau khi gateway load config.

#### Phạm vi áp dụng / ngoại lệ

| Loại secret | Cơ chế sync |
|-------------|-------------|
| Foundation LLM keys (`ai-providers`) | **`openclaw.json` `env` only** (mục này) |
| Gateway token | `openclaw.json` `gateway.auth` (+ DB `project.gatewayToken`) |
| Channel tokens (Telegram, Discord, …) | Merge slice từ `CHANNEL_REGISTRY` → `openclaw.json` |
| Connector OAuth (Google Drive, …) | Merge slice connector — **không** nhét vào `env` LLM |

#### Smoke test vs runtime

- **Test key** (`provider-key-test.ts`, adapters): gọi API provider trực tiếp từ API process — **không** ghi disk.
- **Chat runtime**: gateway đọc key từ `openclaw.json` `env` sau sync — test pass **không** thay thế sync.

#### Checklist khi chạm provider keys

- [ ] Key lưu DB qua `encryptSecret`; list chỉ masked
- [ ] Sync qua `mergeProviderKeysIntoConfig` → `openclaw.json` `env`
- [ ] **Không** thêm writer `auth-profiles.json` hoặc per-agent key file
- [ ] `envKey` mới: cập nhật `provider-registry.ts` + `PROVIDER_ENV_KEYS` + merge spec
- [ ] Sau deploy sync: gateway cần reload config (restart hoặc config reload) để `env` có hiệu lực

### 4.2 Quy trình sync chuẩn

1. `assertOwned` / validate DTO
2. Prisma write (transaction nếu cần)
3. `workspace.syncProjectRuntime(projectId)` hoặc merge cụ thể (`mergeChannelsIntoConfig`, …)
4. (Tuỳ) ping gateway health — không block UX nếu optional

### 4.3 Prisma & migration

- Schema: `packages/database` — chạy migrate từ app api (`prisma migrate`).
- **Cấm** sửa DB tay production — migration có tên mô tả.
- Breaking migration: document trong README / task — không silent drop.

### 4.4 OSS volume layout

```text
{OPENCLAW_DATA_ROOT}/{projectId}/
├── openclaw.json
└── workspace/
    ├── agents/...
    └── skills/...
```

- `WorkspaceService.resolveProjectDataDir(projectId)` — **một** entry point path.

---

## 5. API & NestJS patterns

### 5.1 Response envelope

Mọi HTTP JSON (qua `ResponseInterceptor`):

```json
{ "success": true, "data": { ... }, "error": null }
```

- Lỗi: `HttpExceptionFilter` → `{ success: false, data: null, error: { code, message } }`
- **Cấm** return shape lẫn lộn — controller return data thuần, interceptor bọc.

### 5.2 Controller mẫu (project-scoped)

```typescript
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ExampleController {
  @Get(':id/example')
  async get(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    await this.projects.assertOwned(user.sub, id);
    return this.exampleService.get(id);
  }
}
```

### 5.3 DTO mẫu

- `class-validator` decorators + `@ApiProperty`
- Optional field: `@IsOptional()` + type rõ
- Enum: `@IsEnum` hoặc union validated

### 5.4 Service mẫu

- Inject `PrismaService`, `WorkspaceService`, service domain khác
- Throw Nest exceptions: `NotFoundException`, `BadRequestException`, `ConflictException`, `ForbiddenException`
- Logger: `private readonly log = new Logger(XxxService.name)` — không `console.log`

### 5.5 WebSocket (chat proxy)

- Đăng ký route trong `OnApplicationBootstrap` (`ChatWsRegistrar`) — không `@Controller` WS
- Auth giống REST: extract + verify JWT
- Close code có nghĩa: `1008` unauthorized, `1013` project not running

### 5.6 Testing

- Unit test: `*.spec.ts` cạnh service/util — mock Prisma, không DB thật
- Test pure logic trong package tại package đó
- Chạy: `pnpm --filter @aucobot/api test` (nếu có script)

### 5.7 TypeScript

- **Cấm `any`**, **cấm `@ts-ignore`**
- Fastify types: mở rộng trong `src/types/` khi cần
- Import workspace packages: `@aucobot/control-plane-core`, `@aucobot/workspace-sync`, `@aucobot/database`, `@aucobot/shared`

---

## 6. Phạm vi task

### 6.1 Nguyên tắc

- **Một task → một phạm vi rõ** — module/feature hoặc package extract
- **Diff tối thiểu** — không refactor ngoài scope
- **Move/copy** sang package trước khi rewrite kiến trúc (`AGENTS.md` Phase 3)

### 6.2 Trong phạm vi (API task thông thường)

```text
aucobot/apps/api/src/
aucobot/packages/control-plane-core/   # nếu extract logic thuần
aucobot/packages/workspace-sync/     # nếu chạm sync file
aucobot/packages/database/           # nếu chạm schema
```

### 6.3 Cấm (trừ khi user yêu cầu rõ)

| Cấm | Lý do |
|-----|--------|
| Sửa `apps/web/`, `cloud/*` (trừ contract chung) | Ngoài backend scope |
| Thêm npm dependency | Review + bề mặt tấn công |
| Docker spawn / `docker.sock` trong OSS | `workflow.md` §2 |
| Cloud billing/fleet trong `runtime-oss` | Ranh OSS/Cloud |
| Drive-by format, rename lan man | Khó review |
| Markdown/doc mới | Chỉ khi user yêu cầu |
| Commit / push git | Chỉ khi user yêu cầu |

### 6.4 Verify trước khi hoàn thành

Từ `aucobot/`:

```bash
pnpm --filter @aucobot/runtime-contracts build   # nếu chạm contracts
pnpm --filter @aucobot/runtime-oss build         # nếu chạm runtime-oss
pnpm --filter @aucobot/control-plane-core build  # nếu chạm core package
pnpm --filter @aucobot/workspace-sync build      # nếu chạm sync
pnpm --filter @aucobot/api build
```

Compose E2E (khi chạm sync/gateway): `docker compose -f deploy/docker-compose.yml up -d --build`

### 6.5 Template task (AI tự điền)

```text
Task: [một câu]
Scope: aucobot/apps/api/src/features/projects/<domain>/
Out of scope: apps/web, cloud/, unrelated refactor, new deps
Verify: pnpm --filter @aucobot/api build
Rule: apps/api/.agent/rule.md §[liên quan]
Diagram: workflow.md §[n] hoặc monorepo-diagram.md
```

### 6.6 Đọc trước khi code (onboarding)

| Doc | Khi |
|-----|-----|
| `workflow.md` | Sync, chat proxy, OSS vs Cloud, channels |
| `aucobot/AGENTS.md` | Monorepo commands, package map |
| `aucobot/docs/monorepoplan.md` | Folder roles, Phase extract |
| `packages/control-plane-core/README.md` | JWT, crypto, gateway upstream |
| `apps/api/README.md` | Env, migrate, chạy local |

---

## Phụ lục — Checklist nhanh cho endpoint mới

- [ ] `@UseGuards(JwtAuthGuard)` (hoặc public có lý do)
- [ ] `await projects.assertOwned(user.sub, projectId)` nếu project-scoped
- [ ] DTO + ValidationPipe
- [ ] Service — không logic trong controller
- [ ] Secret: encrypt at-rest, masked in list
- [ ] Cần OpenClaw thấy? → sync qua `WorkspaceService`
- [ ] LLM API key? → **chỉ** `openclaw.json` `env` (§4.1.1) — không `auth-profiles.json`
- [ ] Response qua envelope — không custom shape lỗi
- [ ] Không log secret / PII
- [ ] `pnpm --filter @aucobot/api build` pass
