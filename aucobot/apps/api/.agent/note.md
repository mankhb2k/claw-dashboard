# Ghi chú tiến độ & nợ kỹ thuật — AucoBot API

> **Không phải quy định bắt buộc.** Snapshot lint, việc đã làm / chưa làm, backlog refactor.  
> **Quy định chính thức:** [`rule.md`](./rule.md) · **Config:** `eslint.config.mjs`

---

## 1. Snapshot lint

| Chỉ số | Giá trị | Ghi chú |
|--------|---------|---------|
| **Errors** | `0` | CI chặn merge nếu > 0 |
| **Warnings** | `0` | `@typescript-eslint/require-await`, `no-unsafe-assignment`, `restrict-template-expressions` vẫn **warn** |
| **Cập nhật** | 2026-06-19 | Sau Phase 2b boundary + cherry-pick Airbnb (R1/R4–R6) |

```bash
cd aucobot
pnpm --filter @aucobot/api lint          # local (--fix)
pnpm --filter @aucobot/api lint:ci       # CI parity
pnpm --filter @aucobot/api build
pnpm --filter @aucobot/api test          # chưa gate CI
```

**CI** (`.github/workflows/api-ci.yml`): lint 0 error + build. **Test chưa gate.**

---

## 2. Đã hoàn thành

### 2.1 ESLint ratchet (Phase 1–3)

| Hạng mục | Kết quả |
|----------|---------|
| `RULES_LOGIC`, `RULES_TYPE`, `RULES_IMPORT`, `RULES_PROMISE` | ✅ error |
| `no-explicit-any`, `no-unsafe-*` (prod), layer boundaries | ✅ error |
| `import/order`, `no-base-to-string`, `no-require-imports` | ✅ error |
| `no-restricted-imports` dto/lib/controller/core + `@aucobot-cloud/*` | ✅ error |
| `UsageSource` / `UsageStatus` → `@aucobot/shared` | ✅ |
| Storage self-host only (§1.13) | ✅ |
| `api-ci.yml` lint + build gate | ✅ |

### 2.2 Cherry-pick Airbnb / TS-eslint

| Luật | Trạng thái |
|------|------------|
| `prefer-promise-reject-errors` | ✅ error (spec không nới) |
| `default-case-last` | ✅ error |
| `guard-for-in` (+ ưu tiên `Object.keys/values/entries`) | ✅ error |
| `@typescript-eslint/consistent-type-imports` | ✅ error |
| `runtime-mode.ts` re-export (fix `no-unsafe-call`) | ✅ |

### 2.3 Phase 2b warnings (55 → 0)

Batch: `import/order` → `no-unused-vars` → `require-await` → `no-base-to-string` → boundary + `no-require-imports`.

---

## 3. Nợ kỹ thuật đang mở

### 3.1 ESLint — warn (code mới không thêm)

| Rule | Mức | Ghi chú |
|------|-----|---------|
| `@typescript-eslint/require-await` | warn | Stub `projects.service` respawn/start/stop — giữ warn theo policy §C |
| `@typescript-eslint/no-unsafe-assignment` | warn | Ratchet → error khi snapshot sạch |
| `@typescript-eslint/restrict-template-expressions` | warn | Ratchet tuỳ chọn |
| `@typescript-eslint/no-unsafe-member-access` | warn | Cùng nhóm typed debt |

**Boy-scout:** đụng file có warn → dọn file đó (diff tối thiểu).

### 3.2 ESLint — backlog luật mới

| Luật | Ưu tiên | Ghi chú |
|------|---------|---------|
| `@typescript-eslint/switch-exhaustiveness-check` | cao | Enum Prisma / `@aucobot/shared` |
| `no-useless-catch` | trung bình | Airbnb best-practices |
| Phase 3b — cấm `fetch` trong `*.controller.ts` | trung bình | Mirror web HTTP boundary |
| CI gate `pnpm test` | thấp | Bật khi suite ổn định |
| `process.env` tập trung module config | doc | Tuỳ chọn lint sau |

**Quy trình bật luật mới:** quét `--rule` → sửa `eslint.config.mjs` → fix code → `lint:ci` + `build` → cập nhật `rule.md` §7 + mục này.

### 3.3 Zod refactor (policy: `rule.md` §5.8)

Inventory P0–P2 — refactor dần, không thay DTO HTTP.

| Tier | File / vùng | Ghi chú |
|------|-------------|---------|
| **P0** | `usage/lib/parse-ws-frame.ts`, `parse-gateway-usage.ts`, `parse-rpc-usage.ts`, `session-usage-snapshot.ts` | Gateway / billing |
| **P1** | `google-oauth.ts`, provider test-key, `agent-ai-editor.prompt.ts`, LLM providers | OAuth / LLM JSON |
| **P2** | `nodes.service.ts`, `chat-agents.service.ts`, `project-model-catalog.ts` | RPC / config read |

**Chiến lược:** schema shared → `packages/shared` hoặc package domain; API chỉ `parse`/`safeParse`. Audit: `rg "JSON\.parse|as Record<string|response\.json\(\)" apps/api/src packages/`.

**SKIP:** DTO HTTP, npm tool instance, spec mock — §5.8.

### 3.4 Legacy / ngoại lệ documented

| Vị trí | Nội dung |
|--------|----------|
| `features/internal/**` | Controller Prisma legacy — §3.E |
| `jest.mock()` trước `import` trong spec | Pattern Jest — nới `import/first` trên `*.spec.ts` |

---

## 4. Ghi chú vận hành

### 4.1 Spec Jest — thứ tự import

`jest.mock()` **trước** block `import`. ESLint `--fix` / save thường giữ thứ tự; nếu mock hỏng — sửa tay, không đảo mock xuống dưới import.

### 4.2 Thêm luật ESLint

1. Một luật / một PR nhỏ  
2. `pnpm exec eslint "src/**/*.ts" --rule 'rule-name: error'` (ước lượng)  
3. Cập nhật `eslint.config.mjs` + `rule.md` §7  
4. Ghi snapshot / checklist tại **file này**

### 4.3 Airbnb tham khảo

Clone (local, `.gitignore`): `scratch/airbnb-javascript/`. **Không** `extends('airbnb')` — cherry-pick từng luật. Web: `apps/web/.agent/rule-match.md`.

---

*Cập nhật tiến độ: chỉ file này. Đổi quy định: `rule.md` + `eslint.config.mjs`.*
