# Hướng dẫn cập nhật Model Catalog — 6 Foundation Providers

> Áp dụng khi user yêu cầu **thêm / đổi / gỡ model** của provider foundation.  
> Phạm vi: `aucobot/` — catalog web + `GET /api/projects/providers/definitions` + chat/skill picker.

**6 Foundation providers** (`PHASE1_FOUNDATION_IDS`):

| # | ID | Pattern | SSOT |
|---|-----|---------|------|
| 1 | `openai` | Shared package | `packages/shared/src/models/openai-models.ts` |
| 2 | `anthropic` | Inline (2 file) | `provider-registry.ts` + `providers-data.ts` |
| 3 | `gemini` | Shared package | `packages/shared/src/models/gemini-models.ts` |
| 4 | `deepseek` | Inline (2 file) | `provider-registry.ts` + `providers-data.ts` |
| 5 | `groq` | Inline (2 file) | `provider-registry.ts` + `providers-data.ts` |
| 6 | `mistral` | Inline (2 file) | `provider-registry.ts` + `providers-data.ts` |

**Catalog snapshot (cập nhật lần cuối: 2026-06):**

| Provider | Default `openclawId` | Models trong catalog |
|----------|----------------------|----------------------|
| OpenAI | `openai/gpt-5.4-mini` | gpt-5.5, gpt-5.4, gpt-5.4-mini ★, gpt-5.4-nano |
| Anthropic | `anthropic/claude-sonnet-4-6` | opus-4-8, opus-4-6, sonnet-4-6 ★, haiku-4-5 |
| Gemini | `google/gemini-3.5-flash` | 3.5-flash ★, 3.1-pro-preview, 3-flash-preview, 3.1-flash-lite, 2.5-pro, 2.5-flash, 2.5-flash-lite, 2.0-* (deprecated) |
| DeepSeek | `deepseek/deepseek-v4-flash` | v4-flash ★, v4-pro |
| Groq | `groq/llama-3.3-70b-versatile` | llama-3.3-70b ★, llama-3.1-8b-instant, llama-3.1-70b (deprecated) |
| Mistral | `mistral/mistral-large-latest` | large ★, small, devstral, codestral |

★ = `recommended` trong catalog.

---

## 1. Kiến trúc & quy ước ID

```
Docs chính thức (web)
        ↓
SSOT (shared HOẶC provider-registry + providers-data)
        ↓
apps/api/.../provider-registry.ts  →  GET /api/projects/providers/definitions
        ↓
apps/web (AI Model, Chat select, Skill editor)
```

| Field | Ví dụ | Ý nghĩa |
|-------|--------|---------|
| `id` | `gpt-5.4-mini` | Native API id — UI dropdown, một số DB `defaultModel` |
| `openclawId` | `openai/gpt-5.4-mini` | Id gửi OpenClaw gateway: `{provider}/{model-id}` |
| `name` | `GPT-5.4 Mini` | Nhãn hiển thị |

**Lọc model:** chỉ chat / agent / coding. Không thêm image, TTS, realtime, embedding-only.

**Legacy:** Project đã lưu `defaultModel` cũ vẫn chạy (`project-model-catalog.ts` inject model nếu không còn trong catalog). Không migration DB trừ khi user yêu cầu.

---

## 2. Hai pattern cập nhật

### Pattern A — Shared SSOT (OpenAI, Gemini)

Sửa **một file** trong `packages/shared`; API + web tự sync qua import.

| Bước | Việc làm |
|------|----------|
| 1 | Research docs chính thức |
| 2 | Sửa `*-models.ts` (+ `*-models.types.ts` nếu thêm field) |
| 3 | Cập nhật `*_DEFAULT_OPENCLAW_MODEL` nếu đổi default |
| 4 | Cập nhật `adapters/{provider}/*-test-key.ts` + `.spec.ts` nếu đổi model smoke test |
| 5 | `pnpm --filter @aucobot/shared build` |
| 6 | Grep fixture test (tùy chọn) |
| 7 | `pnpm --filter @aucobot/api build` |

`provider-registry.ts` và `providers-data.ts` **không cần sửa list model** (đã map từ shared).

### Pattern B — Inline dual-file (Anthropic, DeepSeek, Groq, Mistral)

**Bắt buộc sửa đồng bộ 2 file:**

1. `apps/api/src/features/projects/ai-providers/lib/provider-registry.ts` — `*_MODELS` + `defaultModel` + `docsUrl`
2. `apps/web/utils/ai-model/providers-data.ts` — `models[]` + `catalogSource` (cùng id/openclawId)

| Bước | Việc làm |
|------|----------|
| 1 | Research docs |
| 2 | Sửa **cả hai** file trên — copy cùng structure |
| 3 | Đối chiếu `openclaw-architecture.md` §5.3 |
| 4 | `pnpm --filter @aucobot/api build` (+ web nếu chạm `providers-data.ts`) |

**Smoke test:** Mọi foundation provider đều gọi API thật khi test key:

| Provider | Adapter | Model test |
|----------|---------|------------|
| OpenAI | `adapters/openai/openai-test-key.ts` | `gpt-5.4-mini` |
| Gemini | `adapters/gemini/gemini-test-key.ts` | `gemini-3.5-flash` |
| Anthropic | `adapters/anthropic/anthropic-test-key.ts` | `claude-haiku-4-5` |
| DeepSeek | `openAiCompatTest` → `openai-compat-test-key.ts` | `deepseek-v4-flash` |
| Groq | `openAiCompatTest` → `openai-compat-test-key.ts` | `llama-3.3-70b-versatile` |
| Mistral | `openAiCompatTest` → `openai-compat-test-key.ts` | `mistral-small-latest` |

Routing: `lib/provider-key-test.ts` → `runProviderKeyTest()`.

---

## 3. OpenAI

### 3.1 Nguồn tra cứu

| Nguồn | URL |
|-------|-----|
| **Canonical** | https://developers.openai.com/api/docs/models |
| Cross-check | https://platform.openai.com/docs/models |
| API list | https://platform.openai.com/docs/api-reference/models |
| OpenClaw | `openclaw-architecture.md` §5.3 |

### 3.2 File phụ thuộc

| File | Bắt buộc |
|------|----------|
| `packages/shared/src/models/openai-models.ts` | ✅ SSOT |
| `packages/shared/src/models/openai-models.types.ts` | Khi thêm field |
| `packages/shared/src/index.ts` | Export mới (nếu có) |
| `apps/api/.../adapters/openai/openai-test-key.ts` | Khi đổi model test (`gpt-5.4-mini`) |
| `apps/api/.../adapters/openai/openai-test-key.spec.ts` | Khớp test key |
| `provider-registry.ts` | Tự sync — chỉ sửa metadata |
| `providers-data.ts` | Tự sync — kiểm tra `catalogSource` |

**Skill editor:** `skillAiEditor: true` → hiện trong `OPENAI_SKILL_AI_EDITOR_MODELS`.

### 3.3 Grep

```bash
rg "gpt-5\.|OPENAI_DEFAULT|OPENAI_CHAT_MODELS" aucobot --glob "*.{ts,tsx}"
```

### 3.4 Template entry

```ts
{
  id: 'gpt-5.x',
  name: 'GPT-5.x',
  openclawId: 'openai/gpt-5.x',
  tier: 'stable',
  description: '...',
  recommended: false,
  skillAiEditor: true,
}
```

---

## 4. Google Gemini

### 4.1 Nguồn tra cứu

| Nguồn | URL |
|-------|-----|
| **Canonical** | https://ai.google.dev/gemini-api/docs/models |
| Deprecations | https://ai.google.dev/gemini-api/docs/deprecations |
| OpenClaw prefix | `google` (`GEMINI_OPENCLAW_PROVIDER`) |

### 4.2 File phụ thuộc

| File | Bắt buộc |
|------|----------|
| `packages/shared/src/models/gemini-models.ts` | ✅ SSOT |
| `packages/shared/src/models/gemini-models.types.ts` | Khi thêm field |
| `GEMINI_DEFAULT_OPENCLAW_MODEL` | Default SaaS (hiện `gemini-3.5-flash`) |
| `GEMINI_SKILL_AI_EDITOR_MODEL_IDS` | 3–4 model 3.x cho skill editor |
| `apps/api/.../adapters/gemini/gemini-test-key.ts` | Model smoke test (sync default) |
| `apps/api/.../adapters/gemini/gemini-test-key.spec.ts` | Khớp test key |
| `project-model-catalog.ts` | Tự import `GEMINI_CHAT_MODELS` |

### 4.3 Lọc catalog

Thêm: `generateContent` chat/agent.  
Không thêm: TTS, Live, image (Nano Banana), video (Veo), embedding, robotics.

### 4.4 Grep

```bash
rg "gemini-|GEMINI_DEFAULT|GEMINI_CHAT_MODELS" aucobot --glob "*.{ts,tsx}"
```

---

## 5. Anthropic (Claude)

### 5.1 Nguồn tra cứu

| Nguồn | URL |
|-------|-----|
| **Models overview** | https://docs.anthropic.com/en/docs/about-claude/models |
| Model IDs | https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions |
| Deprecations | https://platform.claude.com/docs/en/about-claude/model-deprecations |
| OpenClaw prefix | `anthropic` |

### 5.2 File phụ thuộc (Pattern B — sửa cả hai)

| File | Vị trí sửa |
|------|------------|
| `provider-registry.ts` | `ANTHROPIC_MODELS`, `defaultModel: 'anthropic/claude-sonnet-4-6'` |
| `providers-data.ts` | `id: 'anthropic'` → `models[]`, `catalogSource` |
| `adapters/anthropic/anthropic-test-key.ts` | Smoke test (`claude-haiku-4-5`) |
| `adapters/anthropic/anthropic-test-key.spec.ts` | Unit test |

### 5.3 Quy tắc ID (4.6+)

- Format: `claude-{name}-{major}-{minor}` (dateless, pinned snapshot)
- Ví dụ API: `claude-sonnet-4-6`, `claude-opus-4-8`, `claude-haiku-4-5`
- **Đã retired:** `claude-haiku-3-5`, `claude-3-5-sonnet-*` — không thêm lại

### 5.4 Grep

```bash
rg "claude-|ANTHROPIC_MODELS|anthropic/claude" aucobot --glob "*.{ts,tsx}"
```

---

## 6. DeepSeek

### 6.1 Nguồn tra cứu

| Nguồn | URL |
|-------|-----|
| **Canonical** | https://api-docs.deepseek.com/ |
| V4 release | https://api-docs.deepseek.com/news/news260424 |
| OpenClaw prefix | `deepseek` |

### 6.2 File phụ thuộc (Pattern B)

| File | Vị trí sửa |
|------|------------|
| `provider-registry.ts` | `DEEPSEEK_MODELS`, `defaultModel`, `openAiCompatTest` |
| `providers-data.ts` | `id: 'deepseek'` → `models[]`, `catalogSource` |

### 6.3 Model API hiện tại

- `deepseek-v4-pro`, `deepseek-v4-flash` (chính)
- Legacy `deepseek-chat` / `deepseek-reasoner` → ngừng 24/07/2026 — **không thêm vào catalog**

### 6.4 Grep

```bash
rg "deepseek-|DEEPSEEK_MODELS|deepseek/" aucobot --glob "*.{ts,tsx}"
```

---

## 7. Groq

### 7.1 Nguồn tra cứu

| Nguồn | URL |
|-------|-----|
| **Canonical** | https://console.groq.com/docs/models |
| Changelog | https://console.groq.com/docs/changelog |
| List API | `GET https://api.groq.com/openai/v1/models` |
| OpenClaw prefix | `groq` |

### 7.2 File phụ thuộc (Pattern B)

| File | Vị trí sửa |
|------|------------|
| `provider-registry.ts` | `GROQ_MODELS`, `defaultModel`, `openAiCompatTest` |
| `providers-data.ts` | `id: 'groq'` → `models[]`, `catalogSource` |

### 7.3 Lưu ý

- `openclawId` dùng **đúng Groq model id** (ví dụ `groq/llama-3.3-70b-versatile`)
- **Đã gỡ bởi Groq:** `mixtral-8x7b-32768` — không thêm lại
- Chỉ catalog production chat; bỏ qua guard/moderation-only models

### 7.4 Grep

```bash
rg "GROQ_MODELS|groq/|llama-3" aucobot --glob "*.{ts,tsx}"
```

---

## 8. Mistral

### 8.1 Nguồn tra cứu

| Nguồn | URL |
|-------|-----|
| **Canonical** | https://docs.mistral.ai/getting-started/models |
| Changelog | https://docs.mistral.ai/resources/changelogs |
| OpenClaw prefix | `mistral` |

### 8.2 File phụ thuộc (Pattern B)

| File | Vị trí sửa |
|------|------------|
| `provider-registry.ts` | `MISTRAL_MODELS`, `defaultModel`, `openAiCompatTest` |
| `providers-data.ts` | `id: 'mistral'` → `models[]`, `catalogSource` |

### 8.3 Quy tắc ID

- Catalog dùng alias `*-latest` (ví dụ `mistral-large-latest`, `codestral-latest`)
- OpenClaw: `mistral/mistral-large-latest` (khớp `openclaw-architecture.md`)
- Không thêm: OCR, Voxtral TTS, moderation-only

### 8.4 Grep

```bash
rg "MISTRAL_MODELS|mistral/|codestral" aucobot --glob "*.{ts,tsx}"
```

---

## 9. Ma trận file chung (mọi foundation)

| File | OpenAI | Gemini | Anthropic | DeepSeek | Groq | Mistral |
|------|:------:|:------:|:---------:|:--------:|:----:|:-------:|
| `packages/shared/*-models.ts` | ✅ | ✅ | — | — | — | — |
| `provider-registry.ts` | auto | auto | ✅ | ✅ | ✅ | ✅ |
| `providers-data.ts` | auto | auto | ✅ | ✅ | ✅ | ✅ |
| `*-test-key.ts` | ✅ | ✅ | ✅ | via `openAiCompatTest` | via `openAiCompatTest` | via `openAiCompatTest` |
| `project-model-catalog.ts` | auto | auto | auto | auto | auto | auto |
| `list-editor-provider-options.ts` | ✅ | ✅ | — | — | — | — |

---

## 10. Checklist agent — cập nhật 1 provider

```text
Provider: ___________
□ Research docs (mục 3–8 tương ứng)
□ Xác nhận openclawId với openclaw-architecture.md §5.3
□ Pattern A → sửa shared + build shared
□ Pattern B → sửa provider-registry.ts VÀ providers-data.ts (đối chiếu từng model)
□ Cập nhật defaultModel / recommended
□ Cập nhật test-key adapter + spec (chỉ OpenAI/Gemini)
□ rg model id cũ trong repo
□ pnpm --filter @aucobot/shared build (nếu Pattern A)
□ pnpm --filter @aucobot/api build
□ Test UI: AI Model → provider → catalog + test connection
□ Báo user: project cũ giữ model đã lưu
```

### Checklist — cập nhật cả 6 foundation

```text
□ OpenAI    — shared/openai-models.ts + test-key
□ Gemini    — shared/gemini-models.ts + test-key
□ Anthropic — registry + providers-data (đồng bộ)
□ DeepSeek  — registry + providers-data (đồng bộ)
□ Groq      — registry + providers-data (đồng bộ)
□ Mistral   — registry + providers-data (đồng bộ)
□ Verify build api (+ shared nếu cần)
```

---

## 11. Verify

```bash
cd aucobot
pnpm --filter @aucobot/shared build    # OpenAI hoặc Gemini thay đổi
pnpm --filter @aucobot/api build
pnpm --filter @aucobot/web build       # nếu chạm providers-data.ts
```

Test tay (có API key):

1. **AI Model** → từng foundation card → model list đúng
2. **Test connection** — OpenAI/Gemini gọi API thật
3. **Chat** — chọn model mới
4. **Skill editor** — OpenAI/Gemini dropdown (nếu có `skillAiEditor` / `GEMINI_SKILL_AI_EDITOR_*`)

---

## 12. Anti-patterns

- Pattern B: chỉ sửa `providers-data.ts` mà quên `provider-registry.ts` (hoặc ngược lại).
- Hardcode model list trong React component.
- `openclawId` không khớp gateway (`provider/model`).
- Thêm npm dependency chỉ để fetch catalog — catalog static, cập nhật thủ công.
- Tạo markdown mới ngoài `.agent/` trừ khi user yêu cầu.

---

## 13. AI Provider proxy (ngoài foundation)

OpenRouter, Together, Vercel AI Gateway, Kilo — chỉ cập nhật `starterModels` trong `provider-registry.ts` khi cần. User tự thêm model qua UI.
