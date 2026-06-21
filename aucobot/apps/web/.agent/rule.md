# Nguyên tắc Phát triển Frontend — AucoBot Web

> Áp dụng cho `aucobot/apps/web/`. Mọi code (kể cả AI) phải tuân thủ.  
> Monorepo: đọc thêm `aucobot/AGENTS.md` khi task chạm nhiều app/package.  
> **Config thực thi:** `eslint.config.mjs` · `tsconfig.json`

---

## Mục lục

| § | Nội dung |
|---|----------|
| 1 | Bảo mật |
| 2 | Tái sử dụng code |
| 3 | Cấu trúc thư mục |
| 4 | Data & state |
| 5 | UI & CSS |
| 6 | Phạm vi task |
| 7 | Kiểm thử |
| 8 | CI/CD & đóng gói |
| 9 | ESLint & enforcement |

---

## 1. Bảo mật

> Checklist chung — không gắn implementation cụ thể.

### 1.1 Xác thực & phiên

- Token/session do **server** quản lý (`httpOnly` cookie hoặc flow chuẩn framework).
- **Cấm** lưu access/refresh token trong `localStorage` / `sessionStorage`.
- Một nơi xử l API, refresh, redirect hết phiên — không duplicate auth.
- Route protected: guard **middleware/edge**, không chỉ ẩn UI.

### 1.2 Phân quyền

- Ẩn nút UI **không** thay check quyền backend.
- Không tin `role` / `userId` từ client state nếu chưa đối chiếu server.
- URL params (`/resource/:id`) phải **validate** trước API.

### 1.3 Validate dữ liệu

- **Input:** form, query, upload — validate schema trước submit.
- **Output API:** parse/validate response — không tin JSON tùy ý.
- TypeScript: `unknown` + parse; **cấm `any`**; **cấm `@ts-ignore`**.

### 1.4 XSS & render nội dung

- Mặc định render text (React escape).
- Cẩn trọng: `dangerouslySetInnerHTML`, Markdown/HTML, paste, URL `javascript:`.
- Chỉ HTML **đã sanitize**; ưu tiên `ReactMarkdown` + `rehype-sanitize`.
- Link ngoài `target="_blank"`: `rel="noopener noreferrer"`.
- Link nội app trong Markdown: `next/link` — xem `ChatMarkdown`.

### 1.5 Secrets

- **Cấm** API key/password/token trong `NEXT_PUBLIC_*`, source client, `console`, message lỗi user.
- Hiển thị key: **masked**; copy có confirm khi cần.
- **Cấm** secrets trong URL query.

### 1.6 Giao tiếp API

- HTTPS production; cookie auth: `Secure`, `SameSite`, `httpOnly`.
- Một HTTP client chuẩn — không rải `fetch`/`axios` thô.
- Timeout & lỗi thống nhất — không leak stack ra UI.

### 1.7 Lưu trữ client

| Được | Cấm |
|------|-----|
| Theme, locale, UI preference | Token, password, API key, PII thừa |

### 1.8–1.11 Upload, OAuth, WebSocket, dependency

- Upload: validate type/size/MIME; cẩn thận preview SVG/HTML.
- OAuth: validate redirect; state/nonce do backend.
- WebSocket: không secret trên query; validate message server.
- Dependency: không thêm package tùy tiện; không copy snippet có `eval`.

### 1.12 Logging & error UX

- Production: **cấm `console.*`** (enforce ESLint §9).
- Lỗi user: message chung; chi tiết kỹ thuật chỉ server/dev log.

---

## 2. Tái sử dụng code

> **Discover → Reuse → Extend → Create.**

### 2.1 Phân tầng folder

| Folder | Vai trò | Được | Cấm |
|--------|---------|------|-----|
| `utils/<domain>/` | Helper thuần | Transform, parse, validate; `import type` + `lib/http/api-base-url` | React, API/WS, hooks, UI |
| `hooks/<domain>/` | React hook domain | `useState`, compose utils + `lib/api` | Helper thuần, JSX |
| `lib/<domain>/` | Client I/O domain | WS client, class kết nối | Hook, JSX |
| `lib/http/` | HTTP transport | `axios`, `api-base-url`, `server-api` | Business API, JSX |
| `lib/api/` | REST + Zod | `xxxApi.list()` | JSX, `useState` |
| `schemas/` | Zod + inferred type | Form, API shape | Component, fetch |
| `stores/` | Zustand shared | App-wide + `stores/<domain>/` | Local UI state |
| `components/ui/` | Design system | Button, Input… | Business, API |
| `components/layout/` | Layout | Flex, Container | Fetch |
| `components/dashboard/` | Shell ≥2 màn | Sidebar, Header | Logic 1 feature |
| `components/chat/` | UI chat tái dùng | `MessageBox`, `ChatMarkdown` | Logic 1 màn chat |

**Luồng phụ thuộc:**

```text
components/app  →  hooks/<domain>  →  lib/api + utils + lib/<domain>
components/app  →  lib/api          (action đơn: toggle/submit — §4.5)
```

- `utils` không import `hooks`.
- **Cấm** `fetch`/`axios` thô trong component/hook — qua `lib/api/*` (§9).

**Code mới:** bắt buộc `hooks/<domain>/`, `utils/<domain>/`, `stores/<domain>/`.

### 2.2 Workflow trước khi viết mới

1. Search codebase — feature, API, component tương tự.
2. Kiểm tra `utils/`, `hooks/`, `lib/api/`.
3. Đọc `.stories.tsx` trong `components/ui/`.
4. Extend trước khi tạo file mới.
5. Đặt file đúng folder §2.1.

### 2.3 Extend vs tạo mới

| Tình huống | Hành động |
|------------|-----------|
| Thiếu prop UI | Thêm `components/ui/` |
| Endpoint cùng resource | Thêm method `lib/api/xxx.ts` |
| Logic thuần tái dùng | `utils/<domain>/` |
| State React tái dùng | `hooks/<domain>/` |
| Type form + API | `schemas/xxx.schema.ts` |
| UI 1 màn | `app/.../_components/` |

### 2.4 Anti-pattern

- `fetch`/`axios` trong component → `lib/api/*`
- Button custom → `Button` từ `components/ui`
- Copy hook → import `hooks/<domain>/`
- Helper thuần trong `hooks/` hoặc hook trong `utils/`

### 2.5 UI primitives

- Kiểm tra `components/ui/` **trước**.
- Đọc `.stories.tsx` trước khi dùng component UI.
- Composition first — không viết lại CSS primitive đã có.
- Mở rộng qua `variant`/`size`/props — không override style primitive từ component cha.

### 2.6 Storybook

- `.stories.tsx` **cạnh component** (`ui/`, `layout/`, `dashboard/`, `chat/`).
- Self-contained demo; `tags: ['autodocs']`.

---

## 3. Cấu trúc thư mục

### 3.A Sơ đồ `apps/web/`

```text
apps/web/
├── app/                 Routes & UI theo feature
├── components/          ui/, layout/, dashboard/, chat/
├── hooks/<domain>/      React hooks
├── utils/<domain>/      Helper thuần
├── lib/                 http/, api/, auth/, chat/, routing/, theme/, runtime/, i18n/
├── schemas/             Zod (web-first)
├── stores/              Zustand (root + <domain>/)
├── public/              Static assets
├── .storybook/
├── scripts/             Dev/CI tooling
├── proxy.ts             Route guard
└── next.config.ts       Rewrites, images, redirects
```

### 3.B `app/`

#### 3.B.1 Cây route

```text
app/
├── layout.tsx, providers.tsx, globals.css, page.tsx
├── (auth)/login|register/page.tsx     # ngoại lệ Server/Client — §3.B.2
├── setup/page.tsx + _components/
└── (dashboard)/dashboard/
    ├── layout.tsx
    ├── page.tsx
    ├── _components/                   # chỉ overview
    └── <feature>/page.tsx, [param]/, _components/
```

#### 3.B.2 `page.tsx` vs `ClientXxxPage`

| | `page.tsx` (Server) | `ClientXxxPage` |
|---|---------------------|-----------------|
| Layout shell, `TitleHeader` | ✅ | ❌ |
| Fetch server, `initial*` props | ✅ | Nhận props |
| `useState`, API client | ❌ | ✅ |

- **`(auth)/`:** ngoại lệ — không bắt buộc `ClientXxxPage`.
- **Section layout chung** (vd `agent/layout.tsx`): `page.tsx` con render trơ client page là **đúng**.
- **Full-bleed** (vd `chat`): `page.tsx` bọc `styles.page`, không `Container`.

#### 3.B.3 `_components/`

- **Cấm** file component lẻ — mỗi component = folder `Name/Name.tsx`.
- Tiền tố: `ClientXxxPage`, `CardXxx`, `ModalXxx`, `XxxSection`, `NoXxx`.

### 3.C `components/`

| Subfolder | Vai trò |
|-----------|---------|
| `ui/` | Design system |
| `layout/` | Bố cục |
| `dashboard/` | Widget ≥2 route |
| `chat/` | UI chat tái dùng |

Feature-specific 1 màn → `app/.../_components/`.

### 3.D `hooks/`

- Có `useState`/`useEffect` → đây, không `utils/`.
- Compose: `lib/api` + `utils` + `lib/<domain>`.
- Tên file **kebab** `use-xxx.ts`.
- Hook 1 domain ở root `hooks/` → chuyển `hooks/<domain>/`.

### 3.E `utils/`

- Thuần: không React, không API/WS runtime.
- Import: `@/utils/<domain>/<file>`.

### 3.F `lib/` & `lib/api/`

| Path | Vai trò |
|------|---------|
| `lib/http/axios.ts` | Client HTTP duy nhất |
| `lib/http/server-api.ts` | RSC fetch + cookie forward |
| `lib/http/api-base-url.ts` | Base URL client/server |
| `lib/api/*` | REST + Zod parse |
| `lib/auth/` | Session middleware |
| `lib/chat/` | WebSocket client |

- `lib/api` **cấm** import `server-api`.
- `server-api` chỉ từ RSC / middleware.

### 3.G `schemas/` · 3.H `stores/` · 3.I–3.L

- **schemas:** web-first Zod; dùng `@aucobot/shared` khi type đã có — không duplicate.
- **stores:** app-wide `stores/*.store.ts`; domain `stores/<domain>/`; selector bắt buộc (§4.4).
- **public:** static only — cấm secrets.
- **scripts/:** không import vào app/components/lib/hooks/utils.

### 3.M Đặt tên & export

| Loại | Quy ước |
|------|---------|
| Component `.tsx` | PascalCase folder + file |
| CSS module component | `ComponentName.module.css` |
| CSS page/route | `<feature>.module.css` |
| Hook, util, store, schema | **kebab** `use-xxx.ts`, `xxx.schema.ts` |
| Story | `ComponentName.stories.tsx` |
| Export component/hook/util | **Named export** |
| `page.tsx`, `layout.tsx` | Default export (Next bắt buộc) |

Hook page-local: co-located trong `_components/ClientXxxPage/use-xxx.ts` — chỉ 1 màn.

---

## 4. Data & state

### 4.1 Ba kênh data

| Kênh | Layer | Khi nào |
|------|-------|---------|
| REST client | `lib/http/axios` → `lib/api/*` | Mutation, client fetch |
| REST server | `lib/http/server-api` | `page.tsx` RSC |
| WebSocket | `lib/<domain>/…-client` | Realtime — không qua axios |

### 4.2 `lib/api/` chuẩn

- Mọi method: `api` + **Zod parse** response.
- Body: validate schema trước gửi.
- Export `xxxApi = { list, create, … }`.

### 4.3 Server vs client fetch

- **Tách rõ** — không helper hybrid `typeof window`.
- Server → props `initial*`; client → refetch qua `lib/api`/hook.

### 4.4 State

| Lớp | Công nghệ | Khi nào |
|-----|-----------|---------|
| Shared | Zustand §3.H | ≥2 component |
| Page local | `useState` trong `ClientXxxPage` | 1 màn |
| Tái dùng logic | `hooks/<domain>/` | ≥2 component |
| Infra | Context (i18n, toast) | Không business data |

```ts
const projects = useProjectStore((s) => s.projects); // bắt buộc selector
```

### 4.5 Form

- Form nhập liệu: **react-hook-form** + `zodResolver` + `schemas/`.
- Toggle/settings đơn: `lib/api` trực tiếp trong handler được phép.

### 4.6 Loading & 4.7 Error

- Loading list/page: `Spinner` hoặc skeleton pattern feature.
- Validation: inline `.field__error`; API action: `Toast` hoặc inline card — **một pattern / feature**.
- **Cấm** `alert()` cho lỗi thường.

### 4.8 Ảnh (Next.js)

- Dùng `import Image from "next/image"` + `unoptimized={shouldUseUnoptimized(src)}` (`utils/image/app-image.utils`).
- Icon có fallback: `IconProvider`.
- **Ngoại lệ `<img>`:** favicon domain bất kỳ — `eslint-disable` có lý do (vd `ToolResearchBlock`).

### 4.9 Link (Next.js)

- Navigation nội app: `next/link` — không `<a href="/...">` thuần.
- Markdown chat: link `/…` → `Link`; external → `<a target="_blank" rel="noopener noreferrer">`.

---

## 5. UI & CSS

### 5.1 Import

- Gộp import `@/components/ui`, `@/components/layout` trên một dòng.

### 5.2 CSS Modules

- **Không** Tailwind / Bootstrap / MUI / shadcn.
- Mỗi component: `.module.css` cạnh file; class phẳng (không BEM).
- Comment CSS tiếng Việt ngắn mô tả block.
- Dùng **CSS variables** từ `globals.css` — không hardcode màu/spacing (trừ 1–7px §5.3).
- **Không** `className` + `style` cùng lúc trên một element.

### 5.3 Tokens

- Font: `xs` → `2xl`; spacing `--space-*` (4px bước); radius `--radius-md` (control), `--radius-lg` (card/modal).
- Card hover: border + shadow — không `translateY`; không `transition: all`.

### 5.4 TypeScript component

- Cấm `any`; props có type rõ; cấm `@ts-ignore`.

---

## 6. Phạm vi task

### 6.1 Nguyên tắc

- Một task → một phạm vi; **diff tối thiểu**.
- Extend trước khi tạo mới (§2.2).
- **`aucobot/apps` storage = local** (avatar PG, chat disk) — không phụ thuộc `RUNTIME_MODE` (API: `apps/api/.agent/rule.md` §1.13).
- **Giữ `NEXT_PUBLIC_RUNTIME_MODE`:** `oss` (mặc định self-host) ẩn UI cloud (spawn container, `SetupCloudRecreate`, subdomain URL); `cloud` bật UI đó — dùng khi build/deploy product `../cloud/`.

### 6.2 Trong phạm vi

`aucobot/apps/web/` — `app/`, `components/`, `hooks/`, `utils/`, `lib/`, `schemas/`, `stores/`, `public/`.

### 6.3 Cấm (trừ user yêu cầu rõ)

| Cấm | Lý do |
|-----|--------|
| Sửa `apps/api`, `packages/*`, `deploy/` | Ngoài web scope |
| Thêm dependency | Review + security |
| Drive-by refactor / format cả file | Khó review |
| Tạo markdown/doc mới | Chỉ khi user yêu cầu |
| Commit/push git | Chỉ khi user yêu cầu |
| Refactor legacy toàn codebase | Chỉ file đang chạm |

### 6.4 Template task (AI)

```text
Task: [một câu]
Scope: aucobot/apps/web/[path]
Out of scope: apps/api, packages/, unrelated refactor
Verify: §8
Rule: .agent/rule.md §[liên quan]
```

---

## 7. Kiểm thử

### 7.1 Phạm vi

- **Unit/helper:** `node:test` + `node:assert` trong `**/*.spec.ts` cạnh source (vd `utils/chat/*.spec.ts`).
- **Chạy:** từ `aucobot/`:

```bash
pnpm --filter @aucobot/web test
```

- Test spec **chạy typed lint** (cùng chuẩn Promise §9) — chỉ nới ranh giới tầng §9.4.
- **`node:test`:** `void describe(…, async () => { await it(…) })` khi `describe`/`it` async.

### 7.2 Storybook

- Dev: `pnpm --filter @aucobot/web storybook` (port 6006).
- Build static: `pnpm --filter @aucobot/web build-storybook`.
- Story **không** deploy production — nới ESLint §9.4.

### 7.3 E2E / Playwright

- Script trong `scripts/` khi có — không import vào app.

---

## 8. CI/CD & đóng gói

### 8.1 Pipeline (`/.github/workflows/web-ci.yml`)

Trigger: PR/push `main` khi đổi `apps/web/**`, `packages/**`, lockfile.

| Bước | Lệnh | Yêu cầu |
|------|------|---------|
| Install | `pnpm install --frozen-lockfile` | — |
| Lint | `pnpm --filter @aucobot/web lint` | **0 error** |
| Typecheck | `pnpm --filter @aucobot/web typecheck` | **0 error** |
| Build | `pnpm turbo run build --filter=@aucobot/web` | Thành công |

Node 22 · pnpm 9 (field `packageManager`).

### 8.2 Verify local (trước khi xong task)

Từ `aucobot/`:

```bash
pnpm --filter @aucobot/web lint
pnpm --filter @aucobot/web typecheck
pnpm --filter @aucobot/web build
```

Task chạm workspace package → build package đó trước (`AGENTS.md`).

### 8.3 Dev & production

| Lệnh | Mục đích |
|------|----------|
| `pnpm --filter @aucobot/web dev` | Dev server port **8386** |
| `pnpm --filter @aucobot/web build` | `next build` production |
| `pnpm --filter @aucobot/web start` | Serve build port 8386 |

### 8.4 Đóng gói

- Output: `.next/` (gitignore).
- `transpilePackages`: workspace deps (`@aucobot/workspace-sync`, …).
- API proxy: `next.config.ts` rewrites `/api/*` → backend.
- Images: SVG allowlist trong `next.config.ts` — dùng với `next/image` §4.8.

### 8.5 TypeScript strictness (`tsconfig.json`)

| Flag | Bắt buộc | Ý nghĩa |
|------|----------|---------|
| `strict` | `true` | Bộ kiểm tra khắt khe nhất (null-check, implicit any…) |
| `noImplicitReturns` | `true` | Mọi nhánh `if/else`/`switch` phải return nhất quán |
| `noUnusedLocals` | `true` | Cấm biến/import rác (bổ trợ ESLint) — typecheck **fail** nếu còn |

- **`noUnusedLocals` ⇒ cấm `import React` thừa**: JSX dùng transform `react-jsx`, không cần `import React`. Chỉ import khi thực sự dùng `React.<API>` (vd `React.ReactNode`).
  - `import React, { useX } from "react"` → `import { useX } from "react"`.
  - `import React from "react"` đứng một mình → xoá cả dòng.
- Biến cố ý không dùng (exhaustiveness `never`): vẫn phải **tham chiếu** giá trị (vd nhét vào message lỗi) — `noUnusedLocals` **không** bỏ qua tiền tố `_`.
- Field/biến chỉ ghi mà không đọc = code chết → xoá.

---

## 9. ESLint & enforcement

> Config thực thi: `eslint.config.mjs`. Baseline: **0 error / 0 warn**.

### 9.1 Hai mức

| Mức | CI | Ý nghĩa |
|-----|-----|---------|
| **`error`** | Chặn merge | Luật cam kết giữ sạch |
| **`warn`** | Không chặn | Nợ kỹ thuật — code mới không thêm |

**Ratchet:** luật mới thường `warn` → `error` khi snapshot sạch.

### 9.2 Base preset

`eslint-config-next/core-web-vitals` + `typescript` + Storybook flat recommended.

Nâng cấp riêng: `@next/next/no-img-element: error`.  
Giữ `warn`: `@next/next/no-typos` (Pages Router; App Router ít tác dụng).

### 9.3 Luật `error` — kiến trúc AucoBot

| Luật / nhóm | Nội dung |
|-------------|----------|
| `@typescript-eslint/no-explicit-any` | Cấm `any` |
| `@typescript-eslint/ban-ts-comment` | Cấm `@ts-ignore`; `@ts-expect-error` có mô tả |
| `no-restricted-globals: fetch` | UI/hooks/utils — qua `lib/api` |
| `no-restricted-imports: axios` | UI/hooks/utils — qua `lib/api` |
| Ranh giới `utils/**` | Cấm React, API, hooks, UI (cho `import type`) |
| Ranh giới `lib/api/**` | Cấm React, hooks, UI, `server-api` |
| Ranh giới `hooks/**` | Cấm UI/app; cấm fetch/axios thô |
| `no-restricted-syntax` | Named export — trừ `page`/`layout`/stories |
| `react/no-unescaped-entities` | Chỉ cấm `>` / `}` trong JSX text |

### 9.4 Luật `error` — logic & an toàn (ESLint core)

| Luật | Nội dung |
|------|----------|
| `eqeqeq` | `===` / `!==`; cho phép `== null` |
| `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url` | Cấm eval / script URL |
| `no-throw-literal` | Chỉ `throw new Error(...)` |
| `array-callback-return`, `no-promise-executor-return` | Callback/executor đúng return |
| `no-return-assign`, `no-self-assign`, `no-unreachable-loop` | Logic bug |
| `no-unsafe-optional-chaining` | Không arithmetic trên optional chain |
| `no-console` | Cấm `console.*` prod |
| `no-param-reassign` | Không mutate param (`props: true`; whitelist `acc`/`draft`/…) |
| `consistent-return` | Nhánh return nhất quán |
| `default-case` | `switch` có `default` hoặc exhaustiveness `never` |
| `prefer-template` | Template literal thay `+` nối chuỗi |


### 9.5 Luật `error` — import

| Luật | Mức | Nội dung |
|------|------|----------|
| `import/no-duplicates`, `no-self-import`, `no-useless-path-segments` | error | Vệ sinh import |
| `import/first`, `import/newline-after-import` | error | Thứ tự file |
| `import/order` | **warn** | Nhóm + `@/**` internal + alphabetize + `type` last |

### 9.6 Luật — React

| Luật | Mức | Nội dung |
|------|------|----------|
| `react/no-array-index-key` | warn | Stable key khi list động |
| `react/jsx-no-useless-fragment` | error | Bỏ Fragment 1 con |
| `react/no-unstable-nested-components` | error | Component ở module scope |
| `react/no-danger` | warn | Cảnh báo `dangerouslySetInnerHTML` |
| `react-hooks/rules-of-hooks` | **error** | Hook chỉ gọi ở top-level component/hook viết hoa — Storybook `render` tách thành component |
| `react-hooks/set-state-in-effect` | **error** | Không `setState` đồng bộ trong `useEffect` — derive render / fetchKey / callback async |
| `react-hooks/exhaustive-deps` | **error** | Khai báo đủ dep thật; `useMemo`/`useCallback` cho giá trị/hàm dùng làm dep; `eslint-disable` có lý do (§9.11) khi thêm dep gây re-run ngoài ý muốn |
| `react-hooks/refs` | **error** | Không đọc/ghi `ref.current` lúc render — gán trong `useEffect`, đọc trong handler/async |
| `react-hooks/preserve-manual-memoization` | warn | Bỏ manual memo thừa để React Compiler giữ được (compiler đang tắt runtime) |
| `react-hooks/static-components` | warn | Không tạo component động lúc render — đưa ra module scope (vd `PlatformIcon`) |
| `react-hooks/incompatible-library` | warn | API thư viện không memo được (RHF `watch()`) — `eslint-disable` §9.11 nếu chủ đích |
| `react-web-api/no-leaked-timeout` | **error** | `setTimeout` trong `useEffect` phải gán `const timerId = …` và `return () => clearTimeout(timerId)` — nhiều timer: tách component con (vd `DoneActivityScheduler`) |
| `react-web-api/no-leaked-interval` | **error** | `setInterval` trong effect phải `clearInterval` ở cleanup tương ứng |

**Chính sách `key`:** `id` → composite → nội dung → index (chỉ list tĩnh + disable có lý do).

**Chính sách `setState` trong effect:** tính tại render (`useMemo`/const); reset loading khi `projectId` đổi (render-time `trackedFetchKey`); loader gọi từ effect bọc `await Promise.resolve()` trước khi `setState`.

### 9.7 Luật `error` — Promise (typed lint)

| Luật | Nội dung |
|------|----------|
| `@typescript-eslint/no-floating-promises` | `await` / `.catch` / `void` có chủ đích |
| `@typescript-eslint/no-misused-promises` | Không async trong `.map`/timer sync; JSX `attributes: false` |

Cần `projectService: true` — bỏ qua stories/scripts/mocks (§9.4 nới).

### 9.8 Luật — Next.js

| Luật | Mức | Nội dung |
|------|------|----------|
| `@next/next/no-img-element` | error | Dùng `next/image` §4.8 |
| `@next/next/no-html-link-for-pages` | error | Dùng `next/link` §4.9 |
| `@next/next/no-typos` | warn | Typo `getStaticProps`… (Pages Router) |

### 9.9 Luật `warn` — React Compiler hints

`react-hooks/preserve-manual-memoization`, `react-hooks/static-components`, `react-hooks/incompatible-library`, `storybook/no-renderer-packages`. Hiện **0 vi phạm**.

- Code **mới** không thêm warn — fix ngay hoặc `eslint-disable` có lý do (§9.11).

### 9.10 Nới luật (§7.3 trong config)

**Artifact** (`*.stories.tsx`, `scripts/**`, `lib/api/mocks/**`, …): tắt `no-explicit-any`, `no-restricted-*`, `no-console`, `no-param-reassign`, Promise rules, `react/no-array-index-key`, …

**Test** (`*.spec.ts`, `*.test.*`): chỉ nới ranh giới tầng + `import/first` — **giữ** logic & Promise typed lint.

### 9.11 `eslint-disable`

- Chỉ khi bắt buộc — kèm `-- lý do` + tham chiếu §.
- **Cấm** disable cho code mới thay vì sửa đúng chuẩn.

### 9.12 Tham khảo Airbnb (chỉ đọc)

- **Không** `extends('airbnb')` — cherry-pick từng luật vào `eslint.config.mjs`.
- Clone tham khảo: `scratch/airbnb-javascript/`.

---

*Cập nhật quy định: sửa `rule.md` + `eslint.config.mjs` đồng bộ.*
