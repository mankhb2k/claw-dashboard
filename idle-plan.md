# Idle / Cold-Start Plan — OpenClaw SaaS (v2)

> Viết lại sau khi đọc kỹ docs OpenClaw upstream.
> Nhận thức đúng: **OpenClaw không phải server truyền thống** — nó là personal assistant
> chạy trên device của user. SaaS đóng gói lại thành container-per-user.
> Điều này thay đổi hoàn toàn cách tư duy về "always-on vs idle".

---

## 1. OpenClaw bản chất là gì

Đọc [VISION.md](worker/.tmp-openclaw-upstream/VISION.md#L2): *"OpenClaw is the AI that actually does things. It runs on your devices, in your channels, with your rules."*

### Kiến trúc thật của OpenClaw

```
OpenClaw Gateway (1 process)                     ~200-500 MB RAM
├── WebSocket server (port 18789)                 ← user nói chuyện qua đây
├── HTTP endpoints (webhooks, OpenAI-compat API)
├── Agent loop runner (pi-agent-core)             ← chạy khi có turn
├── Cron scheduler (jobs.json)                    ← PHẢI gateway running
├── Heartbeat ticker (mỗi 30 phút)                ← PHẢI gateway running
├── Messaging channel connectors                  ← tùy channel
│   ├── Telegram bot (polling hoặc webhook)
│   ├── Discord Gateway (persistent WebSocket)
│   ├── WhatsApp Baileys (persistent connection)
│   ├── Signal-cli (persistent process)
│   ├── Slack Bolt (Events API — webhook capable)
│   ├── Matrix (WebSocket)
│   └── ... ~20 channels khác
├── Hook dispatcher (event-driven scripts)
└── Tool executors (browser, exec, media, ...)
```

### Khi nào Gateway CHẠY trong đời thường (không SaaS)

- Trên Mac: chạy dưới launchd (`ai.openclaw.gateway`) — start khi login, stop khi shutdown
- Trên Linux: systemd user service — stop khi user logout trừ khi `loginctl enable-linger`
- Trên laptop: gateway stop khi đóng máy
- → **OpenClaw bản chất KHÔNG always-on** — phụ thuộc device của user

**Kết luận quan trọng:** User của OpenClaw (non-SaaS) đã phải chấp nhận bot chỉ online khi máy của họ chạy. SaaS đóng gói lại — câu hỏi là SaaS nên hứa 24/7 hay tương tự như local install.

---

## 2. Giá trị thực sự của SaaS là gì

### Lý do user chọn SaaS thay vì self-host

| Lý do | Cần always-on? |
|---|---|
| Không muốn cài đặt | ❌ Không liên quan |
| Không có server/máy luôn bật | ⚠️ Có lẽ có |
| Muốn domain .openclaw.ai sẵn sàng | ⚠️ Có thể |
| Muốn bot Telegram/Discord trả lời 24/7 | ✅ Có |
| Muốn cron job chạy đều đặn khi họ không ở nhà | ✅ Có |
| Muốn thử trước khi cam kết | ❌ Không cần |

**Insight:** Value prop của SaaS không phải "always-on" — mà là **"delegate the running"**.
Việc có thực sự 24/7 hay không là implementation detail.

---

## 3. Phân loại workload theo độ phụ thuộc Gateway Running

### A. Workload KHÔNG cần gateway running liên tục (wake-on-demand OK)

| Workload | Có thể idle? | Cơ chế wake |
|---|---|---|
| WebChat UI (user mở dashboard chat) | ✅ Có | User mở → wake container |
| Telegram webhook mode | ✅ Có | Telegram POST → CP wake → deliver |
| Slack Events API | ✅ Có | Slack POST → CP wake → deliver |
| Discord Interactions (slash commands) | ✅ Có | Discord POST → CP wake → respond |
| Google Chat webhook | ✅ Có | Webhook arrival → wake |
| BlueBubbles webhook | ✅ Có | macOS server POST → wake |
| Synology Chat | ✅ Có | Webhook → wake |
| Gmail PubSub | ✅ Có | PubSub push → wake |
| Generic HTTP hooks (`/hooks/wake`) | ✅ Có | POST → wake |
| Cron jobs | ✅ Có | CP scheduler wake trước khi fire |
| Manual user interaction (web dashboard) | ✅ Có | Button click → wake |

### B. Workload CẦN gateway running liên tục (persistent connection)

| Workload | Tại sao cần always-on |
|---|---|
| Telegram bot polling mode | Long-poll loop phải chạy |
| Discord Gateway (bot presence) | WebSocket heartbeat mỗi 41s, offline = bot offline |
| WhatsApp (Baileys) | QR-paired session cần WebSocket liên tục |
| Signal-cli | Persistent daemon subscribe |
| Matrix | `/sync` long-poll |
| IRC | Persistent TCP socket |
| Feishu WebSocket channel | Persistent WS |
| Twitch IRC | Persistent TCP |
| Heartbeat tự phát (agent self-check mỗi 30min) | Gateway ticker |
| Standing orders "luôn giám sát" | Heartbeat-based |

### C. Workload nửa-nửa

| Workload | Ghi chú |
|---|---|
| Cron job `--session main` + `--wake now` | Gateway phải đang chạy để nhận wake event — nếu down thì miss |
| Task Flow (multi-step) | Nếu step đang chạy thì không dừng; giữa các step có thể idle |
| Hook `gateway:startup` | Chỉ chạy 1 lần mỗi start — nhiều start-stop = nhiều lần |

---

## 4. Phân tích 2 gói

### Gói Free

**Thông số:** 1 GB RAM, 0.5 vCPU, 4 GB storage, idle timeout 10 phút.

**Value prop:** "Thử OpenClaw, dùng nhẹ, không cần maintain."

**Workload phù hợp (tier A):**
- WebChat từ dashboard
- 1 Telegram bot ở webhook mode
- 1 cron job/ngày
- Thử các integration
- ❌ Heavy jobs (FFmpeg, Playwright, TTS/STT) - Pro only

**Workload KHÔNG phù hợp:**
- WhatsApp (persistent connection)
- Discord bot presence (cần online liên tục)
- Signal, Matrix, IRC
- Cron chạy mỗi vài phút
- Heartbeat liên tục
- Heavy jobs (FFmpeg, Playwright, TTS/STT)

**Thông điệp rõ ràng cho user Free:**
> *"Free tier dùng chế độ 'khi cần mới chạy'. Bot Telegram webhook và cron chạy bình thường (có độ trễ 3-5s lúc wake). Nếu bạn cần WhatsApp, Discord 24/7, Signal hay cron mỗi 5 phút — nâng lên Pro."*

### Gói Pro ($20/tháng)

**Thông số:** 2 GB RAM, 1.0 vCPU, 10 GB storage, idle timeout 60 phút (đề xuất).

**Value prop:** *"Trợ lý AI của bạn luôn sẵn sàng, không miss channel, cron chính xác. + Heavy jobs (FFmpeg, Playwright, TTS/STT)."*

**Gồm:**
- Idle timeout 60 phút (thay vì 10 phút)
- 100 heavy jobs/ngày (FFmpeg, Playwright, TTS/STT)
- Wake-on-demand cho mọi trigger
- Optional keep-alive cho persistent channels

**Câu hỏi then chốt:** Always-on hay idle thông minh?

#### Phân tích economics

```
VPS Worker: 12 vCPU / 45 GB usable RAM, ~$50/tháng

Nếu Pro always-on, mỗi container = 2 GB RAM + 1.0 vCPU:
  Cap RAM: 45 / 2 = 22 pro users
  Cap CPU: 12 / 1.0 = 12 pro users ← bottleneck
  → Max 12 pro users/VPS always-on

Revenue: 12 × $20 = $240/tháng
Cost/user: $50 / 12 = $4.17/tháng
Margin: $20 - $4.17 = $15.83 → viable ✓

Nếu Pro idle (60 phút timeout, ~30% active rate):
  Active đồng thời: 12 (CPU cap vẫn là 12)
  Total users = 12 / 0.3 ≈ 40 pro users/VPS

Revenue: 40 × $20 = $800/tháng
Cost/user: $50 / 40 = $1.25/tháng
Margin: $20 - $1.25 = $18.75 → tốt hơn ✓✓
```

→ **Always-on là HẠN CHẾ capacity, không phải feature khả thi kinh tế.**

### Khuyến nghị: Pro = "Smart idle" + Wake-on-Everything

Pro **không luôn bật** — nhưng wake-on-demand được implement đúng cho mọi trigger:
1. Webhook arrival (Telegram/Slack/etc) → wake
2. Cron schedule due → wake
3. User truy cập dashboard → wake
4. Heartbeat scheduled → wake (hoặc skip nếu không có việc)

Pro **khác Free ở:**
- `idleTimeoutMin`: 60 phút vs 10 phút
- Priority queue: wake job priority=1 (cao nhất)
- Keep-alive mode tự động khi có channel tier-B active
- Pre-warm pool (option V3)
- Multi-channel support, cron unlimited

---

## 5. Xử lý từng workload cụ thể

### 5.1 Cron jobs — Control Plane-owned scheduler

**Vấn đề gốc:** Cron của OpenClaw chạy trong Gateway process ([cron-jobs.md:35](worker/.tmp-openclaw-upstream/docs/automation/cron-jobs.md#L35)). Gateway down = cron miss hoàn toàn.

**Giải pháp:** CP sở hữu lịch cron, wake container trước khi fire.

```typescript
// cron_schedules — bảng mới trong Control Plane DB
model CronSchedule {
  id              String   @id @default(cuid())
  userId          String
  projectId       String
  name            String
  cronExpression  String   // "0 7 * * *"
  timezone        String   // "Asia/Ho_Chi_Minh"
  sessionTarget   String   @default("isolated") // main | isolated
  message         String
  deliveryChannel String?  // telegram, slack, discord...
  deliveryTarget  String?
  enabled         Boolean  @default(true)
  lastRunAt       DateTime?
  nextRunAt       DateTime // pre-computed, index
  createdAt       DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id])
  project Project @relation(fields: [projectId], references: [id])

  @@index([nextRunAt, enabled])
  @@index([projectId])
}
```

```typescript
// cron-scheduler.service.ts
@Injectable()
export class CronSchedulerService {
  private readonly logger = new Logger(CronSchedulerService.name);

  @Cron('*/30 * * * * *')  // scan mỗi 30 giây
  async fireDueCronJobs() {
    const now = new Date();
    const due = await this.prisma.cronSchedule.findMany({
      where: { enabled: true, nextRunAt: { lte: now } },
      include: { project: true },
      take: 50,
    });

    for (const job of due) {
      // fire-and-forget
      this.fireJob(job).catch(err =>
        this.logger.error(`Cron ${job.id} failed: ${err.message}`)
      );
    }
  }

  private async fireJob(job: CronSchedule & { project: Project }) {
    // 1. Đánh dấu nextRunAt trước để tránh double-fire
    const next = this.computeNext(job.cronExpression, job.timezone);
    await this.prisma.cronSchedule.update({
      where: { id: job.id },
      data: { lastRunAt: new Date(), nextRunAt: next },
    });

    // 2. Wake container nếu cần
    if (job.project.status !== 'RUNNING') {
      await this.containerQueue.add(
        'wake',
        { projectId: job.projectId, reason: 'cron', cronJobId: job.id },
        { priority: 1, attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
      );
      await this.waitUntilRunning(job.projectId, 30_000);
    }

    // 3. Trigger cron trong Gateway qua hook endpoint
    //    Gateway expose /hooks/agent (xem cron-jobs.md:216)
    const subdomain = job.project.subdomain;
    await fetch(`https://${subdomain}.openclaw.ai/hooks/agent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${job.project.hookToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: job.message,
        name: `cron:${job.name}`,
        deliver: job.deliveryChannel ? 'announce' : 'none',
        channel: job.deliveryChannel,
        to: job.deliveryTarget,
      }),
    });
  }
}
```

**Giới hạn theo plan:**

| | Free | Pro |
|---|---|---|
| Số cron jobs | 1 | 20 |
| Min interval | 1 giờ | 1 phút |
| Session target | `isolated` only | `isolated` hoặc `main` |
| Delivery channels | Không | Full |
| Wake timeout | 30s | 30s |

### 5.2 Heartbeat — KHÔNG dùng gateway heartbeat, emulate từ CP

**Vấn đề:** Heartbeat của OpenClaw chạy mỗi 30 phút khi Gateway đang chạy ([heartbeat.md:14](worker/.tmp-openclaw-upstream/docs/gateway/heartbeat.md#L14)). Nếu container stopped 28/30 phút thì heartbeat không fire.

**Giải pháp:**
- Disable built-in heartbeat (`agents.defaults.heartbeat.every: "0m"`)
- CP-owned heartbeat trigger (tương tự cron)
- User định nghĩa một "cron job đặc biệt" tên `heartbeat` với interval mong muốn
- CP wake container → gửi prompt heartbeat qua `/hooks/agent`

**Ưu điểm:**
- Heartbeat không miss khi container idle
- User có quyền tắt/mở heartbeat
- Tokens cost minh bạch (mỗi heartbeat = 1 agent run)

### 5.3 Messaging channels

#### Tier A — Webhook-capable (idle OK)

Setup khi user bật channel:
1. User cung cấp bot token/credentials
2. CP register webhook URL: `https://{subdomain}.openclaw.ai/hooks/{channel}`
3. Platform (Telegram/Slack/...) POST đến URL này khi có tin nhắn
4. Request đến Cloudflare → Traefik → VPS
5. Nếu container stopped, Traefik route đến **wake-proxy** (xem worker.md:444):
   - Wake-proxy trả 202 Accepted ngay (platform không timeout)
   - Wake-proxy enqueue wake job, retry forward sau khi container healthy
6. Nếu container running, Traefik route trực tiếp đến container → gateway xử lý webhook

**Thời gian wake (p95):** 3-5 giây với warm image.

#### Tier B — Persistent connection (cần always-on)

- Discord Gateway, WhatsApp, Signal, Matrix, IRC, Feishu...
- Nếu user bật channel này → **đánh dấu project `keepAlive=true`**
- Project `keepAlive=true` không bị idle-stop
- Chi phí: container chiếm slot liên tục → giới hạn quota

**Chính sách:**

| | Free | Pro |
|---|---|---|
| Tier A channels | ✅ (1) | ✅ (unlimited) |
| Tier B channels | ❌ | ✅ (max 2) |
| Keep-alive override | ❌ | ✅ tự động khi có tier B active |

**Lý do Free không có tier B:** 1 free container keep-alive = chiếm 0.5 vCPU vĩnh viễn → nhanh hết capacity.

### 5.4 User interactive (WebChat dashboard)

```
User mở https://{subdomain}.openclaw.ai
  → Cloudflare → Traefik
  → Container stopped?
      → Wake-proxy nhận request
      → Trả HTML loading page (spinner + JavaScript auto-reload)
      → Đồng thời POST /api/internal/wake
      → CP enqueue wake (priority=1)
      → Container healthy ~3-5s
      → Page auto-reload → Traefik route đến container
  → User thấy chat UI, bắt đầu chat bình thường
  → lastActiveAt update mỗi message
```

**UX cho Free (10 phút idle):**
- User quay lại sau 15 phút → thấy loading page 3-5 giây → OK
- User đang chat → không bị stop (activity reset timer)

**UX cho Pro (60 phút idle):**
- User mở sáng → chat → đóng laptop → mở lại chiều cùng ngày (6 tiếng sau) → wake 3-5s
- Đối với user chỉ dùng 1-2 lần/ngày, UX gần như always-on

---

## 6. Luồng đầy đủ (sequence diagram text)

### Luồng 1: Cron job khi container idle

```
00:00:00  Control Plane scheduler scan nextRunAt <= NOW()
00:00:01  Job "morning-brief" due (07:00 Asia/Ho_Chi_Minh)
00:00:01  Update nextRunAt = next occurrence (tránh double-fire)
00:00:01  Check project.status → STOPPED
00:00:02  Enqueue wake job (priority=1)
00:00:02  VPS Worker pull wake job
00:00:02  docker start openclaw-{userId}
00:00:03  Container process starting
00:00:05  Container healthy (POST /api/internal/status → RUNNING)
00:00:05  CP POST https://{sub}.openclaw.ai/hooks/agent
          {
            message: "Tóm tắt email sáng",
            name: "cron:morning-brief",
            deliver: "announce",
            channel: "telegram",
            to: "123456789"
          }
00:00:05  Gateway nhận, spawn isolated agent session
00:00:15  Agent đọc email, gọi Telegram API gửi tóm tắt
00:01:30  Agent hoàn thành, return summary
00:01:30  Gateway response OK
01:01:30  Container idle 60 phút (Pro timeout)
01:01:30  Idle scheduler stop container
```

### Luồng 2: Telegram message khi container idle

```
10:00:00  User nhắn bot Telegram
10:00:00  Telegram POST webhook → {sub}.openclaw.ai/hooks/telegram
10:00:00  Cloudflare → Traefik
10:00:00  Container stopped → Traefik route đến wake-proxy
10:00:00  Wake-proxy:
            - Respond 200 OK ngay (Telegram không timeout)
            - Buffer request body
            - Enqueue wake (priority=1, metadata={buffered: true})
10:00:03  Container healthy
10:00:03  Wake-proxy replay request đến container
10:00:04  Gateway xử lý message, agent turn
10:00:08  Agent response → Telegram API
10:00:08  User nhận reply (8s cold start)
```

**Trade-off:** 8s cold start cho message đầu tiên sau idle. Sau đó conversation sẽ < 1s response. Với bot cá nhân (không phải customer support), chấp nhận được.

### Luồng 3: Cron + persistent channel (Pro, keep-alive)

```
User đang có:
  - WhatsApp channel (persistent, tier B)
  - Project keepAlive=true
  - 5 cron jobs

→ Container KHÔNG bao giờ bị idle-stop
→ Cron fires trực tiếp (Gateway heartbeat/cron native chạy)
→ CP-owned cron scheduler fallback (nếu native miss)
```

---

## 7. Bảng so sánh cuối cùng

| Dimension | Free | Pro (idle) | Pro (keep-alive) |
|---|---|---|---|
| RAM / CPU | 1GB / 0.5vCPU | 2GB / 1.0vCPU | 2GB / 1.0vCPU |
| Idle timeout | 10 phút | 60 phút | ∞ |
| Điều kiện keep-alive | — | — | Có ≥1 tier-B channel |
| Cron jobs | 1 | 20 | 20 |
| Tier A channels (webhook) | 1 | Unlimited | Unlimited |
| Tier B channels (persistent) | ❌ | ❌ | ✅ max 2 |
| **Heavy jobs/day** | ❌ **0** | **100** | **100** |
| **Heavy tools** | ❌ None | ✅ FFmpeg, Playwright, TTS/STT | ✅ FFmpeg, Playwright, TTS/STT |
| Cold start (webhook) | 3-8s | 3-8s | 0s |
| Cold start (user UI) | 3-5s | 3-5s | 0s |
| Cron miss rate | ~0% (CP-owned) | ~0% (CP-owned) | ~0% |
| Heartbeat | CP emulate | CP emulate | CP emulate |
| Cost/user infra | $0.40 | $1.25 | $4.00 |
| Max users/VPS | ~133 | ~40 | ~12 |

---

## 8. Kiến trúc triển khai

### Các thành phần cần thêm

1. **`wake-proxy`** (Traefik fallback service, ~100 dòng Node.js)
   - Bind Traefik HostRegexp priority thấp nhất
   - Nhận request khi container không tồn tại trong Traefik routing
   - Buffer request body, respond 200/202
   - Enqueue wake job
   - Replay request sau khi container healthy

2. **`CronSchedulerService`** (NestJS @Cron mỗi 30s)
   - Scan `cron_schedules` due
   - Wake container → trigger qua `/hooks/agent`
   - Update `nextRunAt`, `lastRunAt`

3. **`HeartbeatSchedulerService`** (tương tự, nhưng cho heartbeat)
   - Scan projects có heartbeat config
   - Wake + trigger heartbeat prompt

4. **Bảng `cron_schedules`** (Prisma migration)

5. **Field `keepAlive: boolean`** trên `projects`

6. **Field `channels: jsonb`** trên `projects` — tracking channel nào active
   - Khi user bật WhatsApp/Discord → tự set `keepAlive=true`
   - Khi user tắt hết tier-B channels → `keepAlive=false`

7. **Endpoint `/hooks/agent`** trong container (đã có sẵn trong OpenClaw upstream, xem [cron-jobs.md:216](worker/.tmp-openclaw-upstream/docs/automation/cron-jobs.md#L216))

### Cấu hình container khi spawn

```typescript
// Pro container với idle + CP-owned cron
{
  env: [
    'OPENCLAW_PLAN=pro',
    'OPENCLAW_IDLE_TIMEOUT_MIN=60',
    // Disable built-in heartbeat — CP owned
    'OPENCLAW_HEARTBEAT_EVERY=0m',
    // Disable built-in cron — CP owned
    'OPENCLAW_SKIP_CRON=1',
    // Enable hooks endpoint
    'OPENCLAW_HOOKS_ENABLED=true',
    'OPENCLAW_HOOKS_TOKEN=<random-per-project>',
    'OPENCLAW_HOOKS_PATH=/hooks',
  ],
}
```

---

## 9. Lộ trình triển khai

### Sprint 1 — MVP (đã có phần lớn)

- [x] Free: 10 phút idle timeout
- [x] User interactive wake (button "Start" trên dashboard)
- [ ] Đặt `idleTimeoutMin=60` cho Pro trong `plans` seed
- [ ] Document rõ: cron/heartbeat chưa support trong MVP
- [ ] Wake-proxy service cho webhook arrival (Telegram webhook)

### Sprint 2 — CP-owned cron + Heartbeat

- [ ] Prisma migration: `cron_schedules` table, `keepAlive` field
- [ ] `CronSchedulerService` NestJS
- [ ] `HeartbeatSchedulerService`
- [ ] API endpoints: CRUD cron schedules
- [ ] Container env: disable built-in cron/heartbeat, enable hooks
- [ ] Per-project hook token (random, lưu DB)
- [ ] UI: cron management page trên dashboard

### Sprint 3 — Tier B channels + keep-alive

- [ ] Channel config UI (nhập token WhatsApp, Discord, ...)
- [ ] Auto-set `keepAlive=true` khi bật tier-B channel
- [ ] Idle scheduler skip projects với `keepAlive=true`
- [ ] Capacity monitoring: cảnh báo khi > 10 pro users keep-alive
- [ ] Retry logic: wake timeout 3 attempts exponential

### Sprint 4 — Scale

- [ ] Tách VPS Pro riêng khi > 20 Pro users active
- [ ] Pre-warm pool: giữ sẵn 2-3 container "base" để wake nhanh hơn
- [ ] Cron history + delivery status
- [ ] Alert khi cron miss > 3 lần liên tiếp

---

## 10. Kết luận — trả lời câu hỏi gốc

**"User Pro $20 có nên luôn bật container không?"**

**Không.** Always-on cho Pro là economically inefficient và không phải là giá trị thật của SaaS.

Giá trị đúng của Pro: *"Chúng tôi wake container kịp thời cho mọi trigger — webhook, cron, user mở app. Bạn không mất tin nhắn, không miss cron. Với channel cần always-on (WhatsApp, Discord bot presence), chúng tôi tự động keep-alive."*

**"User đặt cron job thì xử lý thế nào?"**

Control Plane sở hữu lịch (bảng `cron_schedules`), scan mỗi 30s, wake container trước khi fire, trigger qua hook endpoint `/hooks/agent` có sẵn trong OpenClaw. Cron không phụ thuộc gateway đang chạy. Thời gian fire = scheduled time + 3-5s wake latency.

**"OpenClaw không phải dạng server — điều này có nghĩa gì?"**

OpenClaw được thiết kế để chạy trên device cá nhân, không phải always-on cloud. SaaS nên ôm triết lý này: **idle là chế độ mặc định, wake khi có việc**. Always-on chỉ dành cho channels thật sự cần persistent connection, và user phải trả tiền cho resource đó.

---

*Generated: 2026-04-20*
*Status: Draft v2 — đã đọc kỹ OpenClaw docs upstream*
