# Heavy Tasks Worker Model — Lợi, Hại & Đánh Đổi

**Proposal**: Dedicated VPS for heavy tasks (FFmpeg, Playwright, video processing)  
**User quota**: 3 calls/day, results auto-saved to user's 1GB storage  
**Current status**: No Pro tier yet, extensible later

---

## 📋 Model Overview

```
┌──────────────────────────────────┐
│  User Container (1GB/0.5vCPU)    │
│  ├─ Chat + AI API               │
│  └─ REST API: POST /heavy-task   │
│     {"tool": "ffmpeg", "params"} │
└──────────────────────────────────┘
                 │ (async job)
                 ▼
┌──────────────────────────────────┐
│  Heavy Tasks VPS (dedicated)     │
│  ├─ FFmpeg                       │
│  ├─ Playwright (Chromium)        │
│  ├─ Video processing             │
│  ├─ Image generation             │
│  └─ Job queue (BullMQ)           │
└──────────────────────────────────┘
                 │ (result)
                 ▼
┌──────────────────────────────────┐
│  User Storage (1GB quota)        │
│  ├─ /data/users/{userId}/       │
│  ├─ output_video_20260418.mp4   │
│  └─ image_output.png             │
└──────────────────────────────────┘
```

---

## ✅ Advantages

### 1. **Isolation & Stability**
- ✅ Heavy tasks **không làm crash** main container
- ✅ FFmpeg spike (500MB) **không ảnh hưởng** chat users
- ✅ Playwright Chromium **không compete** với AI inference
- ✅ Main VPS ổn định 24/7, worker VPS có thể reboot mà safe

### 2. **Resource Efficiency (Cost)**
- ✅ Main VPS: nhỏ (1GB/0.5vCPU) × nhiều users → dense
  - 48GB VPS chứa: ~45-50 free users
- ✅ Heavy VPS: chỉ cần khi có jobs
  - Có thể **scale down lúc idle** (tắt/minimize)
  - Không cần `OPENCLAW_INSTALL_BROWSER=1` bloat toàn bộ main image

### 3. **Flexibility & Extensibility**
- ✅ Heavy VPS có thể chạy **tools khác nhau** mà không rebuild main image
  - Thêm GPU node → từng cái riêng
  - Update FFmpeg → không downtime main
- ✅ Pro tier sau này: có thể **higher quota** (10x/day, longer timeout) mà **share** heavy VPS

### 4. **Throttling Built-in**
- ✅ Job queue tự throttle (mỗi user 3 calls/day)
- ✅ Không cần logic phức tạp trong container

### 5. **User Autonomy**
- ✅ User **tự quản lý** kết quả (xóa/archive khi đầy)
- ✅ Không phải server phải lo storage cleanup
- ✅ User **biết rõ** chi phí: "3 lần video processing mỗi ngày"

---

## ❌ Disadvantages & Risks

### 1. **Timeout Management** (Bạn chưa define — **Critical**)

**Vấn đề:**
- Playwright: có thể chạy 30-120 giây (tùy complexity)
- FFmpeg: có thể chạy vài phút (4K video)
- User chat → long-polling? Webhook callback?

| Scenario | Risk | Impact |
|----------|------|--------|
| Timeout 30s | ❌ FFmpeg 4K cut off | User angry, incomplete video |
| Timeout 10m | ⚠️ Queue backs up | If 2 users × 5m each = 10m queue |
| No timeout | ❌ Job hangs forever | Worker stuck, manual cleanup |

**Recommendation:**
```
Timeout strategy:
- FFmpeg: 5m max (src:1080p, codec:libx264, crf:20)
- Playwright: 2m max (screenshot/PDF only, no render farm)
- Fallback: 3m default, user can request extension
```

### 2. **Storage Conflict** (If 1GB container storage)

**Vấn đề:** 1GB container = ~800MB after OS/app  
```
Scenario:
- User creates 1× 4K video (200MB)
- Creates 1× high-res screenshots (50MB)
- Runs 3 jobs × 2 days = 6 files (up to 600MB)
- ────────────────────────
- Runs out of space on day 3 → job fails with "ENOSPC"
```

**Sub-issues:**
- ❌ If results auto-saved forever → user hits quota in ~1 week
- ❌ If auto-delete old results → user loses work without warning
- ⚠️ If user has to delete manually → UX friction (forget, lose files)

**Recommendation:** (See Storage Strategy section below)

### 3. **Worker VPS Cost** (Operational)

| Cost | Amount | Notes |
|------|--------|-------|
| Base VPS | $30-50/mo | Contabo 12vCPU, 48GB (shared with main) |
| Heavy VPS | $30-50/mo | New VPS + ops overhead |
| Total | **$60-100/mo** | For 100 free users |

**Cost per user**: $0.60-1.00 per free user (heavy job capability)

**Comparison:**
- Pure SaaS (AWS Lambda + S3): pay-per-use, but cold start latency 10-30s
- This model: predictable cost, but **less utilized** if jobs infrequent

### 4. **Queue Starvation** (Multi-user fairness)

**Scenario:**
```
User A: Posts job at 09:00 (FFmpeg, 4m)
User B: Posts job at 09:01 (Playwright, 1m)
User C: Posts job at 09:02 (FFmpeg, 4m)

Queue order (FIFO):
09:00 → User A job (0-4m)
09:01 → User B job (4-5m)
09:02 → User C job (5-9m) ← waits 8 minutes from submission
```

**Risk:** If user C hits **3 calls/day quota** waiting, they can't resubmit.

**Solution:** Priority queue or fair scheduling.

### 5. **Error Handling & Retry Logic** (Not obvious)

**Vấn đề:**
```
Job fails:
- Why? (Corrupted input, unsupported codec, OOM, timeout?)
- User knows? (Error message in UI?)
- Can retry? (Counts against 3 calls/day quota?)
- Can fix? (Parameters, input file?)
```

**Recommendation:** Clear error taxonomy + 1 free retry per job.

### 6. **No Pro Tier Yet** (Design debt)

**Issue:** You're building "free with quota" but pricing unclear.

```
Future upgrade path is fuzzy:
- Pro = 10 calls/day? 30m timeout?
- Pro = custom tools (RunwayML, Synthesia)?
- Pro = priority queue?
- Pro = stored results for 30 days (vs. auto-purge)?
```

**Recommendation:** Define Pro tier **now** to avoid refactoring later.

### 7. **Webhook Callback Complexity**

**If job is async → user must poll or get callback:**

```
Option A: User polls API
GET /job/{jobId}/status
→ Latency: 5-30s before user knows result ready
→ UX: Spinner, "Generating..."

Option B: Webhook callback
User gets notified when done
→ Requires user to expose public endpoint (security risk)
→ Or you host callback intermediary (cost + complexity)

Option C: WebSocket subscription
→ User stays connected to Gateway
→ Gateway holds connection to heavy VPS result stream
→ Complex, but good UX
```

**Current proposal unclear on this.**

---

## 🔄 Storage Strategy Recommendation

### **Updated: 4GB SSD per user — GENEROUS!**

**Changed from:** 1GB → 4GB per user

**Storage math with 4GB:**
```
Scenario (moderate use: 3 calls/day, mixed outputs):
- Average output: 50-100MB per call
- 3 calls/day × 30 days = 90 calls/month
- 90 × 75MB avg = 6.75GB over 30 days

Timeline to fill 4GB:
- Aggressive (200MB per job): ~2 weeks
- Moderate (100MB per job): ~3 weeks  
- Casual (50MB per job): ~3 months
```

### **Recommendation: SIMPLE (No tiered storage needed)**

```
Just implement:
✅ Storage quota indicator UI (3.2GB / 4GB used)
✅ Delete button to remove old files
✅ File list view with dates & sizes

NO NEED for:
❌ Auto-delete (user can manage)
❌ Archive tiers (4GB is big enough)
❌ Complex retention policies
```

**Why simple works:**
- ✅ 4GB absorbs 2-3 weeks of normal use
- ✅ User has time to download/backup before hitting limit
- ✅ If they want more: upgrade to Pro tier (larger storage)
- ✅ UX is transparent: "You've used 80%, delete old files or upgrade"

---

## 💰 SaaS Model Assessment

### **Current (Free-only, no Pro yet)**

| Aspect | Status | Assessment |
|--------|--------|------------|
| **Pricing clarity** | ❌ Undefined | "3 calls/day" is quota, but what's cost model? |
| **Monetization** | ❓ Unknown | How do you make money if everything is free? |
| **Upgrade path** | ⚠️ Fuzzy | Pro tier undefined → hard to migrate users |
| **Cost per user** | ⚠️ ~$0.60-1.00/mo | Sustainable if you charge Pro, risky if free-forever |

### **Recommendations**

#### **Option 1: Freemium (Recommended)**
```
Free:
  - 3 heavy jobs/day
  - 5m FFmpeg, 2m Playwright
  - Results kept 7 days
  - Cost to you: ~$0.30/user/mo (shared heavy VPS)

Pro ($5/mo):
  - 50 jobs/day (unlimited in practice)
  - 15m FFmpeg, 5m Playwright
  - Results kept 30 days
  - Priority queue
  - Early access to new tools (image gen, music gen)
  - Cost to you: ~$1.50/user/mo (heavy VPS + storage)
  - Margin: $5 - $1.50 = $3.50 gross (before compute, infra)
```

#### **Option 2: Usage-based (AWS Lambda model)**
```
Pay-per-call:
- Free: 3 calls/day included
- Beyond: $0.10 per call (or $0.50 for 10 calls/day pack)
- User pays only for what they use
- You avoid over-provisioning
- Risk: Users complain about surprise charges
```

#### **Option 3: Compute-hours (transparency)**
```
Show cost per job:
- "FFmpeg 4K video (4m) = $0.15"
- "Playwright (1m) = $0.05"
- Free tier gets 3 calls/day included
- Beyond = pay-per-use
- Very transparent, but UX overhead
```

**My take:** **Option 1 (Freemium)** is cleanest. Users understand "3/day free, $5/mo for more."

---

## 🎯 Risk Assessment (Severity)

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Timeout undefined** | 🔴 Critical | Define now: FFmpeg 5m, Playwright 2m |
| **Storage overflow** | 🔴 Critical | Implement tiered retention (Recent/Archive) |
| **No Pro tier defined** | 🟡 High | Lock down pricing before launch |
| **Queue starvation** | 🟡 Medium | Implement fair scheduling or priority |
| **Error UX unclear** | 🟡 Medium | Design error states, retry logic |
| **Webhook callback** | 🟡 Medium | Decide on polling vs. WebSocket vs. callback |
| **Cost per user** | 🟢 Low | Economically viable if freemium pricing |

---

## 🚀 Alternative Approaches (Simpler?)

### **Alternative 1: No Heavy Tasks on Free (Simplest)**
```
Approach:
- Free: Chat + search + light tools only
- Pro: Unlock FFmpeg, Playwright, media gen

Pros:
✅ Zero new infrastructure (no heavy VPS)
✅ Zero job queue complexity
✅ Clear upgrade incentive
✅ Lower cost to you

Cons:
❌ Less feature parity with free tier
❌ Might lose users who want video editing
❌ Limited competitive advantage
```

**My verdict:** Not recommended. FFmpeg/Playwright are differentiators.

---

### **Alternative 2: Serverless (AWS Lambda / Fly Machines)**
```
Approach:
- Don't build heavy VPS
- Spin up ephemeral Docker container per job (via Fly or Lambda)
- Auto-scales, auto-terminates

Pros:
✅ No persistent infrastructure cost
✅ Auto-scales if spike
✅ Pay only for compute used

Cons:
❌ Cold start latency: 10-30s (bad UX)
❌ More complex DevOps (container orchestration)
❌ Pricing can surprise (data transfer costs)
❌ Overkill for 3 calls/day quota

Cost: ~$50-100/mo for light usage (worse than dedicated VPS)
```

**My verdict:** Overkill for MVP. Stick with dedicated VPS.

---

### **Alternative 3: Hybrid (Best balance)**
```
Approach:
- Main VPS: User containers (1GB/0.5vCPU) — prod-ready
- Heavy VPS: Shared job queue
- But: Only provision heavy VPS when needed
  - Monitor: If queue empty > 1 hour, scale down
  - Webhook from job: Scale up on demand

Pros:
✅ Cost efficient (not always running)
✅ Scales with demand
✅ Simple to operate

Cons:
⚠️ Scale-up latency: 2-5m to spin up heavy VPS
❌ Not viable if users expect sub-1m response time

Risk: If job queued while VPS spinning up, user waits 2-5m.
```

**My verdict:** Good for ~50+ concurrent users. For MVP (5-10 users), fixed heavy VPS is simpler.

---

## 📊 Overall Assessment

### **Your model: SOLID for MVP, but incomplete**

| Dimension | Score | Why |
|-----------|-------|-----|
| **Simplicity** | 7/10 | Straightforward, but storage/timeout not defined |
| **Cost efficiency** | 7/10 | Shared heavy VPS is smart, but need freemium pricing |
| **Scalability** | 6/10 | Works for ~100 free users, then need multi-heavy-VPS |
| **User experience** | 5/10 | Async model OK, but callback/polling UX unclear |
| **Monetization** | 4/10 | No pricing defined yet — risk |

### **What to fix BEFORE launch:**

🔴 **Critical (must have):**
1. Define timeout limits (FFmpeg, Playwright)
2. Define storage strategy (7-day Recent + Archive)
3. Define Pro tier pricing & limits
4. Define error handling & retry logic
5. Define callback/polling mechanism

🟡 **Important (should have):**
6. Fair scheduling in job queue
7. Clear UX: progress, errors, success states
8. Monitoring: queue length, job failure rate

🟢 **Nice-to-have:**
9. Priority queue for paying users
10. Job history / analytics per user

---

## 🎯 Final Verdict

### **My Recommendation: GO FOR IT**

**Why:**
- ✅ Architecture is sound (isolated heavy VPS, throttled quota)
- ✅ Cost structure is reasonable ($0.30-1.00/user)
- ✅ Extensible to Pro tier
- ✅ Clear freemium upgrade path

**But:**
- 🔴 **Fix the 5 critical gaps BEFORE launch**
- Don't launch without clear storage/timeout/pricing
- Users will hate vague error states or surprise storage full

**Timeline:**
- **Week 1:** Define timeout, storage, Pro tier, error UX
- **Week 2:** Implement job queue + callbacks
- **Week 3:** Test with 5-10 internal users
- **Week 4:** Launch with confidence

---

## 📝 Questions for You

1. **Callback mechanism**: How will you notify user when job done?
   - Polling? Webhook? WebSocket? In-app notification?

2. **Storage location**: User's 1GB = inside main container (`/data/users/{userId}`)?
   - Or external (S3, user's own bucket)?

3. **Pro tier timeline**: Month 1? Month 3? Never?
   - Affects pricing strategy now.

4. **Monitoring**: How will you track:
   - Job failure rates?
   - Queue depth?
   - Heavy VPS utilization?

---

Generated: April 18, 2026
