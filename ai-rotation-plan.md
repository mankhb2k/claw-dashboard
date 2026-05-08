# OpenClaw AI Rotation Plan (Lean)

## Muc tieu

Xay lop tu dong xoay provider/credential cho tung user, de khi mot tai khoan het quota hoac bi rate limit thi he thong tu failover sang tai khoan khac. Khong dung kien truc cong kenh nhu full 9router.

## Pham vi

- Khong build MITM proxy
- Khong build dashboard phuc tap nhu 9router
- Chi build core rotation logic trong backend
- Ho tro truoc 2 provider chinh (de mo rong sau): OpenAI, Claude

## Kien truc tong quan

1. Worker/API nhan request AI
2. Goi `AccountRotatorService.selectCredential(userId, model, ...)`
3. Chon credential kha dung theo strategy
4. Goi provider
5. Thanh cong -> cap nhat usage + clear lock het han
6. That bai fallback duoc -> lock tam credential + retry voi credential khac
7. Het credential kha dung -> tra `retry_after` va ly do

## Data model de xuat (PostgreSQL)

### Bang `ai_connections`

- `id` (uuid, pk)
- `user_id` (uuid, index)
- `provider` (text) - vd: openai, claude, github
- `auth_type` (text) - oauth | apikey | cookie
- `access_token_enc` (text, nullable)
- `refresh_token_enc` (text, nullable)
- `api_key_enc` (text, nullable)
- `expires_at` (timestamptz, nullable)
- `is_active` (boolean, default true)
- `priority` (int, default 100)
- `last_used_at` (timestamptz, nullable)
- `consecutive_use_count` (int, default 0)
- `last_error` (text, nullable)
- `last_error_at` (timestamptz, nullable)
- `backoff_level` (int, default 0)
- `created_at`, `updated_at`

### Bang `ai_connection_locks`

- `id` (uuid, pk)
- `connection_id` (uuid, fk -> ai_connections.id, index)
- `scope_type` (text) - model | provider | global
- `scope_key` (text) - vd: claude-sonnet-4.6
- `locked_until` (timestamptz, index)
- `reason` (text)
- `error_code` (int, nullable)
- `created_at`, `updated_at`

### Bang `ai_usage_events` (optional)

- `id` (uuid, pk)
- `user_id`, `connection_id`
- `provider`, `model`
- `status_code`
- `latency_ms`
- `cost_estimate` (numeric)
- `created_at`

## Services can co (NestJS)

### `AiCredentialService`

- Doc/ghi secrets da ma hoa
- Decrypt token/key truoc khi goi provider
- Refresh OAuth token khi sap het han

### `AccountRotatorService`

- `selectCredential(userId, model, options)`
- Filter credential dang bi lock
- Strategy:
  - `fill-first`
  - `round-robin` + sticky limit
- Co co che tranh race condition khi nhieu request dong thoi

### `ProviderInvokerService`

- Goi API upstream theo provider
- Chuan hoa loi thanh nhom noi bo:
  - `RATE_LIMIT`
  - `UNAUTHORIZED`
  - `TRANSIENT`
  - `FATAL`

### `FallbackService`

- `markUnavailable(...)`: tao lock + backoff
- `clearError(...)`: clear lock het han khi request thanh cong

### `ModelRoutingService` (optional)

- Dinh nghia fallback chain theo model
- Vi du: `gpt-5.3-codex -> gpt-5-codex -> claude-sonnet`

## Rule fallback/backoff khuyen nghi

- `429`: lock per-model, backoff: 1m -> 5m -> 15m -> 30m
- `401`: lock provider ngan + trigger refresh token
- `403 quota exceeded`: lock lau hon (30-120m)
- `5xx timeout`: lock ngan (30s-2m), cho phep retry account khac
- Khi thanh cong: clear lock scope tuong ung, reset backoff neu khong con lock active

## API endpoints toi thieu

- `POST /api/ai/connections`
  - Them credential moi cho user
- `PATCH /api/ai/connections/:id`
  - Bat/tat, sua priority
- `POST /api/ai/connections/:id/oauth/refresh`
  - Manual refresh (fallback)
- `POST /api/ai/resolve-credential` (internal)
  - Worker xin credential phu hop
- `POST /api/ai/report-result` (internal)
  - Worker bao ket qua de cap nhat lock/backoff

## Pseudocode luong retry

```ts
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  const cred = await rotator.selectCredential(userId, model, { excludedIds });
  if (!cred) break;

  const result = await providerInvoker.call(cred, payload);

  if (result.ok) {
    await rotator.onSuccess(cred, model);
    return result;
  }

  const decision = await rotator.onError(cred, model, result.error);
  excludedIds.add(cred.id);
  if (!decision.shouldFallback) throw result.error;
}

throw new Error("All providers unavailable");
```

## Ke hoach trien khai 1 tuan (lean)

### Day 1-2

- Tao migration cho `ai_connections`, `ai_connection_locks`
- CRUD co ban cho connections
- Ma hoa/decrypt secret

### Day 3

- Implement `AccountRotatorService`
- Implement lock/backoff core

### Day 4

- Tich hop 2 provider dau tien (OpenAI, Claude)
- Chuan hoa mapping loi

### Day 5

- Retry/fallback end-to-end
- Bo sung logs va metrics co ban

### Day 6-7

- Test concurrency/race condition
- Test canh lock het han, recover, retry-after
- Hardening va docs

## Test checklist

- Chon dung credential theo `fill-first`
- Chuyen dung credential theo `round-robin`
- 429 tren model A khong chan model B (neu lock theo model)
- 401 thi refresh token hoac fallback dung
- Het tat ca credential thi tra retry-after co nghia
- Nhieu request dong thoi khong chon trung sai logic

## Out of scope (de sau)

- MITM/proxy desktop tools
- Combo pool giua nhieu user
- Dashboard usage nang
- Multi-region provider routing

## Ket luan

Huong di de nhat va dung nhu cau hien tai la xay 1 rotation layer nho trong backend (TypeScript + DB), tap trung vao:

- credential selection
- lock/backoff
- retry/fallback
- token refresh

Nhu vay da du de tu dong chuyen provider cho user ma khong can he thong cong kenh.
