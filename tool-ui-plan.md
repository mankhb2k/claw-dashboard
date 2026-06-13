# Kế hoạch UI — Tool Activity (Chat Live Tools)

> Updated: 2026-06-13  
> Status: Draft — triển khai theo 3 phase  
> Liên quan: OpenClaw gateway tool events, AucoBot Chat (`ClientChatPage`), Control UI reference (`openclaw-worker/ui`)

---

## Document Role

- **Purpose:** Kế hoạch hiển thị trạng thái gọi tool realtime trong Chat (search, exec/shell, MCP, …) — kiểu Cursor / terminal inline.
- **Owns:** Web UI + client state cho tool events; quy ước map event → component.
- **Does not own:** Cấu hình tool trên gateway (`openclaw.json`, skills, MCP sync — đã có); billing credit theo tool (`billing-plan.md`).
- **Prerequisite:** Gateway healthy, chat WS proxy hoạt động, `sessions.subscribe` + `chat.send` ổn định.

---

## 1. Bối cảnh & hiện trạng

### 1.1 Tool runtime (OpenClaw)

Agent **không** nhận danh sách tool từ AucoBot API lúc chat. Toolset được gateway resolve từ:

| Nguồn cấu hình (AucoBot UI) | Sync vào | Ảnh hưởng tool |
|-----------------------------|----------|----------------|
| Bot Agent → Capabilities (`shellExecEnabled`) | `agents.list[].tools.deny` | Tắt `exec` / `process` |
| Settings → Shell exec | `tools.exec` | Policy shell project-wide |
| Settings → Collaboration | `tools.agentToAgent` | Agent gọi agent khác |
| Bot Agent → Skills | `agents.list[].skills` + `skills.load.extraDirs` | Skill tools |
| Connector (CONNECTED) | `mcp.servers` | MCP tools (Drive, Calendar, …) |
| Sandbox | `agents.list[].sandbox` | Giới hạn filesystem/exec |

Sync qua `WorkspaceService.syncProjectRuntime()` → `openclaw.json` trên `OPENCLAW_DATA_ROOT/{projectId}/`.

### 1.2 Luồng chat hiện tại

```
Browser (ClientChatPage)
  → WS /api/projects/:id/chat/ws
  → ChatGatewayProxyService (forward frame)
  → OpenClaw gateway
  → chat.send → agent turn → tool_call → tool execution
```

**Đã có:**

- API upstream connect với `caps: ['tool-events']` (`packages/control-plane-core/.../gateway-upstream.ts`).
- Proxy **forward toàn bộ** upstream events xuống browser (không lọc `agent`).
- `chat.send` trên gateway đăng ký `registerToolEventRecipient(runId, connId)` khi client có cap `tool-events`.
- Chat gọi `sessions.subscribe` — nhận thêm event `session.tool` cho subscriber session.

**Chưa có (gap UI):**

- `ClientChatPage` chỉ handle `chat` + `sessions.changed`.
- History ẩn role `tool`, `toolresult`, `system` (`HIDDEN_HISTORY_ROLES`).
- Không component hiển thị tool đang chạy / đã xong.

### 1.3 Reference implementation

OpenClaw Control UI đã implement đầy đủ:

| Module | Vai trò |
|--------|---------|
| `openclaw-worker/ui/src/ui/app-tool-stream.ts` | `handleAgentEvent`, map `stream: "tool"` → cards |
| `openclaw-worker/ui/src/ui/activity-model.ts` | Status `running \| done \| error`, redact secrets |
| `openclaw-worker/ui/src/ui/app-gateway.ts` | Listen `agent` + `session.tool` |

**Chiến lược:** Phase 1–2 port/adapt logic (TypeScript thuần, không copy Lit UI). Phase 3 align UX sâu hơn với Control UI nếu cần.

### 1.4 Event contract (gateway → browser)

WebSocket frame:

```json
{
  "type": "event",
  "event": "agent",
  "payload": {
    "runId": "...",
    "sessionKey": "agent:my-agent:main",
    "stream": "tool",
    "seq": 12,
    "ts": 1710000000000,
    "data": {
      "phase": "start | update | result",
      "toolCallId": "call_abc",
      "name": "web_search",
      "args": {},
      "partialResult": {},
      "result": {}
    }
  }
}
```

Event thay thế / bổ sung: `session.tool` (cùng shape payload, cho client `sessions.subscribe`).

**Lọc session:** Match `sessionKey` với session đang active — **không** match `runId` với `idempotencyKey` client (server dùng engine runId khác).

---

## 2. Nguyên tắc thiết kế

1. **Event-driven, không polling** — UI cập nhật từ WS `agent` / `session.tool`, không gọi RPC `tools.list`.
2. **Session-scoped** — Chỉ hiển thị tool của session chat đang mở.
3. **Redact by default** — Args/output có thể chứa token/path; áp dụng redact trước khi render (tham chiếu `activity-model.ts`).
4. **Truncate output** — Giới hạn preview (Phase 1: ~500 chars; Phase 2+: expandable full với cap ~120k).
5. **Không block chat stream** — Tool UI là overlay / inline cards; text assistant vẫn stream qua event `chat`.
6. **Progressive enhancement** — Phase 1 shippable độc lập; Phase 2–3 mở rộng không phá Phase 1.

---

## 3. Kiến trúc đích (tổng quan)

```
ClientChatPage
├── useChatToolStream (hook)          # state + handleAgentEvent adapter
├── utils/chat/tool-stream.ts         # pure: parse event, labels, redact
├── utils/chat/tool-stream.types.ts
└── chat/_components/
    ├── ToolActivityBar/              # Phase 1 — compact strip
    ├── ToolActivityCard/             # Phase 2 — expandable card
    └── ToolExecPanel/                # Phase 3 — terminal-like (exec)
```

**Không đổi backend Phase 1–2** (proxy đã forward events). Phase 3 có thể thêm tùy chọn env `CHAT_TOOL_VERBOSE` nếu cần giới hạn payload — mặc định không bắt buộc.

---

## Phase 1 — MVP: Tool Activity Strip

**Mục tiêu:** User thấy ngay agent đang làm gì (“Searching…”, “Running command…”) khi gửi tin nhắn.

**Effort ước tính:** 1–2 ngày  
**Ship criteria:** Demo được trên Chat local với agent có web search hoặc exec.

### 1.1 Scope

| In scope | Out of scope |
|----------|--------------|
| Handler `agent` + `session.tool` trong `ClientChatPage` | Expand args/output |
| State map `toolCallId → ToolActivity` | Hiển thị tool trong history cũ |
| Component `ToolActivityBar` (1–3 chip running + done gần nhất) | Terminal view |
| Map tên tool → label tiếng Anh (i18n key sau) | Billing / credit UI |
| Clear activities khi `chat` final / aborted / session đổi | |

### 1.2 Tasks

1. **`utils/chat/tool-stream.types.ts`**
   - `ToolActivityStatus = 'running' | 'done' | 'error'`
   - `ToolActivity { id, name, label, status, startedAt, updatedAt }`

2. **`utils/chat/tool-stream.ts`**
   - `parseAgentToolPayload(payload): ToolActivityPatch | null`
   - `applyToolActivityPatch(map, patch): Map<...>`
   - `resolveToolLabel(name: string): string` — bảng map:
     - `web_search`, `search` → “Searching the web…”
     - `exec`, `process`, `bash` → “Running command…”
     - `read`, `write`, `edit` → “Working with files…”
     - default → “Running {name}…”
   - `matchesToolSession(payloadSessionKey, activeSessionKey, agentId?)` — reuse logic từ `matchesSessionKey`

3. **`hooks/chat/use-chat-tool-stream.ts`**
   - `activities: ToolActivity[]`
   - `handleGatewayToolEvent(evt: GatewayEventFrame)`
   - `resetToolStream()` — gọi khi send mới / session change / final

4. **`ToolActivityBar` component**
   - Vị trí: trên `MessageBox` trong `ChatPanel` (hoặc ngay dưới stream cuối)
   - UI: pill + spinner (running), checkmark (done), X đỏ (error)
   - Tối đa 5 entries; auto-remove done sau 30s (optional)

5. **Wire `ClientChatPage`**
   - Trong `onEvent`: branch `agent` / `session.tool`
   - `resetToolStream` khi `payload.state === 'final' | 'aborted' | 'error'` (chat event)
   - Pass `activities` → `ChatPanel` → `ToolActivityBar`

6. **Tests (unit)**
   - `tool-stream.test.ts`: parse start/result, session filter, label map

### 1.3 Acceptance criteria

- [ ] Gửi prompt kích hoạt search → bar hiện “Searching the web…” với spinner.
- [ ] Tool xong → chuyển done trong vòng 1 event `phase: result`.
- [ ] Đổi session → activities clear.
- [ ] Session khác không leak tool events.
- [ ] Không regression chat text stream.

### 1.4 Files dự kiến

```
aucobot/apps/web/
├── utils/chat/tool-stream.ts
├── utils/chat/tool-stream.types.ts
├── utils/chat/tool-stream.test.ts
├── hooks/chat/use-chat-tool-stream.ts
└── app/(dashboard)/dashboard/chat/_components/
    ├── ToolActivityBar/ToolActivityBar.tsx
    ├── ToolActivityBar/ToolActivityBar.module.css
    ├── ClientChatPage/ClientChatPage.tsx          (modify)
    └── ChatPanel/ChatPanel.tsx                    (modify)
```

---

## Phase 2 — Expandable Tool Cards

**Mục tiêu:** Card inline trong luồng chat (giống Cursor cơ bản): tên tool, thời gian, preview output, expand xem chi tiết (redacted).

**Effort ước tính:** 3–5 ngày  
**Phụ thuộc:** Phase 1 merged.

### 2.1 Scope

| In scope | Out of scope |
|----------|--------------|
| Port logic `handleAgentEvent` (start/update/result) đầy đủ | Full terminal ANSI colors |
| `ToolActivityCard` trong message flow | Activity sidebar riêng tab |
| Redact secrets (pattern từ `activity-model.ts`) | Edit/re-run tool |
| Truncate preview + “Show more” | |
| Interleave text segments + tool cards (pre-tool text không bị nuốt) | |
| Optional: hiện tool cards từ `chat.history` (parse role tool) | |

### 2.2 Tasks

1. **Mở rộng `tool-stream.ts`**
   - `ToolStreamEntry` với `args`, `outputPreview`, `outputTruncated`
   - `formatToolOutput()` — JSON pretty hoặc text
   - `redactSensitiveText()` — copy pattern SECRET_PATTERNS
   - Phase `update` → cập nhật partial output (exec streaming)

2. **`ToolActivityCard` component**
   - Header: icon theo loại tool (Search, Terminal, File, Plug)
   - Body collapsed: 1 dòng summary
   - Expanded: args (collapsed nếu >3 fields), output preview
   - Status badge: Running / Completed / Failed

3. **Tích hợp `ContentArea` / message list**
   - State `liveToolCards: ToolStreamEntry[]` song song `streamText`
   - Khi tool start: flush accumulated `streamText` thành message segment (pattern Control UI)
   - Render order: user msg → assistant segments → live tool cards → streaming text

4. **History (optional trong Phase 2)**
   - Bỏ filter `tool` / `toolresult` hoặc map sang read-only cards khi `loadHistory`
   - Dedupe với live cards khi final

5. **Storybook**
   - `ToolActivityCard.stories.tsx`: running, done, error, long output

6. **Tests**
   - Redaction, truncate, multi-tool parallel, update phase

### 2.3 Acceptance criteria

- [ ] Exec tool hiện card “Running command…”; output partial update khi có `phase: update`.
- [ ] Secret trong output hiển thị `[redacted]`.
- [ ] 2+ tool song song → 2 cards độc lập.
- [ ] Expand/collapse không làm jump layout chat.
- [ ] (Optional) Reload trang mid-run: `session.tool` hoặc history khôi phục card trạng thái gần đúng.

### 2.4 Files dự kiến

```
aucobot/apps/web/
├── utils/chat/tool-stream.ts                    (extend)
├── utils/chat/tool-redact.ts                    (new, optional split)
├── app/(dashboard)/dashboard/chat/_components/
    ├── ToolActivityCard/ToolActivityCard.tsx
    ├── ToolActivityCard/ToolActivityCard.module.css
    ├── ChatMessageBubble/                       (modify — segments)
    └── ClientChatPage/ClientChatPage.tsx        (modify)
```

---

## Phase 3 — Cursor-grade UX & Exec Terminal

**Mục tiêu:** Trải nghiệm cao cấp: terminal panel cho shell, activity timeline, iconography đầy đủ, settings verbose.

**Effort ước tính:** 1–2 tuần  
**Phụ thuộc:** Phase 2 stable.

### 3.1 Scope

| In scope | Out of scope |
|----------|--------------|
| `ToolExecPanel` — monospace stream, exit code, copy output | Remote SSH UI |
| Tool-type icons + duration timer | Re-implement toàn bộ Control UI |
| Activity timeline (collapsed panel) | |
| User setting: “Show tool details” (localStorage) | |
| i18n labels (vi/en) | |
| Align với `verboseLevel` session nếu expose qua `sessions.patch` | |
| Docs agent: gợi ý prompt khi tool fail | |

### 3.2 Tasks

1. **`ToolExecPanel`**
   - Chỉ bind `name` ∈ `{ exec, process, bash, shell, ... }`
   - Live append stdout từ `partialResult`
   - Hiển thị exit code / `isError` từ result

2. **`ToolActivityTimeline`**
   - Drawer hoặc sidebar section “Activity”
   - List `ActivityEntry[]` (port từ `activity-model.ts`)
   - Auto-follow toggle

3. **Settings**
   - `dashboard/settings` hoặc Chat toolbar: “Show tool output”
   - Ẩn args/output khi off — chỉ strip Phase 1

4. **`sessions.patch` (optional)**
   - Expose `verboseLevel: 'off' | 'on' | 'full'` cho power users
   - Document: chỉ ảnh hưởng channel messages; WS tool events vẫn đủ cho UI

5. **Performance**
   - Virtualize timeline nếu >50 entries
   - Debounce UI update 80ms (như `TOOL_STREAM_THROTTLE_MS`)

6. **E2E smoke**
   - Playwright: send message → assert tool card appears → final message

### 3.3 Acceptance criteria

- [ ] Exec hiển thị terminal-like output stream.
- [ ] Setting tắt chi tiết → chỉ còn activity strip.
- [ ] Timeline liệt kê lịch sử tool trong session hiện tại.
- [ ] i18n: label tiếng Việt + English.
- [ ] Không leak secret trong DOM (audit redact paths).

### 3.4 Files dự kiến

```
aucobot/apps/web/
├── app/(dashboard)/dashboard/chat/_components/
│   ├── ToolExecPanel/
│   ├── ToolActivityTimeline/
│   └── ChatPanel/ChatPanel.tsx
├── lib/i18n/dictionaries/{en,vi}/chat.ts         (tool labels)
└── hooks/chat/use-chat-tool-preferences.ts
```

---

## 4. Ma trận rủi ro

| Rủi ro | Mức | Mitigation |
|--------|-----|------------|
| Không nhận event `agent` | Trung bình | Verify gateway cap + `chat.send` registration; log raw WS trong dev |
| `runId` mismatch | Thấp | Lọc theo `sessionKey` only |
| Output quá lớn lag UI | Trung bình | Truncate + throttle + virtualize (Phase 3) |
| Secret leak UI | Cao | Redact bắt buộc Phase 2+; review trước ship |
| Tool names không ổn định | Trung bình | Fallback label + telemetry log unknown names |

---

## 5. Checklist trước khi bắt Phase 1

- [ ] Chat WS connected (`proxy.ready`)
- [ ] `sessions.subscribe` không lỗi
- [ ] Agent có ít nhất 1 tool bật (search hoặc exec)
- [ ] Gateway image ≥ version emit `stream: "tool"` (openclaw-worker hiện tại)

---

## 6. Thứ tự triển khai đề xuất

```
Phase 1 (MVP strip) → merge → dogfood nội bộ
        ↓
Phase 2 (cards + redact) → merge → beta users
        ↓
Phase 3 (terminal + timeline + i18n) → merge → GA
```

**Không** gộp Phase 2–3 vào một PR — giữ review nhỏ, tránh conflict với Chat streaming đang ổn định.

---

## 7. Tài liệu tham chiếu

| Tài liệu / path | Nội dung |
|-----------------|----------|
| `openclaw-worker/src/gateway/server-chat.ts` | Broadcast `agent` / `session.tool` |
| `openclaw-worker/ui/src/ui/app-tool-stream.ts` | `handleAgentEvent` reference |
| `openclaw-worker/ui/src/ui/activity-model.ts` | Status + redact |
| `aucobot/packages/control-plane-core/src/chat/gateway-upstream.ts` | `tool-events` cap |
| `aucobot/apps/api/.../chat-gateway-proxy.service.ts` | WS forward |
| `aucobot/apps/web/.../ClientChatPage.tsx` | Chat event handler hiện tại |
| `openclaw-architecture.md` § Tool loop | Agent tool execution flow |

---

## 8. Open questions (resolve khi Phase 1 kickoff)

1. **Vị trí UI Phase 1:** Trên MessageBox vs inline cuối message list? → Đề xuất: trên MessageBox (ít invasive).
2. **Hiện tool trong history mặc định:** Phase 2 optional hay bắt buộc? → Đề xuất: optional flag Phase 2.
3. **Package shared:** Extract `@aucobot/chat-tool-stream` hay giữ trong `apps/web`? → Phase 1–2 trong web; extract nếu mobile cần sau.

---

*End of plan.*
