# Updated Assessment: Heavy Tasks Worker Model (4GB Storage/User)

**Updated specs:**
- Free tier: **1GB RAM** + **0.5vCPU** + **4GB SSD**
- Heavy tasks: async worker VPS
- Quota: 3 calls/day

---

## 🎯 Key Change: 4GB Storage Changes Everything

### **Old assumption (1GB):** ❌ Tight
```
1GB container = ~800MB usable
3 jobs/day × 100MB = 300MB/day
3 jobs/day × 200MB = 600MB/day

→ Hit limit in 1-3 weeks (aggressive use)
→ Need tiered auto-delete strategy (complex UX)
→ Risk: User loses work without clear warning
```

### **New reality (4GB):** ✅ Comfortable
```
4GB storage per user
- Aggressive (200MB/job): 3 jobs/day → fills 4GB in ~2 weeks
- Moderate (100MB/job): 3 jobs/day → fills 4GB in ~3 weeks
- Casual (50MB/job): 3 jobs/day → fills 4GB in ~3 months

→ User has 2-3 weeks to download/backup
→ No need for auto-delete complexity
→ Simple UI: storage indicator + manual delete
```

---

## 📊 Storage Math (Realistic)

### **Scenario: User runs 3 jobs/day, mixed outputs**

| Job Type | Size | Frequency | Monthly |
|----------|------|-----------|---------|
| Screenshot | 2-5MB | 1/day | 60-150MB |
| 1080p video encode | 100-150MB | 1/day | 3-4.5GB |
| Playwright PDF | 5-20MB | 1/day | 150-600MB |
| **Total/month** | **avg 75MB** | **90 jobs** | **~6.75GB** |

**Timeline:**
- Week 1: ~525MB used
- Week 2: ~1.05GB used
- Week 3: ~1.575GB used
- Week 4: ~2.1GB used (50% of 4GB)
- Week 5: ~2.625GB used (65% of 4GB)
- Week 6: ~3.15GB used (78% of 4GB) ← User should delete old files

**Outcome:** User has **5-6 weeks** before hitting 4GB limit at 3 jobs/day.

---

## ✅ Advantages (Now Even Better)

| Advantage | Impact |
|-----------|--------|
| **Storage not a blocker** | 4GB absorbs 4-6 weeks of normal use |
| **No auto-delete needed** | Simpler architecture, better UX |
| **User retains control** | "Delete old files when you want" |
| **Clear pricing signal** | Pro tier can offer 10GB, 20GB, unlimited |
| **Easier to scale** | If 1000 users × 4GB = 4TB (reasonable cost) |

---

## ❌ Disadvantages (Unchanged)

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Timeout undefined** | 🔴 Critical | FFmpeg 5m, Playwright 2m |
| **Queue starvation** | 🟡 Medium | Fair scheduling or priority queue |
| **Pro tier pricing** | 🟡 Medium | Define freemium tiers |
| **Callback mechanism** | 🟡 Medium | Polling (MVP) → WebSocket (later) |
| **Error UX** | 🟡 Medium | Clear error messages + 1 free retry |

---

## 💰 Cost Analysis (Updated)

### **Compute + Storage for 1000 free users**

```
Monthly costs:
├─ Main VPS (12vCPU, 48GB):        $40/mo
├─ Heavy VPS (12vCPU, 48GB):       $50/mo
└─ Storage (4GB × 1000 users):     $16/mo*
   ────────────────────────────────
   TOTAL:                          $106/mo

Cost per user: $0.106/mo
```

*Storage estimate: Contabo ~$0.004/GB/mo for dedicated storage

### **Break-even Analysis**

| Pro Tier Price | Signup % Needed | Users at 1000 | Revenue |
|---|---|---|---|
| **$5/mo** | 2.12% | 21 users | $105/mo (breakeven) |
| **$10/mo** | 1.06% | 11 users | $110/mo (profit) |
| **$15/mo** | 0.71% | 7 users | $105/mo (profit) |

**Verdict:** Very sustainable. Need only **1-2% of users** to upgrade to Pro for profitability.

---

## 🎯 Recommended Tier Structure

### **Freemium Model**

```
┌─ FREE TIER ────────────────────────────────────┐
│ • 1GB RAM, 0.5vCPU, 4GB SSD                    │
│ • 3 heavy jobs/day                             │
│ • FFmpeg: 5 min, Playwright: 2 min timeout     │
│ • Results stored 4GB quota (user manages)      │
│ • Community support                            │
└────────────────────────────────────────────────┘

┌─ PRO TIER ($5-9/mo) ──────────────────────────┐
│ • 2GB RAM, 1.0vCPU, 10GB SSD                   │
│ • 50 heavy jobs/day (unlimited in practice)    │
│ • FFmpeg: 15 min, Playwright: 5 min            │
│ • Priority queue (fast processing)             │
│ • Email support                                │
│ • Longer retention (30 days auto-delete)       │
│ • Early access to new tools                    │
└────────────────────────────────────────────────┘

┌─ BUSINESS ($20-30/mo) ─────────────────────────┐
│ • 4GB RAM, 2.0vCPU, 50GB SSD                   │
│ • Unlimited heavy jobs                         │
│ • Custom timeouts, parallel processing         │
│ • Dedicated support                            │
│ • Team collaboration                           │
│ • API access                                   │
└────────────────────────────────────────────────┘
```

---

## 🎯 Final Verdict: GO FOR IT ✅

### **Score: 8.5/10** (Up from 7/10 with 1GB)

**Why 4GB changes the game:**
1. ✅ Storage is NO LONGER a critical risk
2. ✅ UX becomes simple (just quota indicator + delete)
3. ✅ Economics are solid (1-2% upgrade needed)
4. ✅ Extensible to Pro/Business tiers naturally
5. ✅ Clear user story: "Use 3 jobs/day free, keep files for weeks"

### **Still need to define (before launch):**

🔴 **Critical:**
- [ ] Timeout limits (FFmpeg 5m, Playwright 2m)
- [ ] Pro tier pricing ($5, $9, $15/mo?)
- [ ] Callback mechanism (polling vs WebSocket)
- [ ] Error handling + retry logic
- [ ] Storage quota UI (indicator, delete button)

🟡 **Important:**
- [ ] Fair scheduling in job queue
- [ ] Job history / analytics
- [ ] Rate limiting per IP (prevent abuse)

---

## 📋 Implementation Checklist

### **Phase 1: MVP (Week 1-2)**
- [ ] Define timeout: FFmpeg 5m, Playwright 2m
- [ ] Implement job queue (BullMQ)
- [ ] Storage quota UI (simple percentage bar)
- [ ] File list view with dates/sizes
- [ ] Delete confirmation dialog
- [ ] Error messages + retry once
- [ ] Polling mechanism for job status

### **Phase 2: Polish (Week 3-4)**
- [ ] Monitoring: queue depth, job failure rate
- [ ] User quotas enforced (3 calls/day)
- [ ] Rate limiting (prevent spam)
- [ ] Job history (last 30 jobs)
- [ ] Storage auto-cleanup for failed jobs

### **Phase 3: Pro Tier (Month 2)**
- [ ] WebSocket for real-time status
- [ ] Priority queue
- [ ] Higher quotas (50 jobs/day)
- [ ] Storage indicator in settings
- [ ] Billing integration

---

## 🚀 Next Steps

1. **Confirm timeout limits** with you:
   - FFmpeg: 5 min?
   - Playwright: 2 min?
   - Others: 10 min fallback?

2. **Confirm Pro tier pricing:**
   - $5/mo, $9/mo, or $15/mo?
   - Higher quota: 10×, 50×, unlimited?

3. **Confirm callback strategy:**
   - Polling (MVP)? → WebSocket (later)?
   - Or straight WebSocket from start?

4. **Review tier specs** above — make sense?

---

**Status:** Ready to implement MVP with 4GB storage model.  
**Risk level:** LOW (storage no longer a concern)  
**Viability:** HIGH (1-2% upgrade rate covers cost)

