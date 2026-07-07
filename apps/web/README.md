# OpenClaw — Frontend

SPA dashboard (Next.js App Router): auth, danh sách project, chi tiết project và cấu hình agent.

## Yêu cầu

- Node 20+
- Backend API (Nest + Better Auth) hoặc **Mock API** khi dev UI

## Cài đặt & chạy

```bash
cd frontend
npm install
npm run dev
```

Mặc định: [http://localhost:8386](http://localhost:8386) → **`/`** redirect **`/dashboard`**.

### Biến môi trường

Tạo `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8387
# Dev UI không cần backend thật:
# NEXT_PUBLIC_MOCK_API=true
```

## Luồng routing (flow hiện tại)

| URL | Ý nghĩa |
|-----|---------|
| `/` | Redirect → `/dashboard` |
| `/login`, `/register` | Auth (public) |
| `/dashboard` | Trang chủ dash: danh sách project (cards + modal tạo) |
| `/projects` | Danh sách project (layout riêng) |
| `/projects/new` | Form tạo project |
| `/project/{slug}-{id}` | Chi tiết project (tổng quan) — `slug` từ tên hiển thị + `id` là id backend |
| `/project/{slug}-{id}/info` | Chi tiết — phần thông tin |
| `/project/{slug}-{id}/agent` | Chi tiết — API keys / agent |

**Lưu ý:** không còn URL dạng `/{username}/{project}`. Hàm dựng đường dẫn: `lib/project-route.ts` (`getProjectOverviewPath`, …).

### Bảo vệ route & static

`proxy.ts` (middleware/route guard trong setup hiện tại): session hợp lệ qua cookie + gọi `get-session`; user chưa đăng nhập → `/login`. File tĩnh (`.png`, …) được bỏ qua để `next/image` không bị redirect HTML.

## Scripts

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm run start    # chạy bản production
npm run lint     # ESLint
```

## Tài liệu trong repo

- **Quy trình & checklist:** [.agent/workflow.md](.agent/workflow.md)
- **Quy tắc code:** [.agent/rule.md](.agent/rule.md)
- **Tiến độ & nợ kỹ thuật:** [.agent/note.md](.agent/note.md)

## Stack ngắn gọn

Next.js 16, React 19, TypeScript, Zustand, Zod, react-hook-form, Axios, Radix UI.
