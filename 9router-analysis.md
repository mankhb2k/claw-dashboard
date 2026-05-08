# Phân Tích 9Router — Cơ Chế Xoay Tài Khoản AI & Khả Năng Áp Dụng Vào OpenClaw SaaS

> **Mục tiêu tài liệu:** Hiểu rõ cơ chế proxy và xoay tài khoản agent AI của 9router, đánh giá chi phí tài nguyên, và đưa ra phương án áp dụng phù hợp vào kiến trúc Container-per-user của OpenClaw SaaS.

---

## 1. Tổng Quan Kiến Trúc 9Router

9Router là một **AI Proxy Router** chạy local (hoặc self-hosted), hoạt động như một tầng trung gian giữa các AI Client (Cursor, Claude, Copilot...) và các AI Provider (Gemini, OpenAI, Anthropic...).

### Hai mode hoạt động chính:

```
Mode 1: API Proxy (OpenAI-compatible endpoint)
Client  ──►  9Router (port 20128)  ──►  Provider API
             /v1/chat/completions        (Gemini, OpenAI...)

Mode 2: MITM Proxy (Man-in-the-Middle)
Client  ──►  MITM Server (port 443)  ──►  Provider
             Certificate intercept        (Copilot, Cursor...)
             Chặn HTTPS, chèn token khác
```

---

## 2. Cơ Chế Xoay Tài Khoản (Account Rotation)

Toàn bộ logic xoay tài khoản nằm trong file `src/sse/services/auth.js`, hàm `getProviderCredentials()`.

### 2.1 Cấu trúc dữ liệu một tài khoản

```js
{
  id: "uuid-...",
  provider: "gemini",         // tên provider
  authType: "oauth" | "apikey",
  name: "Account 1",
  email: "user@gmail.com",
  priority: 1,                // thứ tự ưu tiên (số nhỏ = ưu tiên cao hơn)
  isActive: true,
  lastUsedAt: "2026-05-08T...",
  consecutiveUseCount: 2,     // đã dùng liên tiếp bao nhiêu lần
  testStatus: "active" | "unavailable",
  lastError: "Rate limit exceeded",
  lastErrorAt: "...",
  
  // Per-model lock (không khóa cả tài khoản, chỉ khóa từng model)
  "modelLock_gemini-1.5-pro": "2026-05-08T10:30:00Z",  // unlock lúc này
  "modelLock_gemini-2.0-flash": null,                   // không bị lock
}
```

### 2.2 Hai chiến lược lựa chọn tài khoản

#### Strategy 1: `fill-first` (mặc định)
```
→ Luôn chọn tài khoản priority = 1 (cao nhất)
→ Chỉ fallback sang tài khoản khác khi tài khoản 1 bị error/lock
→ Giống như "máy chủ chính + máy chủ dự phòng"
→ Phù hợp: ít tài khoản, muốn tối đa hóa một tài khoản premium
```

#### Strategy 2: `round-robin` (tùy chọn)
```
→ Xoay vòng đều giữa các tài khoản
→ Có "sticky limit" N: dùng 1 tài khoản tối đa N lần liên tiếp rồi chuyển
→ Phù hợp: nhiều tài khoản free tier, muốn trải đều rate limit
```

**Thuật toán Round-Robin chi tiết:**

```
1. Sort tất cả tài khoản theo lastUsedAt (mới nhất trước)
2. current = tài khoản được dùng gần đây nhất

3. IF current.consecutiveUseCount < stickyLimit:
   → Tiếp tục dùng current
   → consecutiveUseCount += 1

4. ELSE (đã đủ sticky limit):
   → Sort theo lastUsedAt (cũ nhất trước)
   → Chọn tài khoản LÂU NHẤT chưa dùng
   → Reset consecutiveUseCount = 1
```

### 2.3 Cơ chế Rate Limit & Auto-Recovery

**Khi request lỗi (429, 401, 5xx):**
```
markAccountUnavailable(connectionId, status, errorText, model) {
  1. Tính thời gian cooldown dựa trên mã lỗi:
     - 429: backoff tăng dần (1min → 5min → 15min...)
     - 401: lock account-level (cả tài khoản hỏng)
     - 5xx: lock ngắn hơn
  
  2. Ghi vào DB:
     modelLock_{model} = Date.now() + cooldownMs
     testStatus = "unavailable"
     lastError = errorText
  
  3. Lần request tiếp theo: tài khoản này bị BỎ QUA
     cho model đó, nhưng vẫn dùng được cho model khác!
}
```

**Khi request thành công:**
```
clearAccountError(connectionId, model) {
  1. Xóa modelLock_{model} khỏi DB
  2. Lazy-clean các lock đã hết hạn
  3. Nếu không còn lock nào → reset testStatus = "active"
  
  → Tài khoản tự động phục hồi, không cần can thiệp thủ công
}
```

**Điểm đặc biệt — Per-Model Lock:**
```
Tài khoản A bị 429 với "gemini-1.5-pro":
  ✗ modelLock_gemini-1.5-pro = locked until 10:30
  ✓ modelLock_gemini-2.0-flash = null (vẫn dùng được!)

→ Hệ thống không "giết" cả tài khoản chỉ vì 1 model bị limit
```

### 2.4 Mutex chống Race Condition

```js
// Quan trọng: nhiều request đồng thời phải được xử lý tuần tự
// để không bị chọn cùng 1 tài khoản 2 lần
let selectionMutex = Promise.resolve();

async function getProviderCredentials(...) {
  const currentMutex = selectionMutex;
  let resolveMutex;
  selectionMutex = new Promise(resolve => { resolveMutex = resolve; });
  
  try {
    await currentMutex; // Chờ request trước xử lý xong
    // ... logic chọn tài khoản ...
  } finally {
    resolveMutex(); // Nhả mutex cho request tiếp theo
  }
}
```

### 2.5 Combos (Pool đa-provider)

Ngoài xoay trong 1 provider, 9router còn hỗ trợ **Combo** — pool kết hợp nhiều provider khác nhau:

```
Combo "my-llm-pool":
  - gemini/gemini-2.0-flash  (tài khoản Google)
  - openai/gpt-4o-mini       (API key OpenAI)
  - anthropic/claude-haiku   (API key Anthropic)

Strategy: fallback → Thử Gemini trước, nếu lỗi thử OpenAI, rồi Claude
         round-robin → Xoay vòng 3 provider
```

---

## 3. Kiến Trúc MITM Proxy (Dành Cho OAuth Tools)

Đây là phần phức tạp nhất: dùng **Man-in-the-Middle** để chặn HTTPS của các AI Client (Cursor, Copilot) và thay token khác vào.

```
Cursor IDE ──► MITM Server (port 443, tự cấp cert)
              ↓
              Đọc request: "Ai gọi API nào?"
              ↓  
              Gọi getProviderCredentials() → Lấy token tài khoản phù hợp
              ↓
              Forward request với token mới tới provider thật
```

**Yêu cầu kỹ thuật:**
- Cài Root CA certificate vào OS trust store (yêu cầu `sudo`/admin)
- Sửa `/etc/hosts` để redirect `api.githubcopilot.com` → `127.0.0.1`
- Chạy HTTPS server trên port 443 (cần root)

> **Phần MITM này KHÔNG phù hợp cho SaaS multi-tenant.** Nó được thiết kế cho Desktop App cá nhân.

---

## 4. Chi Phí Tài Nguyên Khi Chạy 9Router

Dựa trên codebase, đây là ước tính tài nguyên khi chạy 9Router:

### 4.1 Tài nguyên cơ bản (không MITM)

| Thành phần | RAM | CPU | I/O |
|-----------|-----|-----|-----|
| Next.js App | ~80-120 MB | <1% idle | Thấp |
| DB (lowdb/JSON) | ~5-10 MB | Ghi file khi có request | Thấp |
| SSE Handler | ~10-20 MB per active stream | Trung bình khi streaming | Trung bình |
| **Tổng** | **~100-150 MB** | **<2% idle** | - |

### 4.2 Khi có MITM Server

| Thành phần | RAM | CPU | Ghi chú |
|-----------|-----|-----|---------|
| MITM Process | +30-50 MB | ~1-3% | Tiến trình Node riêng biệt |
| Certificate ops | Burst | Cao lúc khởi động | Sau đó idle |
| **Tổng với MITM** | **~150-200 MB** | **<5% idle** | - |

---

## 5. Phân Tích Khả Năng Áp Dụng Vào OpenClaw SaaS

### 5.1 Kiến Trúc Hiện Tại Của OpenClaw

```
Mỗi User = 1 Container (openclaw-worker)
           ↑
           Container chứa AI agent, chạy Skills
           Gọi AI API với key riêng của User
```

**Vấn đề đặt ra:** User chỉ có 1 API key → Dễ bị rate limit → Muốn xoay nhiều key/tài khoản

### 5.2 Hai Phương Án Tích Hợp

---

#### Phương Án A: Shared Proxy — 1 Router Cho Toàn Hệ Thống

```
                      ┌─────────────────────────────────┐
                      │       OpenClaw Backend           │
                      │   (Quản lý pool tài khoản AI)   │
                      └─────────────┬───────────────────┘
                                    │
                      ┌─────────────▼───────────────────┐
                      │     AI Account Rotation Service  │
                      │     (1 service dùng chung)       │
                      │                                  │
                      │  - Pool: [gemini_key1, key2...] │
                      │  - Strategy: round-robin         │
                      │  - Rate limit tracking           │
                      └────┬──────────┬─────────────────┘
                           │          │
              ┌────────────▼──┐  ┌────▼────────────┐
              │ Worker User A │  │ Worker User B   │
              └───────────────┘  └─────────────────┘
```

**Ưu điểm:**
- Triển khai 1 lần, dùng cho toàn bộ user
- Pool tài khoản AI tập trung → hiệu quả hơn
- Dễ monitor, dễ thêm/bớt tài khoản

**Nhược điểm:**
- User share chung pool → Nếu user A spam, ảnh hưởng user B
- Phức tạp về isolation & fairness
- Cần thiết kế per-user quota trên shared pool

**Phù hợp khi:** Pool tài khoản do **Admin OpenClaw** sở hữu (tài khoản hệ thống)

---

#### Phương Án B: Sidecar Proxy — Mỗi Container Có Router Riêng

```
┌─────────────────────────────────┐
│  Docker Container (User A)       │
│                                  │
│  ┌───────────────┐  ┌─────────┐ │
│  │ openclaw-     │  │ mini-   │ │
│  │ worker        │──│ router  │ │
│  │ (port 18789)  │  │(port    │ │
│  │               │  │ 3128)   │ │
│  └───────────────┘  └────┬────┘ │
│                           │      │
└───────────────────────────┼──────┘
                            │
                    AI Provider APIs
                 (Gemini, OpenAI, Claude...)
```

**Worker gọi AI qua router nội bộ:**
```
http://localhost:3128/v1/chat/completions
      ↓
mini-router chọn tài khoản → forward tới provider thật
```

**Ưu điểm:**
- Isolation hoàn toàn: User A có pool riêng, không ảnh hưởng User B
- User có thể tự thêm API key của mình vào pool
- Không cần lo fairness giữa các user

**Nhược điểm:**
- RAM tăng thêm ~80-120 MB mỗi container
- Với VPS 4GB RAM đang chạy N containers, mỗi container thêm ~100MB là vấn đề
- Overhead quản lý (nhiều tiến trình hơn)

**Phù hợp khi:** User tự mang API key cá nhân của họ vào

---

### 5.3 Đánh Giá Khả Thi: Chạy Sidecar Trong Container Của 1 User

> **Câu hỏi cụ thể:** Với 1 container, 1 user — chạy thêm 1 proxy xoay tài khoản như 9router có khả thi không?

**Kết luận: Khả thi về kỹ thuật, nhưng cần đánh đổi.**

#### Tài nguyên thực tế:

```
Hiện tại (1 container):
  openclaw-worker: ~150-200 MB RAM

Nếu thêm sidecar router:
  openclaw-worker: ~150-200 MB
  mini-router:     ~80-100 MB  (phiên bản stripped-down của 9router)
  ─────────────────────────────
  Tổng:            ~230-300 MB per container
```

**Với VPS 4GB:**
- Hiện tại: chạy được ~15-20 container
- Thêm sidecar: chỉ còn ~10-13 container
- Giảm ~30% user capacity trên cùng một máy

#### Có cần dùng full 9Router không?

**Không cần.** 9Router có rất nhiều tính năng mà OpenClaw không cần:
- ❌ MITM proxy (dành cho desktop app)
- ❌ Dashboard UI (Next.js ~80MB)
- ❌ DNS/Certificate management
- ❌ Lowdb (cần thay bằng in-memory hoặc dùng DB của backend)

**Chỉ cần xây phần core:**
- ✅ Account selection logic (fill-first / round-robin)
- ✅ Rate limit tracking (per-model lock)
- ✅ OpenAI-compatible HTTP proxy endpoint
- ✅ Mutex for concurrent requests

Phần core này chỉ tốn **~20-30 MB RAM**, không phải ~100 MB.

---

## 6. Đề Xuất Kiến Trúc Cho OpenClaw SaaS

### Giai Đoạn 1 (Đơn Giản Nhất): Backend-Side Rotation

```
Worker ──► Backend API ──► Rotation Service ──► AI Provider
                              ↓
                         (Tập trung tại backend,
                          không cần sidecar)
```

**Implement trong backend hiện tại:**
- Tạo bảng `ai_accounts` trong PostgreSQL: lưu API keys của user
- Tạo service `AccountRotator` với logic fill-first / round-robin
- Khi worker cần gọi AI, gọi backend `/api/credentials` → nhận key phù hợp
- Backend track rate limit, tự động blacklist key bị lỗi

**Chi phí tài nguyên:** Gần như 0 (chỉ thêm vài bảng DB và vài HTTP handler)

---

### Giai Đoạn 2 (Nâng Cao): In-Container Micro Proxy

Khi user có nhiều key và cần giảm latency (không muốn round-trip tới backend):

```typescript
// ~100 dòng code, chạy trong worker process như 1 module
class MicroAccountRotator {
  private accounts: AIAccount[]
  private mutex = new Mutex()
  
  async getCredentials(model: string): Promise<Credential> {
    return this.mutex.run(() => this.selectAccount(model))
  }
  
  private selectAccount(model: string): Credential {
    // 1. Filter accounts bị lock với model này
    // 2. Áp dụng strategy (fill-first / round-robin)
    // 3. Return credential
  }
  
  async markRateLimited(accountId: string, model: string, cooldownMs: number) {
    // Ghi lock, tự động unlock sau cooldownMs
  }
}
```

**Lợi ích:** Chạy trong process của worker → latency ~0ms, không cần sidecar riêng

---

### Giai Đoạn 3 (Full Scale): Dedicated Rotation Service

Khi hệ thống lớn (>100 user), xây một microservice riêng:

```
                 ┌────────────────────────────┐
                 │    AI Rotation Service      │
                 │    (Shared, centralized)    │
                 │                            │
                 │  POST /credentials         │
                 │  POST /mark-rate-limited   │
                 │  POST /clear-error         │
                 │                            │
                 │  Store: Redis (fast lock)  │
                 └────────────────────────────┘
                          ↑        ↑
                   Worker A    Worker B
```

---

## 7. Kết Luận & Khuyến Nghị

| Tiêu chí | 9Router Sidecar | Backend Rotation | In-Process Rotation |
|---------|----------------|-----------------|---------------------|
| RAM overhead | ~100 MB | ~0 MB | ~0 MB |
| Latency | +1-3ms | +20-50ms | ~0ms |
| Isolation per user | ✅ Hoàn toàn | ⚠️ Cần thiết kế | ✅ Hoàn toàn |
| Dễ implement | ❌ Phức tạp | ✅ Đơn giản | ✅ Trung bình |
| Scalability | ❌ Tốn RAM | ✅ Tốt | ✅ Tốt |
| Phù hợp OpenClaw | ❌ Không tối ưu | ✅ Giai đoạn 1 | ✅ Giai đoạn 2 |

### Khuyến Nghị Trực Tiếp:

1. **Ngắn hạn:** Implement `AccountRotator` ngay trong `backend/` của OpenClaw. Không cần sidecar. Chỉ cần thêm bảng DB và service logic ~200-300 dòng code.

2. **Khi worker cần gọi AI:** Worker → gọi `backend/api/ai/credentials` → lấy key → gọi provider. Backend chịu trách nhiệm tracking và rotation.

3. **Không nên fork 9Router làm sidecar** vì sẽ tốn ~100MB RAM mỗi container cho một thứ chỉ cần ~5MB logic thực sự.

4. **Tham khảo thuật toán** của 9router (fill-first, round-robin với sticky limit, per-model lock) là đủ — không cần copy nguyên code của họ.

---

*Tài liệu được viết dựa trên phân tích trực tiếp source code của 9router tại `d:\NextJS\openclaw-saas\9router\src\sse\services\auth.js` và `src\mitm\manager.js`.*
