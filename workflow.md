# OpenClaw SaaS — Workflow & Tổng quan Kế hoạch

> **Ngày viết:** 2026-04-17  
> **MVP scope:** Free tier · 1 container/user · idle-shutdown · auto-wake

---

## 1. Vấn đề cần giải quyết

Người dùng muốn chạy bot nhắn tin (Telegram, Zalo, WhatsApp, Discord, Slack, LINE) với AI tự động trả lời — không cần quản lý server. OpenClaw SaaS cung cấp mỗi user **1 container riêng biệt**, isolated, persistent state qua Docker Volume.

---

## 2. Kiến trúc theo giai đoạn scale

### Giai đoạn 1 — MVP (2 VPS, ≤ ~500 users đăng ký)

**2-tier architecture: Worker (management) + Heavy (compute)**

```
┌─────────────────────────────────────────────────┐
│  LAYER 1 — CONTROL  (Railway)                   │
│  NestJS/Fastify API + PostgreSQL                │
│  Redis managed (Railway) ← BullMQ broker        │
└──────────────────┬──────────────────────────────┘
                   │ BullMQ + REST API
        ┌──────────┴──────────┐
        │                     │
┌───────▼──────────┐  ┌──────▼─────────────┐
│ VPS WORKER       │  │ VPS HEAVY (NEW)    │
│ (Mgmt Plane)     │  │ (Compute Plane)    │
│                  │  │                    │
│ openclaw-worker  │  │ openclaw-heavy     │
│ Traefik v3       │  │                    │
│ User containers  │  │ ├─ FFmpeg          │
│ ├─ 1GB/0.5vCPU   │  │ ├─ Playwright      │
│ ├─ 4GB SSD       │  │ ├─ TTS/STT         │
│ × 40-50 ctnr     │  │ └─ Job processor   │
│ /data/users/     │  │                    │
│ /250GB NVMe      │  │ /100GB SSD         │
│                  │  │                    │
│ Contabo 12vCPU   │  │ Contabo 12vCPU     │
│ 48GB RAM         │  │ 48GB RAM (CPU-only)
│ $40-50/mo        │  │ $40-50/mo          │
└──────────────────┘  └────────────────────┘
        │                     │
        └──────────┬──────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  CLOUDFLARE (DNS + CDN + DDoS)                  │
│  *.openclaw.ai  → VPS Worker IP                │
│  app.openclaw.ai → Cloudflare Pages             │
└─────────────────────────────────────────────────┘
```

**Why 2-tier?**
- ✅ Light user containers (0.5vCPU) can focus on chat/API
- ✅ Heavy tasks (FFmpeg, Playwright) run isolated on separate VPS
- ✅ Easy to scale independently: add more heavy VPS later
- ✅ Decoupled images = simpler updates (see ARCHITECTURE_DECOUPLING_STRATEGY.md)

### Giai đoạn 2 — Multi-VPS (≤ ~10,000 users)

```
┌─────────────────────────────────────────────────┐
│  LAYER 1 — CONTROL  (Railway)                   │
│  NestJS API · PostgreSQL                        │
│  + Scheduler: chọn VPS node có capacity        │
│  Redis managed (Railway) ← vẫn dùng            │
└─────────┬──────────────────────┬────────────────┘
          │                      │
┌─────────▼────────┐   ┌─────────▼────────┐
│  VPS #1          │   │  VPS #2          │   ...
│  Worker          │   │  Worker          │
│  Traefik         │   │  Traefik         │
│  Containers      │   │  Containers      │
│  /data/users/    │   │  /data/users/    │
└──────────────────┘   └──────────────────┘
```

### Giai đoạn 3 — High Scale (> 10,000 users)

```
Thêm: 1 VPS Redis riêng (Redis Sentinel 1 master + 2 replica)
Lý do: tách queue khỏi Railway dependency, latency ~1ms đến workers
Thay đổi: chỉ đổi REDIS_URL trong worker env → không refactor code
```

**Tại sao Railway Redis ổn cho giai đoạn 1 và 2:**
- Jobs của OpenClaw là container lifecycle (spawn/stop/wake) — mỗi job mất 5–30 giây
- Throughput thực tế: 10,000 users = < 200 lifecycle events/phút = không đến 4 jobs/giây
- Redis throughput limit: 100,000+ ops/giây → không bao giờ là bottleneck ở đây
- Latency ~50ms qua network: không quan trọng khi job bản thân mất 10 giây

### Giai đoạn 2 — Multi-VPS (≤ ~10,000 users)

```
Same 2-tier model, but:
├─ Worker: 3-4 instances (load balanced via Cloudflare)
└─ Heavy: 2-3 instances (pull from same Redis queue)
```

---

## 3. Version Management & Update Workflow

### Update Cycle (Manual, ~monthly)

```
Week 1: Monitor
  └─ git log origin/main (check upstream releases)
     # Spot: v2026.5.0 released

Week 2: Review
  └─ git diff v2026.4.5..v2026.5.0 (assess changes)
     # Decision: Include? Yes/No

Week 3: Build
  ├─ git checkout v2026.5.0 (or merge)
  ├─ ./build.sh 2026.5.0 (build both worker + heavy)
  └─ Test locally (quick smoke test)

Week 4: Deploy (Low-traffic window)
  ├─ ./deploy.sh 2026.5.0 \
  │    openclaw@vps-worker \
  │    openclaw@vps-heavy
  └─ Monitor 24h for issues
```

### Image Versioning

**2 separate Docker images:**

| Image | Purpose | Size | Update freq |
|---|---|---|---|
| `openclaw-worker:2026.5.0` | API gateway, job queue, user containers | ~400MB | Quarterly |
| `openclaw-heavy-worker:2026.5.0` | FFmpeg, Playwright, heavy jobs | ~800MB | Monthly |

**Both based on:** `.tmp-openclaw-upstream` (tracked, pinned version)

See detailed docs:
- **[ARCHITECTURE_DECOUPLING_STRATEGY.md](ARCHITECTURE_DECOUPLING_STRATEGY.md)** — Full version management
- **[HEAVY.md](heavy.md)** — Heavy VPS specifics

---

## 5. Tech Stack

| Layer | Công nghệ | Spec | Ghi chú |
|---|---|---|---|
| **Frontend** | Lit + Cloudflare Pages | Static | No build step |
| **API** | NestJS + Fastify | Railway | Module hóa, type-safe |
| **Auth** | Better-Auth | Railway | OAuth2, session, magic link |
| **Database** | PostgreSQL | Railway | ACID, transaction |
| **Queue** | BullMQ + Redis | Railway MVP | Async job dispatch |
| **Queue (Scale)** | BullMQ + Redis Sentinel | Dedicated VPS | Khi >10k users |
| **Proxy** | Traefik v3 | VPS Worker | Auto-discover, wildcard SSL |
| **User Containers** | Docker image | 1GB RAM / 0.5vCPU / 4GB SSD | OpenClaw gateway |
| **User Storage** | Docker Volume + NVMe | /data/users/ | SQLite, config, 4GB quota |
| **Heavy Tasks** | Separate VPS | VPS Heavy | FFmpeg, Playwright, async |
| **DNS/CDN** | Cloudflare | Global | Wildcard SSL, DDoS, cache |

---

## 4. Capacity Planning

```
VPS Contabo: 12 vCPU / 48GB RAM / 250GB NVMe

Reserved:
  OS + system:       ~1.0 GB
  Traefik:           ~100 MB
  openclaw-worker:   ~200 MB
  Buffer:            ~1.7 GB
  ──────────────────────────
  Available:         ~45 GB

Per container: 256MB RAM · 0.25 vCPU
Max đồng thời:  ~175 containers (lý thuyết)
Comfortable:     ~80 containers

Với idle-shutdown 10 phút:
  80 active / ~15% active rate = ~530 users đăng ký/VPS
  
Storage: 500 users × 100MB avg = 50GB → 250GB đủ cho MVP
```

---

## 5. Các Flow chính

### Flow 1 — Tạo Project (lần đầu)
```
User click "Create"
  → POST /api/projects
  → DB: project {status: creating}
  → BullMQ: enqueue "spawn" job
  → Worker: docker run openclaw-gateway \
      --memory=256m --cpus=0.25 \
      --label traefik.enable=true \
      --label traefik.http.routers.{userId}.rule=Host(`{sub}.openclaw.ai`)
  → Traefik: auto-detect container, cấp SSL
  → Health check pass
  → DB: {status: running, container_id, port}
  → Frontend nhận domain: {subdomain}.openclaw.ai
```

### Flow 2 — Request User (bình thường, container đang running)
```
User/Bot → {sub}.openclaw.ai
  → Cloudflare → VPS:443
  → Traefik match subdomain → Container
  → Gateway xử lý → response
```

### Flow 3 — Idle Shutdown
```
Cron mỗi 1 phút kiểm tra projects có status=running
  Nếu last_active_at < now() - 10 phút:
    → BullMQ: enqueue "stop" job
    → Worker: docker stop (SIGTERM → 10s → SIGKILL)
    → Volume giữ nguyên
    → DB: {status: stopped}
    → Traefik: container biến mất khỏi routing
```

### Flow 4 — Auto Wake

**MVP (Polling — đơn giản, dùng ngay):**
```
Container stopped, user truy cập dashboard
  → Frontend hiển thị nút "Khởi động"
  → User click → POST /api/projects/:id/start
  → DB: {status: starting}
  → BullMQ: enqueue "wake" job (priority cao)
  → Frontend poll GET /api/projects/:id/health mỗi 2s
  → Worker: docker start → health check pass
  → DB: {status: running}
  → Frontend tự reload → domain active
```

**Scale (Traefik Auto-Wake — transparent, không cần bấm nút):**
```
Request đến {sub}.openclaw.ai, container stopped
  → Traefik: không tìm thấy backend → route đến wake-proxy service
  → wake-proxy: extract userId từ Host header
  → wake-proxy: POST /api/internal/wake/{userId} → Control Plane
  → wake-proxy: trả HTML loading page (auto-refresh 3s)
  → Sau ~5s container healthy → Traefik route bình thường
  → Refresh tự động → request pass through
```

> **Khi nào chuyển từ MVP sang Scale wake:**  
> Khi user phàn nàn về trải nghiệm "phải bấm nút". Deploy `openclaw-wake-proxy` (service nhỏ ~50 dòng) lên VPS là xong.

---

## 6. Database Schema (tóm tắt)

```
PostgreSQL (Control Plane):
  users         — id, email, password_hash, plan_id, status
  accounts      — OAuth links (Better-Auth)
  sessions      — HttpOnly session (Better-Auth)
  projects      — id, user_id, subdomain, container_id, status,
                  last_active_at, vps_id (null = VPS #1, dùng cho multi-VPS)
  plans         — free/paid config (max_projects, ram_mb, idle_timeout)

Per-user container (SQLite):
  messages · tasks · connections (platform tokens, AES-256)
```

---

## 7. Auto Wake — Kế hoạch triển khai chi tiết

| Giai đoạn | Cơ chế | Effort | UX |
|---|---|---|---|
| MVP | Frontend polling sau khi user bấm "Start" | 2 giờ | Phải bấm nút, chờ ~5s |
| V2 | `openclaw-wake-proxy` + Traefik fallback | 1 ngày | Tự động, loading page |
| V3 (optional) | Pre-warm container trước khi idle timeout | 3 ngày | Zero cold start |

---

## 8. MVP Checklist

- [ ] Control Plane: Auth (đăng ký / đăng nhập / OAuth Google)
- [ ] Control Plane: POST /api/projects → spawn container
- [ ] Control Plane: Idle detection cron
- [ ] Control Plane: POST /api/projects/:id/start → wake
- [ ] Control Plane: GET /api/projects/:id/health
- [ ] Data Plane: Traefik + wildcard SSL Cloudflare DNS challenge
- [ ] Data Plane: openclaw-gateway image build + test
- [ ] Data Plane: Worker BullMQ consumer (spawn/stop/wake/destroy)
- [ ] Frontend: Login page
- [ ] Frontend: Dashboard (project card + status + start/stop)
- [ ] Frontend: Polling auto-wake flow
- [ ] Cloudflare: Wildcard A record *.openclaw.ai → VPS IP
- [ ] Monitoring: Netdata trên VPS + UptimeRobot ping check
