# Worker Directory Workflow

> Tài liệu tóm tắt nhanh cấu trúc `worker/` để onboard và tham chiếu khi chạy OpenClaw với Control UI.
> Bối cảnh kiến trúc tổng thể xem thêm ở `workflow.md` (root repo).

---

## 1) Mục tiêu của `worker/`

`worker/` là phần runtime OpenClaw (gateway + command/runtime logic) và UI dashboard (`control-ui`) dùng để điều khiển gateway.

Trong nhánh này, UI chính đang dùng là **Control UI** thay vì upstream `ui/`.

---

## 2) Các directory chính trong `worker/`

### `src/`
- Core runtime của OpenClaw (gateway, agents, commands, config, infra, tests).
- Là nơi backend/gateway chạy thực tế.
- `control-ui/src` có import chéo sang `worker/src/...` cho shared types/logic.

### `control-ui/`
- Mã nguồn dashboard (Vite + Lit).
- Entry dev/build nằm ở đây (`package.json`, `vite.config.ts`, `src/main.ts`).
- Build output hiện cấu hình ra `worker/vendor/control-ui`.

### `assets/`
- Tài nguyên tĩnh/asset dùng bởi runtime hoặc packaging.

### `.agent/`
- Tài liệu thao tác nội bộ cho agent/dev (ví dụ runbook sync/build/run).
- Nên giữ tài liệu workflow ngắn gọn, có command thực thi được.

### `.tmp-openclaw-upstream/`
- Bản mirror upstream để đối chiếu/sync theo version pin.
- Dùng khi cập nhật code upstream vào fork hiện tại.

### `apps/` (junction/symlink)
- Tham chiếu tới source app từ upstream/workspace setup.
- Chủ yếu phục vụ sync/tương thích import trong một số flow.

### `node_modules/`
- Dependency cài cho `worker/` package hiện tại.

---

## 3) File quan trọng ở root `worker/`

- `Dockerfile`: build image runtime.
- `openclaw-version.pin`: version upstream đang pin.
- `openclaw-src.ref.json`: metadata tham chiếu source upstream.
- `package.json`: package cục bộ của workspace `worker`.
- `tsconfig.json`: config TypeScript cho phần `worker` package.

---

## 4) Workflow thường dùng

### A. Chạy gateway + dashboard trên cùng cổng (khuyến nghị cho run thực tế)
1. Build UI assets:
   - `pnpm ui:build`
2. Chạy gateway:
   - `npx openclaw gateway run --bind loopback --port 18789`
3. Lấy dashboard URL:
   - `npx openclaw dashboard --no-open`

Ghi chú:
- Gateway serve Control UI từ `dist/control-ui` (hoặc path override qua `gateway.controlUi.root`).
- Ít vấn đề CORS hơn so với tách cổng.

### B. Dev UI hot-reload (khuyến nghị khi chỉnh UI liên tục)
1. Chạy gateway:
   - `npx openclaw gateway run --bind loopback --port 18789`
2. Chạy UI dev server:
   - `cd control-ui`
   - `npm run dev`
3. Mở UI dev server (mặc định Vite port 5173).

Ghi chú:
- Mode này tiện cho vòng lặp sửa giao diện nhanh.
- Có thể cần xử lý CORS/origin theo config gateway.

---

## 5) Quy ước tham chiếu path

- **Không dùng** `worker/src/control-ui` (không phải cấu trúc chuẩn ở repo này).
- UI source nằm ở `worker/control-ui/src`.
- Backend/runtime nằm ở `worker/src`.
- Nếu thấy import kiểu `../../../src/...` trong Control UI thì đang tham chiếu sang backend shared logic ở `worker/src`.

---

## 6) Khi cần đọc thêm

- Tổng quan kiến trúc & roadmap: `workflow.md` (root).
- Runbook chạy NodeJS/gateway: `worker/.agent/run-openclaw-nodejs.md`.
- Hướng dẫn dùng control-ui: `worker/.agent/use-control-ui.md`.
- Hướng dẫn sync từ upstream: `worker/.agent/sync-control-ui.md`.
