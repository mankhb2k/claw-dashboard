# Nguyên tắc Phát triển Frontend — AucoBot Web

> Áp dụng cho `aucobot/apps/web/`. Mọi code do AI tạo phải tuân thủ.  
> Monorepo: đọc thêm `aucobot/AGENTS.md` khi task chạm nhiều app/package.

---

## Tổng quan 7 nhóm (ưu tiên)

| # | Nhóm | Trạng thái trong rule |
|---|------|------------------------|
| 1 | **Bảo mật** | Đã có — 12 đại ý (rule chung) |
| 2 | **Tái sử dụng code** | Đã có — UI, `utils/`, `hooks/`, `lib/`, workflow |
| 3 | **Cấu trúc thư mục** | Đã có — §3.A→L (cây project + app + từng folder) |
| 4 | **Data & state** | Đã có — API, fetch, form, state, loading/error |
| 5 | **UI & CSS** | Đã có (CSS Modules, design tokens) |
| 6 | **Phạm vi task** | Đã có — scope, cấm, verify |
| 7 | **Lint & Enforcement** | Đã có — §7 (ESLint error/warn + CI) |

---

## 1. Bảo mật

> Rule chung cho mọi frontend — đại ý, không gắn implementation cụ thể. Dùng làm checklist khi viết code và refactor.

### 1.1 Xác thực & phiên (Auth / Session)

- Token/session do **server quản lý** (cookie `httpOnly` hoặc flow chuẩn của framework).
- **Cấm** lưu access/refresh token vào `localStorage` / `sessionStorage`.
- Một nơi xử lý API, refresh token, redirect hết phiên — **không duplicate logic auth**.
- Route protected: guard ở **middleware/edge** (server), không chỉ ẩn UI.

### 1.2 Phân quyền (Authorization)

- Ẩn nút trên UI **không** thay thế check quyền backend.
- Không tin `role` / `userId` từ client state mà không đối chiếu server.
- URL params (`/resource/:id`) phải **validate** trước khi gọi API.

### 1.3 Validate dữ liệu (Input & Output)

- **Input**: form, query, upload — validate schema trước submit.
- **Output API**: parse/validate response trước khi render — không tin shape JSON tùy ý.
- Kiểu TS: `unknown` + parse; **cấm `any`**; **cấm `@ts-ignore`**.

### 1.4 XSS & render nội dung

- Mặc định render text (React escape) — an toàn.
- Cẩn trọng: `dangerouslySetInnerHTML`, rich text (Markdown/HTML), paste clipboard, URL `javascript:`.
- Chỉ render HTML **đã sanitize**; không render raw từ user/API.
- Link ngoài `target="_blank"`: thêm `rel="noopener noreferrer"`.

### 1.5 Secrets & dữ liệu nhạy cảm

- **Cấm** đưa API key, password, private token vào env public (`NEXT_PUBLIC_*`), source client, `console.log`, hoặc message lỗi hiển thị user.
- Hiển thị key/token: **masked**; thao tác copy có confirm khi cần.
- **Cấm** embed secrets trong URL (query string dễ leak qua log/referrer).

### 1.6 Giao tiếp API

- HTTPS trong production.
- Cookie auth: `Secure`, `SameSite`, `httpOnly` (backend set).
- Một HTTP client chuẩn — không rải `fetch`/`axios` thô không kiểm soát credential/header.
- Timeout và xử lý lỗi thống nhất — **không leak stack trace** ra UI.

### 1.7 Lưu trữ phía client

| Được phép | Cấm |
|-----------|-----|
| Theme, locale, UI preference | Token, password, API key |
| Cache UX không nhạy cảm | PII không cần thiết |

- `localStorage` chỉ cho dữ liệu **không nhạy cảm**.
- Logout: xóa sạch state client liên quan phiên.

### 1.8 Upload file

- Validate **type, size, tên file** phía client (backend vẫn validate lại).
- Không chỉ tin extension — kiểm MIME khi có thể.
- Preview file user upload cẩn thận (SVG/HTML có thể chứa script).

### 1.9 OAuth / redirect / deep link

- Validate `redirect_uri` / return URL — chống open redirect.
- OAuth state/nonce do backend xử lý — frontend không bỏ qua bước verify.

### 1.10 WebSocket / realtime

- Tránh gửi secret qua query string.
- Validate message từ server trước khi render hoặc thực thi action.
- Reconnect không log token vào console.

### 1.11 Dependency & supply chain

- Không thêm package mới tùy tiện — mỗi dependency là bề mặt tấn công.
- Tránh copy snippet không review (eval, inline script).

### 1.12 Logging & error UX

- Dev: log chi tiết được; production: **cấm log** object chứa PII/secrets.
- Thông báo lỗi user: chung chung; chi tiết kỹ thuật chỉ dev/server log.

---

## 2. Tái sử dụng code

> Nguyên tắc: **Discover → Reuse → Extend → Create**. Tìm code cũ trước khi viết mới.

### 2.1 Phân tầng folder — ai làm gì

| Folder | Vai trò | Được chứa | Cấm |
|--------|---------|-----------|-----|
| **`utils/<domain>/`** | Helper **thuần** theo domain | Transform, parse, validate, tính toán không side-effect; `import type` + `lib/http/api-base-url` (hàm thuần) được phép (§7.2) | React, gọi API/WS (value `lib/api`/`axios`/`fetch`), JSX |
| **`hooks/<domain>/`** | **React hook** theo domain | `useState`, `useEffect`, compose `utils` + `lib/api` | Helper thuần, component UI |
| **`lib/<domain>/`** | **Client / service** có I/O theo domain | WebSocket client, class kết nối (vd `project-chat-client`) | React hook, JSX |
| **`lib/http/`** | **HTTP transport** toàn app | `axios`, `api-base-url`, `server-api` | Business API, JSX |
| **`lib/`** (subfolder infra) | **Hạ tầng** khác | `auth/`, `routing/`, `theme/`, `runtime/`, `i18n/` | Logic UI, logic 1 feature |
| **`lib/api/`** | HTTP + Zod | `xxxApi.list()`, parse response | JSX, `useState` |
| **`schemas/`** | Zod schema + inferred type | Form input, shape API | Component, fetch |
| **`stores/`** | Zustand shared state | App-wide + `stores/<domain>/` (§3.H) | Local UI state, feature store ở root |
| **`hooks/`** (root) | Hook **cross-domain** (hiếm) | Dùng ≥2 domain không liên quan | Hook thuộc 1 domain |
| **`components/ui/`** | Design system | Button, Input, Dialog… | Business logic, API |
| **`components/layout/`** | Layout thuần | Flex, Container, Grid | Fetch, domain rule |
| **`components/dashboard/`** | Shell dùng **≥2 màn** | Sidebar, TitleHeader, Header | Logic chỉ 1 feature |
| **`components/chat/`** | UI chat **tái dùng** + story | `MessageBox`, `ChatMarkdown` | Logic 1 màn chat |

**Chọn folder nhanh:**

```text
Có useState / useEffect?     → hooks/<domain>/
Hàm thuần, không I/O?      → utils/<domain>/
WebSocket / client class?  → lib/<domain>/
Gọi HTTP?                  → lib/api/
Infra HTTP transport?      → lib/http/
Infra khác (theme, route)? → lib/<infra>/
```

**Luồng phụ thuộc (cấm đảo ngược):**

```text
_components / components  →  hooks/<domain>  →  lib/api + utils/<domain> + lib/<domain> + lib/ (infra)
_components / components  →  lib/api            (action 1 phát: toggle/submit — §4.5, §7.2)
```

- `utils` **không** import `hooks`
- `hooks` **được** import `utils`, `lib/api`, `lib/<domain>`
- `_components`/`components` **được** import `lib/api` trực tiếp cho **action đơn** (§4.5); logic fetch/transform **dùng lại ≥2 nơi** → tách `hooks/<domain>/`
- **Cấm** `fetch`/`axios` **thô** trong component/hook — qua `lib/api/*` (§7.2)

> **Code mới bắt buộc** `hooks/<domain>/`, `utils/<domain>/`, `stores/<domain>/`.

### 2.2 Workflow trước khi viết code mới

1. **Search** codebase — tên feature, API path, component tương tự
2. Kiểm tra `utils/<domain>/`, `hooks/<domain>/`, `lib/api/`
3. UI: đọc `.stories.tsx` trong `components/ui/`
4. **Extend** file/hàm có sẵn trước khi tạo file mới
5. Đặt file đúng folder theo §2.1

### 2.3 Extend vs tạo mới

| Tình huống | Hành động |
|------------|-----------|
| Thiếu prop UI primitive | Thêm vào `components/ui/` |
| Endpoint cùng resource | Thêm method vào `lib/api/xxx.ts` |
| Logic thuần dùng lại | `utils/<domain>/` |
| State React dùng lại | `hooks/<domain>/` |
| Type form + API | `schemas/xxx.schema.ts` |
| UI chỉ 1 màn | `app/.../_components/` (xem §3) |

### 2.4 Anti-pattern

- `axios`/`fetch` trong component → `lib/api/*`
- Tạo `<button>` custom → `Button` từ `components/ui`
- Copy hook thành bản mới → import từ `hooks/<domain>/`
- Đặt helper thuần trong `hooks/` hoặc hook trong `utils/`
- Tạo `hooks/use-xxx` ở root khi chỉ 1 domain dùng → `hooks/<domain>/`

### 2.5 UI Primitives (Composition First)

- **Kiểm tra UI Primitives trước**: Khi xây dựng bất kỳ thành phần giao diện nào (Button, Input, Card, Modal...), **luôn luôn phải kiểm tra thư mục `components/ui/` đầu tiên**.
- **Đọc Storybook để hiểu cách dùng**: Trước khi sử dụng bất kỳ component nào trong `components/ui/`, **bắt buộc phải đọc file `.stories.tsx` cùng thư mục** (ví dụ `components/ui/Button/Button.stories.tsx`) để hiểu rõ các props, variant và cách dùng chuẩn.
- **Lắp ghép thay vì viết mới**: Ưu tiên sử dụng các component nhỏ có sẵn trong `components/ui` để ghép lại thành các giao diện phức tạp hơn. Không tự ý viết mới khi các component sẵn có có thể lắp ghép hoặc mở rộng được.
- **Không ghi đè style của UI Primitives**: Các component cấp cao (như Dashboard components) tuyệt đối không viết lại CSS cho những gì các UI Primitives (`Button`, `Avatar`, `DropdownMenu`...) đã đảm nhiệm. Sử dụng đúng các `variant`, `size`, hoặc bổ sung `props` vào chính UI component đó nếu cần mở rộng.

### 2.6 Storybook

- **Vị trí lưu trữ**: Đặt file `.stories.tsx` **cạnh component** trong `components/ui/[ComponentName]/`, `components/layout/[ComponentName]/`, hoặc `components/dashboard/[ComponentName]/`.
- **Nguyên tắc Self-contained (Tự thân)**:
  - Hạn chế tạo thêm file CSS phụ cho story. Sử dụng các **Helper Components** nội bộ (như `DemoBox`, `DemoLabel`) ngay trong file `.stories.tsx` để quản lý layout demo (grid, flex, spacing...).
  - Mục tiêu: Giúp nhà phát triển hoặc AI Agent chỉ cần đọc duy nhất 1 file `.stories.tsx` là hiểu trọn vẹn cách dùng và demo trực quan của component.
- **Tags**: Luôn luôn khai báo `tags: ['autodocs']` để Storybook tự động tạo tài liệu hướng dẫn.

---

## 3. Cấu trúc thư mục

> Chi tiết từng folder. Workflow tái dùng: **§2**. Luồng phụ thuộc: **§2.1**.

### 3.A — Sơ đồ tổng quan `apps/web/`

```text
apps/web/
├── app/                    §3.B   Routes & UI theo feature
├── components/             §3.C   ui/, layout/, dashboard/
├── hooks/                  §3.D   React hooks (bắt buộc code mới)
│   ├── chat/                      use-model-catalog, use-chat-model-select, use-chat-sandbox-context
│   ├── skill/                     use-skill-model-select
│   └── use-project-navigation.ts  # root — nav cross-route (sidebar)
├── utils/                  §3.E   Helper thuần (bắt buộc code mới)
│   ├── agent/                     cron, heartbeat, collaboration-events, agent-panel-*
│   ├── chat/                      session-key, groups, model-catalog transform, message-extract…
│   ├── channels/                  openclaw catalog, icons, merge-channel-catalog
│   ├── connectors/                project-connector-status
│   ├── nodes/                     nodes-utils (device/invite)
│   ├── profile/                   user-avatar, avatar-upload
│   ├── skill/                     skill-markdown
│   ├── ai-model/                  openai/gemini catalogs, provider-test timeout
│   └── common/                    format-compact-count (cross-domain)
├── lib/                    §3.F   Infra + client I/O
│   ├── http/               §3.F.1 axios, api-base-url, server-api
│   ├── api/                       projectApi, chatApi, authApi, users… + Zod parse
│   ├── auth/                      session-middleware (edge/proxy cookie)
│   ├── chat/                      project-chat-client (WebSocket)
│   ├── routing/                   dashboard-route, entry-route, resolve-dashboard-path
│   ├── theme/                     bootstrap, cookie, sync, resolve, constants
│   ├── runtime/                   OSS/cloud mode, gateway URL, spawn timeout, control-ui URL
│   ├── i18n/                      dictionaries, I18nProvider, locale-storage
│   └── current-project.ts         # legacy hybrid server/client — §4.3
├── schemas/                §3.G   Zod schema (web-first)
├── stores/                 §3.H   Zustand shared state
│   ├── auth.store.ts              app-wide
│   ├── project.store.ts           app-wide
│   ├── theme.store.ts             app-wide
│   ├── agent/agent-editor.store.ts
│   └── skill/skill-editor.store.ts
├── public/                 §3.I   Static assets
├── .storybook/             §3.J   Storybook config
├── scripts/                §3.K   Script dev/CI
├── proxy.ts                §3.L   Route guard
└── next.config.ts          §3.L   Next config
```

```text
app/ → components/ + hooks/ + stores/ + lib/api (action đơn — §4.5)
hooks/ → lib/api/ + utils/<domain>/ + lib/<domain>/
lib/api/ → lib/http/axios.ts
lib/http/server-api.ts ← page.tsx (RSC only)
```

---

### 3.B — `app/` *(đã chốt)*

#### 3.B.1 Cây `app/`

```text
app/
├── layout.tsx, providers.tsx, globals.css, page.tsx
├── (auth)/                 # Ngoại lệ — xem §3.B.2
│   ├── login/page.tsx
│   └── register/page.tsx
├── setup/
│   ├── page.tsx
│   └── _components/ClientSetupPage/
└── (dashboard)/dashboard/
    ├── layout.tsx          # Sidebar + Header
    ├── page.tsx            # Overview
    ├── _components/        # Chỉ /dashboard (overview)
    └── <feature>/
        ├── page.tsx
        ├── [param]/
        └── _components/
            ├── ClientXxxPage/
            ├── CardXxx/
            └── ModalXxx/
```

`(auth)` / `(dashboard)` = route group — **không** vào URL.

#### 3.B.2 Vai trò `page.tsx`

**Luôn Server Component** — **ngoại lệ:** `(auth)/login`, `(auth)/register`.

| Việc | `page.tsx` | `ClientXxxPage` |
|------|------------|-----------------|
| Layout (`Flex`, `Container`, `<feature>.module.css`) | ✅ | ❌ |
| `TitleHeader` (tuỳ trang) | ✅ | ❌ |
| Fetch server / `params`, `initial*` | ✅ | Nhận props |
| Render client | ✅ chỉ `<ClientXxxPage />` | ✅ |
| `useState`, API client | ❌ | ✅ |

- **`setup/`** + **`(dashboard)/dashboard/**`**: bắt buộc tuân theo.
- **Mọi `page.tsx`** đều bọc layout chuẩn (`Container`/`Flex` + `<feature>.module.css`, `TitleHeader` nếu có) rồi render đúng 1 `<ClientXxxPage />` — **không** để `page.tsx` chỉ render trơ `<ClientXxxPage />` không khung. Shell **không được** đặt bên trong `ClientXxxPage` (client component) — phải ở `page.tsx`.
  - **Section route dùng chung shell:** với nhóm route con (vd `agent/`, `agent/collaboration`, `agent/heartbeat`, `agent/schedules`) shell + section nav đặt ở `agent/layout.tsx` dùng chung là **đạt chuẩn** — khi đó `page.tsx` con render trơ `<ClientXxxPage />` là **đúng** (không bọc thêm kẻo double-wrapper).
  - **Route canvas full-bleed** (vd `chat` — `contentCanvas`): `page.tsx` chỉ bọc `<div className={styles.page}>` full-bleed, **không** `Container` (Container giới hạn bề rộng sẽ vỡ layout chat).
- **`(auth)/`**: ngoại lệ — không bắt buộc `ClientXxxPage` / `_components/`.

#### 3.B.3 `_components/` — folder bắt buộc

**Cấm** file component lẻ (vd `_components/ClientChatPage.tsx`).

```text
_components/ClientSettingPage/ClientSettingPage.tsx
_components/CardXxx/CardXxx.tsx
```

| Tiền tố | Vai trò |
|---------|---------|
| `ClientXxxPage` | Orchestrator màn (`"use client"`) |
| `CardXxx` | Khối UI |
| `ModalXxx` | Dialog |
| `XxxSection` | Cụm trong Client page |
| `XxxPanel` | Panel phụ |
| `NoXxx` | Empty state |

| Path | Phạm vi |
|------|---------|
| `dashboard/_components/` | **Chỉ** overview |
| `dashboard/<feature>/_components/` | Feature đó |
| `setup/_components/` | Chỉ setup |

#### 3.B.4 Anti-pattern `app/`

- File lẻ trong `_components/`
- `"use client"` trong `page.tsx` (trừ auth)
- Ghép `Section` trong `page.tsx` thay vì `ClientXxxPage`
- Logic domain → `utils/`, `hooks/` (§3.D, §3.E)

> Legacy: `ClientChatPage.tsx` lẻ, `setting/page.tsx` chưa có `ClientSettingPage`.

---

### 3.C — `components/`

| Subfolder | Vai trò | Cấm |
|-----------|---------|-----|
| **`ui/`** | Design system (Button, Input, Dialog…) | Business logic, API |
| **`layout/`** | Bố cục (Flex, Container, Grid) | Fetch, domain rule |
| **`dashboard/`** | Widget **≥2 route** (Sidebar, TitleHeader, Header) | Logic 1 feature |
| **`chat/`** | UI chat **tái dùng** + Storybook chat (`MessageBox`, `ChatMarkdown`…) | Logic 1 màn chat (→ `app/.../chat/_components/`) |

- Mỗi component = **folder riêng** + `ComponentName.tsx` + `ComponentName.module.css` (nếu có style) + `.stories.tsx` (ui/layout/dashboard/chat) — đặt tên theo **§3.M**.
- Import gộp: `@/components/ui`, `@/components/layout`.
- **`components/chat/`**: nơi ở của UI chat dùng chung (gồm `MessageBox`). Component **chỉ thuộc 1 màn chat** vẫn ở `app/.../chat/_components/`.
- Feature-specific (1 màn) → `app/.../_components/`, không đặt ở đây.

---

### 3.D — `hooks/` *(bắt buộc code mới)*

| Path | Vai trò | Ví dụ hiện có |
|------|---------|---------------|
| **`hooks/chat/`** | Hook chat / model / sandbox | `use-model-catalog`, `use-chat-model-select`, `use-chat-sandbox-context` |
| **`hooks/skill/`** | Hook skill editor | `use-skill-model-select` |
| **`hooks/` (root)** | Hook **cross-domain** (≥2 domain) | `use-project-navigation` (sidebar nav) |

- Có `useState` / `useEffect` → **đây**, không `utils/`, không `lib/`.
- Compose: `lib/api/` + `utils/<domain>/` + `lib/<domain>/`.
- Tên file **kebab** `use-xxx.ts` (kể cả root) — xem §3.M.
- **Cấm** JSX, helper thuần, hook 1 domain ở root `hooks/use-xxx.ts`.

---

### 3.E — `utils/` *(bắt buộc code mới)*

| Path | Vai trò | Ví dụ hiện có |
|------|---------|---------------|
| **`utils/agent/`** | Agent, schedule, heartbeat, collaboration | `cron-format`, `heartbeat-interval`, `collaboration-events`, `agent-panel-*` |
| **`utils/chat/`** | Session, model patch, message transform | `session/key`, `session/display`, `stream/message-extract`, `tool/stream`, `model-catalog` |
| **`utils/channels/`** | Catalog kênh, icon, merge API + i18n | `openclaw-channels`, `channel-icons`, `merge-channel-catalog` |
| **`utils/connectors/`** | Trạng thái connector | `project-connector-status` |
| **`utils/nodes/`** | Device / invite helpers | `nodes-utils` |
| **`utils/profile/`** | Avatar URL, upload prepare | `user-avatar`, `avatar-upload` |
| **`utils/skill/`** | Skill markdown | `skill-markdown` |
| **`utils/ai-model/`** | Catalog model, timeout test | `openai-models`, `gemini-models`, `provider-test` |
| **`utils/common/`** | Helper dùng ≥2 domain | `format-compact-count` |

- **Không** React, **không** gọi API/WS (legacy: `utils/agent/agent-collaboration.ts` gọi API — cần chuyển hook/`lib/api`).
- **Cấm** import `hooks/`.
- Import: `@/utils/<domain>/<file>`.

---

### 3.F — `lib/` + `lib/api/`

| Path | Vai trò | Ví dụ hiện có |
|------|---------|---------------|
| **`lib/http/`** | HTTP transport — **§3.F.1** | `axios`, `api-base-url`, `server-api` |
| **`lib/api/`** | REST client + Zod parse | `project`, `chat`, `auth`, `users`, `multipart-upload` |
| **`lib/auth/`** | Session / cookie (edge) | `session-middleware` |
| **`lib/chat/`** | WebSocket client | `project-chat-client` |
| **`lib/routing/`** | URL dashboard, entry, setup redirect | `dashboard-route`, `entry-route` |
| **`lib/theme/`** | Dark/light, cookie, bootstrap script | `theme-sync`, `theme-cookie`, `theme-bootstrap` |
| **`lib/runtime/`** | OSS vs Cloud, gateway, spawn | `runtime-mode`, `oss-gateway`, `gateway-control-ui` |
| **`lib/i18n/`** | Locale, dictionaries, provider | `I18nProvider`, `dictionaries/vi|en` |
| **`lib/current-project.ts`** | Active project (legacy hybrid) | §4.3 — tách server/client sau |

- **Cấm** hook (`use-*` → §3.D), helper thuần (→ §3.E `utils/`).
- **Cấm** `fetch`/`axios` ngoài `lib/http/axios.ts` và `lib/api/*`.

#### 3.F.1 — `lib/http/` *(đã refactor)*

| File | Vai trò | Import |
|------|---------|--------|
| **`axios.ts`** | HTTP client duy nhất (cookie, refresh, mock interceptor) | `import { api } from '@/lib/http/axios'` |
| **`api-base-url.ts`** | `getPublicApiBaseUrl`, `getServerApiBaseUrl` — client vs server base URL | `proxy.ts`, `next.config.ts`, WS client |
| **`server-api.ts`** | `serverGet`, `getServerCookieHeader` — RSC gọi Nest, forward cookie | `page.tsx` Server Component |

```text
lib/http/axios.ts       ← lib/api/*.ts (client)
lib/http/server-api.ts  ← page.tsx (server)
lib/http/api-base-url.ts ← shared bởi axios, server-api, next.config, project-chat-client
```

- **Cấm** đặt `axios` instance hoặc `serverGet` ở `lib/` root hoặc trong `utils/`.
- **Cấm** `lib/api/*` import `server-api` — server fetch chỉ từ RSC / middleware.

---

### 3.G — `schemas/`

- **Web-first**: schema + `z.infer<>` đặt tại `schemas/` cho form và shape API web.
- Chỉ dùng `@aucobot/shared` khi type **đã có sẵn** trong shared — không duplicate.
- Dùng bởi: `lib/api/`, React Hook Form, stores.
- **Cấm** component, fetch.

---

### 3.H — `stores/` *(đã chốt)*

Zustand — state **chia sẻ giữa nhiều component** (không thay `useState` 1 component).

| Tầng | Path | Khi nào | Ví dụ |
|------|------|---------|-------|
| **App-wide** | `stores/*.store.ts` | ≥2 feature/route khác domain | `auth`, `project`, `theme` |
| **Domain** | `stores/<domain>/*.store.ts` | ≥2 component **cùng feature** | `stores/skill/skill-editor.store.ts` |

**Quy tắc:**

- **Cấm** store feature-specific ở root `stores/` — bắt buộc subfolder `stores/<domain>/`.
- Tên file: `<feature>.store.ts` — **không** hậu tố `-ui` (vd `skill-editor.store.ts`, không `skill-editor-ui.store.ts`).
- **`persist` (localStorage)** qua zustand middleware: **chỉ** domain UI store (`stores/<domain>/`), không persist store app-wide trừ khi có lý do rõ.
- Gọi API trong action store → qua `lib/api/`.
- Subscribe bắt buộc **selector** (§4).

```text
State 1 component?           → useState
≥2 component cùng feature?   → stores/<domain>/xxx.store.ts
≥2 feature khác domain?      → stores/xxx.store.ts (root)
```
---

### 3.I — `public/`

- Static: SVG icon, image, font — phục vụ URL `/…`.
- **Cấm** secrets, config nhạy cảm.

---

### 3.J — `.storybook/`

- Chỉ config Storybook.
- File `.stories.tsx` đặt **cạnh component** trong `components/` (§2.6).

---

### 3.K — `scripts/`

- Playwright, check DOM, tooling dev/CI.
- **Cấm** import vào `app/`, `components/`, `lib/`, `hooks/`, `utils/`.

---

### 3.L — Root (`proxy.ts`, `next.config.ts`)

| File | Vai trò |
|------|---------|
| **`proxy.ts`** | Route guard, session check |
| **`next.config.ts`** | Rewrites API, redirects |
| **Cấm** business logic feature |

---

### 3.M — Quy ước đặt tên & export *(đã chốt)*

> Một quy ước duy nhất cho mọi file — không để mỗi người một kiểu. Áp dụng cho **code mới**; file cũ migrate dần (§7.4).

#### 3.M.1 Tên file

| Loại | Quy ước | Ví dụ |
|------|---------|-------|
| **Component** (`.tsx`) | **PascalCase**, folder riêng cùng tên | `ChatPanel/ChatPanel.tsx` |
| **CSS Module (component)** | **`ComponentName.module.css`** — khớp đúng tên component | `ChatPanel/ChatPanel.module.css`, `MessageBox/MessageBox.module.css` |
| **CSS phụ** trong 1 folder component (đi kèm css chính) | **PascalCase mô tả** | `AgentPanel/AgentPanelLayout.module.css` (cạnh `AgentPanel.module.css`) |
| **CSS cấp page/route** (owner `page.tsx`/`layout.tsx`) | `<feature>.module.css` / `layout.module.css` (kebab/lowercase) | `ai-model.module.css`, `connect.module.css`, `dashboard/layout.module.css` |
| **CSS dùng chung** nhiều component | kebab + tiền tố rõ (ngoại lệ) | `setup-shared.module.css` |
| **Hook** | **kebab** `use-xxx.ts` (kể cả root) | `use-project-navigation.ts` |
| **Util / lib / store** | **kebab** | `model-catalog.ts`, `project-chat-client.ts`, `agent-editor.store.ts` |
| **Schema** | **kebab** `xxx.schema.ts` | `agent-form.schema.ts` |
| **Story** | `ComponentName.stories.tsx` | `Button.stories.tsx` |

- **Toàn bộ file non-component dùng kebab.** Không camelCase tên file (vd `agentForm.schema.ts` → `agent-form.schema.ts`).
- **Hook co-located (page-local)** — hook chỉ phục vụ đúng 1 màn (cả orchestrator của `ClientXxxPage` **lẫn** các hook con tách ra từ nó) đặt **co-located** trong `_components/ClientXxxPage/` và vẫn dùng tiền tố `use-xxx.ts`. Yếu tố phân biệt với `hooks/` là **vị trí**, không phải tên: co-located = dùng đúng 1 màn; `hooks/` = tái dùng ≥2 màn. Khi orchestrator phình to (>1k dòng), tách các phần **state riêng / derive thuần** thành hook con co-located, **giữ phần lõi gắn kết** (vd WebSocket + streaming) trong orchestrator để tránh phải truyền `ref`/`setter` chung qua lại (dependency threading). Ví dụ — `chat/_components/ClientChatPage/`: `use-client-chat-page.ts` (orchestrator) compose `use-chat-session-search.ts`, `use-sidebar-preference.ts`, `use-chat-derivations.ts`.

#### 3.M.2 Export

| Loại file | Export |
|-----------|--------|
| Component, hook, util, helper | **Named export** (`export function ChatPanel() {}`) |
| `page.tsx`, `layout.tsx`, file Next yêu cầu | **Default export** (Next bắt buộc) |

- **Cấm `export default`** cho component/hook/util (trừ file Next ép default).
- Lý do: dễ grep, đổi tên đồng bộ, auto-import nhất quán.

#### 3.M.3 Enforce

- Export: lint `no-restricted-syntax` cấm `ExportDefaultDeclaration` trong `components/**` + `app/**/_components/**` (loại trừ `page.tsx`, `layout.tsx`).
- Tên file: script kiểm tra trong CI (ESLint không lint tên file CSS).

---

## 4. Data & state

> Schema: **§3.G** (`schemas/` web-first). Store: **§3.H**. HTTP: **§3.F**.

### 4.1 Ba kênh data

| Kênh | Layer | Dùng khi |
|------|-------|----------|
| **REST client** | `lib/http/axios.ts` → `lib/api/*.ts` | Mutations, fetch/refetch trên client |
| **REST server** | `lib/http/server-api.ts` (`serverGet`, cookie forward) | `page.tsx` Server Component |
| **WebSocket** | `lib/<domain>/project-chat-client.ts` | Realtime (chat) — **không** qua axios |

- **Cấm** `fetch`/`axios` trực tiếp trong component, hook (ngoài `lib/api/`, `lib/http/server-api.ts`, client WS).

### 4.2 `lib/api/` — chuẩn bắt buộc

- Mọi method: gọi `api` từ `lib/http/axios.ts` → **Zod parse** response (`parse` / `safeParse`).
- Body POST/PATCH: validate input qua schema (`schemas/` hoặc input schema export cùng `lib/api/`).
- Export dạng `xxxApi = { list, create, … }` theo resource (vd `projectApi`, `chatApi`).
- **Cấm** trả `res.data` thô không parse (legacy: `authApi` cần refactor).

### 4.3 Server fetch vs client fetch *(đã chốt)*

**Tách rõ** — không dùng helper hybrid `window ? client : server`:

| | Server | Client |
|---|--------|--------|
| **Helper** | `serverGet`, `getServerCookieHeader`, helper server-only (vd `getCurrentProject` trên server) | `lib/api/*`, `useProjectStore` |
| **Gọi từ** | `page.tsx` (Server) | `ClientXxxPage`, `hooks/`, stores |
| **Truyền xuống** | Props `initial*` (vd `initialHealth`) | — |

- **Tránh** fetch cùng endpoint trên server rồi fetch lại client khi không cần refetch.
- Refetch / tương tác user → client (`lib/api` hoặc hook).

### 4.4 Phân lớp state

| Lớp | Công nghệ | Khi nào |
|-----|-----------|---------|
| App / domain shared | Zustand **§3.H** | ≥2 component cần chung (auth, project, skill-editor…) |
| Page / list local | `useState` trong `ClientXxxPage` | List, filter, modal open — **1 màn** |
| Logic tái dùng | `hooks/<domain>/` | Cùng fetch/transform ≥2 component |
| UI infra | Context (I18n, Toast) | **Không** business data |

- **Cấm** React Context cho business state.
- Store: bắt buộc **selector** khi subscribe:

  ```ts
  const projects = useProjectStore((s) => s.projects);
  // Cấm: const store = useProjectStore();
  ```

### 4.5 Form *(đã chốt)*

**Form nhập liệu user** (nhiều field, submit):

- **Bắt buộc** `react-hook-form` + `zodResolver` + schema `schemas/`.
- **Cấm** `useState` từng field cho form nhập liệu.

**Toggle / settings đơn** (Switch, một API call):

- **Không** bắt buộc RHF — gọi `lib/api/*` trực tiếp từ handler (vd `CardCapabilities`, `SandboxSection`).
- Vẫn validate payload nếu có body phức tạp (Zod trước khi gọi API).

### 4.6 Loading *(đã chốt)*

- Load list / load page / chờ API lần đầu → **`Spinner`** từ `components/ui` (hoặc skeleton nếu feature đã có pattern skeleton).
- Đặt loading state trong `ClientXxxPage` hoặc hook — không block cả dashboard shell.

### 4.7 Error UX *(đã chốt)*

| Loại lỗi | Cách hiển thị |
|----------|----------------|
| **Validation form** | Inline dưới field — class **`.field__error`** (CSS Module) |
| **Action API** (save, delete, toggle…) | **`Toast`** hoặc inline trong card — **một pattern cố định / feature** |
| **Cấm** | `alert()`, `window.alert`, dialog hệ thống cho lỗi thường |

- Message lỗi: text user-friendly; chi tiết kỹ thuật không hiện UI (§1.12).

### 4.8 Anti-pattern

- `api.get` trong `CardXxx` khi đã có `xxxApi` — dùng `lib/api`
- Hybrid server/client trong một hàm `getXxx()` có `typeof window`
- Duplicate fetch server + client không cần thiết
- List data đưa vào Zustand khi chỉ 1 page dùng
- Form nhiều field không qua RHF

---

## 5. UI & CSS

### Import

- **Quy tắc Import gọn**: Khi import các component từ `components/ui/` hoặc `components/layout/`, **bắt buộc phải import gộp trên một dòng** (ví dụ: `import { Card, Typography } from "@/components/ui"`). Không import rải rác từng file nhỏ lẻ.

### CSS Modules & Styling

- **Không dùng CSS Framework**: Tuyệt đối không sử dụng Tailwind, Bootstrap, Material UI, shadcn, hay bất kỳ CSS framework nào khác. Tự build UI bằng Vanilla CSS kết hợp CSS Modules.
- **Quản lý CSS theo Component & Chuẩn Comment đồng bộ**:
  - Mỗi component có file `.module.css` riêng đặt cùng thư mục.
  - **Không dùng chuẩn BEM**: Vì Next.js CSS Modules đã tự động cô lập class name (scope local), hãy đặt tên class phẳng, tự nhiên và ngắn gọn (ví dụ: `.card`, `.title`, `.active`, `.disabled` thay vì `.card__title` hay `.card--active`).
  - **Viết comment tiếng Việt đơn giản**: Chỉ cần dùng comment một dòng ngắn gọn mô tả block CSS đó dành cho **thành phần hoặc chức năng nào** để mở file ra là hiểu ngay:

    ```css
    /* Khung chứa thẻ */
    .card {
      display: flex;
      flex-direction: column;
    }

    /* Tiêu đề thẻ */
    .title {
      font-size: var(--font-size-md);
    }

    /* Trạng thái hoạt động */
    .active {
      border-color: var(--color-primary);
    }
    ```

- **Dùng CSS Variables**: Sử dụng **CSS Custom Properties** (variables định nghĩa trong `globals.css`) cho color, spacing, radius, shadow — không hardcode giá trị thô (trừ ngoại lệ padding/margin nhỏ ở mục **Quy tắc Spacing** bên dưới).
- **Thang size thống nhất (`xs` → `2xl`)** — định nghĩa tại `app/globals.css`, **không dùng `base`**:
  - Typography: `--font-size-xs` (11px), `--font-size-sm` (13px), **`--font-size-md` (14px, mặc định body)**, `--font-size-lg`, `--font-size-xl`, `--font-size-2xl`
  - Transition: `--transition-fast`, **`--transition-md`**, `--transition-slow`
  - Component props `size`: dùng cùng tên `xs | sm | md | lg | xl | 2xl` khi có (ví dụ `DatePicker size="sm"`)
  - **Button**: `size` = `xs | sm | md | lg` (mặc định `md`); nút chỉ icon dùng thêm `iconOnly` (ví dụ `<Button size="sm" iconOnly />`)
- **Quy tắc Spacing (padding / margin)** — thang `--space-*` tại `globals.css` (`--space-1` = 4px, `--space-2` = 8px, `--space-3` = 12px, …) **không có** bước lẻ 1–3px hay 5–7px:
  - **1–3px** (ví dụ `padding: 2px`, `gap: 1px`): **luôn ghi cố định `px`** — **không** dùng `var(--space-*)` hay `calc()` quanh token.
  - **5–7px** (ví dụ `margin-top: 6px`): **luôn ghi cố định `px`** — cùng lý do.
  - **Khớp thang spacing** (4, 8, 12, 16, 20, 24, 32, 40, 48px…): dùng `var(--space-1)` … `var(--space-12)` tương ứng.
  - **Không** làm tròn 5px → `var(--space-1)` (4px) hoặc 6px → `var(--space-2)` (8px) nếu thiết kế cần đúng số lẻ.
- **Quy tắc Radius (Bo góc)**:
  - **Button, Input, Alert, Menu**: Sử dụng `var(--radius-md)` (10px).
  - **Card, Modal, Large Containers**: Sử dụng `var(--radius-lg)` (14px).
- **Quy tắc Single-styling (Style hoặc ClassName — KHÔNG DÙNG CẢ HAI)**:
  - **Chỉ dùng EITHER `style` hoặc `className`**: Tuyệt đối không dùng cả `className` và `style` đồng thời trên cùng một element.
  - **Khi nào dùng `style`**: Khi element chỉ cần **đúng 1 thuộc tính CSS đơn giản** (ví dụ: `style={{ marginRight: 8 }}`) hoặc thuộc tính CSS tính toán động dựa trên state/server. Không khai báo thêm thuộc tính `className` cho element này.
  - **Khi nào dùng `className`**: Khi element cần **từ 2 thuộc tính CSS trở lên**. Toàn bộ các style phải được đưa hết vào CSS Module class và sử dụng `className` duy nhất. Không khai báo thêm thuộc tính `style` cho element này.
- **Chuẩn giao diện Card**:
  - Mặc định: `border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);`
  - Hover: `border-color: var(--color-border-focus); box-shadow: var(--shadow-md);` (KHÔNG dùng `transform: translateY(-2px)` hay `border-color: var(--color-primary)`).
  - Transition: Chỉ định rõ các thuộc tính cần transition, ví dụ: `transition: border-color var(--transition-md) ease, box-shadow var(--transition-md) ease;` (Tuyệt đối không dùng `transition: all`).
- **Chuẩn giao diện Menu Dropdown**:
  - **Nút mở (Kebab/Dots)**: `width: 34px; height: 34px; border-radius: var(--radius-sm); color: var(--color-text-muted); background: transparent;`. Khi hover: `background: var(--color-primary-dim); color: var(--color-text);`.
  - **Menu Container**: `background: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-sm); box-shadow: var(--shadow-md); padding: var(--space-1); z-index: 50;`.
  - **Item nguy hiểm (.danger)**: `color: var(--color-danger);`. Khi hover: `background: var(--color-danger-dim);`.

### TypeScript (component)

- **Cấm sử dụng `any`**: Tuyệt đối không dùng `any` trong code. Nếu kiểu dữ liệu chưa xác định rõ, sử dụng `unknown` và tiến hành parse thông qua Zod schema.
- **Định nghĩa Props tường minh**: Props của mọi component phải có type hoặc interface rõ ràng.
- **Cấm `@ts-ignore`**: Không sử dụng `// @ts-ignore` để bỏ qua lỗi build. Hãy giải quyết lỗi type một cách triệt để.

> Quy tắc TypeScript an toàn (`any`, `unknown`, Zod) cũng thuộc **§1 Bảo mật**.

---

## 6. Phạm vi task

> Kỷ luật **scope** khi AI/dev làm việc trong `apps/web/`. Monorepo rộng hơn: `aucobot/AGENTS.md`.

### 6.1 Nguyên tắc

- **Một task → một phạm vi rõ** — chỉ sửa file liên quan trực tiếp.
- **Diff tối thiểu** — code đúng §1–§5, không “dọn dẹp” / refactor ngoài yêu cầu.
- **Mở rộng có sẵn trước** — extend file/hàm hiện có trước khi tạo file mới (§2.2).

### 6.2 Trong phạm vi (web task thông thường)

```text
aucobot/apps/web/
  app/, components/, hooks/, utils/, lib/, schemas/, stores/, public/
```

- Chỉ chạm path user/task chỉ định; liệt kê **Out of scope** nếu không chắc.

### 6.3 Cấm (trừ khi user yêu cầu rõ)

| Cấm | Lý do |
|-----|--------|
| Sửa `apps/api`, `packages/*`, `cloud/*`, `deploy/` | Ngoài frontend scope |
| Sửa `../backend/`, `../frontend/` (legacy ngoài `aucobot/`) | Legacy |
| Thêm npm dependency (`package.json`) | Bề mặt tấn công + review |
| Drive-by refactor, format cả file, đổi tên lan man | Khó review |
| Tạo markdown/doc mới | Chỉ khi user yêu cầu |
| Commit / push git | Chỉ khi user yêu cầu |
| Refactor legacy → convention mới **toàn codebase** | Chỉ refactor file đang chạm trong task |

### 6.4 Verify trước khi hoàn thành

Từ thư mục `aucobot/`:

```bash
pnpm --filter @aucobot/web build
```

- Task chạm shared workspace package → build package đó trước (xem `AGENTS.md`).
- Báo user nếu không chạy được verify (môi trường thiếu).

### 6.5 Template task (AI tự điền khi bắt đầu)

```text
Task: [một câu]
Scope: aucobot/apps/web/[path cụ thể]
Out of scope: apps/api, packages/, refactor unrelated, new deps
Verify: pnpm --filter @aucobot/web build
Rule: .agent/rule.md §[liên quan]
```

### 6.6 Khi user không nói rõ scope

- Mặc định: **chỉ** `apps/web/` + path feature được nhắc trong task.
- Không đoán mở rộng sang API/backend.
- Nếu cần sửa ngoài web → **hỏi user** trước.

---

## 7. Lint & Enforcement

> Rule §1–§6 được **enforce tự động** qua ESLint (`apps/web/eslint.config.mjs`) + CI. Máy chặn, không dựa vào trí nhớ. Code mới đỏ lint = không merge.

### 7.1 Hai mức luật

| Mức | Ý nghĩa | Dùng cho |
|-----|---------|----------|
| **`error`** | ESLint thoát mã `1` → **CI chặn merge** | Luật ta cam kết giữ sạch 100% |
| **`warn`** | Hiện ra nhưng thoát mã `0` → **không chặn** | Nợ kỹ thuật — visible, dọn dần |

Nguyên tắc **ratchet (bánh cóc)**: lỗi cũ để `warn`, luật mới đặt `error`, vi phạm chỉ giảm không tăng.

### 7.2 Luật cứng (`error`) — không được vi phạm

| Luật | Nội dung | Rule gốc |
|------|----------|----------|
| `@typescript-eslint/no-explicit-any` | Cấm `any` — dùng `unknown` + Zod | §1.3, §5 |
| `@typescript-eslint/ban-ts-comment` | Cấm `@ts-ignore`, `@ts-nocheck` (cho `@ts-expect-error` kèm mô tả) | §1.3, §5 |
| `no-restricted-globals: fetch` (UI/hook/utils) | Cấm `fetch` thô — qua `lib/api/*` | §4.1 |
| `no-restricted-imports: axios` (UI/hook/utils) | Cấm `axios` thô — qua `lib/api/*` | §4.1 |
| Ranh giới `utils/**` | Cấm import value: react, hooks, components, app, stores, `lib/api`, `lib/http/axios`, `lib/chat`. **Cho** `import type` + `lib/http/api-base-url` (hàm thuần) | §2.1, §3.E |
| Ranh giới `lib/api/**` | Cấm import value: react, hooks, components, app, stores, `lib/http/server-api` | §3.F, §4.2 |
| Ranh giới `hooks/**` | Cấm import value: components, app; cấm `fetch`/`axios` | §3.D |

> **Component được phép** import `lib/api/*` trực tiếp (action 1 phát: toggle, submit) — chốt theo §4.5. Chỉ cấm `fetch`/`axios` thô. Logic fetch dùng lại ≥2 nơi vẫn nên tách `hooks/<domain>/` (guideline, không lint).
>
> **Ngoại lệ legacy** dùng `// eslint-disable-next-line <rule> -- <lý do + §7>` kèm TODO; ghi vào §7.4. Không lạm dụng cho code mới.

### 7.3 Nới luật

- **Story / test / script** (`*.stories.tsx`, `*.spec.ts`, `scripts/**`): tắt `no-explicit-any`, `no-restricted-*` (code công cụ, không phải sản phẩm).

### 7.4 Nợ kỹ thuật (`warn`) — dọn dần, code mới không thêm

**Snapshot:** sau đợt dọn "Nhóm A" (warning cơ học, 0 rủi ro runtime): **120 → 96 warning, 0 error**. 96 còn lại đều thuộc họ `react-hooks` / React Compiler (rủi ro hành vi → xử lý boy-scout từng case, không quét hàng loạt).

**Còn nợ (warn) — Nhóm B: rủi ro hành vi, KHÔNG nên fix hàng loạt (~94 warning)**

| Rule | Số | Vì sao nguy hiểm |
|------|----|------------------|
| `react-hooks/set-state-in-effect` | 62 | Sửa effect dễ gây render-loop/regression; lõi data-loading; chưa có test |
| `react-hooks/exhaustive-deps` | 27 | Thêm dep có thể gây chạy lại vòng lặp; phải xét từng case |
| `react-hooks/refs` / `static-components` / memoization | 5 | Đặc thù React Compiler — xử lý từng chỗ một |

> **Tổng snapshot:** 96 warning (94 react-hooks ở bảng trên + ~2 mục khác — xem bảng chi tiết). Chi tiết từng luật, mẫu code, công thức fix → §7.4.2.

**Chi tiết theo luật (warn):**

| Luật (warn) | Số chỗ | Hướng xử lý |
|-------------|--------|-------------|
| `react-hooks/set-state-in-effect` | ~62 | React Compiler — bỏ `setState` đồng bộ trong effect, xem từng case (dễ gây render-loop) |
| `react-hooks/exhaustive-deps` | ~27 | Bổ sung/điều chỉnh deps — xét từng case (thêm dep có thể gây chạy lại vòng) |
| `react-hooks/refs` | 3 | Không đụng ref lúc render |
| `react-hooks/preserve-manual-memoization`, `incompatible-library` | 3 | Xem cảnh báo React Compiler |
| `react-hooks/static-components` | 1 | Đưa định nghĩa component ra ngoài render |
| `utils/agent/agent-collaboration.ts` gọi `projectApi` | 1 | Đã `eslint-disable` tạm; chuyển `hooks/agent/` hoặc `lib/api/project` |

**Đã dọn (Nhóm A):**

| Luật | Số | Cách đã làm |
|------|----|-------------|
| ~~`storybook/no-renderer-packages`~~ | 14 | ✅ đổi import `@storybook/react` → `@storybook/nextjs-vite` |
| ~~`@typescript-eslint/no-empty-object-type`~~ | 3 | ✅ `interface X extends … {}` → `type X = …` (`CardSection`) |
| ~~`@typescript-eslint/no-unused-vars`~~ | 3 | ✅ gỡ import/biến thừa (`projectConnectData`, `ClientSetupPage`, script) |
| ~~`@next/next/*` font + `no-img-element`~~ | 3 | ✅ `eslint-disable` có ghi chú lý do (icon font trong `<head>`; favicon remote) |
| ~~`react/no-unescaped-entities`~~ | 1 | ✅ chỉnh rule chỉ cấm `>`/`}` (ký tự thật sự nguy hiểm); cho phép `'`/`"` render thẳng — KHÔNG ép `&apos;`/`&quot;` |

**Quy ước boy-scout:** đụng file nào có warn thì dọn warn của file đó luôn (vẫn giữ diff tối thiểu theo §6). Không “dọn cả codebase” trong 1 task.

#### 7.4.1 Migrate chuẩn hoá (Phase 2 — §3.M, §3.C) — code mới theo chuẩn ngay

| Việc | Hiện trạng | Hướng xử lý |
|------|-----------|-------------|
| ~~Export default → named (§3.M.2)~~ | ✅ **Xong** — 8 `ClientXxxPage` đã đổi | Đã enforce: lint `no-restricted-syntax` cấm `ExportDefaultDeclaration` |
| ~~Tên file kebab (§3.M.1)~~ | ✅ **Xong** — `use-project-navigation.ts`, `agent-form.schema.ts` đã rename | `git mv` + cập nhật 8 import |
| ~~CSS `ComponentName.module.css` (§3.M.1)~~ | ✅ **Xong** — 4 file (`NoApiKey`, `ActiveConnection`, `ClientConnectorPage`, `NoConnection`) đã rename; `setup-shared` giữ kebab (ngoại lệ shared) | `git mv` + sửa import |
| ~~`page.tsx` bọc layout (§3.B.2)~~ | ✅ **Xong** — `profile` + `chat` dời shell từ ClientXxxPage lên `page.tsx` (chat full-bleed, không Container); `agent` root/collaboration/heartbeat/schedules vốn đã chuẩn qua `agent/layout.tsx` dùng chung (không đụng) | Relocate shell + ghi nhận pattern layout chung |
| ~~Gom UI chat vào `components/chat/` (§3.C)~~ | ✅ **Xong** — `MessageBox/` (kèm `AttachmentPreviewRow/`, `ContextUsageRing/`) đã dời `components/dashboard/` → `components/chat/MessageBox/`; cập nhật 4 import + gỡ barrel `components/dashboard/index.ts` | Story chuẩn hoá: xem hàng "Thiếu `.stories.tsx`" |
| ~~Thiếu `.stories.tsx`~~ | ✅ **Xong** — `MessageBox`, `TitleHeader`, `SidebarFooter` đã có story co-located | CSF3 + `I18nProvider` decorator |
| ~~Tách `use-client-chat-page.ts` (>1k dòng)~~ | ✅ **Xong** — giữ co-located + tiền tố `use-`; tách 3 hook con thuần co-located (`use-chat-session-search`, `use-sidebar-preference`, `use-chat-derivations`); orchestrator 1071→936 dòng; lõi WebSocket/streaming giữ nguyên | Theo §3.M.1 (hook page-local) |

#### 7.4.2 Đánh giá Nhóm B (react-hooks / React Compiler) — nghiên cứu fix sau

> Mục tiêu phần này: ghi lại **bản chất từng luật**, **mẫu code gây ra**, **mức rủi ro khi sửa**, và **công thức fix theo case** để fix dần an toàn. **Không quét hàng loạt** — chưa có test cho phần lõi.

**Bối cảnh:** đây là bộ luật của `eslint-plugin-react-hooks` v6 (đi kèm React Compiler ở Next 16). Chúng cảnh báo các mẫu khiến React Compiler **không tối ưu được** hoặc **không an toàn với concurrent rendering**. Chạy bình thường ở hiện tại, nhưng nên dọn dần trước khi bật React Compiler.

**1. `react-hooks/set-state-in-effect` (~62) — rủi ro CAO khi sửa**
- *Bản chất:* gọi `setState(...)` **đồng bộ** trong thân `useEffect` → có thể tạo render thừa (render → effect → setState → render lại).
- *Mẫu trong repo:* (a) đồng bộ giá trị dẫn xuất từ props/state (`setThinkingLevel(target)`, `setSidebarCollapsed(load())`); (b) reset state khi đổi key (`setMessages([])` khi đổi `sessionKey`); (c) set sau `await` trong loader (`status/models/sessions`).
- *Công thức fix theo case:*
  - (a) **derive khi render** hoặc `useMemo` thay vì effect + setState (xoá hẳn effect).
  - (b) cân nhắc đổi sang **`key` prop để remount** component con, hoặc giữ effect nếu rõ ràng.
  - (c) set sau `await` thường **chấp nhận được** — để lại, hoặc dời sang data-fetching lib (React Query/SWR) ở refactor riêng.
  - khởi tạo từ storage → **lazy initializer** `useState(() => load())` thay vì effect.

**2. `react-hooks/exhaustive-deps` (~27) — rủi ro TRUNG BÌNH**
- *Bản chất:* `useEffect/useCallback/useMemo` thiếu hoặc dư dependency.
- *Công thức fix:* thiếu dep thật → thêm; cố tình (mount-once / ref-like) → `// eslint-disable-next-line react-hooks/exhaustive-deps` **kèm lý do**, hoặc chuyển giá trị sang `useRef`. Cẩn thận: thêm dep mà dep đó bị set trong chính effect → vòng lặp.

**3. `react-hooks/refs` (3) — rủi ro THẤP–TRUNG BÌNH**
- *Bản chất:* đọc/ghi `ref.current` trong **thân render** (không phải trong effect/handler) → không an toàn concurrent.
- *Fix:* chuyển truy cập ref vào `useEffect`/event handler, hoặc dùng state nếu giá trị ảnh hưởng render.

**4. `react-hooks/preserve-manual-memoization` + `incompatible-library` (3) — để sau**
- *Bản chất:* compiler không bảo toàn được `useMemo/useCallback` thủ công, hoặc thư viện không tương thích compiler. Thường **để nguyên**; xử lý khi bật React Compiler chính thức.

**5. `react-hooks/static-components` (1) — rủi ro THẤP, nên fix sớm**
- *Bản chất:* định nghĩa component **bên trong** render → mỗi lần render tạo type mới → remount + mất state con.
- *Fix:* đưa định nghĩa component ra **module scope** (ngoài hàm render).

**Hotspot (ưu tiên nghiên cứu):**
- `chat/_components/ClientChatPage/use-client-chat-page.ts` — đậm đặc nhất (~10), nhưng là **lõi WebSocket/streaming nhạy cảm → để cuối**, fix kèm test thủ công kỹ.
- `agent/[agentId]/_components/CardIntegrations.tsx`, `AgentPanel.tsx`, `ai-model/[providerId]/_components/ClientProviderIdPage.tsx` — mỗi file vài chỗ, **bắt đầu từ đây** (component nhỏ, dễ kiểm chứng).
- Phần lớn `ClientXxxPage.tsx` + `Card*/Modal*` còn 1–2 chỗ → dọn **boy-scout** khi đụng tới feature.

**Quy trình fix an toàn (mỗi lượt 1 file):** sửa 1 file → `pnpm typecheck` + `pnpm lint` → tự bấm thử màn liên quan trên `pnpm dev` → commit nhỏ. Không gộp nhiều file lõi trong 1 commit.

### 7.5 Lệnh verify (từ `aucobot/`)

```bash
pnpm --filter @aucobot/web lint        # 0 error mới được merge
pnpm --filter @aucobot/web typecheck   # tsc --noEmit, 0 error
pnpm --filter @aucobot/web build       # §6.4
```

- CI tự chạy 3 lệnh này trên mỗi PR — xem `.github/workflows/web-ci.yml`.

---