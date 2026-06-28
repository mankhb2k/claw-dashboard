# AucoBot Desktop Bundle

Gói cài đặt cho người dùng **không cần clone repo**, chỉ cần Docker Desktop.

---

## Dành cho người dùng cuối

### Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã cài và đang chạy (biểu tượng cá voi ở khay hệ thống)
- Windows 10/11 hoặc macOS (Linux: dùng `start-aucobot.sh`)

### Cài đặt (Windows)

1. Tải file **`aucobot-desktop.zip`** từ [GitHub Releases](https://github.com/aucobot/aucobot/releases)
2. Giải nén vào thư mục bất kỳ (ví dụ `C:\AucoBot`)
3. **Double-click** `Setup-AucoBot.bat`
4. Đợi tải image (lần đầu 5–15 phút tùy mạng)
5. Trình duyệt mở `http://localhost:8386`
6. Đăng nhập: **admin** / **admin123** → tạo project → thêm API key AI

### Dừng / chạy lại

| Việc | Cách |
|------|------|
| Dừng | Double-click `Dung-AucoBot.bat` |
| Chạy lại | Double-click `Setup-AucoBot.bat` |
| Quản lý GUI | Docker Desktop → **Containers** → nhóm **aucobot** |

### Đổi mật khẩu (tùy chọn)

Mở file `.env` (tự tạo lần đầu từ `.env.example`), sửa:

```env
SELF_HOST_USER_PASSWORD=mat-khau-moi
JWT_SECRET=chuoi-ngau-nhien-dai
POSTGRES_PASSWORD=mat-khau-db
OPENCLAW_GATEWAY_TOKEN=token-gateway
```

Sau đó chạy lại `Setup-AucoBot.bat`.

### Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|------------|
| `Bind for 127.0.0.1:5432 failed: port is already allocated` | Dev stack (`pnpm dev:runtime`) hoặc Postgres khác đang chạy | Dừng dev: `docker compose -f deploy/docker-compose.runtime.yml down` + tắt `pnpm dev` (api/web). Hoặc chạy `Dung-AucoBot.bat` |
| Tương tự cổng `8386`, `8387`, `18789` | API/Web dev trên host hoặc stack cũ | Tắt tiến trình Node đang listen cổng đó |
| Chat lỗi `No API key found` (DeepSeek) | Image cũ trước khi có fix `models.providers.apiKey` | Dùng `AUCOBOT_IMAGE_TAG=latest` và `docker compose pull` |
| Chat lỗi `WorkspaceVanishedError` / workspace trống | Gateway attest workspace trước khi API seed file | API mới tự repair khi khởi động; `docker compose restart api gateway` sau khi cập nhật image |
| Gateway không healthy / chờ mãi | Chưa có `openclaw.json` trên volume | Đợi API khởi động xong (tạo project `default`); xem log `aucobot-api` |

**Lưu ý:** Desktop bundle và dev local **không chạy song song** — cùng dùng cổng `5432`, `8386`, `8387`, `18789`.

---

## Dành cho maintainer — đóng gói ZIP lên GitHub

### Cấu trúc gói

```text
aucobot-desktop/
├── docker-compose.yml
├── .env.example
├── Cai-AucoBot.bat          # Windows: cài + chạy
├── Dung-AucoBot.bat         # Windows: dừng
├── start-aucobot.sh         # Mac/Linux: cài + chạy
├── stop-aucobot.sh          # Mac/Linux: dừng
├── HUONG-DAN.md             # File này
└── scripts/
    └── gateway-entrypoint.sh
```

**Không** đưa file `.env` thật (có secret) vào git hoặc zip công khai.

### Bước 1 — Tạo file ZIP

**Windows (PowerShell):**

```powershell
cd aucobot\deploy\desktop-bundle
.\build-zip.ps1
# Hoặc chỉ định version:
.\build-zip.ps1 -Version "1.0.0"
```

File ra: `aucobot\deploy\dist\aucobot-desktop-1.0.0.zip`

**macOS / Linux:**

```bash
cd aucobot/deploy/desktop-bundle
chmod +x start-aucobot.sh stop-aucobot.sh scripts/gateway-entrypoint.sh
./build-zip.sh 1.0.0
```

### Bước 2 — Kiểm tra trước khi publish

1. Giải nén zip vào thư mục tạm
2. Chạy `Cai-AucoBot.bat` (hoặc `start-aucobot.sh`)
3. Xác nhận `http://localhost:8386` mở được
4. Docker Desktop hiện nhóm **aucobot** với 4 container

### Bước 3 — Tạo GitHub Release

**Qua giao diện GitHub:**

1. Vào repo → **Releases** → **Draft a new release**
2. Tag: `desktop-v1.0.0` (hoặc gắn vào tag app chính)
3. Title: `AucoBot Desktop 1.0.0`
4. Mô tả ngắn (copy mẫu bên dưới)
5. Kéo thả `aucobot-desktop-1.0.0.zip` vào **Attach binaries**
6. **Publish release**

**Qua CLI (`gh`):**

```bash
cd aucobot/deploy/dist
gh release create desktop-v1.0.0 \
  aucobot-desktop-1.0.0.zip \
  --title "AucoBot Desktop 1.0.0" \
  --notes "## Cài đặt nhanh (Windows)

1. Tải \`aucobot-desktop-1.0.0.zip\`
2. Giải nén
3. Chạy \`Cai-AucoBot.bat\`
4. Mở http://localhost:8386 — đăng nhập admin / admin123

Yêu cầu: Docker Desktop đang chạy."
```

### Bước 4 — Link tải cho user

Sau khi publish, link dạng:

```text
https://github.com/aucobot/aucobot/releases/download/desktop-v1.0.0/aucobot-desktop-1.0.0.zip
```

Đặt link này trên README, website, hoặc Docker Hub description.

### Cập nhật phiên bản mới

1. Sửa `AUCOBOT_IMAGE_TAG` trong `.env.example` nếu pin tag cụ thể
2. Chạy lại `build-zip.ps1 -Version "1.0.1"`
3. Tạo release mới với zip mới

---

## Ghi chú kỹ thuật

- Image pull từ Docker Hub: `aucobot/api`, `aucobot/web`, `alpine/openclaw`, `postgres:16-alpine`
- Compose project name: `aucobot` (hiển thị gom nhóm trong Docker Desktop)
- Dữ liệu lưu Docker volumes: `aucobot-postgres-data`, `aucobot-openclaw-data`
- Xóa sạch dữ liệu: `docker compose down -v` (trong thư mục gói)
