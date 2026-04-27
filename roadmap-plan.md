# OpenClaw SaaS — Roadmap & MVP Plan

> Updated: 2026-04-27
> Status: Phase 1 (MVP) — Railway backend deployed, VPS setup in progress
> Related docs: Architecture flow in `workflow.md`; billing and quota source of truth in `billing-plan.md`

## Document Role

- **Purpose:** Checklist và timeline triển khai.
- **Owns:** phase/sprint tasks, migration sequence, rollout order.
- **Does not own:** kiến trúc chi tiết (`workflow.md`) và billing policy (`billing-plan.md`).
- **Terminology note:** Dùng `project` làm đơn vị sản phẩm; runtime hiện tại map 1:1, tức **1 project = 1 container worker**.

---

## 🗺️ Phases Overview

| Phase | Scale | Infrastructure | Status |
|---|---|---|---|
| **Phase 1 — MVP** | ≤ 500 users | 1 VPS Worker + Railway | 🔄 In Progress |
| **Phase 2 — Multi-VPS** | ≤ 10,000 users | N VPS Workers + CF DNS API | 📋 Planned |
| **Phase 3 — High Scale** | > 10,000 users | CF Workers + Redis Sentinel | 🔮 Future |

---

## Phase 1 — MVP Checklist

### ✅ Done
- [x] Backend API (NestJS + Prisma + PostgreSQL) deployed on Railway
- [x] Redis managed on Railway
- [x] Docker images: `mankhb2k/clawsaas-be`, `mankhb2k/clawsaas-worker`, `mankhb2k/clawsaas-vps-worker`
- [x] deploy.ps1 scripts for all services
- [x] vps-worker docker-compose.yml (Traefik + vps-worker)
- [x] vps-worker .env.example documented

### 🔄 In Progress
- [ ] Build & push `mankhb2k/clawsaas-worker` image (user gateway)
- [ ] Build & push `mankhb2k/clawsaas-vps-worker` image
- [ ] Setup VPS Contabo: install Docker, docker-compose
- [ ] Deploy docker-compose on VPS Worker

### 📋 Control Plane (Backend)
- [ ] `POST /api/projects` → enqueue spawn job
- [ ] `GET /api/projects/:id` → get project status
- [ ] `GET /api/projects/:id/health` → health check polling
- [ ] `POST /api/projects/:id/start` → manual wake
- [ ] `PUT /api/internal/status` → VPS Worker callback
- [ ] Idle detection cron (scan every 1 min, dùng `plan.idleTimeoutMin`: Free 10m, Pro 60m)
- [ ] `vps_nodes` table seeded (vps-1 entry)
- [ ] `projects` table with `subdomain`, `vps_id`, `container_name`, `status`

### 📋 VPS Worker (Container Orchestrator)
- [ ] BullMQ consumer: spawn / wake / stop / destroy
- [ ] Docker SDK: createContainer with Traefik labels
- [ ] `POST /api/internal/status` callback to Control Plane
- [ ] Health check endpoint `GET /health`
- [ ] `/data/users` directory created on host with correct permissions

### 📋 Traefik
- [ ] Wildcard DNS: `*.openclaw.ai → VPS-1 IP` (Cloudflare A record)
- [ ] Traefik DNS challenge with Cloudflare API token
- [ ] Auto-SSL `*.openclaw.ai` via Let's Encrypt
- [ ] Container routing: `{subdomain}.openclaw.ai → container :3000`

### 📋 Frontend (Cloudflare Pages)
- [ ] Login / Register page
- [ ] Dashboard: project card (status, subdomain, start/stop button)
- [ ] Polling: `GET /health` every 2s when status = starting
- [ ] Auto-redirect when container healthy

### 📋 Subdomain Strategy (MVP)
- Single wildcard DNS: `*.openclaw.ai → VPS-1 IP`
- Subdomain format: `{username}-{random4}.openclaw.ai`
- Check UNIQUE in DB before assign
- No Cloudflare API needed in MVP

### 📋 Monitoring (MVP)
- [ ] SSH tunnel alias for Portainer (`portainer-worker`)
- [ ] Portainer deployed on VPS Worker (127.0.0.1:9000 only)
- [ ] UptimeRobot ping: `api.openclaw.ai/health`, `vps-worker-ip:3002/health`

---

## Phase 2 — Multi-VPS (≤ 10,000 users)

> Trigger: VPS-1 capacity > 70% (~35 active containers) OR latency issues

### Architecture Change
```
BEFORE (MVP):
  *.openclaw.ai → A → VPS-1 IP (wildcard)

AFTER (Multi-VPS):
  abc.openclaw.ai → A → VPS-1 IP  (per-project, created via CF API)
  xyz.openclaw.ai → A → VPS-2 IP  (per-project, created via CF API)
```

### What to build

#### Control Plane
- [ ] `vps_nodes` table with `ip`, `capacity`, `active_count`
- [ ] VPS selector: `ORDER BY active_count ASC` (least loaded)
- [ ] `projects.dns_record_id` field (Cloudflare record ID for cleanup)
- [ ] `CloudflareService.createSubdomain(subdomain, vpsIp)` → saves record ID
- [ ] `CloudflareService.deleteSubdomain(recordId)` → on project destroy
- [ ] Per-VPS BullMQ queues: `jobs:vps-1`, `jobs:vps-2`, ...
- [ ] VPS health monitoring: ping `/health` every 30s, mark offline if fails

#### VPS Worker
- [ ] Each VPS subscribes only to its own queue: `jobs:{VPS_NODE_ID}`
- [ ] `VPS_NODE_ID` env var set per VPS in `.env`

#### Cloudflare
- [ ] Remove wildcard A record `*.openclaw.ai` (or keep as fallback page)
- [ ] API Token with `Edit zone DNS` permission (already exists from Traefik)
- [ ] New env vars: `CF_ZONE_ID`, `CF_API_TOKEN` in Backend

#### Database Migration
```sql
ALTER TABLE projects ADD COLUMN dns_record_id TEXT;
ALTER TABLE projects ADD COLUMN vps_id TEXT REFERENCES vps_nodes(id);

CREATE TABLE vps_nodes (
  id           TEXT PRIMARY KEY,
  ip           TEXT NOT NULL,
  region       TEXT,
  capacity     INT DEFAULT 50,
  active_count INT DEFAULT 0,
  status       TEXT DEFAULT 'active'
);

INSERT INTO vps_nodes VALUES ('vps-1', 'VPS-1-IP', 'sg', 50, 0, 'active');
```

### Deployment checklist
- [ ] Add VPS-2 to `vps_nodes` table
- [ ] Deploy docker-compose on VPS-2
- [ ] Set `VPS_NODE_ID=vps-2` in VPS-2 `.env`
- [ ] Update Cloudflare: remove wildcard, rely on per-record DNS
- [ ] Test: create project → DNS record created → routes to correct VPS

---

## Phase 3 — High Scale (> 10,000 users)

> Trigger: > 5 VPS workers OR need to migrate containers between VPS without DNS TTL delays

### Architecture Change
```
BEFORE (Multi-VPS):
  abc.openclaw.ai → CF DNS → VPS-1 IP → Traefik → Container
  (DNS record per project, TTL 1-5 min)

AFTER (High Scale):
  *.openclaw.ai → Cloudflare Workers → KV lookup: {subdomain → vps-id}
                → Cloudflare Tunnel (vps-1) → Traefik → Container
```

### What to build

#### Cloudflare Workers + KV
- CF Worker script: extract subdomain from Host header, lookup KV store
- CF KV namespace: `{ "abc": "vps-1", "xyz": "vps-2" }`
- Control Plane updates KV via CF API on spawn/destroy
- Sub-millisecond routing, no DNS propagation delay

#### Cloudflare Tunnels (one per VPS)
```bash
# On each VPS:
cloudflared tunnel create openclaw-vps-1
# Configure ingress → traefik:80
```
- No exposed ports on VPS (more secure)
- Zero-downtime container migration between VPS

#### Redis Sentinel (Dedicated VPS)
```
1 Master + 2 Replicas
~$20/mo dedicated VPS
```
- Replace Railway Redis
- `REDIS_URL=redis-sentinel://sentinel1,sentinel2,sentinel3/mymaster`
- ~1ms latency vs ~50ms Railway
- Required when BullMQ throughput > 10,000 jobs/hour

#### Multi-region (Optional)
```
VPS Workers in: SG, EU, US-East
Cloudflare geo-routing: user → nearest VPS region
```

### Migration path from Phase 2
1. Deploy Cloudflare Tunnel on all VPS (parallel with existing)
2. Deploy CF Worker script (routes via KV, fallback to DNS)
3. Populate KV from existing projects table
4. Switch DNS: `*.openclaw.ai → CF Worker` (remove per-project A records)
5. Remove Cloudflare DNS API dependency from Control Plane

---

## Billing & Resource Model

Để tránh trùng lặp tài liệu, phần này được tách riêng:

- Xem policy đầy đủ tại `billing-plan.md`
- Workflow kỹ thuật liên quan xem `workflow.md`

Roadmap này chỉ giữ checklist triển khai theo sprint/phase.

---

## Feature Roadmap

> Scope note:
> - **MVP Core:** Sprint 1
> - **Post-MVP / mở rộng:** Sprint 2+

### Sprint 1 — MVP Core (Now)
- Auth: email/password + Google OAuth
- Project create → spawn container (validate maxProjects + maxConcurrentRunning từ user plan)
- Project start/stop (manual)
- Idle shutdown (10 min free, 60 min pro — từ plan.idleTimeoutMin)
- Dashboard: status, start button, domain link

### Sprint 2 — Plan Model & Idle Smart

**Schema migration:**
- [ ] Bỏ `project.planId` — resolve plan qua `user → subscription → plan`
- [ ] Bỏ `project.heavyQuotaUsed`
- [ ] Thêm `project.keepAlive: Boolean`
- [ ] Thêm `plans.maxConcurrentRunning`, `plans.maxKeepAliveProjects`
- [ ] (Nếu còn schema cũ) migrate `plans.heavyJobsPerDay` → `plans.monthlyCredits`
- [ ] Seed data cập nhật cho Free và Pro

**Logic:**
- [ ] Wake-proxy service (Traefik fallback cho stopped containers)
- [ ] Telegram webhook wake-on-message
- [ ] CP-owned cron scheduler (via `/hooks/agent`)

### Sprint 3 — Credit System & Billing

**Schema:**
- [ ] Bảng `user_credits` (monthlyBalance, purchasedBalance, monthlyResetAt)
- [ ] Bảng `credit_transactions` (audit trail)
- [ ] Bảng `credit_packs` (seed: starter/standard/pro_pack)
- [ ] Thêm `heavy_jobs.creditCost` (snapshot tại lúc submit)

**Backend:**
- [ ] `CreditService.checkAndDeduct(userId, tool)` — atomic transaction
- [ ] `CreditService.refund(userId, heavyJobId)` — hoàn credit khi server error
- [ ] `CreditService.grantMonthly(userId, credits)` — gọi khi Stripe subscription renew
- [ ] `POST /api/credits/purchase` → Stripe Payment Intent
- [ ] `POST /api/credits/webhook` ← Stripe payment_intent.succeeded
- [ ] `GET /api/credits/wallet` → balance + resetAt
- [ ] `GET /api/credits/history` → transactions paged
- [ ] Monthly reset cron: scan subscriptions có `currentPeriodEnd <= NOW()`, grant + reset

**Frontend:**
- [ ] Credit wallet widget trong dashboard (balance + reset countdown)
- [ ] Credit packs page — chọn pack → Stripe checkout
- [ ] Heavy job submission hiển thị cost trước khi confirm
- [ ] Transaction history page

### Sprint 4 — Channels & Keep-alive
- Channel config UI (Telegram, Slack tokens)
- Auto set `project.keepAlive=true` khi bật tier-B channel (Discord, WhatsApp)
- Validate `maxKeepAliveProjects` per user trước khi cho phép bật tier-B
- Idle scheduler skip projects với `keepAlive=true`
- Channel status trong project card

### Sprint 5 — Multi-VPS
- Per-project DNS via Cloudflare API
- VPS load balancer (least active)
- VPS health monitoring

### Sprint 6 — Scale
- Cloudflare Workers routing
- Redis Sentinel
- Usage analytics dashboard (credit spend, heavy job stats)

---

## Cost Model

| Users | Infra | Cost/mo | Revenue (avg $5 ARPU) |
|---|---|---|---|
| 500 | 1 VPS + Railway | ~$80 | $2,500 |
| 2,000 | 3 VPS + Railway | ~$200 | $10,000 |
| 10,000 | 10 VPS + CF | ~$700 | $50,000 |
| 50,000 | 30 VPS + CF Workers | ~$2,500 | $250,000 |

---

*Last updated: 2026-04-27*
