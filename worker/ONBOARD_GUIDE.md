# OpenClaw Onboarding Guide

## Quick Start

Thay vì chạy lệnh CLI trực tiếp (có vấn đề Windows paths), bây giờ bạn có thể dùng **Onboard UI Server**.

### Step 1: Chạy Onboard Server

```bash
npm run onboard
```

Output:
```
╔══════════════════════════════════════════════════════════════╗
║  🦞 OpenClaw Onboard Server                                  ║
╚══════════════════════════════════════════════════════════════╝

📍 Mở trình duyệt: http://localhost:18788
⏱️  Sau khi thiết lập xong, chạy: npm run gateway:run
```

### Step 2: Mở Trình Duyệt

Truy cập: **http://localhost:18788**

Bạn sẽ thấy form với 2 tùy chọn:

#### Option A: Dùng API Key (Recommended)
- **Anthropic Claude** → Nhập API key từ https://console.anthropic.com
- **Google Gemini** → Nhập API key từ https://ai.google.dev
- **OpenAI** → Nhập API key từ https://platform.openai.com

**Ưu điểm:**
- Nhanh, không cần cài thêm gì
- Cloud-based, tính toán trên server

#### Option B: DeepSeek-R1 (Ollama — Cục bộ)
- Chọn model: 1.5B / 8B / 14B
- Cần cài Ollama trước: https://ollama.com
- Chạy local, không gửi dữ liệu ra cloud

**Ưu điểm:**
- Không cần API key
- Kiểm soát hoàn toàn dữ liệu
- Chạy offline

### Step 3: Xác Nhận & Chạy

1. Đánh dấu ☑️ "Tôi hiểu rủi ro..."
2. Click **"Chạy thiết lập"**
3. Chờ ~1 phút để quá trình hoàn tất
4. **Tự động:**
   - ✅ Onboard CLI chạy xong
   - ✅ Gateway khởi động ở port 18789
   - ✅ Tự động redirect đến dashboard

**Không cần chạy lệnh thêm!** 🎉

Server onboard sẽ:
- Chạy CLI onboard
- Tự động start gateway trong background
- Redirect browser đến http://localhost:18789

Nếu muốn dừng gateway, chỉ cần đóng terminal (hoặc Ctrl+C trên onboard server).

---

## Tại sao Dùng UI Server?

### ❌ Vấn đề CLI (Windows):
```bash
npm run gateway:onboard
# Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: 
# Only URLs with a scheme in: file, data, and node are supported...
# Received protocol 'd:'
```

Windows paths (`d:\...`) không match ESM module loader.

**PLUS:** Lỗi "Gateway did not become reachable" vì CLI chờ gateway running (nhưng gateway chưa start).

### ✅ Giải Pháp UI Server:
- ✅ Node.js xử lý path đúng cách (internal)
- ✅ Không gặp ESM URL errors
- ✅ Thêm `--skip-daemon --skip-health` flags (giống Electron)
- ✅ Giao diện thân thiện + real-time feedback
- ✅ Tự động start gateway sau onboard

### 🎯 CLI Flags (từ Electron):
```javascript
// Electron version (openclaw-1click) dùng:
--skip-daemon     // Không cài daemon service
--skip-health     // Bỏ qua health check (không chờ gateway)
```

UI Server đã thêm 2 flags này → **Hoạt động như Electron!**

---

## 🎯 Automatic Gateway Start

**Nếu setup thành công**, onboard server **tự động khởi động gateway** cho bạn:

```
✅ Thiết lập thành công!
Gateway đang khởi động trên port 18789...
(Chuyển hướng tới dashboard)
```

### Cách hoạt động:

1. **Onboard hoàn tất** → Mark file `.onboard-completed`
2. **Gateway start** → `openclaw gateway run --bind loopback --port 18789`
3. **Browser redirect** → http://localhost:18789

### Nếu muốn dừng:
- Đóng terminal (hoặc Ctrl+C) → Gateway sẽ dừng
- Onboard server + Gateway sẽ cùng dừng

### Nếu muốn chạy riêng:
```bash
# Terminal 1: Onboard (chỉ UI, không run gateway)
PORT=18788 npm run onboard

# Terminal 2: Gateway (riêng)
npm run gateway:run
```

---

## Development

### Modify Onboard UI

Edit: `public/onboard.html`
- HTML form
- CSS styling  
- Client-side validation

### Modify API Server

Edit: `onboard-server.js`
- CLI arguments builder
- File serving
- Error handling

---

## Troubleshooting

### Port 18788 đã dùng?
```bash
PORT=18790 npm run onboard
```

### Ollama không tìm thấy?
1. Tải: https://ollama.com
2. Mở ứng dụng Ollama
3. Check taskbar (biểu tượng khay hệ thống)
4. Quay lại form, UI sẽ tự detect

### API key không nhận?
- Kiểm tra API key đúng format
- Không có khoảng trắng ở đầu/cuối
- Thử cấp API key mới từ dashboard nhà cung cấp

### Sau khi onboard, vẫn bị lỗi khi chạy gateway?
1. Kiểm tra: `~/.openclaw/config.json` tồn tại
2. Xóa: `~/.openclaw/.onboard-completed`
3. Chạy lại: `npm run onboard`

---

## Architecture

```
User opens http://localhost:18788
    ↓
Browser renders onboard.html (static)
    ↓
User inputs: API key + choose model
    ↓
Click "Chạy thiết lập"
    ↓
POST /api/onboard/run → onboard-server.js
    ↓
Node.js spawn child_process("npx openclaw onboard ...")
    ↓
CLI runs with proper env vars + arguments
    ↓
JSON response → Browser shows progress/result
    ↓
Auto-redirect to gateway (localhost:18789)
```

---

## Next Steps

1. ✅ Chạy onboard server: `npm run onboard`
2. ✅ Thiết lập qua UI
3. ✅ Chạy gateway: `npm run gateway:run`
4. ✅ Truy cập dashboard: http://localhost:18789

Cần giúp gì? Kiểm tra `/vendor/control-ui/` để hiểu thêm về dashboard.
