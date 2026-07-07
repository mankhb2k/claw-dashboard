# Kế hoạch xử lý 33 ESLint warnings (apps/web)

> **Baseline hiện tại:** `pnpm --filter @claw-dashboard/web lint` → **0 errors / 33 warnings**  
> **Mục tiêu:** **0 errors / 0 warnings** (theo `rule.md` §9.1 — ratchet lên `error` khi snapshot sạch)  
> **Config:** `eslint.config.mjs` · **Chuẩn import:** §9.5 `import/order`

---

## Tóm tắt theo rule

| Rule | Số warn | Auto-fix? | Ưu tiên |
|------|---------|-----------|---------|
| `import/order` | 32 | Có (`eslint --fix` / script) | P1 — batch |
| `jsx-a11y/role-supports-aria-props` | 1 | Không — sửa tay | P2 |

**32/33** warning ESLint báo *potentially fixable with `--fix`*.

---

## Thứ tự import chuẩn (import/order)

Áp dụng cho mọi file `.ts` / `.tsx`:

1. **builtin** — `node:*`, `fs`, …
2. **external** — `react`, `next`, `lucide-react`, …
3. **internal `@/**`** — alphabetize, group `@/lib` trước `@/utils` nếu cùng nhóm
4. **parent / sibling / index** — `./`, `../`
5. **type** — `import type` cuối cùng (trong cùng nhóm theo alphabet)
6. **Dòng trống** giữa các group (`newlines-between: always`)
7. **Không** dòng trống *trong* cùng một group

Script có sẵn (chạy từ `apps/web`):

```bash
node scripts/fix-import-order.mjs
# hoặc
pnpm eslint --fix
```

Sau batch fix: `pnpm --filter @claw-dashboard/web lint` + `typecheck` + smoke chat composer.

---

## Phase 1 — Batch auto-fix (32 warnings)

### Bước thực hiện

```bash
cd studio/apps/web
node scripts/fix-import-order.mjs
pnpm lint
pnpm typecheck
```

Nếu còn sót `import/order`, chạy thêm 1–2 pass `eslint --fix` hoặc sửa tay theo bảng file bên dưới.

### Checklist verify sau Phase 1

- [ ] `pnpm --filter @claw-dashboard/web lint` — còn ≤ 1 warning (chỉ `aria-expanded`)
- [ ] `pnpm --filter @claw-dashboard/web typecheck` — pass
- [ ] Mở Chat → gõ `/` → SlashMenu vẫn hoạt động (MessageBox imports phức tạp nhất)

---

## Phase 2 — Sửa tay `aria-expanded` (1 warning)

| File | Dòng | Rule | Vấn đề |
|------|------|------|--------|
| `components/chat/MessageBox/MessageBox.tsx` | 686 | `jsx-a11y/role-supports-aria-props` | `<textarea>` có role implicit `textbox` — không hỗ trợ `aria-expanded` |

### Hướng xử lý (chọn 1)

**A — Khuyến nghị:** Bỏ `aria-expanded` trên `textarea`; giữ quan hệ combobox qua container:

- Bọc textarea + SlashMenu trong `<div role="combobox" aria-expanded={skillMenuOpen} aria-controls="chat-slash-menu">`
- `textarea` chỉ giữ `aria-label`, `aria-autocomplete="list"` khi menu mở
- `SlashMenu` giữ `role="listbox"` + `id="chat-slash-menu"`

**B — Tối giản a11y:** Xóa `aria-expanded` + `aria-controls` trên textarea; chỉ dùng `aria-label` (menu vẫn focus keyboard qua logic hiện tại). Acceptable nếu không cần combobox pattern đầy đủ.

**C — Không khuyến nghị:** `eslint-disable-next-line jsx-a11y/role-supports-aria-props` — chỉ dùng nếu product chấp nhận nợ a11y tạm.

---

## Danh sách chi tiết 33 warnings

### A. Chat (8 warnings)

| # | File | Dòng | Message | Hướng xử lý |
|---|------|------|---------|-------------|
| 1 | `app/.../ChatPanel/ChatPanel.tsx` | 20 | type `@/utils/chat/skill-slash` trước type `@/utils/chat/tool/types` | Sắp lại block `import type`: alphabet `@/utils/chat/skill-slash` → `@/utils/chat/tool/types` |
| 2 | `app/.../ChatSidebar/ChatSidebar.tsx` | 43 | `@/lib/i18n` trước `@/utils/chat/session/display` | Đưa `@/lib/*` lên trước `@/utils/*` trong group internal |
| 3 | `app/.../ClientChatPage/use-client-chat-page.ts` | 14 | `@/lib/chat/project-chat-client` trước `@/lib/i18n/translate` | Alphabet trong `@/lib/**`: `chat` → `i18n` |
| 4–11 | `components/chat/MessageBox/MessageBox.tsx` | 32, 34–36, 56 | Thứ tự sibling CSS/utils/type; blank line giữa groups | **Batch phức tạp nhất:** (1) external (2) `@/components`, `@/hooks`, `@/lib`, `@/utils` alphabet (3) `./MessageBox.module.css` (4) `./ContextUsageRing/*`, `./SlashMenu/*`, `./ModelSelects/*` alphabet (5) `import type` sibling cuối. Dùng script; review diff cẩn thận |
| 12 | `components/chat/MessageBox/InputMirror/InputMirror.tsx` | 1 | Empty line trong import group | Gộp imports cùng group, chỉ blank line *giữa* groups |
| 13 | `components/chat/MessageBox/ModelSelects/ModelSelects.tsx` | 3 | Empty line trong import group | Xóa dòng trống thừa giữa imports cùng loại |
| 14 | `components/chat/MessageBox/SlashMenu/SlashMenu.tsx` | 13 | `./slash-menu.utils` trước `./SlashMenu.module.css` | Sibling alphabet: `./slash-menu.utils` → `./SlashMenu.module.css` (utils `.ts` trước `.module.css`) |
| 15 | `components/chat/MessageBox/MessageBox.tsx` | 619 | `aria-expanded` on textarea | **Phase 2** — xem trên |

### B. Dashboard / connector (3 warnings)

| # | File | Dòng | Message | Hướng xử lý |
|---|------|------|---------|-------------|
| 16 | `app/.../connector/connect-display.ts` | 2–3 | Blank line giữa groups; `@/utils/logoship/connector-logo` trước type `./projectConnectData` | (1) value imports `@/utils/...` (2) blank (3) type `./projectConnectData` |
| 17 | `app/(dashboard)/dashboard/layout.tsx` | 29 | `@/stores/auth.store` trước `@/stores/project.store` | Alphabet stores: `auth` → `project` |

### C. Hooks (1 warning)

| # | File | Dòng | Message | Hướng xử lý |
|---|------|------|---------|-------------|
| 18 | `hooks/skill/use-project-skills.ts` | 5 | Empty line trong import group | Xóa blank line thừa |

### D. lib/api & lib/http (5 warnings)

| # | File | Dòng | Message | Hướng xử lý |
|---|------|------|---------|-------------|
| 19–21 | `lib/api/mocks/handlers.ts` | 13–14 | Blank lines + `@/lib/i18n/translate` trước type `@/schemas/auth.schema` | Group: external → `@/lib/i18n` → blank → type `@/schemas` |
| 22 | `lib/api/users.ts` | 3 | `@/lib/http/axios` trước `@/lib/i18n/translate` | Alphabet `@/lib/http` → `@/lib/i18n` |
| 23 | `lib/http/axios.ts` | 5 | `@/lib/http/api-base-url` trước `@/lib/i18n/translate` | Alphabet `@/lib/http/*` trước `@/lib/i18n/*` |

### E. i18n dictionaries (7 warnings)

| # | File | Dòng | Message | Hướng xử lý |
|---|------|------|---------|-------------|
| 24–26 | `lib/i18n/dictionaries/en/index.ts` | 1, 5, 16 | `./auth` sau `./aiModel`; `./chat/errors` sau `./chat/composer`; `./project` sau `./profile` | Sắp export/import theo alphabet path: `aiModel` → `auth` → … → `chat/composer` → `chat/errors` → … → `profile` → `project` |
| 27–29 | `lib/i18n/dictionaries/vi/index.ts` | 1, 5, 16 | Giống `en/index.ts` | **Mirror 1:1** với `en/index.ts` — đổi thứ tụ import/export cùng pattern |
| 30 | `lib/i18n/translate.ts` | 2 | `./dictionaries` trước `./locale-storage` | Alphabet sibling: `dictionaries` → `locale-storage` |

### F. utils (2 warnings)

| # | File | Dòng | Message | Hướng xử lý |
|---|------|------|---------|-------------|
| 31–32 | `utils/chat/session/groups.ts` | 1–2 | Blank line giữa groups; `@/lib/i18n/translate` trước type `./types` | value `@/lib/i18n/translate` → blank → `import type` từ `./types` |

---

## Phase 3 — Ratchet (sau khi 0 warnings)

Theo `rule.md` §9.1:

1. Chạy lint snapshot sạch trên `main`
2. Nâng `import/order` từ `"warn"` → `"error"` trong `eslint.config.mjs` (`RULES_IMPORT`)
3. CI Web đã chạy `pnpm --filter @claw-dashboard/web lint` — sẽ chặn merge nếu ai phá thứ tự import

Tuỳ chọn a11y: nếu dùng combobox wrapper ở Phase 2A, cân nhắc thêm rule `jsx-a11y/*` liên quan vào snapshot (hiện chỉ warn qua Next preset).

---

## Phân công đề xuất (1 PR)

| PR | Phạm vi | Effort |
|----|---------|--------|
| **PR-1** | `node scripts/fix-import-order.mjs` + verify lint/typecheck | ~15 phút, diff lớn nhưng mechanical |
| **PR-2** | `MessageBox.tsx` a11y combobox wrapper + test keyboard `/` menu | ~30 phút |

Hoặc gộp 1 PR nếu muốn snapshot 0 warn một lần.

---

## Lệnh verify cuối

```bash
cd studio
pnpm --filter @claw-dashboard/web lint        # expect: 0 problems
pnpm --filter @claw-dashboard/web typecheck
pnpm --filter @claw-dashboard/web build
```

---

## Ghi chú

- **Không** đổi logic business khi sửa `import/order` — chỉ reorder imports / blank lines.
- File **`MessageBox.tsx`** là rủi ro conflict cao nhất (nhiều import + a11y); merge/rebase cẩn thận.
- **`en/index.ts` / `vi/index.ts`**: giữ thứ tự export đồng bộ để diff i18n dễ review.
- Sau khi sạch warnings, cập nhật `rule.md` §9.1 baseline thành **0 error / 0 warn** (nếu team ratchet `import/order` → error).

*Generated from lint output — 2026-06-21.*
