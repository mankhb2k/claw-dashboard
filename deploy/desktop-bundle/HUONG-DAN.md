# Claw Dashboard Desktop Bundle

Gói cài đặt cho người dùng **không cần clone repo**, chỉ cần Docker Desktop.

---

## Dành cho người dùng cuối

### Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã cài và đang chạy (biểu tượng cá voi ở khay hệ thống)
- Windows 10/11 hoặc macOS (Linux: dùng `start-studio.sh`)

### Cài đặt (Windows)

1. Tải file **`claw-dashboard-desktop.zip`** từ [GitHub Releases](https://github.com/mankhb2k/claw-dashboard/releases)
2. Giải nén vào thư mục bất kỳ (ví dụ `C:\Claw Dashboard`)
3. **Double-click** `Setup-Claw-Dashboard.bat`
4. Đợi tải image (lần đầu 5–15 phút tùy mạng)
5. Trình duyệt mở `http://localhost:8386`
6. Đăng nhập: **admin** / **admin123** → tạo project → thêm API key AI

### Dừng / chạy lại

| Việc | Cách |
|------|------|
| Dừng | Double-click `Stop-Claw-Dashboard.bat` |
| Chạy lại | Double-click `Setup-Claw-Dashboard.bat` |
| Quản lý GUI | Docker Desktop → **Containers** → nhóm **claw-dashboard** |

### Đổi mật khẩu (tùy chọn)

Mở file `.env` (tự tạo lần đầu từ `.env.example`), sửa:

```env
SELF_HOST_USER_PASSWORD=mat-khau-moi
JWT_SECRET=chuoi-ngau-nhien-dai
POSTGRES_PASSWORD=mat-khau-db
OPENCLAW_GATEWAY_TOKEN=token-gateway
```

Sau đó chạy lại `Setup-Claw-Dashboard.bat`.

### Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|------------|
| `Bind for 127.0.0.1:5432 failed: port is already allocated` | Dev stack (`pnpm dev:runtime`) hoặc Postgres khác đang chạy | Dừng dev: `docker compose -f deploy/docker-compose.runtime.yml down` + tắt `pnpm dev` (api/web). Hoặc chạy `Stop-Claw-Dashboard.bat` |
| Tương tự cổng `8386`, `8387`, `18789` | API/Web dev trên host hoặc stack cũ | Tắt tiến trình Node đang listen cổng đó |
| Chat lỗi `No API key found` (DeepSeek) | Image cũ trước khi có fix `models.providers.apiKey` | Dùng `CLAW_DASHBOARD_IMAGE_TAG=latest` và `docker compose pull` |
| Chat lỗi `WorkspaceVanishedError` / workspace trống | Gateway attest workspace trước khi API seed file | API mới tự repair khi khởi động; `docker compose restart api gateway` sau khi cập nhật image |
| Gateway không healthy / chờ mãi | Chưa có `openclaw.json` trên volume | Đợi API khởi động xong (tạo project `default`); xem log `claw-dashboard-api` |

**Lưu ý:** Desktop bundle và dev local **không chạy song song** — cùng dùng cổng `5432`, `8386`, `8387`, `18789`.

---

## Dành cho maintainer — đóng gói ZIP lên GitHub

### Cấu trúc gói

```text
claw-dashboard-desktop/
├── docker-compose.yml
├── .env.example
├── Cai-Claw Dashboard.bat          # Windows: cài + chạy
├── Stop-Claw-Dashboard.bat         # Windows: dừng
├── start-studio.sh         # Mac/Linux: cài + chạy
├── stop-studio.sh          # Mac/Linux: dừng
├── HUONG-DAN.md             # File này
└── scripts/
    └── gateway-entrypoint.sh
```

**Không** đưa file `.env` thật (có secret) vào git hoặc zip công khai.

### Bước 1 — Tạo file ZIP

**Windows (PowerShell):**

```powershell
cd deploy\desktop-bundle
.\build-zip.ps1
# Hoặc chỉ định version:
.\build-zip.ps1 -Version "1.0.0"
```

File ra: `deploy\dist\claw-dashboard-desktop-1.0.0.zip`

**macOS / Linux:**

```bash
cd deploy/desktop-bundle
chmod +x start-studio.sh stop-studio.sh scripts/gateway-entrypoint.sh
./build-zip.sh 1.0.0
```

### Bước 2 — Kiểm tra trước khi publish

1. Giải nén zip vào thư mục tạm
2. Chạy `Cai-Claw Dashboard.bat` (hoặc `start-studio.sh`)
3. Xác nhận `http://localhost:8386` mở được
4. Docker Desktop hiện nhóm **claw-dashboard** với 4 container

### Bước 3 — Tạo GitHub Release

**Qua giao diện GitHub:**

1. Vào repo → **Releases** → **Draft a new release**
2. Tag: `desktop-v1.0.0` (hoặc gắn vào tag app chính)
3. Title: `Claw Dashboard Desktop 1.0.0`
4. Mô tả ngắn (copy mẫu bên dưới)
5. Kéo thả `claw-dashboard-desktop-1.0.0.zip` vào **Attach binaries**
6. **Publish release**

**Qua CLI (`gh`):**

```bash
cd deploy/dist
gh release create desktop-v1.0.0 \
  claw-dashboard-desktop-1.0.0.zip \
  --title "Claw Dashboard Desktop 1.0.0" \
  --notes "## Cài đặt nhanh (Windows)

1. Tải \`claw-dashboard-desktop-1.0.0.zip\`
2. Giải nén
3. Chạy \`Cai-Claw Dashboard.bat\`
4. Mở http://localhost:8386 — đăng nhập admin / admin123

Yêu cầu: Docker Desktop đang chạy."
```

### Bước 4 — Link tải cho user

Sau khi publish, link dạng:

```text
https://github.com/mankhb2k/claw-dashboard/releases/download/desktop-v1.0.0/claw-dashboard-desktop-1.0.0.zip
```

Đặt link này trên README, website, hoặc Docker Hub description.

### Cập nhật phiên bản mới

1. Sửa `CLAW_DASHBOARD_IMAGE_TAG` trong `.env.example` nếu pin tag cụ thể
2. Chạy lại `build-zip.ps1 -Version "1.0.1"`
3. Tạo release mới với zip mới

---

## Ghi chú kỹ thuật

- Image pull từ Docker Hub: `claw-dashboard/api`, `claw-dashboard/web`, `alpine/openclaw`, `postgres:16-alpine`
- Compose project name: `claw-dashboard` (hiển thị gom nhóm trong Docker Desktop)
- Dữ liệu lưu Docker volumes: `claw-dashboard-postgres-data`, `claw-dashboard-openclaw-data`
- Xóa sạch dữ liệu: `docker compose down -v` (trong thư mục gói)
