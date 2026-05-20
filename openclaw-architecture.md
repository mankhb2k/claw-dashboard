# OpenClaw — Kiến Trúc Tổng Quan Chi Tiết

> Tài liệu này mô tả toàn diện kiến trúc, cách hoạt động, các kênh, gateway, model provider, tools, plugin và các tính năng của OpenClaw.

---

## 1. OpenClaw Là Gì?

**OpenClaw** là một **self-hosted gateway** (cổng tự lưu trữ) kết nối các ứng dụng chat và kênh nhắn tin (WhatsApp, Telegram, Discord, Slack, v.v.) với **AI agent** được tích hợp sẵn (dựa trên Pi/pi-mono). Người dùng chạy một tiến trình Gateway duy nhất trên máy tính cá nhân hoặc máy chủ, và nó trở thành cầu nối giữa ứng dụng nhắn tin và trợ lý AI luôn sẵn sàng.

**Triết lý thiết kế:**

- **Local-first** — chạy trên phần cứng của bạn, theo quy tắc của bạn
- **Multi-channel** — một Gateway phục vụ nhiều kênh đồng thời
- **Agent-native** — được xây dựng cho AI agent với tool use, sessions, memory, multi-agent routing
- **Open source** — MIT license, cộng đồng phát triển

**Đối tượng:** Developers và power users muốn trợ lý AI cá nhân có thể nhắn tin từ bất cứ đâu mà không mất quyền kiểm soát dữ liệu hoặc phụ thuộc vào dịch vụ hosted.

---

## 2. Sơ Đồ Kiến Trúc Tổng Thể

```mermaid
flowchart TB
    subgraph CHANNELS["📡 Channels (Chat Apps)"]
        direction LR
        WA["WhatsApp\n(Baileys/QR)"]
        TG["Telegram\n(grammY)"]
        DC["Discord\n(Bot API)"]
        SL["Slack\n(Bolt SDK)"]
        GC["Google Chat\n(Webhook)"]
        SI["Signal\n(signal-cli)"]
        IM["iMessage\n(BlueBubbles)"]
        MT["Matrix\n(bundled plugin)"]
        MS["MS Teams\n(bundled plugin)"]
        OT["...24+ others"]
    end

    subgraph GATEWAY["🦞 OpenClaw Gateway (port 18789)"]
        direction TB
        WS["WebSocket Server\n(Control Plane / RPC)"]
        HTTP["HTTP Server\n/v1/* (models chat completions responses embeddings)\n/tools/invoke\n/sessions/.../history | /kill\n/api/chat/media/outgoing/…"]
        CANVAS["Canvas Host\n/__openclaw__/canvas/\n/__openclaw__/a2ui/"]
        VOICE["VoiceClaw Realtime\n/voiceclaw/realtime"]
        AUTH["Auth Layer\n(token / password /\ntrusted-proxy / Tailscale)"]
        ROUTER["Message Router\n(session key / bindings)"]
        QUEUE["Queue / Debounce\n(per sender)"]
        SCHED["Cron / Scheduler"]
        HOOKS["Hooks / Lifecycle"]
        PLUGINS["Plugin Registry\n(loader / registry)"]
    end

    subgraph AGENT["🤖 Pi Agent Runtime"]
        direction TB
        SESSION["Session Manager\n(JSONL transcripts)"]
        TOOLLOOP["Tool Loop\n(streaming)"]
        PROMPT["Prompt Builder\n(AGENTS.md / SOUL.md\n/ TOOLS.md / skills)"]
        MEMORY["Memory\n(active memory plugin)"]
        SUBAGENTS["Sub-agents /\nMulti-agent Routing"]
    end

    subgraph PROVIDERS["🧠 Model Providers"]
        direction LR
        OAI["OpenAI\ngpt-5.5, gpt-5.4-mini"]
        ANT["Anthropic\nclaude-opus-4-6/4-7"]
        GGL["Google\ngemini-3.1-pro"]
        OLM["Ollama\n(local)"]
        DSK["DeepSeek"]
        XAI["xAI\ngrok-4"]
        ORT["OpenRouter\n(proxy)"]
        MORE["...80+ providers"]
    end

    subgraph NODES["📱 Nodes (Companion Devices)"]
        direction LR
        IOS["iOS Node\n(canvas / voice)"]
        AND["Android Node\n(canvas / camera\n/ device / screen)"]
        MAC["macOS App\n(menu bar / canvas\n/ voice wake)"]
        HEAD["Headless Node\n(system.run)"]
    end

    subgraph CLIENTS["💻 Control Plane Clients"]
        CLI["CLI\n(openclaw ...)"]
        WEB["Web Control UI\n(browser dashboard)"]
        WEBCHAT["WebChat\n(gateway-hosted)"]
        MCP_C["MCP Client\n(stdio / sse)"]
    end

    %% Channel → Gateway
    CHANNELS -->|"inbound messages\n(webhooks / WS / API)"| GATEWAY
    GATEWAY -->|"outbound replies\n(chunked + threaded)"| CHANNELS

    %% Gateway internals
    WS --- AUTH
    HTTP --- AUTH
    AUTH --- ROUTER
    ROUTER --- QUEUE
    QUEUE --- AGENT

    %% Agent → Providers
    AGENT -->|"provider/model API\n(HTTP/WS)"| PROVIDERS

    %% Nodes connect via WS
    NODES -->|"WS (role: node)\ndevice pairing"| WS

    %% Clients connect via WS
    CLIENTS -->|"WS / HTTP"| WS
    CLIENTS -->|"HTTP"| HTTP

    %% Plugin system wires into Gateway
    PLUGINS -.->|"channels / providers\n/ tools / hooks"| GATEWAY
    PLUGINS -.->|"tools / providers"| AGENT
```

---

## 3. Hệ Thống Channel (Kênh Kết Nối)

### 3.1 Kết Nối Đồng Thời Nhiều Kênh

**Có — các kênh có thể chạy đồng thời**. Một Gateway duy nhất quản lý tất cả kết nối kênh và route per chat. Bạn có thể cấu hình WhatsApp + Telegram + Discord + Slack cùng lúc; mỗi kênh nhận và gửi tin nhắn độc lập qua cùng một agent.

```
"Channels can run simultaneously; configure multiple and OpenClaw will route per chat."
— docs/channels/index.md
```

### 3.2 Danh Sách Đầy Đủ Các Kênh Được Hỗ Trợ

| Kênh                  | Loại            | Phương thức kết nối            | Ghi chú                              |
| --------------------- | --------------- | ------------------------------ | ------------------------------------ |
| **WhatsApp**          | Built-in        | Baileys library + QR pairing   | Phổ biến nhất; cần quét QR           |
| **Telegram**          | Built-in        | Bot API via grammY             | Setup nhanh nhất (chỉ cần bot token) |
| **Discord**           | Built-in        | Discord Bot API + Gateway      | Hỗ trợ servers, channels, DMs        |
| **Signal**            | Built-in        | signal-cli                     | Tập trung vào bảo mật                |
| **Google Chat**       | Built-in        | Google Chat API (HTTP webhook) | Workspace app                        |
| **IRC**               | Built-in        | IRC protocol                   | Classic; channels + DMs              |
| **iMessage (legacy)** | Built-in        | imsg CLI                       | Deprecated, dùng BlueBubbles         |
| **WebChat**           | Built-in        | Gateway WebSocket UI           | Dashboard tích hợp                   |
| **BlueBubbles**       | Bundled plugin  | REST API (macOS server)        | **Khuyến nghị cho iMessage**         |
| **Feishu / Lark**     | Bundled plugin  | WebSocket                      | Doanh nghiệp Trung Quốc              |
| **LINE**              | Bundled plugin  | LINE Messaging API             |                                      |
| **Matrix**            | Bundled plugin  | Matrix protocol                | Decentralized                        |
| **Mattermost**        | Bundled plugin  | Bot API + WebSocket            | Self-hosted Slack alternative        |
| **Microsoft Teams**   | Bundled plugin  | Bot Framework                  | Enterprise support                   |
| **Nextcloud Talk**    | Bundled plugin  | Nextcloud Talk API             | Self-hosted                          |
| **Nostr**             | Bundled plugin  | NIP-04 DMs                     | Decentralized                        |
| **QQ Bot**            | Bundled plugin  | QQ Bot API                     | China; private + group + rich media  |
| **Synology Chat**     | Bundled plugin  | Webhooks (in/out)              | NAS-based                            |
| **Tlon**              | Bundled plugin  | Urbit-based                    |                                      |
| **Twitch**            | Bundled plugin  | IRC connection                 | Stream chat                          |
| **Zalo**              | Bundled plugin  | Zalo Bot API                   | Vietnam phổ biến                     |
| **Zalo Personal**     | Bundled plugin  | QR login                       | Tài khoản cá nhân                    |
| **WeChat**            | External plugin | iLink Bot / QR login           | Chỉ private chats                    |
| **Voice Call**        | External plugin | Plivo / Twilio telephony       | Cần cài thêm                         |

### 3.3 Cách Một Kênh Xử Lý Tin Nhắn

```mermaid
sequenceDiagram
    participant User as 👤 User (WhatsApp/Telegram/...)
    participant Channel as 📡 Channel Connector
    participant Gateway as 🦞 Gateway
    participant Queue as 📋 Queue / Debounce
    participant Agent as 🤖 Pi Agent
    participant Model as 🧠 LLM Provider

    User->>Channel: Gửi tin nhắn
    Channel->>Gateway: Inbound event (dedupe check)
    Gateway->>Queue: Resolve session key → enqueue
    Note over Queue: Debounce 2-5s<br/>(text-only messages)
    Queue->>Agent: Start agent run
    Agent->>Model: Chat API call (streaming)
    Model-->>Agent: Token streaming
    Agent->>Agent: Tool calls (if needed)
    Agent-->>Gateway: Reply chunks
    Gateway-->>Channel: Outbound reply (chunked)
    Channel-->>User: Hiển thị reply
```

### 3.4 Group Chat & DM Policy

- **DM pairing** (`dmPolicy="pairing"`): Mặc định — người gửi không xác định nhận code và bot không xử lý tin nhắn đó cho đến khi được approve.
- **DM open** (`dmPolicy="open"`): Opt-in — mở hoàn toàn, phải set `allowFrom: ["*"]`.
- **Groups**: Có thể yêu cầu mention (`requireMention: true`).
- Approve: `openclaw pairing approve <channel> <code>`

---

## 4. Gateway — Control Plane

### 4.1 Định Nghĩa

Gateway là **một tiến trình luôn chạy** (long-lived process) đóng vai trò:

- Trung tâm định tuyến tất cả kết nối kênh
- Control plane cho sessions, tools, events
- HTTP server với API tương thích OpenAI
- WebSocket server cho clients và nodes
- Scheduler (cron), hook engine, plugin host

**Port mặc định:** `18789` (bind: loopback)

**Pin upstream (tham chiếu khi đọc tài liệu này):** commit `110042d840` trên `openclaw/openclaw` (`main`), đồng bộ với repo vendored `openclaw-worker` trong monorepo.

### 4.2 Các Endpoint HTTP

Cùng port với Gateway (HTTP multiplex với WebSocket). Danh sách dưới đây khớp dispatcher trong `openclaw-worker/src/gateway/server-http.ts` và tài liệu `docs/gateway/` (có thể thay đổi theo bản fork).

| Endpoint                              | Phương thức | Mô tả                                                                 |
| ------------------------------------- | ----------- | --------------------------------------------------------------------- |
| `/v1/models`                          | GET         | Danh sách models (OpenAI-compatible)                                  |
| `/v1/models/{id}`                     | GET         | Chi tiết một model                                                    |
| `/v1/chat/completions`                | POST        | Chat completions (OpenAI-compatible)                                  |
| `/v1/responses`                       | POST        | Agent responses API                                                   |
| `/v1/embeddings`                      | POST        | Embeddings                                                            |
| `/tools/invoke`                       | POST        | Gọi **một** tool trực tiếp (policy + auth gateway; payload tối đa ~2 MB) |
| `/sessions/{sessionKey}/history`      | GET         | Lịch sử / transcript session (hỗ trợ SSE tùy `Accept`)               |
| `/sessions/{sessionKey}/kill`         | POST        | Hủy run / session theo khóa session (operator scopes)                 |
| `/api/chat/media/outgoing/…`          | GET         | Ảnh đính kèm do gateway quản lý (OpenAI-compat / chat pipeline; xem `managed-image-attachments.ts`) |
| `/__openclaw__/canvas/…`              | *           | Canvas host                                                           |
| `/__openclaw__/a2ui/…`                | *           | A2UI host                                                             |
| `/voiceclaw/realtime`                 | *           | Voice realtime (WebSocket upgrade)                                    |

**Ghi chú quan trọng**

- **`POST /tools/invoke`**: luôn bật; dùng cùng lớp auth HTTP với các API tương thích OpenAI. Với `gateway.auth.mode` là `token` hoặc `password`, `Authorization: Bearer …` được coi là **quyền operator đầy đủ** trên instance (không phải multi-tenant user scope). Không nên public Internet trừ khi có biên tin cậy (tailnet, reverse proxy, mTLS, v.v.). Chi tiết: `docs/gateway/tools-invoke-http-api.md`. Với **`trusted-proxy`**: request phải tới từ **trusted proxy đã cấu hình**; proxy loopback trên cùng host chỉ hợp lệ nếu bật `gateway.auth.trustedProxy.allowLoopback`; caller nội bộ có thể dùng `password` / `OPENCLAW_GATEWAY_PASSWORD` làm lối trực tiếp; nếu có bằng chứng header `Forwarded` / `X-Forwarded-*` / `X-Real-IP`, luồng vẫn được xử lý như trusted-proxy (theo doc cùng file).
- **Không có** endpoint HTTP kiểu `POST /config/reload` hay REST riêng để “ép reload config”. Cập nhật `openclaw.json` chủ yếu qua **theo dõi file** và/hoặc **RPC trên WebSocket** (mục 4.5.1).
- Plugin có thể đăng ký route HTTP bổ sung (auth bypass / scope theo cấu hình).
- Webhook automation: các đường dẫn kiểu `/hooks/…` (wake, agent, …) vẫn được dùng trong tài liệu hooks — không liệt kê đầy đủ trong bảng trên.

### 4.3 WebSocket Protocol

```
Client → Gateway: connect frame (auth + device identity)
Gateway → Client: hello-ok (presence + health snapshot)
         event:presence
         event:tick

Client → Gateway: req(method, params) [idempotency key required for side-effects]
Gateway → Client: res(ok|error)
         event:agent (streaming)
         event:chat
         event:session.message
         event:session.tool
         event:sessions.changed
         event:heartbeat
         event:shutdown
```

**Agent runs — hai giai đoạn:**

1. Immediate accepted ack (`status: "accepted"`, trả về `runId`)
2. Final completion response (`status: "ok"|"error"`) + streamed `agent` events giữa hai giai đoạn

### 4.4 Auth Gateway

| Mode            | Mô tả                                                    |
| --------------- | -------------------------------------------------------- |
| `token`         | Shared secret token (`OPENCLAW_GATEWAY_TOKEN`)           |
| `password`      | Password-based (`OPENCLAW_GATEWAY_PASSWORD`)             |
| `trusted-proxy` | Reverse proxy + header định danh; cấu hình tin cậy nguồn + tuỳ chọn `allowLoopback` (xem `docs/gateway/tools-invoke-http-api.md`, `docs/gateway/configuration.md`) |
| `tailscale`     | Tailscale identity (`gateway.auth.allowTailscale: true`) |
| `none`          | Không auth (chỉ loopback test)                           |

### 4.5 Hot Reload

| Mode               | Hành vi                             |
| ------------------ | ----------------------------------- |
| `off`              | Không reload                        |
| `hot`              | Chỉ apply hot-safe changes          |
| `restart`          | Restart khi cần                     |
| `hybrid` (default) | Hot-apply khi safe, restart khi cần |

#### 4.5.1 File `openclaw.json`, tái tải cấu hình & RPC `config.*`

Đây là phần bổ sung từ `docs/gateway/configuration.md` và mã gateway (`config-reload-plan.ts`, watcher `chokidar`), để tránh nhầm “có API REST reload”.

- **Ghi file trực tiếp**: Gateway **theo dõi** file cấu hình (`OPENCLAW_CONFIG_PATH` hoặc mặc định trong state dir). Khi `openclaw.json` thay đổi hợp lệ, thay đổi được áp dụng theo **kế hoạch reload** (reload rules): một số nhánh **hot-apply**, một số cần **restart** kênh/gateway tùy prefix (ví dụ plugin kênh, hooks, v.v.). Trường hợp đặc biệt: `gateway.reload` và `gateway.remote` — đổi **không** kích hoạt restart (theo ghi chú trong doc).
- **Không có** HTTP GET/POST chuyên biệt kiểu `/config/reload` trên server HTTP gateway; “reload” ở đây là hành vi nội bộ sau khi file đổi hoặc sau RPC.
- **Cập nhật qua Control Plane (RPC, không phải bảng HTTP ở §4.2)**: cho tool/CLI tương tác với gateway đang chạy, doc khuyến nghị luồng:
  - `config.schema.lookup` — xem schema theo path
  - `config.get` — snapshot hiện tại + `hash`
  - `config.patch` — merge patch (cần `baseHash` khi đã có config)
  - `config.apply` — thay toàn bộ config khi có chủ đích
  - `update.run` / `update.status` — cập nhật bản thân gateway + restart sentinel
- **Rate limit** (theo doc): các thao tác control-plane ghi (`config.apply`, `config.patch`, `update.run`) bị giới hạn tần suất theo `deviceId` + IP; restart được gom và có cooldown giữa các chu kỳ restart.

Gọi RPC thường qua **`openclaw gateway call <method>`** hoặc client WebSocket; không đồng nhất với chỉ JWT của ứng dụng SaaS — xem §4.7.

### 4.6 Multi-Gateway Setup

Mỗi host thường chạy **một gateway**. Một gateway có thể host nhiều agents và channels. Nếu cần isolation:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

### 4.7 Gợi ý tích hợp OpenClaw SaaS (Phase 1 / Phase 2)

Áp dụng khi control plane (Nest/Node…) và frontend chỉ đồng bộ metadata, còn **openclaw-worker** chạy gần dữ liệu người dùng (self-host hoặc VM).

| Giai đoạn   | Cách đồng bộ với worker | Auth                                                                 |
| ----------- | ------------------------ | -------------------------------------------------------------------- |
| **Phase 1** | **Chỉ ghi file** vào volume mount trùng path gateway đọc (`openclaw.json`, workspace `AGENTS.md` / `SOUL.md` / …). Gateway tự áp dụng khi file hợp lệ (§4.5.1). Không bắt buộc gọi HTTP reload. | **JWT** (hoặc session) cho API **SaaS** — xác thực user/tenant khi chỉnh project; worker **không** dùng JWT đó trừ khi bạn tự làm proxy map sang gateway auth. |
| **Phase 2** | Tuỳ chọn: gọi **`config.patch` / `config.apply`** qua RPC (cần credential operator của gateway), hoặc tiếp tục ghi file. **`POST /tools/invoke`** cho automation tool-level; cùng yêu cầu **gateway auth** (token/password/trusted-proxy/…). | Tách bạch: JWT = biên SaaS; `OPENCLAW_GATEWAY_TOKEN` (v.v.) = biên operator worker. Chỉ nối hai lớp qua dịch vụ nội bộ / proxy tin cậy. |

**Tóm tắt**: Phase 1 an toàn và đơn giản nhất là **sync file + mount**. Phase 2 thêm RPC HTTP-compat (`/tools/invoke`) hoặc patch config qua WS khi cần và khi đã có chiến lược bảo mật operator credential.

### 4.8 Đối chiếu nhanh với upstream vừa pin (`110042d840`)

So với bản mô tả cũ trong tài liệu này (hoặc pin cũ hơn), các điểm đáng cập nhật từ **mã `server-http.ts` + `docs/gateway/*` + `CHANGELOG.md`** tại snapshot trên:

| Chủ đề | Ghi chú |
| ------ | ------- |
| **HTTP** | Thêm **`GET /api/chat/media/outgoing/…`** (ảnh/đính kèm do gateway quản lý cho luồng chat/OpenAI-compat). Các path `/v1/*`, `/tools/invoke`, `/sessions/…/history` và `/sessions/…/kill` vẫn như bảng §4.2. |
| **Auth `trusted-proxy`** | Doc hiện tại không còn gói gọn “chỉ non-loopback”: cần **proxy tin cậy đã khai báo**, **`allowLoopback`** nếu gọi qua loopback, và quy tắc header / fallback password như §4.2. |
| **Runtime** | Dòng **Node 22 tối thiểu** trên nhánh release gần đây được nâng lên **22.19** (CHANGELOG `2026.5.19`: Pi packages + floor Node); xem §29.1 — đã chỉnh trong bảng yêu cầu. |
| **Khác (CHANGELOG, không đổi §4.2)** | Ví dụ: metadata reload config cho tool (`config` lookup), tối ưu startup gateway song song kênh, CRON queue Matrix/Mattermost/Google Chat, nhiều sửa agent/cron/channel — chi tiết xem `openclaw-worker/CHANGELOG.md`. |

---

## 5. Model Providers — LLM Backends

### 5.1 Cách Khai Báo Model

Format: `provider/model-id`

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### 5.2 Built-in Providers (Pi-AI Catalog)

Không cần cấu hình `models.providers` — chỉ set auth env var + chọn model:

| Provider                 | ID                  | Auth Env            | Model ví dụ                                |
| ------------------------ | ------------------- | ------------------- | ------------------------------------------ |
| **OpenAI**               | `openai`            | `OPENAI_API_KEY`    | `openai/gpt-5.5`, `openai/gpt-5.4-mini`    |
| **Anthropic**            | `anthropic`         | `ANTHROPIC_API_KEY` | `anthropic/claude-opus-4-6`                |
| **OpenAI Codex (OAuth)** | `openai-codex`      | OAuth (ChatGPT)     | `openai-codex/gpt-5.5`                     |
| **Google Gemini**        | `google`            | `GEMINI_API_KEY`    | `google/gemini-3.1-pro-preview`            |
| **Google Vertex**        | `google-vertex`     | gcloud ADC          |                                            |
| **Google Gemini CLI**    | `google-gemini-cli` | OAuth flow          | `google-gemini-cli/gemini-3-flash-preview` |

### 5.3 Bundled Provider Plugins

| Provider                    | ID                  | Auth Env                 | Model ví dụ                                   |
| --------------------------- | ------------------- | ------------------------ | --------------------------------------------- |
| **xAI (Grok)**              | `xai`               | `XAI_API_KEY`            | `xai/grok-4`                                  |
| **DeepSeek**                | `deepseek`          | `DEEPSEEK_API_KEY`       | `deepseek/deepseek-v4-flash`                  |
| **OpenRouter**              | `openrouter`        | `OPENROUTER_API_KEY`     | `openrouter/auto`                             |
| **Ollama** (local)          | `ollama`            | Không cần                | `ollama/llama3.3`                             |
| **LM Studio** (local)       | `lmstudio`          | `LM_API_TOKEN`           | `lmstudio/...`                                |
| **vLLM** (local)            | `vllm`              | Optional                 | `vllm/your-model-id`                          |
| **SGLang** (local)          | `sglang`            | Optional                 | `sglang/your-model-id`                        |
| **Groq**                    | `groq`              | `GROQ_API_KEY`           |                                               |
| **Mistral**                 | `mistral`           | `MISTRAL_API_KEY`        | `mistral/mistral-large-latest`                |
| **MiniMax**                 | `minimax`           | `MINIMAX_API_KEY`        | `minimax/MiniMax-M2.7`                        |
| **Moonshot (Kimi)**         | `moonshot`          | `MOONSHOT_API_KEY`       | `moonshot/kimi-k2.6`                          |
| **Kimi Coding**             | `kimi`              | `KIMI_API_KEY`           | `kimi/kimi-code`                              |
| **NVIDIA**                  | `nvidia`            | `NVIDIA_API_KEY`         | `nvidia/llama-3.1-nemotron-70b`               |
| **Together AI**             | `together`          | `TOGETHER_API_KEY`       | `together/moonshotai/Kimi-K2.5`               |
| **Hugging Face**            | `huggingface`       | `HF_TOKEN`               | `huggingface/deepseek-ai/DeepSeek-R1`         |
| **Cerebras**                | `cerebras`          | `CEREBRAS_API_KEY`       | `cerebras/zai-glm-4.7`                        |
| **GitHub Copilot**          | `github-copilot`    | `COPILOT_GITHUB_TOKEN`   |                                               |
| **Vercel AI Gateway**       | `vercel-ai-gateway` | `AI_GATEWAY_API_KEY`     | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| **Kilo Gateway**            | `kilocode`          | `KILOCODE_API_KEY`       | `kilocode/kilo/auto`                          |
| **Z.AI (GLM)**              | `zai`               | `ZAI_API_KEY`            | `zai/glm-5.1`                                 |
| **Qwen Cloud**              | `qwen`              | `QWEN_API_KEY`           | `qwen/qwen3.5-plus`                           |
| **DeepSeek Qianfan**        | `qianfan`           | `QIANFAN_API_KEY`        | `qianfan/deepseek-v3.2`                       |
| **Volcano Engine (Doubao)** | `volcengine`        | `VOLCANO_ENGINE_API_KEY` | `volcengine-plan/ark-code-latest`             |
| **BytePlus (ARK)**          | `byteplus`          | `BYTEPLUS_API_KEY`       | `byteplus-plan/ark-code-latest`               |
| **StepFun**                 | `stepfun`           | `STEPFUN_API_KEY`        | `stepfun/step-3.5-flash`                      |
| **Venice AI**               | `venice`            | `VENICE_API_KEY`         |                                               |
| **Xiaomi**                  | `xiaomi`            | `XIAOMI_API_KEY`         | `xiaomi/mimo-v2-flash`                        |
| **MiniMax Portal**          | `minimax-portal`    | `MINIMAX_OAUTH_TOKEN`    |                                               |
| **OpenCode**                | `opencode`          | `OPENCODE_API_KEY`       | `opencode/claude-opus-4-6`                    |
| **Synthetic**               | `synthetic`         | `SYNTHETIC_API_KEY`      | `synthetic/hf:MiniMaxAI/MiniMax-M2.5`         |

### 5.4 Provider Phụ (Chuyên Biệt)

| Loại                    | Provider                                                           | Mô tả                     |
| ----------------------- | ------------------------------------------------------------------ | ------------------------- |
| **Image Gen**           | `openai`, `google`, `fal`, `minimax`                               | `image_generate` tool     |
| **Music Gen**           | `google`, `minimax`                                                | `music_generate` tool     |
| **Video Gen**           | `qwen`                                                             | `video_generate` tool     |
| **TTS (Speech)**        | `openai`, `elevenlabs`, `microsoft`, `azure-speech`                | Text-to-speech            |
| **STT (Transcription)** | `openai`, `elevenlabs`, `mistral`, `deepgram`, `xai`, `senseaudio` | Audio transcription       |
| **Web Search**          | `google`, `perplexity`, `minimax`                                  | Built-in web search       |
| **Web Fetch**           | `firecrawl`                                                        | Enhanced web scraping     |
| **Embeddings**          | `openai`, `google`                                                 | `/v1/embeddings` endpoint |

### 5.5 API Key Rotation & Failover

```
Priority (cao → thấp):
OPENCLAW_LIVE_<PROVIDER>_KEY  →  <PROVIDER>_API_KEYS (comma list)  →  <PROVIDER>_API_KEY  →  <PROVIDER>_API_KEY_1, _2, ...
```

Rotation chỉ xảy ra khi rate-limit (429) — không phải khi lỗi khác.

---

## 6. Cách Kết Nối Provider — API Key & OAuth

### 6.1 API Key (Phổ biến nhất)

Cách 1 — Environment variable:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="..."
```

Cách 2 — Config file (`~/.openclaw/openclaw.json`):

```json5
{
  env: {
    ANTHROPIC_API_KEY: "sk-ant-...",
    OPENAI_API_KEY: "sk-...",
  },
  agents: {
    defaults: { model: { primary: "anthropic/claude-opus-4-6" } },
  },
}
```

Cách 3 — Onboard CLI (khuyến nghị cho lần đầu):

```bash
openclaw onboard --auth-choice apiKey          # Anthropic
openclaw onboard --auth-choice openai-api-key  # OpenAI
openclaw onboard --auth-choice gemini-api-key  # Google
openclaw onboard --auth-choice zai-api-key     # Z.AI
```

### 6.2 OAuth (Subscription-based)

Các provider hỗ trợ OAuth (đăng nhập tài khoản subscription, không cần API key):

| Provider                                | OAuth Flow             | CLI Command                                               |
| --------------------------------------- | ---------------------- | --------------------------------------------------------- |
| **OpenAI Codex** (ChatGPT subscription) | Browser OAuth          | `openclaw onboard --auth-choice openai-codex`             |
| **Google Gemini CLI**                   | OAuth flow qua CLI     | `openclaw models auth login --provider google-gemini-cli` |
| **MiniMax**                             | OAuth (Global/CN)      | `openclaw onboard --auth-choice minimax-global-oauth`     |
| **GLM (Z.AI)**                          | Z.AI Coding Plan OAuth | `openclaw onboard --auth-choice zai-api-key`              |

OAuth tokens được lưu trong **auth profiles** tại:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

### 6.3 Auth Profile Rotation (Multi-Account)

```json5
{
  models: {
    providers: {
      anthropic: {
        authProfiles: ["profile-a", "profile-b"],
      },
    },
  },
}
```

Chọn profile cụ thể: `/model anthropic/claude-opus-4-6@profile-a`

### 6.4 Custom Provider / Local Proxy

```json5
{
  models: {
    mode: "merge",
    providers: {
      "my-local": {
        baseUrl: "http://localhost:8080/v1",
        apiKey: "${MY_LOCAL_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [{ id: "my-model", contextWindow: 128000 }],
      },
    },
  },
}
```

---

## 7. Cách OpenClaw Gọi Model (Model Call Flow)

```mermaid
flowchart LR
    subgraph SESSION["Pi Agent Session"]
        direction TB
        PROMPT_BUILD["Prompt Builder\n(AGENTS.md + SOUL.md\n+ skills + history)"]
        MODEL_RESOLVE["Model Resolver\n(provider/model\n→ auth profile\n→ transport)"]
        API_CALL["API Call\n(HTTP/WebSocket streaming)"]
        TOOL_LOOP["Tool Loop\n(tool_call → execute → inject result)"]
        OUTPUT["Final Reply\n(token stream)"]
    end

    subgraph TRANSPORT["Transport Layer"]
        WS_T["WebSocket\n(preferred)"]
        SSE_T["SSE\n(fallback)"]
        HTTP_T["HTTP\n(completions)"]
    end

    PROMPT_BUILD --> MODEL_RESOLVE
    MODEL_RESOLVE --> API_CALL
    API_CALL --> WS_T
    API_CALL --> SSE_T
    API_CALL --> HTTP_T
    WS_T --> TOOL_LOOP
    SSE_T --> TOOL_LOOP
    HTTP_T --> TOOL_LOOP
    TOOL_LOOP -->|"tool result injected\nback into context"| API_CALL
    TOOL_LOOP -->|"no more tools"| OUTPUT
```

**Model selection rules:**

1. `agents.defaults.model.primary` — model mặc định
2. `agents.defaults.models` — allowlist (khi set, chỉ những model này được dùng)
3. Per-session override: `/model provider/model-id` hoặc `session_status` tool
4. Fallback chain: `agents.defaults.model.fallback` khi primary thất bại

**Thinking/Reasoning levels:**

- `/think off|low|medium|high|adaptive|max`
- Tương ứng với `thinkingLevel` trong config hoặc model-native thinking params (Gemini `thinkingBudget`, Anthropic `thinking`)

---

## 8. Built-in Tools (Công Cụ Tích Hợp)

### 8.1 Bảng Tổng Hợp Tất Cả Tools

| Tool               | Mô tả                                                | Group              |
| ------------------ | ---------------------------------------------------- | ------------------ |
| `exec` / `process` | Chạy lệnh shell, quản lý background processes        | `group:runtime`    |
| `code_execution`   | Chạy Python trong sandbox từ xa                      | `group:runtime`    |
| `browser`          | Điều khiển Chromium (navigate, click, screenshot)    | `group:ui`         |
| `read`             | Đọc file trong workspace                             | `group:fs`         |
| `write`            | Ghi file trong workspace                             | `group:fs`         |
| `edit`             | Sá»­a file trong workspace                           | `group:fs`         |
| `apply_patch`      | Multi-hunk file patches                              | `group:fs`         |
| `web_search`       | Tìm kiếm web                                         | `group:web`        |
| `x_search`         | Tìm kiếm X (Twitter) posts                           | `group:web`        |
| `web_fetch`        | Fetch ná»™i dung trang web                           | `group:web`        |
| `message`          | Gửi tin nhắn qua tất cả các kênh                     | `group:messaging`  |
| `canvas`           | Điều khiển Canvas node (present, eval, snapshot)     | `group:ui`         |
| `nodes`            | Discover và target paired devices                    | `group:nodes`      |
| `cron`             | Quản lý scheduled jobs                               | `group:automation` |
| `gateway`          | Inspect / patch / restart gateway, config management | `group:automation` |
| `image`            | Phân tích ảnh (media understanding)                  | `group:media`      |
| `image_generate`   | Tạo ảnh (DALL-E, Imagen, fal, v.v.)                  | `group:media`      |
| `music_generate`   | Tạo nhạc                                             | `group:media`      |
| `video_generate`   | Tạo video                                            | `group:media`      |
| `tts`              | Text-to-speech (one-shot)                            | `group:media`      |
| `sessions_list`    | Liệt kê sessions                                     | `group:sessions`   |
| `sessions_history` | Xem lịch sử session (filtered, safe)                 | `group:sessions`   |
| `sessions_send`    | Gửi tin nhắn vào session khác                        | `group:sessions`   |
| `sessions_spawn`   | Tạo session mới                                      | `group:sessions`   |
| `sessions_yield`   | Yield control                                        | `group:sessions`   |
| `subagents`        | Khởi chạy sub-agent                                  | `group:sessions`   |
| `agents_list`      | Liệt kê agents                                       | `group:agents`     |
| `session_status`   | Đọc trạng thái session, override model               | `group:sessions`   |
| `memory_search`    | Tìm trong memory                                     | `group:memory`     |
| `memory_get`       | Lấy memory item                                      | `group:memory`     |

### 8.2 Tool Groups & Profiles

| Profile     | Tools được phép                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `full`      | Tất cả (không hạn chế)                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, media tools |
| `messaging` | `group:messaging`, session tools cơ bản                                                         |
| `minimal`   | Chỉ `session_status`                                                                            |

### 8.3 Tool Policy

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```

**Nguyên tắc:** `deny` luôn thắng `allow`.

### 8.4 Plugin-Provided Tools (Ví dụ)

| Tool         | Plugin     | Mô tả                                    |
| ------------ | ---------- | ---------------------------------------- |
| `llm_task`   | LLM Task   | JSON-only LLM step, structured output    |
| `lobster`    | Lobster    | Typed workflow vá»›i resumable approvals |
| `diff`       | Diffs      | Diff viewer và renderer                  |
| `tokenjuice` | Tokenjuice | Compact exec output                      |

---

## 9. Hệ Thống Plugin

### 9.1 Hai Loại Plugin

```mermaid
flowchart LR
    subgraph CODE["Code Plugins\n(Native / In-process)"]
        direction TB
        CP1["Runtime hooks"]
        CP2["registerProvider(...)"]
        CP3["registerChannel(...)"]
        CP4["registerSpeechProvider(...)"]
        CP5["registerImageGenerationProvider(...)"]
        CP6["Custom tools, routes, CLI"]
    end

    subgraph BUNDLE["Bundle Plugins\n(Content/Metadata)"]
        direction TB
        BP1["Skills (SKILL.md)"]
        BP2["MCP servers"]
        BP3["Configuration bundles"]
    end

    CODE -->|"in-process, not sandboxed\n(trusted code)"| GATEWAY["Gateway Runtime"]
    BUNDLE -->|"metadata/content pack\n(safer boundary)"| GATEWAY
```

### 9.2 Capability Registration API

| Capability             | Method                                           | Ví dụ Plugin                         |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Text inference         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI inference backend  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Speech (TTS)           | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Realtime transcription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Realtime voice         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Media understanding    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Image generation       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Music generation       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Video generation       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web fetch              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web search             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel/messaging      | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway discovery      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

### 9.3 Plugin Load Pipeline

```mermaid
flowchart TD
    DISCOVER["1. Discovery\n(paths, workspace,\nglobal roots, bundled)"]
    ENABLE["2. Enablement\n(enabled / disabled /\nblocked / exclusive slot)"]
    LOAD["3. Runtime Loading\n(in-process via jiti\n→ register capabilities)"]
    SURFACE["4. Surface Consumption\n(tools, channels, providers,\nhooks, routes, CLI)"]

    DISCOVER --> ENABLE --> LOAD --> SURFACE
```

Plugin manifest: `openclaw.plugin.json`

```bash
openclaw plugins list
openclaw plugins enable <id>
openclaw plugins inspect <id>
openclaw plugins doctor
```

### 9.4 Plugin Shapes

| Shape               | Mô tả                                                                     |
| ------------------- | ------------------------------------------------------------------------- |
| `plain-capability`  | Đúng 1 capability type (e.g. `mistral` chỉ text inference)                |
| `hybrid-capability` | Nhiều capability types (e.g. `openai` = text + speech + image + realtime) |
| `hook-only`         | Chỉ hooks, không capabilities                                             |
| `non-capability`    | Tools/commands/routes nhưng không capabilities                            |

---

## 10. Automation & Workflows

```mermaid
flowchart TD
    START(["Cần tự động hóa gì?"])

    START --> Q1{"Lên lịch chính xác?"}
    START --> Q2{"Track background work?"}
    START --> Q3{"Multi-step flow?"}
    START --> Q4{"React lifecycle events?"}
    START --> Q5{"Persistent instructions?"}

    Q1 -->|"Exact timing"| CRON["Cron / Scheduled Tasks\n(cron expressions + one-shot)"]
    Q1 -->|"Flexible ~30min"| HB["Heartbeat\n(periodic main-session turn)"]
    Q2 --> TASKS["Background Tasks\n(task ledger + audit)"]
    Q3 --> FLOW["Task Flow\n(durable multi-step)"]
    Q4 --> HOOKS["Hooks\n(lifecycle scripts)"]
    Q5 --> SO["Standing Orders\n(AGENTS.md workspace injection)"]
```

### 10.1 Cron (Scheduled Tasks)

```bash
# Tạo job hàng ngày lúc 9 AM
openclaw cron add --schedule "0 9 * * *" --message "Gửi báo cáo hàng ngày"

# One-shot reminder sau 20 phút
openclaw cron add --at "+20m" --message "Nhắc họp"

# Quản lý
openclaw cron list
openclaw cron pause <id>
openclaw cron delete <id>
```

### 10.2 Heartbeat

Periodic main-session turn (default mỗi 30 phút). Không tạo task records. Dùng file `HEARTBEAT.md` để định nghĩa checklist.

### 10.3 Hooks (Lifecycle Scripts)

Triggered bởi: `/new`, `/reset`, `/stop`, session compaction, gateway startup, message flow.

```bash
openclaw hooks list
openclaw hooks run <name>
```

### 10.4 Standing Orders

Injected vào mọi session qua `AGENTS.md`:

```markdown
# Standing Orders

- Luôn check compliance trước khi reply
- Không xóa file mà không hỏi
```

### 10.5 Task Flow

Durable multi-step orchestration vá»›i:

- Managed và mirrored sync modes
- Revision tracking
- `openclaw tasks flow list|show|cancel`

### 10.6 MCP Integration (Automation)

```bash
# OpenClaw làm MCP server (expose tools ra ngoài)
openclaw mcp serve

# Cấu hình MCP servers để agent dùng (outbound)
openclaw mcp list
openclaw mcp set <id> --transport stdio --command "npx my-mcp-server"
```

**MCP Tools có sẵn khi serve:**

- `conversations_list`
- `messages_read`
- `messages_send`
- `events_poll` / `events_wait`
- Approvals

---

## 11. Agent Runtime & Session Model

### 11.1 Pi Agent

OpenClaw nhúng **Pi agent** (từ pi-mono) làm engine AI. Pi cung cấp:

- Session management vá»›i JSONL transcripts
- Tool loop (streaming)
- Multi-turn conversations
- Thinking/reasoning levels

**Session store:** `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

### 11.2 Bootstrap Files (Workspace)

Tại `agents.defaults.workspace` (default: `~/.openclaw/workspace`):

| File           | Mục đích                                |
| -------------- | --------------------------------------- |
| `AGENTS.md`    | Operating instructions + "memory"       |
| `SOUL.md`      | Persona, boundaries, tone               |
| `TOOLS.md`     | Tool usage notes                        |
| `IDENTITY.md`  | Agent name, vibe, emoji                 |
| `USER.md`      | User profile, preferred address         |
| `BOOTSTRAP.md` | One-time first-run ritual (auto-delete) |

### 11.3 Multi-Agent Routing

```mermaid
flowchart LR
    MSG["Inbound Message\n(channel + sender)"] --> BIND["Bindings\n(routing rules)"]
    BIND --> A1["Agent 1\n(workspace A)"]
    BIND --> A2["Agent 2\n(workspace B)"]
    BIND --> A3["Agent 3\n(workspace C)"]

    A1 --> M1["Model X"]
    A2 --> M2["Model Y"]
    A3 --> M3["Model Z"]
```

Cấu hình:

```json5
{
  agents: {
    list: [
      { id: "personal", workspace: "~/.openclaw/workspace-personal" },
      {
        id: "work",
        workspace: "~/.openclaw/workspace-work",
        model: { primary: "openai/gpt-5.5" },
      },
    ],
    defaults: { model: { primary: "anthropic/claude-opus-4-6" } },
  },
}
```

### 11.4 Queue Modes

Khi agent đang chạy và nhận tin nhắn mới:

| Mode        | Hành vi                              |
| ----------- | ------------------------------------ |
| `interrupt` | Dừng run hiện tại, bắt đầu mới       |
| `steer`     | Inject tin nhắn mới vào run hiện tại |
| `followup`  | Queue sau khi run hiện tại xong      |
| `debounce`  | Batch tin nhắn nhanh từ cùng sender  |

### 11.5 Skills

```
Skill = SKILL.md file injected vào system prompt

Locations (priority cao → thấp):
1. <workspace>/skills/
2. <workspace>/.agents/skills/
3. ~/.agents/skills/
4. ~/.openclaw/skills/
5. Bundled skills
6. skills.load.extraDirs
```

ClawHub: [clawhub.ai](https://clawhub.ai) — marketplace cho skills và plugins.

---

## 12. Nodes (Companion Devices)

```mermaid
flowchart LR
    subgraph GATEWAY["Gateway (port 18789)"]
        WS_SRV["WebSocket Server"]
    end

    subgraph NODES["Nodes (role: node)"]
        IOS["iOS\n• canvas\n• voice trigger"]
        AND["Android\n• canvas\n• camera\n• screen.record\n• device.*\n• calendar\n• sms"]
        MAC["macOS App\n• canvas\n• camera\n• voice wake\n• system.run"]
        HEAD["Headless\n• system.run\n• system.which"]
    end

    NODES -->|"WebSocket\nrole: node\ndevice pairing"| WS_SRV
    WS_SRV -->|"node.invoke\ncommands"| NODES
```

**Node Commands:**

| Family            | Commands                           |
| ----------------- | ---------------------------------- |
| `canvas.*`        | present, eval, snapshot            |
| `camera.*`        | capture, stream                    |
| `screen.record`   | Record screen                      |
| `location.get`    | GPS location                       |
| `device.*`        | Device info                        |
| `notifications.*` | Push notifications                 |
| `calendar.*`      | Calendar access (Android)          |
| `sms.*`           | SMS access (Android)               |
| `system.run`      | Remote shell execution (node host) |
| `system.which`    | Check binary availability          |

**Pairing:**

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
openclaw nodes describe --node <id>
```

---

## 13. Security Model

### 13.1 Threat Model

OpenClaw dùng **personal assistant trust model** — một trusted operator boundary per gateway. Không phải multi-tenant security boundary.

```
Supported:  1 user/gateway → nhiều agents
Not supported: Nhiều untrusted users sharing 1 agent
```

### 13.2 DM Safety

- **Mặc định:** `dmPolicy="pairing"` — unknown senders nhận pairing code, bot không xử lý
- Approve: `openclaw pairing approve <channel> <code>`
- **Opt-in open:** `dmPolicy="open"` + `allowFrom: ["*"]`

### 13.3 Sandboxing

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // sandbox mọi session không phải main
        backend: "docker", // docker | ssh | openShell
      },
    },
  },
}
```

**Sandbox mặc định cho non-main sessions:**

- Allow: `bash`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`
- Deny: `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`

### 13.4 Security Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw doctor
```

### 13.5 Remote Access

| Method                      | Mô tả                                                    |
| --------------------------- | -------------------------------------------------------- |
| **Tailscale** (khuyến nghị) | VPN mesh, identity-bearing auth                          |
| **SSH tunnel**              | `ssh -N -L 18789:127.0.0.1:18789 user@host`              |
| **Trusted proxy**           | Reverse proxy vá»›i `gateway.auth.mode: "trusted-proxy"` |

---

## 14. Canvas & A2UI

```mermaid
flowchart LR
    AGENT["Agent"] -->|"canvas tool calls"| CANVAS["Canvas Host\n/__openclaw__/canvas/"]
    CANVAS -->|"live HTML/CSS/JS"| NODE["Node Device\n(macOS/iOS/Android)"]

    AGENT -->|"a2ui commands"| A2UI["A2UI Host\n/__openclaw__/a2ui/"]
    A2UI -->|"structured UI"| NODE
```

- **Canvas** — Agent-editable HTML/CSS/JS workspace visible trực tiếp trên node
- **A2UI** — Structured agent-to-UI protocol cho interactive components
- Served qua cùng Gateway port (18789)

---

## 15. VoiceClaw Integration

Gateway expose endpoint `/voiceclaw/realtime` cho voice AI:

```
VoiceClaw Client → ws://127.0.0.1:18789/voiceclaw/realtime
                  ↓
             Gemini Live (realtime audio)
                  ↓
             OpenClaw Tools (async execution)
                  ↓
             Inject results back to voice session
```

Config:

```bash
GEMINI_API_KEY=... openclaw gateway --port 19789
```

---

## 16. Web Control UI & WebChat

| Surface        | URL                       | Mô tả                                            |
| -------------- | ------------------------- | ------------------------------------------------ |
| **Control UI** | `http://127.0.0.1:18789/` | Browser dashboard: chat, config, sessions, nodes |
| **WebChat**    | `http://127.0.0.1:18789/` | Gateway-hosted chat interface                    |

Mở dashboard:

```bash
openclaw dashboard
```

---

## 17. Sơ Đồ Kiến Trúc Chi Tiết — Message Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant CH as 📡 Channel
    participant GW as 🦞 Gateway
    participant RO as 🔀 Router/Bindings
    participant QU as 📋 Queue
    participant AG as 🤖 Pi Agent
    participant PR as 🧠 Provider
    participant TO as 🔧 Tools

    U->>CH: Gửi tin nhắn
    CH->>GW: Inbound event
    GW->>GW: Dedupe check<br/>(message ID cache)
    GW->>RO: Resolve session key
    RO->>QU: Enqueue<br/>(debounce 2-5s text)
    QU->>AG: Start agent run

    activate AG
    AG->>AG: Build prompt<br/>(AGENTS.md + history + skills)
    AG->>PR: API call (streaming)

    loop Tool calls
        PR-->>AG: token stream + tool_call
        AG->>TO: Execute tool
        TO-->>AG: Tool result
        AG->>PR: Continue (inject result)
    end

    PR-->>AG: Final response
    deactivate AG

    AG->>GW: Reply chunks (streaming)
    GW->>CH: Outbound (chunked + threaded)
    CH->>U: Hiển thị reply
```

---

## 18. Deployment & Installation

### 18.1 Quick Install

```bash
# Global install
npm install -g openclaw@latest

# Onboard (khuyến nghị)
openclaw onboard --install-daemon

# Hoặc chạy trực tiếp
openclaw gateway --port 18789 --verbose
```

### 18.2 Service Management

| Platform                 | Command                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------ |
| macOS (launchd)          | `openclaw gateway install && openclaw gateway status`                                |
| Linux (systemd)          | `openclaw gateway install && systemctl --user enable --now openclaw-gateway.service` |
| Windows (Scheduled Task) | `openclaw gateway install && openclaw gateway status --json`                         |

### 18.3 Docker

```bash
docker compose up -d
```

(Dockerfile đầy đủ trong repo: `Dockerfile`, `docker-compose.yml`)

### 18.4 Configuration Minimal

`~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    model: "anthropic/claude-opus-4-6",
  },
  channels: {
    telegram: { token: "BOT_TOKEN_HERE" },
    whatsapp: { allowFrom: ["+84901234567"] },
  },
}
```

### 18.5 Update Channels

| Channel  | Tag npm  | Mô tả            |
| -------- | -------- | ---------------- |
| `stable` | `latest` | Tagged releases  |
| `beta`   | `beta`   | Prerelease       |
| `dev`    | `dev`    | Main branch head |

```bash
openclaw update --channel stable|beta|dev
```

---

## 19. CLI Reference (Chính)

```bash
openclaw onboard [--install-daemon]     # Guided setup
openclaw gateway [--port 18789]         # Start gateway
openclaw gateway status [--deep]        # Health check
openclaw gateway install                # Install as service
openclaw gateway restart|stop           # Manage service
openclaw status                         # Overall status
openclaw logs [--follow]                # Stream logs
openclaw doctor [--fix]                 # Diagnose issues
openclaw channels status [--probe]      # Channel health
openclaw models list [--provider X]     # List models
openclaw models set <provider/model>    # Set default model
openclaw models auth login              # Auth provider
openclaw pairing approve <ch> <code>    # Approve DM pairing
openclaw devices list|approve|reject    # Node device management
openclaw nodes status|describe          # Node status
openclaw plugins list|enable|disable    # Plugin management
openclaw plugins inspect <id>           # Plugin details
openclaw skills list                    # List skills
openclaw cron list|add|pause|delete     # Cron management
openclaw tasks list|audit               # Background tasks
openclaw hooks list|run                 # Lifecycle hooks
openclaw mcp list|set|unset|serve       # MCP management
openclaw security audit [--fix]         # Security audit
openclaw agent --message "..." [--thinking high]  # Run agent
openclaw message send --target ... --message ...  # Send message
openclaw dashboard                      # Open Control UI
openclaw update [--channel stable]      # Update
```

---

## 20. Tổng Quan Kiến Trúc Layer

```mermaid
graph TB
    subgraph L1["Layer 1: Chat Surfaces"]
        direction LR
        l1a["Built-in Channels\n(WhatsApp, Telegram, Discord,\nSlack, Signal, Google Chat,\niMessage, IRC, WebChat)"]
        l1b["Bundled Plugin Channels\n(Matrix, Teams, Feishu, LINE,\nMattermost, Nostr, QQ, Synology,\nTlon, Twitch, Zalo, ...)"]
        l1c["External Plugin Channels\n(WeChat, Voice Call, ...)"]
    end

    subgraph L2["Layer 2: Gateway Control Plane"]
        direction LR
        l2a["HTTP API\n(OpenAI-compat)"]
        l2b["WebSocket RPC\n(Control)"]
        l2c["Auth Layer\n(token/OAuth/Tailscale)"]
        l2d["Router + Queue\n(session/debounce)"]
        l2e["Plugin Registry\n(capabilities)"]
        l2f["Cron + Hooks\n(automation)"]
    end

    subgraph L3["Layer 3: Agent Runtime (Pi)"]
        direction LR
        l3a["Session Manager\n(JSONL transcripts)"]
        l3b["Prompt Builder\n(workspace files + skills)"]
        l3c["Tool Loop\n(streaming)"]
        l3d["Memory System\n(plugin slot)"]
        l3e["Sub-agents\n(multi-agent)"]
    end

    subgraph L4["Layer 4: Model Providers"]
        direction LR
        l4a["Cloud APIs\n(OpenAI, Anthropic,\nGoogle, xAI, ...)"]
        l4b["Local Models\n(Ollama, LM Studio,\nvLLM, SGLang)"]
        l4c["Proxy Gateways\n(OpenRouter, Vercel AI,\nKilo, LiteLLM)"]
        l4d["Specialized\n(ElevenLabs TTS,\nfal image, ...)"]
    end

    subgraph L5["Layer 5: Companion Devices (Nodes)"]
        direction LR
        l5a["macOS App\n(menu bar + canvas)"]
        l5b["iOS Node\n(canvas + voice)"]
        l5c["Android Node\n(canvas + camera + device)"]
        l5d["Headless Node\n(system.run)"]
    end

    L1 <-->|"messages"| L2
    L2 <-->|"agent runs"| L3
    L3 <-->|"inference calls"| L4
    L5 <-->|"WS (role: node)\ndevice pairing"| L2
    L3 <-->|"canvas / node.invoke"| L5
```

---

## 21. Agent Loop — Vòng Lặp Thực Thi AI

**Agent Loop** là chu trình đầy đủ của một "lượt chạy" thực sự: từ khi nhận tin nhắn đến khi có câu trả lời cuối cùng và lưu trạng thái. Đây là trái tim của OpenClaw.

### 21.1 Luồng Thực Thi Tổng Thể

> ℹ️ **[SYNTHESIS — Diagram tôi tự vẽ]** Các bước dưới đây đều có nguồn từ `docs/concepts/agent-loop.md`, nhưng diagram dạng `sequenceDiagram` là do tôi tạo ra để minh hoạ trực quan. Docs mô tả các bước bằng văn xuôi và danh sách.

```mermaid
sequenceDiagram
    participant Channel as Channel (WA/TG/...)
    participant Gateway as Gateway RPC
    participant Queue as Session Queue
    participant Prompt as Prompt Assembler
    participant Model as LLM Provider
    participant Tools as Tool Executor
    participant Disk as Session Store

    Channel->>Gateway: Tin nhắn đến
    Gateway->>Queue: Enqueue (per-session lane)
    Queue->>Prompt: Dequeue → build context
    Prompt->>Prompt: Load MEMORY.md, SOUL.md,<br/>AGENTS.md, daily notes
    Prompt->>Prompt: Compaction nếu gần hết context window
    Prompt->>Model: System prompt + messages
    Model-->>Tools: tool_call(exec/read/write/...)
    Tools-->>Model: tool_result
    Model-->>Gateway: Assistant text (streaming)
    Gateway-->>Channel: Streaming reply
    Gateway->>Disk: Lưu transcript (JSONL)
```

### 21.2 Các Giai Đoạn của Agent Loop

| Giai đoạn | Mô tả |
|-----------|-------|
| **1. Validate & Route** | Xác thực params, resolve session key/sessionId, trả về `{ runId, acceptedAt }` ngay lập tức |
| **2. Queue** | Serialize runs theo per-session lane + optional global lane (tránh race conditions) |
| **3. Workspace Prep** | Resolve workspace, load skills snapshot, acquire session write lock |
| **4. Prompt Assembly** | Build system prompt từ base + skills + bootstrap files + per-run overrides |
| **5. Context Assembly** | Đưa toàn bộ lịch sử hội thoại vào context window, compaction nếu gần đầy |
| **6. Model Inference** | Gửi prompt tới LLM provider, stream về từng delta |
| **7. Tool Execution** | Mỗi tool_call được thực thi, kết quả feed ngược vào model |
| **8. Reply Shaping** | Lọc token `NO_REPLY`, gộp inline tool summaries, format output |
| **9. Persist** | Lưu transcript JSONL, cập nhật session state |
| **10. Emit Events** | Emit lifecycle `end/error`, stream events cho Control UI/channels |

### 21.3 Entry Points

```
Gateway RPC:
  agent        → fire-and-forget, trả về runId ngay
  agent.wait   → chờ lifecycle end/error (default timeout 30s)

CLI:
  openclaw agent "query"
```

### 21.4 Timeout & Concurrency

| Config | Mặc định | Ghi chú |
|--------|-----------|---------|
| `agent.wait` timeout | 30s | Chỉ là wait, không dừng agent |
| Agent runtime timeout | **48 giờ** (`172800s`) | Abort nếu vượt quá |
| Model idle timeout | 120s (capped) | Không có chunk nào về trong window này |
| Provider HTTP timeout | `models.providers.<id>.timeoutSeconds` | Dùng cho Ollama/local model chậm |

### 21.5 Hook Points Trong Agent Loop

> ℹ️ **[SYNTHESIS — Diagram tôi tự vẽ]** Tên các hooks và thứ tự đều lấy từ `docs/concepts/agent-loop.md`. Diagram flowchart là do tôi tạo ra để minh hoạ luồng thực thi. Docs liệt kê hooks trong prose, không có sơ đồ.

```mermaid
flowchart LR
    A["before_model_resolve"] --> B["before_prompt_build"]
    B --> C["before_agent_start"]
    C --> D["before_agent_reply"]
    D --> E["🤖 LLM Call"]
    E --> F["before_tool_call"]
    F --> G["Tool Execution"]
    G --> H["after_tool_call"]
    H --> I["before_compaction"]
    I --> J["after_compaction"]
    J --> K["agent_end"]
```

| Hook | Thời điểm | Dùng để |
|------|----------|---------|
| `before_model_resolve` | Trước khi resolve provider/model | Override model trước turn |
| `before_prompt_build` | Sau khi load messages | Inject thêm context vào system prompt |
| `before_agent_reply` | Trước khi gọi LLM | Plugin có thể trả reply tổng hợp, skip LLM |
| `before_tool_call` | Trước mỗi tool call | Block tool call (`{ block: true }`) |
| `after_tool_call` | Sau tool execution | Transform kết quả tool |
| `agent_end` | Sau khi loop kết thúc | Inspect final message list |
| `before/after_compaction` | Trước/sau compaction | Annotate compaction cycles |
| `message_received/sending/sent` | Inbound/outbound message | Intercept channel messages |

---

## 22. System Prompt — Cấu Trúc Prompt Gửi Cho Model

OpenClaw tự xây dựng 100% system prompt, **không dùng** prompt mặc định của pi-coding-agent.

### 22.1 Cấu Trúc System Prompt

```
┌─────────────────────────────────────────────────────────┐
│  TOOLING (hướng dẫn dùng tools, long-running work)      │
│  EXECUTION BIAS (act in-turn, continue until done)       │
│  SAFETY (guardrails, no power-seeking)                   │
│  SKILLS (danh sách skills có sẵn, dạng XML)              │
│  OPENCLAW SELF-UPDATE (cách đọc/patch config an toàn)    │
│  WORKSPACE (working directory path)                      │
│  DOCUMENTATION (link đến local docs / docs.openclaw.ai)  │
├─ WORKSPACE FILES (injected) ────────────────────────────┤
│  AGENTS.md     (operating rules)                         │
│  SOUL.md       (voice, tone, personality)                │
│  TOOLS.md      (custom tool docs)                        │
│  IDENTITY.md   (identity config)                         │
│  USER.md       (user profile)                            │
│  HEARTBEAT.md  (heartbeat config, nếu bật)               │
│  MEMORY.md     (long-term memory, nếu có)                │
├─────────────────────────────────────────────────────────┤
│  SANDBOX (nếu bật: sandbox paths, elevated exec status)  │
│  CURRENT DATE & TIME (timezone, không phải giờ cụ thể)  │
│  REPLY TAGS (syntax cho một số providers)                │
│  HEARTBEATS (khi heartbeat bật cho default agent)        │
│  RUNTIME (host, OS, node, model, thinking level)         │
│  REASONING (reasoning visibility + toggle hint)          │
└─────────────────────────────────────────────────────────┘
```

### 22.2 Bootstrap Files Tự Động Inject

| File | Mục đích | Ghi chú |
|------|---------|---------|
| `AGENTS.md` | Operating rules, công việc, hành vi | **Quan trọng nhất** |
| `SOUL.md` | Personality, tone, brevity, humor | Inject mọi DM session |
| `TOOLS.md` | Custom tool documentation | Tùy chọn |
| `IDENTITY.md` | Tên, hình ảnh, identity config | Tùy chọn |
| `USER.md` | Thông tin về user | Tùy chọn |
| `HEARTBEAT.md` | Heartbeat behavior | Chỉ khi heartbeat bật |
| `BOOTSTRAP.md` | Onboarding cho workspace mới | Chỉ workspace brand-new |
| `MEMORY.md` | Long-term memory facts | Nếu file tồn tại |

**Giới hạn:**
- Per-file: `agents.defaults.bootstrapMaxChars` (mặc định 12,000 chars)
- Tổng tất cả files: `agents.defaults.bootstrapTotalMaxChars` (mặc định 60,000 chars)
- Quá giới hạn → tự động truncate + cảnh báo

### 22.3 Prompt Modes (Cho Sub-agents)

| Mode | Dùng khi | Bao gồm |
|------|---------|---------|
| `full` | Agent chính | Tất cả sections |
| `minimal` | Sub-agents | Bỏ Skills, Memory Recall, SOUL.md, Reply Tags, Heartbeats |
| `none` | Đặc biệt | Chỉ base identity line |

### 22.4 SOUL.md — Cấu Hình Tính Cách Agent

`SOUL.md` là nơi định nghĩa **giọng điệu** của agent. OpenClaw inject nó vào mọi DM session.

```markdown
# SOUL.md — Ví dụ tốt
- Have a take. Stop hedging with "it depends."
- Brevity is mandatory. One sentence when it fits.
- Humor is allowed — natural wit, not forced jokes.
- Call out bad ideas early. Charm over cruelty.
- Never open with "Great question" or "Absolutely."
```

**Phân biệt `SOUL.md` vs `AGENTS.md`:**

| File | Dùng cho |
|------|---------|
| `SOUL.md` | Voice, tone, style, personality, humor, brevity |
| `AGENTS.md` | Operating rules, constraints, workflow, tool policy |

---

## 23. Memory System — Hệ Thống Bộ Nhớ

OpenClaw nhớ thông tin bằng cách **ghi ra file Markdown**. Không có hidden state — model chỉ "nhớ" những gì được lưu lên disk.

### 23.1 Ba File Bộ Nhớ Chính

```
~/.openclaw/workspace/
├── MEMORY.md              ← Long-term memory (fact vĩnh viễn)
├── memory/
│   ├── 2026-05-16.md      ← Daily notes (hôm nay)
│   ├── 2026-05-15.md      ← Daily notes (hôm qua, auto-load)
│   └── .dreams/           ← Dreaming machine state
└── DREAMS.md              ← Dream Diary (cho người đọc)
```

| File | Load khi | Mục đích |
|------|---------|---------|
| `MEMORY.md` | Mỗi DM session start | Long-term facts, preferences, decisions |
| `memory/YYYY-MM-DD.md` | Hôm nay + hôm qua | Running context, daily observations |
| `DREAMS.md` | Không auto-load | Dream diary để người dùng review |

### 23.2 Memory Tools

| Tool | Chức năng |
|------|-----------|
| `memory_search` | Tìm kiếm semantic + keyword (hybrid search) |
| `memory_get` | Đọc file memory cụ thể hoặc line range |

### 23.3 Ba Backend Memory

```mermaid
flowchart LR
    Agent["🤖 Agent\nmemory_search()"] --> Router["Memory\nPlugin Slot"]
    Router -->|default| Builtin["Builtin\n(SQLite)"]
    Router -->|optional| QMD["QMD\n(Local sidecar)"]
    Router -->|optional| Honcho["Honcho\n(AI-native cloud)"]
```

| Backend | Mô tả | Phù hợp |
|---------|--------|---------|
| **Builtin** (mặc định) | SQLite, keyword + vector hybrid search, zero deps | Hầu hết users |
| **QMD** | Local-first sidecar, reranking, query expansion, index external dirs | Cần search nâng cao |
| **Honcho** | AI-native cross-session memory, user modeling, multi-agent aware | Team / multi-user |

**Embedding providers được hỗ trợ (auto-detect):**
- OpenAI, Google Gemini, Voyage AI, Mistral — cấu hình tự động khi có API key

### 23.4 Memory Wiki Plugin

Plugin bổ sung biến memory thành **knowledge base có cấu trúc**:
- Deterministic page structure
- Structured claims + evidence
- Contradiction & freshness tracking
- Compiled digests cho agent/runtime
- Tools riêng: `wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`

### 23.5 Dreaming — Bộ Nhớ Nền (Background Consolidation)

**Dreaming** là hệ thống tự động chuyển thông tin ngắn hạn → dài hạn. **Opt-in**, tắt mặc định.

> ℹ️ **[SYNTHESIS — Diagram tôi tự vẽ]** Ba phases Light/Deep/REM và vai trò của từng phase đều lấy từ `docs/concepts/dreaming.md`. Flowchart là do tôi tạo để minh hoạ luồng.

```mermaid
flowchart TD
    Daily["Daily notes\nmemory/YYYY-MM-DD.md"] --> Light["💤 Light Phase\n(Sort & stage)"]
    Light --> Deep["😴 Deep Phase\n(Score & promote)"]
    Deep -->|pass threshold| Memory["MEMORY.md\n(Long-term)"]
    Deep --> REM["🌀 REM Phase\n(Themes & patterns)"]
    REM --> Dreams["DREAMS.md\n(Human review)"]
```

| Phase | Mục đích | Ghi vào `MEMORY.md`? |
|-------|---------|---------------------|
| **Light** | Ingest + dedup daily signals, stage candidates | Không |
| **Deep** | Score + promote durable candidates (qua threshold) | **Có** |
| **REM** | Extract themes, patterns, reflective signals | Không |

**Threshold để promote vào `MEMORY.md`:** `minScore` + `minRecallCount` + `minUniqueQueries`

**Auto memory flush trước compaction:** Trước khi compact context, agent được nhắc lưu thông tin quan trọng vào memory files. Bật mặc định.

---

## 24. Compaction — Quản Lý Context Window

Khi hội thoại dài, OpenClaw **compacts** (tóm tắt) lịch sử cũ để tiếp tục chat trong giới hạn context window.

### 24.1 Cách Compaction Hoạt Động

```mermaid
sequenceDiagram
    participant Agent as Agent Loop
    participant CM as Compaction Manager
    participant Model as LLM (Summarizer)
    participant Disk as Session Transcript

    Agent->>CM: Context sắp đầy
    CM->>Agent: Memory flush turn (silent)
    Agent->>CM: Quan trọng đã lưu vào MEMORY.md
    CM->>Model: Tóm tắt N turns đầu
    Model-->>CM: Summary text
    CM->>Disk: Lưu summary + recent tail (JSONL)
    CM->>Agent: Retry với context mới
```

### 24.2 Auto vs Manual Compaction

| Loại | Kích hoạt | Command |
|------|----------|---------|
| **Auto** (bật mặc định) | Khi gần limit hoặc model trả lỗi context overflow | Tự động |
| **Manual** | Người dùng gõ | `/compact` hoặc `/compact Focus on API design` |

### 24.3 Cấu Hình Quan Trọng

```json5
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6",  // Model riêng cho tóm tắt
        "keepRecentTokens": 4096,           // Giữ N tokens cuối không compact
        "truncateAfterCompaction": true,    // Tạo successor transcript mới
        "notifyUser": true,                 // Thông báo khi compact
        "identifierPolicy": "strict",       // Giữ nguyên các identifier quan trọng
        "maxActiveTranscriptBytes": 10000000 // Byte guard cho transcript lớn
      }
    }
  }
}
```

### 24.4 Compaction vs Session Pruning

| | Compaction | Session Pruning |
|---|---|---|
| **Làm gì** | Tóm tắt hội thoại cũ bằng LLM | Trim tool results cũ trong memory |
| **Lưu xuống disk?** | Có (trong session transcript) | Không (in-memory only) |
| **Phạm vi** | Toàn bộ hội thoại | Chỉ tool results |
| **Khi nào dùng** | Context sắp đầy | Tool output quá lớn |

**Overflow signatures được nhận biết:**
`request_too_large` / `context length exceeded` / `input exceeds maximum tokens` / `input too long for the model` / `ollama error: context length exceeded`

---

## 25. Multi-agent — Toàn Diện Tạo, Điều Phối & Dùng Model Khác Nhau

Một Gateway có thể chạy **nhiều agent độc lập**, mỗi agent có workspace, session, auth profile, và **model riêng**. Đây là hệ thống đầy đủ từ tạo agent đến điều phối và giao tiếp giữa các agent.

### 25.1 Kiến Trúc Multi-agent Tổng Thể

> ℹ️ **[SYNTHESIS — Diagram + ví dụ tôi tự xây dựng]** Cấu trúc tổng thể (binding → agent → runtime) lấy từ docs. Các tên agent cụ thể (main/work/family/coding) và model được gán cho từng agent trong diagram là **ví dụ minh hoạ của tôi**, không phải cấu hình mặc định.

```mermaid
flowchart TB
    GW["🦞 OpenClaw Gateway"]

    subgraph AGENTS["Các Agent Độc Lập"]
        A1["Agent: main\nModel: claude-opus\nWorkspace: /workspace\nChannel: WhatsApp personal"]
        A2["Agent: work\nModel: gpt-5.5 + Codex runtime\nWorkspace: /workspace-work\nChannel: Slack, WhatsApp biz"]
        A3["Agent: family\nModel: claude-haiku (rẻ)\nWorkspace: /workspace-family\nChannel: WhatsApp group"]
        A4["Agent: coding\nModel: claude-sonnet + claude-cli\nWorkspace: /workspace-coding\nChannel: Discord #dev"]
    end

    GW -->|"binding\nroute"| A1
    GW -->|"binding\nroute"| A2
    GW -->|"binding\nroute"| A3
    GW -->|"binding\nroute"| A4

    A1 -->|"sessions_spawn\n(sub-agent)"| SA["Sub-agent\n(background task)"]
    SA -->|"announce result"| A1
```

### 25.2 Tạo Agent — Các Bước Chi Tiết

```bash
# Bước 1: Tạo agent mới bằng wizard
openclaw agents add work
openclaw agents add coding
openclaw agents add family

# Bước 2: Kiểm tra danh sách + bindings
openclaw agents list --bindings

# Bước 3: Khởi động lại gateway
openclaw gateway restart
```

Mỗi agent được tạo ra với:
- Workspace riêng: `~/.openclaw/workspace-<agentId>/`
  - `AGENTS.md` — operating rules
  - `SOUL.md` — personality, tone
  - `USER.md` — user profile
- State dir riêng: `~/.openclaw/agents/<agentId>/agent/`
  - `auth-profiles.json` — API keys / OAuth tokens
  - `auth-state.json` — cooldown, rotation state
  - `models.json` — model registry
- Session store riêng: `~/.openclaw/agents/<agentId>/sessions/`

### 25.3 Mỗi Agent Dùng Model Khác Nhau — CÓ, Hoàn Toàn Được

**Đây là tính năng cốt lõi.** Cấu hình qua `agents.list[].model`:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",  // Default cho tất cả agents
        fallbacks: ["openai/gpt-4o"]
      }
    },
    list: [
      {
        id: "main",
        workspace: "~/.openclaw/workspace",
        // Không set model → kế thừa defaults (claude-sonnet)
      },
      {
        id: "work",
        workspace: "~/.openclaw/workspace-work",
        model: {
          primary: "openai/gpt-5.5",       // Agent work dùng GPT-5.5
          fallbacks: ["anthropic/claude-opus-4-6"]
        },
        agentRuntime: { id: "codex" }       // Chạy qua Codex app-server
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        model: "anthropic/claude-haiku-4-6" // Agent family dùng model rẻ hơn
      },
      {
        id: "coding",
        workspace: "~/.openclaw/workspace-coding",
        model: "anthropic/claude-opus-4-7",
        agentRuntime: { id: "claude-cli" }  // Chạy qua Claude CLI
      }
    ]
  }
}
```

**Bảng tóm tắt per-agent model:**

> ⚠️ **[INFERENCE]** Model trong cột "Lý do chọn" là ví dụ minh hoạ do tôi tự gán, không phải quy định của OpenClaw. Docs chỉ nói `agents.list[].model` cho phép override per-agent — việc chọn model nào cho agent nào là tuỳ người dùng.

| Agent | Model | Runtime | Lý do chọn |
|-------|-------|---------|-----------|
| `main` | claude-sonnet (default) | PI | Balanced, everyday use |
| `work` | gpt-5.5 | Codex app-server | Cần Codex tools |
| `family` | claude-haiku | PI | Rẻ hơn, dùng cho group chat |
| `coding` | claude-opus-4-7 | claude-cli | Cần coding power |
| Sub-agents | claude-haiku (config) | PI | Tiết kiệm chi phí |

### 25.4 Agent Runtimes — 4 Loại Engine Thực Thi

```mermaid
flowchart LR
    M["Model ref\nanthopic/claude-opus"] --> R{"agentRuntime.id"}
    R -->|"auto / pi"| PI["PI Runtime\n(default embedded)"]
    R -->|"codex"| CODEX["Codex App-server\n(bundled plugin)"]
    R -->|"claude-cli"| CCLI["Claude CLI\n(local process)"]
    R -->|"acp"| ACP["ACP/acpx\n(external: Claude Code,\nGemini CLI, OpenCode)"]
```

| Runtime | Cách dùng | Dùng khi |
|---------|----------|---------|
| **`pi`** (mặc định) | Built-in embedded | Hầu hết trường hợp |
| **`codex`** | `agentRuntime: { id: "codex" }` | Cần Codex app-server thread |
| **`claude-cli`** | `agentRuntime: { id: "claude-cli" }` | Reuse Claude CLI subscription |
| **`acp`** | `runtime: "acp"` trong sessions_spawn | Claude Code, Gemini CLI, OpenCode, Cursor |

```json5
// Ví dụ: Agent dùng OpenAI model nhưng chạy qua Codex runtime
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: { id: "codex" }
    }
  }
}

// Ví dụ: Agent dùng Anthropic model qua Claude CLI
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" }
    }
  }
}
```

**Lưu ý quan trọng:** Model ref và runtime là **hai layer độc lập**:
- `openai/gpt-5.5` = provider/model (cách auth và gọi API)
- `agentRuntime.id: "codex"` = engine thực thi turn (Codex app-server)

### 25.5 Routing Rules (Most-specific Wins)

```
Độ ưu tiên từ cao đến thấp:
1. peer match         → exact DM/group id
2. parentPeer match   → thread inheritance
3. guildId + roles    → Discord role routing
4. guildId            → Discord server
5. teamId             → Slack workspace
6. accountId match    → per-channel account
7. channel-wide       → accountId: "*"
8. Default agent      → fallback cuối cùng
```

```json5
// Ví dụ routing đầy đủ
{
  bindings: [
    // Peer-specific (ưu tiên cao nhất)
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } }
    },
    // Account-specific
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
    // Channel-wide fallback
    { agentId: "main", match: { channel: "whatsapp" } },
    // Discord guild + role
    {
      agentId: "coding",
      match: { channel: "discord", guildId: "123456789", roles: ["dev"] }
    }
  ]
}
```

### 25.6 Sub-agents — Agent Spawn Agent Nền

**Sub-agent** là một agent run được spawn trong nền từ agent hiện tại, sau khi xong tự động announce kết quả về.

```mermaid
sequenceDiagram
    participant User as User (WhatsApp)
    participant Main as Agent Main
    participant Sub as Sub-agent
    participant Model as LLM

    User->>Main: "Phân tích 100 file code này"
    Main->>Sub: sessions_spawn(task, model="claude-haiku")
    Main->>User: "Đang xử lý nền, tôi sẽ báo khi xong"
    Sub->>Model: Phân tích file (model rẻ hơn)
    Model-->>Sub: Kết quả
    Sub-->>Main: announce(result)
    Main->>User: "Xong! Đây là kết quả: ..."
```

**Spawn sub-agent trong chat:**
```bash
/subagents spawn coding "Review toàn bộ codebase và liệt kê security issues" --model anthropic/claude-opus-4-7
/subagents spawn research "Research về OpenClaw multi-agent architecture" --thinking high
/subagents list
/subagents log 1
/subagents kill all
```

**Spawn bằng tool `sessions_spawn`:**
```json5
// Agent tự spawn sub-agent trong tool loop
sessions_spawn({
  task: "Crawl 50 trang web và tóm tắt",
  model: "anthropic/claude-haiku-4-6",  // Model rẻ cho task đơn giản
  thinking: "low",
  runTimeoutSeconds: 600,
  context: "isolated",   // "isolated" (mặc định) hoặc "fork" (copy transcript)
  cleanup: "delete"      // Auto archive sau khi xong
})
```

**Hai context modes:**

| Mode | Khi dùng | Hành vi |
|------|---------|---------|
| `isolated` (mặc định) | Task độc lập, brief bằng text | Sub-agent bắt đầu với transcript sạch |
| `fork` | Task cần ngữ cảnh hiện tại | Copy transcript hiện tại vào sub-agent |

### 25.7 Orchestrator Pattern — Agent Điều Phối Agent

OpenClaw hỗ trợ tối đa **2 tầng nesting** (main → orchestrator → workers):

> ℹ️ **[SYNTHESIS — Diagram tôi tự vẽ]** Cấu trúc 3 tầng, depth limits, cascade stop đều lấy từ `docs/tools/subagents.md`. Diagram flowchart và tên workers (crawl/analyze/write) là minh hoạ của tôi.

```mermaid
flowchart TD
    Main["Agent Main\n(depth 0)"] -->|"sessions_spawn"| Orch["Orchestrator Sub-agent\n(depth 1)\nmaxSpawnDepth: 2"]
    Orch -->|"sessions_spawn x3"| W1["Worker 1\n(depth 2)\ncrawl data"]
    Orch -->|"sessions_spawn x3"| W2["Worker 2\n(depth 2)\nanalyze data"]
    Orch -->|"sessions_spawn x3"| W3["Worker 3\n(depth 2)\nwrite report"]
    W1 -->|"announce"| Orch
    W2 -->|"announce"| Orch
    W3 -->|"announce"| Orch
    Orch -->|"announce"| Main
```

```json5
// Bật orchestrator pattern (depth 2)
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2,          // Default: 1 (chỉ 1 tầng)
        maxChildrenPerAgent: 5,    // Max 5 children per session
        maxConcurrent: 8,          // Global concurrency cap
        runTimeoutSeconds: 900,    // 15 phút timeout per sub-agent
        model: "anthropic/claude-haiku-4-6",  // Model mặc định cho sub-agents (tiết kiệm)
        archiveAfterMinutes: 60    // Auto-archive sau 1 giờ
      }
    }
  }
}
```

**Phân công model theo tầng:**

> ⚠️ **[INFERENCE]** Bảng này là **suy luận của tôi** từ logic chi phí. Docs (`docs/tools/subagents.md`) chỉ nói: *"set a cheaper model for sub-agents"* và cấu hình `agents.defaults.subagents.model`. Mapping cụ thể opus/sonnet/haiku theo từng tầng là gợi ý của tôi, không phải quy định của OpenClaw.

| Tầng | Role | Model khuyến nghị |
|------|------|------------------|
| Depth 0 (main) | Nhận request, điều phối tổng thể | claude-opus (mạnh nhất) |
| Depth 1 (orchestrator) | Phân chia task, tổng hợp kết quả | claude-sonnet (balanced) |
| Depth 2 (worker) | Thực hiện task đơn giản | claude-haiku (rẻ nhất) |

### 25.8 Giao Tiếp Giữa Các Agent

```mermaid
flowchart LR
    A1["Agent main"] -->|"sessions_send(agentId='work')"| A2["Agent work"]
    A2 -->|"announce result"| A1
    A1 -->|"sessions_spawn(agentId='coding')"| A3["Agent coding (sub)"]
```

```json5
// Bật agent-to-agent messaging
{
  tools: {
    agentToAgent: {
      enabled: true,
      allow: ["main", "work", "coding"]  // Chỉ các agent này được nhắn nhau
    }
  }
}
```

**Tools giao tiếp agent:**

| Tool | Chức năng |
|------|-----------|
| `sessions_spawn` | Spawn sub-agent nền, announce kết quả về |
| `sessions_send` | Gửi message sang agent khác |
| `sessions_list` | Xem danh sách sessions đang chạy |
| `sessions_history` | Xem lịch sử bounded/sanitized của session |

### 25.9 Delegate Architecture — Agent Đại Diện Tổ Chức

**Delegate** là agent có identity riêng, hoạt động "thay mặt" người dùng trong tổ chức (không giả mạo).

```json5
{
  agents: {
    list: [
      { id: "main", default: true, workspace: "~/.openclaw/workspace" },
      {
        id: "org-assistant",
        name: "Company Assistant",
        workspace: "~/.openclaw/workspace-org",
        agentDir: "~/.openclaw/agents/org-assistant/agent",
        identity: { name: "Company Assistant" },
        model: "anthropic/claude-sonnet-4-6",  // Model riêng cho delegate
        tools: {
          allow: ["read", "exec", "message", "cron"],
          deny: ["write", "edit", "browser", "canvas"]
        },
        sandbox: { mode: "all", scope: "agent" }
      }
    ]
  },
  bindings: [
    { agentId: "org-assistant", match: { channel: "whatsapp", accountId: "org" } },
    { agentId: "main", match: { channel: "whatsapp" } }
  ]
}
```

**3 tier capability của delegate:**

| Tier | Quyền | Mô tả |
|------|-------|-------|
| **Tier 1: Read-only** | Chỉ đọc | Đọc email, lịch, tóm tắt cho người review |
| **Tier 2: Send on Behalf** | Đọc + ghi | Gửi email/event "on behalf of" với header rõ ràng |
| **Tier 3: Proactive** | Tự chủ | Cron jobs, standing orders, không cần approve từng action |

### 25.10 Config Đầy Đủ: 4 Agent Mỗi Loại

> ⚠️ **[INFERENCE — Example tổng hợp]** Config này là do **tôi tự xây dựng** bằng cách ghép các snippet từ nhiều file docs khác nhau (`multi-agent.md`, `subagents.md`, `agent-runtimes.md`). Mỗi key/value đều có nguồn gốc từ docs, nhưng **không có file nào trong docs chứa config kết hợp như thế này**. Dùng làm tham khảo, cần test thực tế trước khi dùng production.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["openai/gpt-4o", "google/gemini-2.5-flash"]
      },
      subagents: {
        maxSpawnDepth: 2,
        maxConcurrent: 8,
        model: "anthropic/claude-haiku-4-6",  // Sub-agents dùng model rẻ
        runTimeoutSeconds: 600
      }
    },
    list: [
      {
        id: "main",
        name: "Personal Assistant",
        default: true,
        workspace: "~/.openclaw/workspace",
        // Kế thừa model defaults (claude-sonnet)
      },
      {
        id: "work",
        name: "Work Assistant",
        workspace: "~/.openclaw/workspace-work",
        model: {
          primary: "openai/gpt-5.5",
          fallbacks: ["anthropic/claude-opus-4-6"]
        },
        agentRuntime: { id: "codex" },
        // Tools cho work context
        tools: { alsoAllow: ["sessions_spawn"] }
      },
      {
        id: "family",
        name: "Family Bot",
        workspace: "~/.openclaw/workspace-family",
        model: "anthropic/claude-haiku-4-6",  // Rẻ hơn cho group chat
        sandbox: { mode: "all", scope: "agent" },
        tools: {
          allow: ["exec", "read", "message", "sessions_list"],
          deny: ["write", "edit", "browser", "canvas", "sessions_spawn"]
        },
        groupChat: {
          mentionPatterns: ["@family", "@familybot"]
        }
      },
      {
        id: "coding",
        name: "Coding Agent",
        workspace: "~/.openclaw/workspace-coding",
        model: "anthropic/claude-opus-4-7",
        agentRuntime: { id: "claude-cli" },
        subagents: {
          model: "anthropic/claude-sonnet-4-6",  // Sub-agents của coding agent
          allowAgents: ["coding"]
        }
      }
    ]
  },
  bindings: [
    // Work: Slack + WhatsApp biz
    { agentId: "work", match: { channel: "slack" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
    // Family: group WhatsApp cụ thể
    {
      agentId: "family",
      match: { channel: "whatsapp", peer: { kind: "group", id: "120363999@g.us" } }
    },
    // Coding: Discord #dev channel
    {
      agentId: "coding",
      match: { channel: "discord", guildId: "123456789", roles: ["developer"] }
    },
    // Main: còn lại
    { agentId: "main", match: { channel: "whatsapp" } },
    { agentId: "main", match: { channel: "telegram" } }
  ],
  channels: {
    whatsapp: {
      accounts: { personal: {}, biz: {} }
    },
    discord: {
      accounts: { default: { token: "BOT_TOKEN" } }
    }
  },
  tools: {
    agentToAgent: {
      enabled: true,
      allow: ["main", "work", "coding"]
    }
  }
}
```

---

## 26. Context Engine — Engine Lắp Ghép Context

**Context engine** điều khiển cách OpenClaw build model context mỗi lượt: messages nào được đưa vào, compaction strategy, cross-session recall.

### 26.1 Hai Loại Engine

| Engine | Mô tả |
|--------|-------|
| **`legacy`** (mặc định) | Built-in, sanitize → validate → limit pipeline; compaction dùng built-in LLM summarization |
| **Plugin engine** | Custom assembly, custom compaction (DAG summaries, vector retrieval, v.v.) |

### 26.2 Lifecycle Của Context Engine

```
1. ingest()      → Khi nhận message mới (lưu/index)
2. assemble()    → Trước mỗi model run (trả messages fit trong token budget)
3. compact()     → Khi context đầy hoặc user gọi /compact
4. afterTurn()   → Sau run hoàn thành (persist state, background compaction)
```

### 26.3 Cài Plugin Engine

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

```json5
{
  plugins: {
    slots: { contextEngine: "lossless-claw" },
    entries: { "lossless-claw": { enabled: true } }
  }
}
```

---

## 27. Model Failover — Tự Động Chuyển Model Khi Lỗi

Khi một model/provider thất bại, OpenClaw tự động xoay sang provider khác theo hai tầng.

### 27.1 Hai Tầng Failover

```mermaid
flowchart TD
    Start["Model Request"] --> A["Auth Profile Rotation\n(trong cùng provider)"]
    A -->|"Rate limit / timeout"| A2["Profile 2 → Profile 3..."]
    A2 -->|"Tất cả profiles hết"| B["Model Fallback\n(sang provider khác)"]
    B --> B2["agents.defaults.model.fallbacks[0]"]
    B2 --> B3["fallbacks[1]..."]
    B3 -->|"Hết candidates"| E["FallbackSummaryError\n(thông báo user)"]
    A2 -->|"Thành công"| OK["✅ Response"]
    B2 -->|"Thành công"| OK
```

### 27.2 Cấu Hình Fallback Chain

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: [
          "anthropic/claude-haiku-4-6",
          "openai/gpt-4o",
          "google/gemini-2.5-flash"
        ]
      }
    }
  }
}
```

### 27.3 Cooldown & Billing Logic

| Loại lỗi | Hành vi | Cooldown |
|---------|---------|---------|
| Rate limit / 429 | Cooldown ngắn + rotate sang profile khác | 1m → 5m → 25m → 1h (exponential) |
| Timeout / overloaded | Failover ngay (1 rotation rồi nhảy model) | 0ms backoff |
| Billing / "insufficient credits" | Disabled (backoff dài) | 5h → 10h → ... cap 24h |
| Auth failure | Skip toàn bộ provider | Immediate |

**Session stickiness:** OpenClaw **pin auth profile per session** để giữ provider cache warm. Chỉ rotate khi cooldown/disabled hoặc `/new`/`/reset`.

### 27.4 Rotation Order Trong Một Provider

```
1. auth.order[provider] (config tường minh)
2. auth.profiles (filtered by provider)
3. Stored profiles (auth-profiles.json)

Tie-breaking: OAuth trước API key → oldest lastUsed first
```

---

## 28. Tóm Tắt Điểm Nổi Bật

| Tính năng             | Chi tiết                                                                      |
| --------------------- | ----------------------------------------------------------------------------- |
| **Kết nối đồng thời** | Có — unlimited channels cùng lúc                                              |
| **Channels hỗ trợ**   | 25+ (built-in + bundled + external plugins)                                   |
| **Model providers**   | 80+ (cloud, local, proxy)                                                     |
| **Auth methods**      | API key, OAuth, subscription, gcloud ADC, CLI OAuth                           |
| **API compatible**    | OpenAI-compatible (`/v1/chat/completions`, `/v1/responses`, `/v1/embeddings`) |
| **Built-in tools**    | 30+ tools (exec, browser, web, file, media, cron, gateway, ...)               |
| **Plugin system**     | Code plugins (in-process) + Bundle plugins (content/metadata)                 |
| **Automation**        | Cron, Heartbeat, Hooks, Standing Orders, Task Flow                            |
| **MCP**               | Server (expose tools) + Client (consume MCP servers)                          |
| **Node support**      | macOS, iOS, Android, Headless                                                 |
| **Security**          | Personal-assistant model, DM pairing, sandboxing, Tailscale                   |
| **Voice**             | VoiceClaw realtime endpoint (Gemini Live), TTS, STT                           |
| **Canvas**            | Agent-driven visual workspace                                                 |
| **Multi-agent**       | Isolated sessions/workspace per agent                                         |
| **Port**              | 18789 (configurable)                                                          |
| **Runtime**           | Node 24 (recommended), Node 22.19+ (min trên dòng 22)                         |
| **License**           | MIT                                                                           |

---

## 29. Yêu Cầu Phần Cứng & Hệ Thống

### 29.1 Yêu Cầu Phần Mềm Tối Thiểu

| Yêu cầu             | Tối thiểu                      | Khuyến nghị                       |
| ------------------- | ------------------------------ | --------------------------------- |
| **Runtime**         | Node 22.19+ (nhánh 22 LTS)     | **Node 24**                       |
| **OS**              | macOS / Linux / Windows (WSL2) | macOS hoặc Linux                  |
| **Windows**         | WSL2 (strongly recommended)    | WSL2                              |
| **Package manager** | npm, pnpm, hoặc bun            | npm (CLI), pnpm (build từ source) |

> **Lưu ý quan trọng:** OpenClaw Gateway bản thân là một tiến trình Node.js nhẹ — mọi tính toán AI nặng đều xảy ra **ở phía LLM provider** (cloud API). Yêu cầu phần cứng dưới đây là cho Gateway process, không phải cho model inference.

---

### 29.2 Phần Cứng Theo Từng Kịch Bản

#### Kịch Bản 1: Chạy Cục Bộ (Laptop / Desktop) với Cloud API Models

Đây là cách phổ biến nhất và **tiết kiệm tài nguyên nhất**:

| Thành phần | Tối thiểu                                 | Khuyến nghị                        |
| ---------- | ----------------------------------------- | ---------------------------------- |
| CPU        | Bất kỳ modern CPU                         | Không yêu cầu đặc biệt             |
| RAM        | **512 MB trống** cho Gateway              | 1–2 GB trống                       |
| Disk       | **~500 MB** (app + dependencies)          | 2–5 GB (sessions, logs, workspace) |
| Network    | Kết nối internet ổn định                  | Băng thông tốt cho streaming       |
| OS         | macOS 12+, Ubuntu 20.04+, Windows 11 WSL2 | macOS hoặc Ubuntu LTS              |

**Tóm tắt:** Máy tính bình thường đều chạy được — Gateway chỉ là một proxy process. *(Cách diễn đạt của tôi — docs xác nhận Gateway là Node.js process và model chạy ở cloud, nhưng không dùng từ "proxy". ⚠️ [INFERENCE về framing])*

---

#### Kịch Bản 2: Raspberry Pi (Self-hosted, Always-on)

```
Yêu cầu chính thức từ docs/install/raspberry-pi.md
```

| Thành phần  | Tối thiểu                   | Khuyến nghị                            |
| ----------- | --------------------------- | -------------------------------------- |
| **Model**   | Raspberry Pi 4              | **Raspberry Pi 4 hoặc Pi 5**           |
| **RAM**     | 2 GB                        | **4 GB**                               |
| **Storage** | 16 GB microSD               | **USB SSD** (microSD wear out nhanh)   |
| **OS**      | 64-bit Raspberry Pi OS Lite | Raspberry Pi OS Lite 64-bit (headless) |
| **Power**   | Official Pi power supply    | Official Pi power supply               |
| **Network** | WiFi hoặc Ethernet          | **Ethernet** (ổn định hơn)             |

**Thiết lập thêm cho RAM thấp:**

```bash
# Thêm 2 GB swap cho Pi 2 GB RAM
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Giảm swappiness
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# Giảm GPU memory (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
```

**Tăng tốc CLI trên ARM:**

```bash
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
```

---

#### Kịch Bản 3: VPS / Cloud Server (24/7, Khuyến Nghị)

```
"If you want OpenClaw 24/7 for ~$5, this is the simplest reliable setup."
— docs/install/hetzner.md
```

**Specs tối thiểu cho VPS:**

| Thành phần | Tối thiểu              | Khuyến nghị          |
| ---------- | ---------------------- | -------------------- |
| vCPU       | 1 vCPU                 | 1–2 vCPU             |
| RAM        | **1 GB** (+ 2 GB swap) | **2 GB**             |
| Disk       | 25 GB SSD              | 40–50 GB SSD         |
| Network    | 1 Gbps                 | 1 Gbps               |
| OS         | Ubuntu 22.04 LTS       | **Ubuntu 24.04 LTS** |

**Thêm 2 GB swap cho VPS 1 GB RAM:**

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

**Ưu tiên SSD** — tránh HDD vì Gateway lưu session transcripts (JSONL reads/writes liên tục).

---

#### Kịch Bản 4: Các Cloud Provider Cụ Thể

| Provider               | Spec cụ thể từ docs                                          | Chi phí             | Ghi chú                                          |
| ---------------------- | ------------------------------------------------------------ | ------------------- | ------------------------------------------------ |
| **Hetzner**            | Smallest Debian/Ubuntu VPS                                   | ~$4–5/tháng         | Khuyến nghị nhất cho self-hosted                 |
| **DigitalOcean**       | 1 vCPU / 1 GB / 25 GB SSD                                    | ~$6/tháng           | Thêm 2 GB swap                                   |
| **Oracle Cloud**       | VM.Standard.A1.Flex (ARM): 2–4 OCPU, 12–24 GB RAM, 50–200 GB | **Miễn phí**        | Always Free tier; ARM64                          |
| **Fly.io**             | `shared-cpu-2x`, 2048 MB RAM, 1 GB volume                    | Pay-as-you-go       | Config: `NODE_OPTIONS=--max-old-space-size=1536` |
| **Railway**            | 512 MB+ RAM                                                  | Pay-as-you-go       | One-click setup                                  |
| **Render**             | 512 MB+ RAM                                                  | Free tier available |                                                  |
| **AWS EC2**            | t3.micro (1 vCPU / 1 GB)                                     | Free tier 12 tháng  | Cần thêm swap                                    |
| **GCP Compute Engine** | e2-micro (0.25 vCPU / 1 GB)                                  | Free tier           | Cần thêm swap                                    |
| **Azure**              | B1s (1 vCPU / 1 GB)                                          | Pay-as-you-go       |                                                  |
| **Raspberry Pi**       | Pi 4/5 + 2–4 GB RAM                                          | ~$35–80 one-time    | Tự lưu trữ tại nhà                               |

---

#### Kịch Bản 5: Chạy Local Models (GPU On-device)

> **Cảnh báo từ docs:** "Local is doable, but OpenClaw expects large context + strong defenses against prompt injection. Small cards truncate context and leak safety."

```
"Aim high: ≥2 maxed-out Mac Studios or equivalent GPU rig (~$30k+).
A single 24 GB GPU works only for lighter prompts with higher latency."
— docs/gateway/local-models.md
```

| Tier                 | Hardware                               | Mô tả                                         |
| -------------------- | -------------------------------------- | --------------------------------------------- |
| **Tối thiểu**        | 1× GPU 24 GB VRAM                      | Hoạt động được với latency cao, model nhỏ hơn |
| **Khuyến nghị thấp** | 2× GPU 48–80 GB VRAM                   | Full-size models, reasonable latency          |
| **Khuyến nghị cao**  | ≥2 Mac Studio (M3 Ultra / M4 Max)      | ~$30k+, full quality                          |
| **Dễ nhất**          | LM Studio + model lớn nhất có thể load | Tránh quantized/small variants                |

**Providers local model được hỗ trợ:**

| Provider      | Hardware yêu cầu    | Ghi chú                        |
| ------------- | ------------------- | ------------------------------ |
| **Ollama**    | CPU đủ RAM hoặc GPU | Dễ setup nhất, nhiều model     |
| **LM Studio** | GPU khuyến nghị     | GUI đẹp, Responses API support |
| **vLLM**      | NVIDIA GPU (CUDA)   | Production-grade serving       |
| **SGLang**    | NVIDIA GPU (CUDA)   | Fast inference                 |
| **inferrs**   | Apple Silicon       | Tối ưu cho Mac                 |

**Khuyến nghị thực tế:** Nếu không có GPU tốt, **dùng cloud API** (Anthropic, OpenAI, Google) — rẻ hơn và chất lượng tốt hơn chạy model nhỏ local.

---

#### Kịch Bản 6: Docker / Containerized

```yaml
# Từ fly.toml — cấu hình Fly.io chính thức
[[vm]]
  size = "shared-cpu-2x"
  memory = "2048mb"

# Node options để giới hạn heap
NODE_OPTIONS = "--max-old-space-size=1536"
```

| Thành phần    | Tối thiểu         | Khuyến nghị               |
| ------------- | ----------------- | ------------------------- |
| Docker        | Docker Engine 20+ | Docker 24+                |
| Container RAM | 512 MB            | **1–2 GB**                |
| Volume        | 1 GB persistent   | 5 GB+ (sessions tích lũy) |

---

### 29.3 Tổng Hợp Phần Cứng Theo Use Case

```mermaid
flowchart TD
    Q["Bạn dùng OpenClaw như thế nào?"]

    Q --> A["Personal assistant\ntrên laptop/Mac"]
    Q --> B["Always-on 24/7\ncần headless"]
    Q --> C["Team / company agent\ncần reliable"]
    Q --> D["Local models\nkhông muốn cloud API"]

    A --> A1["✅ Bất kỳ máy nào\nNode 24 + Internet\nGateway dùng <1GB RAM"]

    B --> B1{"Budget?"}
    B1 -->|"Free"| B2["Oracle Cloud Free\n4 OCPU ARM / 24 GB RAM\n200 GB storage"]
    B1 -->|"~$5/tháng"| B3["Hetzner smallest VPS\n1 vCPU / 2 GB / SSD\nhoặc Raspberry Pi 4 4GB"]
    B1 -->|"Self-hosted"| B4["Raspberry Pi 4/5\n4 GB RAM + USB SSD\n$35-80 one-time"]

    C --> C1["VPS 2 GB RAM+\nDigitalOcean / Hetzner / AWS\nSSD + systemd/Docker"]

    D --> D1{"GPU VRAM?"}
    D1 -->|"<24 GB"| D2["⚠️ Không khuyến nghị\nDùng cloud API thay thế"]
    D1 -->|"24 GB"| D3["Ollama / LM Studio\nLatency cao, model nhỏ"]
    D1 -->|"≥48 GB hoặc Mac Studio"| D4["Full-size models\nvLLM / SGLang / LM Studio"]
```

---

### 29.4 Performance Tuning Theo Môi Trường

| Môi trường              | Tuning cần thiết                                       |
| ----------------------- | ------------------------------------------------------ |
| **VPS RAM thấp (1 GB)** | Thêm 2 GB swap, tránh browser tool                     |
| **ARM (Pi, Oracle)**    | `NODE_COMPILE_CACHE`, `OPENCLAW_NO_RESPAWN=1`          |
| **Fly.io / container**  | `NODE_OPTIONS=--max-old-space-size=1536`               |
| **systemd**             | `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90` |
| **Pi (headless)**       | `gpu_mem=16`, disable bluetooth/avahi                  |
| **Windows WSL2**        | Dùng WSL2 thay vì native Windows                       |

---

### 29.5 Disk Usage Ước Tính

| Thành phần                               | Dung lượng                                |
| ---------------------------------------- | ----------------------------------------- |
| OpenClaw install (`node_modules` + dist) | ~300–500 MB                               |
| `~/.openclaw/` config + state            | ~10–50 MB                                 |
| Sessions transcripts (JSONL)             | ~1–10 MB/session, tích lũy theo thời gian |
| Workspace files                          | Phụ thuộc user                            |
| WhatsApp state (Baileys)                 | ~50–200 MB                                |
| Browser cache (nếu dùng browser tool)    | ~500 MB–2 GB                              |
| Cron logs                                | ~2 MB tối đa (auto-prune)                 |
| **Tổng khuyến nghị** ⚠️ *[INFERENCE: tôi cộng các con số riêng lẻ từ docs, docs không có con số tổng]* | **5–20 GB** cho setup đầy đủ |

---

## 30. Kết Nối Với Công Cụ & Dịch Vụ Bên Ngoài

OpenClaw không phải là một platform đóng. Có **5 cơ chế chính** để kết nối các dịch vụ bên ngoài như Gmail, Google Drive, GitHub, Facebook Fanpage, Notion, Slack API, v.v.:

```mermaid
flowchart TD
    EXT["Dịch vụ bên ngoài\n(Gmail / Drive / GitHub\n/ Facebook / Notion / ...)"]

    EXT -->|"1. MCP Server\n(chính thức nhất)"| MCP["openclaw mcp set\n→ MCP Server stdio/SSE/HTTP"]
    EXT -->|"2. Webhook Inbound\n(external trigger → OpenClaw)"| WH["POST /hooks/wake\nPOST /hooks/agent"]
    EXT -->|"3. Gmail PubSub\n(realtime inbox)"| GMAIL["gcloud pubsub\n+ openclaw webhooks gmail setup"]
    EXT -->|"4. exec tool\n(script/API call trực tiếp)"| EXEC["agent dùng exec tool\ngọi curl/Python/CLI"]
    EXT -->|"5. Google Meet Plugin\n(tham gia cuộc họp)"| GMEET["openclaw googlemeet join\n+ google_meet tool"]

    MCP --> AGENT["🤖 Pi Agent"]
    WH --> AGENT
    GMAIL --> AGENT
    EXEC --> AGENT
    GMEET --> AGENT
```

---

### 30.1 Cơ Chế 1: MCP Server (Cách Chính Thức & Linh Hoạt Nhất)

**MCP (Model Context Protocol)** là cơ chế mạnh nhất để tích hợp bất kỳ dịch vụ nào vào OpenClaw. Agent có thể gọi tools được expose qua MCP server như gọi built-in tools.

#### Cách hoạt động

```mermaid
flowchart LR
    AGENT["🤖 Pi Agent\n(tool loop)"] -->|"call mcp_tool(...)"| MCP_CLIENT["MCP Client\n(embedded in Pi)"]
    MCP_CLIENT -->|"stdio / SSE / HTTP"| MCP_SRV["MCP Server\n(third-party)"]
    MCP_SRV -->|"API calls"| EXT["External Service\n(GitHub / Drive / Notion / ...)"]
```

#### Đăng ký MCP Server

```bash
# Stdio transport (local process)
openclaw mcp set github '{"command":"npx","args":["@modelcontextprotocol/server-github"],"env":{"GITHUB_TOKEN":"ghp_..."}}'

# SSE / HTTP transport (remote server)
openclaw mcp set mytools '{"url":"https://mcp.example.com","transport":"streamable-http","headers":{"Authorization":"Bearer TOKEN"}}'

# Xem danh sách
openclaw mcp list
openclaw mcp show github
```

#### Ví Dụ: GitHub via MCP

```bash
# 1. Cài MCP server cho GitHub
openclaw mcp set github '{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": { "GITHUB_TOKEN": "ghp_your_token_here" }
}'

# 2. Agent giờ có thể dùng GitHub tools:
# - create_issue, list_issues, create_pull_request
# - search_repositories, get_file_contents
# - push_files, create_branch, fork_repository
```

#### Ví Dụ: Google Drive & Google Docs via MCP

```bash
openclaw mcp set gdrive '{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-gdrive"],
  "env": { "GOOGLE_CLIENT_ID": "...", "GOOGLE_CLIENT_SECRET": "...", "GOOGLE_REFRESH_TOKEN": "..." }
}'
# Tools: list_files, read_file, search_files, create_doc, update_doc
```

#### Ví Dụ: Notion via MCP

```bash
openclaw mcp set notion '{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-notion"],
  "env": { "NOTION_API_KEY": "secret_..." }
}'
# Tools: search_pages, get_page, create_page, update_page, create_database_entry
```

#### Ví Dụ: Slack API via MCP

```bash
openclaw mcp set slack '{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-slack"],
  "env": { "SLACK_BOT_TOKEN": "xoxb-...", "SLACK_TEAM_ID": "T..." }
}'
# Tools: list_channels, post_message, get_channel_history, reply_to_thread
```

#### Ví Dụ: PostgreSQL / Database via MCP

```bash
openclaw mcp set postgres '{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres"],
  "env": { "POSTGRES_URL": "postgresql://user:pass@host/db" }
}'
```

#### Cấu hình trong `openclaw.json` (thay vì CLI)

```json5
{
  mcp: {
    servers: {
      github: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: { GITHUB_TOKEN: "${GITHUB_TOKEN}" },
      },
      gdrive: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-gdrive"],
      },
      context7: {
        command: "uvx",
        args: ["context7-mcp"],
      },
    },
  },
}
```

**Tool profile & MCP:**

- Profile `coding` và `messaging` tự động include MCP tools được cấu hình
- Ẩn MCP tools: `tools.deny: ["bundle-mcp"]`
- Profile `minimal` **không** include MCP tools

#### Các MCP Server Phổ Biến

| Dịch vụ          | MCP Server Package                              | Auth                    |
| ---------------- | ----------------------------------------------- | ----------------------- |
| **GitHub**       | `@modelcontextprotocol/server-github`           | `GITHUB_TOKEN`          |
| **Google Drive** | `@modelcontextprotocol/server-gdrive`           | OAuth / Service Account |
| **Notion**       | `@modelcontextprotocol/server-notion`           | `NOTION_API_KEY`        |
| **Slack**        | `@modelcontextprotocol/server-slack`            | `SLACK_BOT_TOKEN`       |
| **PostgreSQL**   | `@modelcontextprotocol/server-postgres`         | Connection URL          |
| **SQLite**       | `@modelcontextprotocol/server-sqlite`           | File path               |
| **Filesystem**   | `@modelcontextprotocol/server-filesystem`       | Local paths             |
| **Puppeteer**    | `@modelcontextprotocol/server-puppeteer`        | Không cần               |
| **Brave Search** | `@modelcontextprotocol/server-brave-search`     | `BRAVE_API_KEY`         |
| **Context7**     | `context7-mcp` (uvx)                            | Không cần               |
| **Exa Search**   | custom                                          | `EXA_API_KEY`           |
| **AWS**          | `@modelcontextprotocol/server-aws-kb-retrieval` | AWS credentials         |
| **Jira**         | custom                                          | `JIRA_API_TOKEN`        |
| **Linear**       | custom                                          | `LINEAR_API_KEY`        |

---

### 30.2 Cơ Chế 2: Webhook Inbound (External System → OpenClaw)

Cho phép **hệ thống bên ngoài trigger OpenClaw**. Ví dụ: GitHub Actions gửi webhook khi có PR; n8n/Zapier trigger agent khi có email mới.

#### Bước 1: Bật Webhook Endpoint

```json5
{
  hooks: {
    enabled: true,
    token: "your-secret-webhook-token",
    path: "/hooks",
  },
}
```

#### Bước 2: Gọi từ Dịch vụ Bên Ngoài

**POST `/hooks/wake`** — Gửi event cho main session:

```bash
# Ví dụ: GitHub Actions gửi notification
curl -X POST http://your-gateway:18789/hooks/wake \
  -H 'Authorization: Bearer your-secret-webhook-token' \
  -H 'Content-Type: application/json' \
  -d '{"text":"PR #123 merged vào main","mode":"now"}'
```

**POST `/hooks/agent`** — Chạy isolated agent turn:

```bash
# Ví dụ: n8n trigger phân tích email
curl -X POST http://your-gateway:18789/hooks/agent \
  -H 'Authorization: Bearer your-secret-webhook-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Phân tích email này và reply nếu cần",
    "name": "EmailAgent",
    "model": "anthropic/claude-opus-4-6",
    "thinking": "medium",
    "deliver": true,
    "channel": "telegram"
  }'
```

#### Ví Dụ: Facebook Fanpage → OpenClaw

Vì OpenClaw chưa có native Facebook Fanpage channel, dùng webhook approach:

```
Facebook Webhook (Meta Developer) → n8n/Zapier/custom server
  → POST /hooks/agent (OpenClaw)
  → Agent xử lý + reply qua message tool (hoặc gọi Facebook API qua exec/MCP)
```

```bash
# Custom webhook bridge cho Facebook Messenger
curl -X POST http://gateway:18789/hooks/agent \
  -H 'Authorization: Bearer TOKEN' \
  -d '{
    "message": "User Nguyen Van A hỏi về sản phẩm: '\''Giá laptop là bao nhiêu?'\''",
    "name": "FacebookBot"
  }'
```

#### Webhooks Plugin (TaskFlow)

Plugin `webhooks` cho phép Zapier, n8n, CI kích hoạt và điều khiển **TaskFlows**:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "ZAPIER_SECRET",
              },
              description: "Zapier TaskFlow bridge",
            },
            github_actions: {
              path: "/plugins/webhooks/github",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "GITHUB_WEBHOOK_SECRET",
              },
            },
          },
        },
      },
    },
  },
}
```

**Supported actions qua webhook:**
`create_flow`, `run_task`, `get_flow`, `resolve_flow`, `resume_flow`, `finish_flow`, `cancel_flow`, v.v.

---

### 30.3 Cơ Chế 3: Gmail PubSub (Realtime Email Trigger)

Tích hợp Gmail inbox trigger OpenClaw theo **realtime** qua Google Cloud PubSub.

#### Architecture

```mermaid
sequenceDiagram
    participant Gmail as 📧 Gmail
    participant GCP as ☁️ Google Cloud PubSub
    participant GW as 🦞 OpenClaw Gateway
    participant Agent as 🤖 Agent

    Gmail->>GCP: Push notification (new email)
    GCP->>GW: POST /hooks/gmail (webhook push)
    GW->>Agent: Wake agent vá»›i email metadata
    Agent->>Gmail: Đọc email (qua exec/gog CLI)
    Agent->>Agent: Xử lý + reply / tạo task
```

#### Setup Nhanh (Khuyến Nghị)

```bash
# Cần: gcloud CLI, gog (gogcli), Tailscale Funnel
openclaw webhooks gmail setup --account your@gmail.com
```

Lệnh này tự động:

1. Ghi `hooks.gmail` config
2. Enable Gmail preset
3. Dùng Tailscale Funnel làm HTTPS endpoint

#### Setup Thủ Công

```bash
# Bước 1: Enable Google APIs
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com

# Bước 2: Tạo PubSub topic
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher

# Bước 3: Bắt đầu watch
gog gmail watch start \
  --account your@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

#### Config OpenClaw cho Gmail

```json5
{
  hooks: {
    enabled: true,
    gmail: {
      account: "your@gmail.com",
      model: "anthropic/claude-opus-4-6",
      thinking: "low",
    },
  },
}
```

Gateway tự động khởi động `gog gmail watch serve` khi boot và tự gia hạn watch. Tắt bằng: `OPENCLAW_SKIP_GMAIL_WATCHER=1`

---

### 30.4 Cơ Chế 4: exec Tool (Script / API Gọi Trực Tiếp)

Agent dùng tool `exec` để gọi bất kỳ CLI, script, hoặc API nào. Đây là cách linh hoạt nhất nhưng ít structured nhất.

#### Ví Dụ: GitHub API via curl

```
Agent nhận yêu cầu: "Tạo issue trên repo openclaw/openclaw"
→ Agent dùng exec tool:
  curl -X POST https://api.github.com/repos/openclaw/openclaw/issues \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -d '{"title":"Bug report","body":"..."}'
```

#### Ví Dụ: Google Drive via Python Script

```python
# agent tạo file script.py rồi exec
from googleapiclient.discovery import build
from google.oauth2 import service_account
# ... upload/read file từ Drive
```

#### Ví Dụ: Facebook Graph API

```bash
# Agent gọi FB Graph API qua exec
curl "https://graph.facebook.com/v20.0/me/messages" \
  -H "Authorization: Bearer $PAGE_ACCESS_TOKEN" \
  -d '{"recipient":{"id":"USER_ID"},"message":{"text":"Hello!"}}'
```

#### Bảo Mật exec

```json5
{
  tools: {
    exec: {
      ask: true, // Hỏi approval trước khi chạy lệnh mới
      security: "high", // Không cho thay đổi setting này qua gateway tool
    },
  },
}
```

---

### 30.5 Cơ Chế 5: Google Meet Plugin (OAuth)

Plugin chuyên dụng cho Google Meet — cho phép agent **tham gia** và **tạo** cuộc họp qua OAuth.

#### Cài Đặt

```bash
# Enable plugin
openclaw plugins enable google-meet

# Hoặc qua config
```

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

#### Auth: Google OAuth

```bash
# Auth Google Meet API (personal OAuth)
openclaw googlemeet auth login
# → Browser OAuth flow với Google account
```

#### Sử Dụng

```bash
# Join meeting
openclaw googlemeet join https://meet.google.com/abc-defg-hij

# Tạo meeting mới và join
openclaw googlemeet create --transport chrome-node --mode realtime

# Tạo chỉ URL (không join)
openclaw googlemeet create --no-join
```

#### Agent Tool

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Modes:

- `realtime` — live audio listen/talk-back qua Gemini Live hoặc OpenAI Realtime
- `transcribe` — chỉ join browser và điều khiển (không realtime voice)

Transports:

- `chrome` — Chrome local
- `chrome-node` — Chrome trên paired node
- `twilio` — Twilio dial-in

---

### 30.6 Web Search Providers (Kết Nối Tìm Kiếm)

Agent dùng `web_search` tool với nhiều provider khác nhau:

| Provider          | Config Key                                | Auth                 | Đặc điểm                               |
| ----------------- | ----------------------------------------- | -------------------- | -------------------------------------- |
| **Brave Search**  | `tools.web.search.provider: "brave"`      | `BRAVE_API_KEY`      | Structured results, LLM Context mode   |
| **Perplexity**    | `tools.web.search.provider: "perplexity"` | `PERPLEXITY_API_KEY` | AI-synthesized answers vá»›i citations |
| **Google Search** | Google plugin                             | `GEMINI_API_KEY`     | Google Search integration              |
| **Exa**           | MCP server                                | `EXA_API_KEY`        | Semantic search                        |

#### Brave Search Config

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BSA...",
            mode: "llm-context", // hoặc "web"
          },
        },
      },
    },
  },
  tools: {
    web: { search: { provider: "brave", maxResults: 5 } },
  },
}
```

#### Perplexity Config

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: { apiKey: "pplx-..." },
        },
      },
    },
  },
  tools: {
    web: { search: { provider: "perplexity" } },
  },
}
```

#### Firecrawl (Enhanced Web Fetch)

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: { apiKey: "fc-..." },
      },
    },
  },
}
```

Agent dùng `web_fetch` với Firecrawl để lấy nội dung trang web dạng Markdown sạch, bypass nhiều anti-scraping.

---

### 30.7 Tổng Hợp: Cách Kết Nối Từng Dịch Vụ

| Dịch vụ                   | Cơ chế chính                 | Auth                    | Ghi chú                                        |
| ------------------------- | ---------------------------- | ----------------------- | ---------------------------------------------- |
| **Gmail**                 | Gmail PubSub + hooks         | Google OAuth / gcloud   | Realtime inbox trigger                         |
| **Google Drive**          | MCP server                   | OAuth / Service Account | Read/write files                               |
| **Google Calendar**       | MCP server                   | OAuth                   | Xem/tạo events                                 |
| **Google Sheets**         | MCP server                   | OAuth                   | Read/write cells                               |
| **Google Meet**           | google-meet plugin           | Google OAuth            | Join/create meetings                           |
| **GitHub**                | MCP server                   | `GITHUB_TOKEN`          | Issues, PRs, repos, files                      |
| **Facebook Fanpage**      | Webhook (n8n/Zapier) → hooks | Page Access Token       | Không có native channel; dùng exec + Graph API |
| **Facebook Messenger**    | Webhook bridge → hooks       | Page Access Token       | Tương tự Fanpage                               |
| **Instagram**             | Webhook bridge → hooks       | Instagram Graph API     | Qua Meta Graph API                             |
| **Twitter/X**             | x_search tool (built-in)     | `TWITTER_BEARER_TOKEN`  | Tìm kiếm posts                                 |
| **Notion**                | MCP server                   | `NOTION_API_KEY`        | Full CRUD                                      |
| **Jira**                  | MCP server                   | `JIRA_API_TOKEN`        | Issues, sprints                                |
| **Linear**                | MCP server                   | `LINEAR_API_KEY`        | Issues, projects                               |
| **Slack API**             | MCP server                   | `SLACK_BOT_TOKEN`       | Ngoài Slack channel                            |
| **Zapier / n8n**          | Webhooks plugin              | Shared secret           | Two-way automation                             |
| **Airtable**              | MCP server                   | `AIRTABLE_API_KEY`      | Records, bases                                 |
| **HubSpot**               | MCP server hoặc exec         | `HUBSPOT_API_KEY`       | CRM                                            |
| **Shopify**               | exec + curl                  | `SHOPIFY_ACCESS_TOKEN`  | Store API                                      |
| **PostgreSQL / MySQL**    | MCP server                   | Connection URL          | DB queries                                     |
| **AWS S3**                | exec + AWS CLI               | AWS credentials         | File storage                                   |
| **Telegram Bot API**      | Native Telegram channel      | Bot token               | **Channel tích hợp sẵn**                       |
| **WhatsApp Business API** | Webhook → hooks              | Business API token      | Ngoài Baileys personal                         |

---

### 30.8 Phân Biệt Rõ: OAuth Trong OpenClaw Hoạt Động Như Thế Nào

> **Hiểu đúng quan trọng:** OpenClaw có **2 lớp auth hoàn toàn khác nhau** — nhiều người nhầm lẫn giữa hai lớp này.

```mermaid
flowchart TB
    subgraph L1["Lớp A: OpenClaw Built-in OAuth\n(CHỈ dành cho LLM model providers)"]
        direction LR
        OA1["OpenAI Codex\n(ChatGPT subscription)\nPKCE flow"]
        OA2["Anthropic Claude CLI\nclaude auth login\nreuse existing login"]
        OA3["Google Gemini CLI\ngemini-cli OAuth\nbrowser flow"]
        OA4["MiniMax OAuth\nGlobal / CN"]
        OA5["Z.AI / GLM\nCoding Plan OAuth"]
    end

    subgraph L2["Lớp B: External Service Tokens\n(Tự quản lý, KHÔNG qua OpenClaw OAuth)"]
        direction LR
        EB1["GitHub PAT\n→ env var hoặc SecretRef"]
        EB2["Google Drive tokens\n→ env var hoặc SecretRef"]
        EB3["Facebook Page Token\n→ env var hoặc SecretRef"]
        EB4["Notion API Key\n→ env var hoặc SecretRef"]
        EB5["Slack Bot Token\n→ env var hoặc SecretRef"]
    end

    L1 -->|"Stored in auth-profiles.json\n~/.openclaw/agents/<id>/agent/"| AP["auth-profiles.json\n(per-agent credential store)"]
    L2 -->|"Read via SecretRef\nhệ thống riêng"| SR["Secrets Management\n(env / file / exec / vault)"]

    AP --> AGENT["🤖 Agent / LLM calls"]
    SR --> MCP["MCP Server processes\n(GitHub, Drive, Notion...)"]
```

---

#### Lớp A: OpenClaw Built-in OAuth (Chỉ cho LLM Providers)

Đây là hệ thống **subscription auth** — cho phép dùng **tài khoản trả phí** (ChatGPT Plus, Claude Pro) thay vì API key tính tiền theo usage.

| Provider                   | Auth Method      | CLI Flow                                                       | Token Location          |
| -------------------------- | ---------------- | -------------------------------------------------------------- | ----------------------- |
| **OpenAI Codex** (ChatGPT) | PKCE OAuth       | `openclaw onboard --auth-choice openai-codex`                  | `auth-profiles.json`    |
| **Anthropic Claude**       | Claude CLI reuse | `openclaw models auth login --provider anthropic --method cli` | Claude's own auth store |
| **Google Gemini CLI**      | Browser OAuth    | `openclaw models auth login --provider google-gemini-cli`      | `auth-profiles.json`    |
| **MiniMax**                | Portal OAuth     | `openclaw onboard --auth-choice minimax-global-oauth`          | `auth-profiles.json`    |
| **Z.AI / GLM**             | Coding Plan      | `openclaw onboard --auth-choice zai-api-key`                   | `auth-profiles.json`    |

**OpenAI Codex PKCE Flow (chi tiết):**

```
1. Generate PKCE verifier/challenge + random state
2. Open: https://auth.openai.com/oauth/authorize?...
3. Capture callback at http://127.0.0.1:1455/auth/callback
   (hoặc paste redirect URL nếu headless/remote)
4. Exchange code tại: https://auth.openai.com/oauth/token
5. Store { access, refresh, expires, accountId } vào auth-profiles.json
```

**Anthropic Claude CLI Reuse Flow:**

```bash
# Bước 1: Login Claude Code trên gateway host
claude auth login
claude auth status --text

# Bước 2: Báo OpenClaw dùng CLI backend này
openclaw models auth login --provider anthropic --method cli --set-default
```

**Token storage:** `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

**Multi-account / profile routing:**

```bash
# Xem profiles hiện tại
openclaw models status --probe

# Set auth order cho provider
openclaw models auth order set --provider anthropic anthropic:work
openclaw models auth order clear --provider anthropic

# Per-session override trong chat
/model anthropic/claude-opus-4-6@anthropic:work
```

**Auto-refresh:** OpenClaw tự động refresh token khi expired — không cần can thiệp thủ công.

---

#### Lớp B: External Service Tokens (GitHub, Drive, Facebook, v.v.)

Đây **KHÔNG phải** là OpenClaw OAuth. Các dịch vụ bên ngoài được kết nối qua:

- **MCP server** nhận credentials qua environment variables
- Credentials được lưu an toàn qua **SecretRef** (không phải plaintext)

---

### 30.9 Secrets Management — Lưu Trữ Credentials An Toàn

Đây là hệ thống riêng biệt cho phép lưu **bất kỳ API key/token nào** (bao gồm cả tokens cho MCP servers kết nối dịch vụ ngoài) mà không để plaintext trong config file.

#### SecretRef Contract

```json5
{ "source": "env" | "file" | "exec", "provider": "default", "id": "..." }
```

#### Ba loại Secret Provider

**1. `env` — Environment Variable (đơn giản nhất)**

```json5
{ source: "env", provider: "default", id: "GITHUB_TOKEN" }
```

- OpenClaw đọc từ `GITHUB_TOKEN` env var
- Lưu trong `~/.openclaw/.env` hoặc system env

**2. `file` — JSON File**

```json5
{ source: "file", provider: "filemain", id: "/providers/github/token" }
```

- OpenClaw đọc từ JSON file tại đường dẫn đã cấu hình
- `id` là JSON pointer (RFC6901)

**3. `exec` — External Binary (1Password, Vault, sops)**

```json5
{ source: "exec", provider: "vault", id: "providers/github/token" }
```

- OpenClaw gọi binary bên ngoài để lấy secret
- Không bao giờ lưu secret trong config file

#### Config Providers

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
  },
}
```

#### Tích Hợp Với Secret Managers Phổ Biến

**1Password CLI:**

```json5
{
  secrets: {
    providers: {
      onepassword: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true,
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/GitHub Token/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  // Dùng trong MCP server config:
  mcp: {
    servers: {
      github: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: {
          GITHUB_TOKEN: {
            source: "exec",
            provider: "onepassword",
            id: "value",
          },
        },
      },
    },
  },
}
```

**HashiCorp Vault:**

```json5
{
  secrets: {
    providers: {
      vault: {
        source: "exec",
        command: "/usr/local/bin/vault",
        allowSymlinkCommand: true,
        trustedDirs: ["/usr/local"],
        args: ["kv", "get", "-field=GITHUB_TOKEN", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
}
```

**sops (encrypted secrets file):**

```json5
{
  secrets: {
    providers: {
      sops: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true,
        args: [
          "-d",
          "--extract",
          '["github"]["token"]',
          "/path/to/secrets.enc.json",
        ],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
}
```

#### MCP Server Credentials Qua SecretRef

**Quan trọng:** Token cho MCP servers (GitHub, Drive, Notion, v.v.) có thể lưu an toàn qua SecretRef thay vì hardcode plaintext:

```json5
{
  mcp: {
    servers: {
      github: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: {
          // Thay vì: GITHUB_TOKEN: "ghp_abc123..."  ← KHÔNG NÊN
          // Dùng SecretRef:
          GITHUB_TOKEN: {
            source: "env",
            provider: "default",
            id: "MY_GITHUB_PAT", // Đọc từ env var MY_GITHUB_PAT
          },
        },
      },
      gdrive: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-gdrive"],
        env: {
          GOOGLE_REFRESH_TOKEN: {
            source: "exec",
            provider: "vault",
            id: "providers/google/refresh_token",
          },
        },
      },
    },
  },
}
```

> **Lưu ý ACPX:** Nếu dùng `plugins.entries.acpx.config.mcpServers` thay vì `mcp.servers`, SecretInput cũng được hỗ trợ theo cùng cơ chế.

#### Secrets CLI Commands

```bash
# Audit xem có plaintext credentials nào không
openclaw secrets audit --check
openclaw secrets audit --allow-exec  # Include exec providers

# Interactive config wizard
openclaw secrets configure
openclaw secrets configure --providers-only
openclaw secrets configure --agent <id>

# Apply saved plan
openclaw secrets apply --from /tmp/plan.json
openclaw secrets apply --from /tmp/plan.json --dry-run

# Reload sau khi rotate secret trong vault
openclaw secrets reload
```

#### Secrets Resolution Flow

```mermaid
sequenceDiagram
    participant GW as 🦞 Gateway
    participant SR as SecretRef Engine
    participant STORE as Secret Store\n(env / file / vault)
    participant MCP as MCP Server Process

    Note over GW: Startup / Reload
    GW->>SR: Activate secrets for all configured surfaces
    SR->>STORE: Resolve each SecretRef
    STORE-->>SR: Resolved values
    SR-->>GW: In-memory snapshot (atomic swap)
    Note over GW: Runtime - NOT re-resolved on each request

    GW->>MCP: Spawn with env vars from snapshot
    MCP->>MCP: Use tokens to call\nGitHub / Drive / Notion API
```

**Key behavior:**

- Resolution **eager** tại startup/reload — không lazy trên từng request
- Startup **fail fast** nếu active SecretRef không resolve được
- Reload dùng **atomic swap** — thành công toàn bộ hoặc giữ nguyên snapshot cũ
- OAuth credentials (auth-profiles.json) **KHÔNG** dùng SecretRef — tách biệt hoàn toàn

---

### 30.10 Tổng Kết Hai Lớp Auth

```mermaid
flowchart LR
    subgraph MODEL_AUTH["Lớp A: LLM Provider Auth\n(openclaw built-in)"]
        A1["API Key\n(env var)\nMọi provider"]
        A2["OAuth / Subscription\n(auth-profiles.json)\nOpenAI Codex, Claude CLI\nGemini CLI, MiniMax, v.v."]
        A3["CLI Reuse\n(claude auth login)\nAnthropic"]
    end

    subgraph EXT_AUTH["Lớp B: External Service Auth\n(tự quản lý)"]
        B1["MCP Server\n+ env var\n(GitHub, Drive, Notion...)"]
        B2["MCP Server\n+ SecretRef\n(1Password / Vault / sops)"]
        B3["Webhook Token\n(shared secret)"]
        B4["exec Tool\n+ API call\n(curl / Python)"]
    end

    MODEL_AUTH -->|"LLM inference calls"| AGENT["🤖 Agent"]
    EXT_AUTH -->|"External service actions"| AGENT
```

| Tiêu chí           | Lớp A (LLM OAuth)            | Lớp B (External Tokens)       |
| ------------------ | ---------------------------- | ----------------------------- |
| **Scope**          | Chỉ model providers          | Bất kỳ dịch vụ nào            |
| **Storage**        | `auth-profiles.json`         | env var / SecretRef / file    |
| **Auto-refresh**   | Có (built-in)                | Không (tự quản lý)            |
| **CLI**            | `openclaw models auth login` | `openclaw mcp set` + env vars |
| **Ví dụ**          | ChatGPT sub, Claude Pro      | GitHub PAT, Drive token       |
| **OAuth protocol** | PKCE (OpenAI), CLI reuse     | Tự implement ngoài OpenClaw   |

---

_Tài liệu được tổng hợp từ `openclaw-worker/README.md`, `VISION.md`, `docs/` (250+ files) của dự án OpenClaw._
