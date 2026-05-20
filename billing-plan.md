# OpenClaw SaaS — Billing Plan

> Updated: 2026-04-27  
> Status: Source of truth for billing and quota model
> Related docs: System architecture in `workflow.md`; implementation timeline in `roadmap-plan.md`

## Document Role

- **Purpose:** Nguồn chuẩn cho billing/quota policy.
- **Owns:** plan limits, credit wallet rules, charging/deduct/refund flow.
- **Does not own:** kiến trúc runtime chi tiết (`workflow.md`), kế hoạch triển khai theo phase (`roadmap-plan.md`), schema đầy đủ (`backend/prisma/schema.prisma`).
- **Terminology note:** Dùng `project` làm đơn vị sản phẩm; runtime hiện tại map 1:1, tức **1 project = 1 container worker**.

---

## 1) Billing Unit và Runtime Unit

- **Billing unit:** `User -> Subscription -> Plan`
- **Runtime unit:** `Project`
- **Quy ước kỹ thuật hiện tại:** **1 project = 1 container worker** (OpenClaw gateway runtime)

Điều này có nghĩa:
- User trả tiền theo gói (Free/Pro), không trả theo từng project riêng lẻ.
- Quota được áp theo đúng loại tài nguyên (một số theo user, một số theo project).

---

## 2) Core Principles

1. **Plan gắn vào user, không gắn trực tiếp vào project**
   - Project không cần lưu `planId`.
   - Khi user upgrade/downgrade, toàn bộ project áp dụng policy mới ngay.

2. **Heavy tools dùng credit wallet theo user (cross-project)**
   - Không dùng daily counter kiểu `heavyJobsPerDay`.
   - Tất cả project của cùng user dùng chung 1 ví credit.

3. **Quota phân tầng theo bản chất tài nguyên**
   - RAM/CPU: theo project runtime.
   - Storage: theo project.
   - Credit/heavy usage: theo user.
   - Keep-alive slot: theo user.

---

## 3) Plan Limits (MVP)

| Metric | Free | Pro |
|---|---:|---:|
| maxProjects (per user) | 1 | 3 |
| maxConcurrentRunning (per user) | 1 | 3 |
| RAM per project runtime | 1 GB | 2 GB |
| CPU per project runtime | 0.5 vCPU | 1.0 vCPU |
| Storage per project | 4 GB | 10 GB |
| monthlyCredits (per user) | 0 | 200 |
| Buy extra credits | No | Yes |
| maxKeepAliveProjects (per user) | 0 | 1 |
| idleTimeoutMin | 10 | 60 |
| Cron jobs per project | 1 | 20 |

---

## 4) Credit Wallet Model

## Wallet fields

- `monthlyBalance`: credit tặng theo subscription cycle, reset theo kỳ.
- `purchasedBalance`: credit mua thêm, không reset.
- `monthlyResetAt`: thời điểm reset monthly balance tiếp theo.

## Spend order

- Trừ `monthlyBalance` trước.
- Thiếu mới trừ `purchasedBalance`.

## Why this model

- Dễ kiểm soát chi phí compute nặng.
- Tránh bất công khi user có nhiều project.
- Linh hoạt cho up-sell credit packs.

---

## 5) Heavy Tool Cost (MVP baseline)

| Tool | Credits |
|---|---:|
| Playwright (screenshot/PDF) | 1 |
| TTS (<= 500 chars) | 1 |
| STT (<= 1 minute) | 2 |
| FFmpeg short (<= 2 minutes) | 3 |
| FFmpeg long (<= 10 minutes) | 8 |

> Đây là baseline vận hành, có thể hiệu chỉnh theo cost thực tế.

---

## 6) Billing Flows

## A. Subscription renewal (Pro)

1. Stripe charge subscription.
2. Webhook thành công.
3. Grant `monthlyCredits` theo plan hiện tại.
4. Update `monthlyResetAt`.
5. Ghi `credit_transactions` type `MONTHLY_GRANT`.

## B. Submit heavy job

1. Resolve credit cost theo tool.
2. Check `monthlyBalance + purchasedBalance`.
3. Nếu không đủ -> reject.
4. Nếu đủ -> transaction atomic:
   - deduct wallet
   - create heavy job
   - log transaction type `USAGE`

## C. Buy credit pack (Pro)

1. Create one-time payment intent.
2. Webhook payment success.
3. Increment `purchasedBalance`.
4. Log transaction type `PURCHASE`.

## D. Refund policy (server-side failure)

- Với lỗi hệ thống (không phải input invalid), hoàn credit theo `creditCost`.
- Log transaction type `REFUND`.

---

## 7) Data Model (reference)

Để tránh ghi trùng schema ở nhiều nơi:

- Schema chi tiết và quan hệ bảng xem `backend/prisma/schema.prisma`
- Flow runtime và lifecycle xem `workflow.md`

Trong file này chỉ giữ policy billing/quota.

---

## 8) Guardrails đề xuất cho Pro (khuyên dùng)

Để tránh 1 user Pro chiếm quá nhiều tài nguyên:

- Giữ `maxConcurrentRunning` (đã có).
- Giữ `maxKeepAliveProjects` nhỏ (đã có).
- Thêm rate limit heavy jobs theo giờ (VD: `maxHeavyJobsPerHour`).
- Theo dõi usage theo user để điều chỉnh pricing/limits theo dữ liệu thật.

---

## 9) Scope Notes

- File này tập trung vào **billing + quota policy**.
- Chi tiết kiến trúc triển khai xem `workflow.md`.
- Chi tiết tiến độ sprint/phase xem `roadmap-plan.md`.

