# Run OpenClaw Gateway Directly (Node.js, No Docker)

> Chạy OpenClaw v2026.4.5 trực tiếp từ node_modules, không cần Docker.
>
> Setup: 2026-04-21

---

## Tại Sao Cách Này Tốt Hơn Docker?

| Yếu tố | Docker | Node.js trực tiếp |
|--------|--------|-----------------|
| **Tốc độ khởi động** | 5-10 giây | < 1 giây |
| **Setup** | Build image 10-15 phút | npm install 2-3 phút |
| **Phát triển** | Rebuild khi thay đổi | Dev mode tự load |
| **Dung lượng** | ~800MB image | ~200MB node_modules |
| **Debug** | Logs từ container | Logs trực tiếp stdout |

---

## Prerequisites

✅ Đã có:
- `npm install` xong phiên bản **2026.4.5** chính xác
- Junctions: `src/` → upstream/src, `apps/` → upstream/apps
- Control-UI source

✅ Kiểm tra:
```bash
node --version
# v24.12.0 (requires >= v22.12)

npx openclaw --version
# 🦞 OpenClaw 2026.4.5
```

---

## Step 1: Tạo Dev Profile (Tùy Chọn)

Tạo config riêng để không ảnh hưởng đến environment chính:

```bash
cd worker

# Chạy lần đầu với --dev để setup
npx openclaw --dev --profile test-gateway gateway run
```

Hoặc dùng default profile (~/.openclaw):

```bash
npx openclaw gateway run
```

---

## Step 2: Chạy Gateway

### Option A: Chạy Foreground (Dễ debug, xem logs real-time)

```bash
cd worker

npx openclaw gateway run \
  --bind lan \
  --port 18789 \
  --dev \
  --verbose
```

**Output:**
```
🦞 OpenClaw 2026.4.5
[INFO] Gateway listening on ws://0.0.0.0:18789
[INFO] Gateway ready for connections
```

### Option B: Chạy Background (Production-like)

```bash
cd worker

# Start in background
npx openclaw gateway start

# Check status
npx openclaw gateway status

# View logs
npx openclaw gateway call health

# Stop
npx openclaw gateway stop
```

---

## Step 3: Chạy Control-UI

Trong terminal khác:

```bash
cd worker/control-ui

# Dev server với hot reload
npm run dev

# Hoặc production build
npm run build && npx serve -s vendor/control-ui
```

---

## Step 4: Test Gateway

### Health Check

```bash
curl http://localhost:18789/healthz
# Returns: 200 OK
```

### Gateway API

```bash
# Via CLI
npx openclaw gateway call health

# Via WebSocket
npx openclaw gateway discover
```

### WebSocket Connection (Browser Console)

```javascript
const ws = new WebSocket('ws://localhost:18789');
ws.onopen = () => console.log('✅ Connected');
ws.onerror = (e) => console.error('❌ Error:', e);
```

---

## Complete Quick Start

**Terminal 1: Gateway (Node.js)**
```bash
cd worker
npx openclaw gateway run --bind lan --port 18789 --dev --verbose
```

**Terminal 2: Control-UI**
```bash
cd worker/control-ui
npm run dev
```

**Terminal 3: Browser**
```
http://localhost:5173
```

---

## Configuration

### Environment Variables

```bash
# Gateway port
export OPENCLAW_GATEWAY_PORT=18789

# Gateway token (for auth)
export OPENCLAW_GATEWAY_TOKEN=your-secret-token

# Config directory
export OPENCLAW_CONFIG_DIR=~/.openclaw

# Time zone
export OPENCLAW_TZ=UTC
```

### Custom Config File

```bash
# Edit config
npx openclaw config

# Or view current
npx openclaw config get
```

---

## Dev Mode

Chạy với `--dev` để:
- Tạo config/workspace fresh
- Use port 19001 (thay vì 18789)
- Isolate state under ~/.openclaw-dev

```bash
npx openclaw --dev gateway run
```

**Check dev state:**
```bash
ls ~/.openclaw-dev/
# Should have: config/, workspace/, sessions/
```

---

## Logs & Debugging

### Real-time Logs

```bash
# Verbose output
npx openclaw gateway run --verbose

# Compact format
npx openclaw gateway run --compact

# Custom log level
npx openclaw --log-level debug gateway run
```

### Stream Raw Events (JSONL)

```bash
npx openclaw gateway run --raw-stream --raw-stream-path ./stream.jsonl
```

---

## Common Commands

```bash
# Run gateway
npx openclaw gateway run

# Check status
npx openclaw gateway status

# Call gateway method
npx openclaw gateway call health

# View agents
npx openclaw agents list

# View channels
npx openclaw channels list

# Open dashboard
npx openclaw dashboard
```

---

## Troubleshooting

### Gateway Won't Start

**Error:** `Port 18789 already in use`

**Solution:**
```bash
# Kill existing process
lsof -ti :18789 | xargs kill -9

# Or use different port
npx openclaw gateway run --port 18790 --force
```

### Control-UI Can't Connect

**Problem:** WebSocket connection fails

**Check:** Gateway is listening
```bash
curl http://localhost:18789/healthz
# Should return 200
```

**Fix:** Use correct bind mode
```bash
# For local only
npx openclaw gateway run --bind loopback --port 18789

# For network
npx openclaw gateway run --bind lan --port 18789
```

### Node Version Issue

**Error:** `Node.js v22.12+ is required`

**Solution:** Upgrade Node
```bash
node --version

# If < v22.12, upgrade via nvm
nvm install 24
nvm use 24
```

---

## Comparing with Docker Approach

### Docker (from `run-openclaw-local.md`)
```bash
# Build image (10-15 minutes)
docker build -t openclaw:2026.4.5 .

# Run container
docker-compose up openclaw-gateway
```

### Node.js Direct (Faster)
```bash
# Direct run (< 1 second)
npx openclaw gateway run --bind lan
```

---

## Advanced: Run as System Service

Install as systemd/launchd service:

```bash
# Install
npx openclaw gateway install

# Start service
npx openclaw gateway start

# Check status
npx openclaw gateway status

# View logs
journalctl -u openclaw-gateway -f

# Stop service
npx openclaw gateway stop

# Uninstall
npx openclaw gateway uninstall
```

---

## Integration with Control-UI

Control-UI automatically:
- Imports from `../../../src/` (via junctions)
- Connects to `ws://localhost:18789` (configurable)
- Sends commands to gateway
- Receives agent responses

**If CORS/WebSocket issues:**

1. Check gateway binding:
   ```bash
   npx openclaw gateway run --bind lan
   ```

2. Check firewall allows port 18789

3. Verify junctions:
   ```bash
   ls src/gateway/events.ts
   ```

---

## Comparison: Docker vs Node.js

| Task | Docker | Node.js |
|------|--------|---------|
| First time setup | 20 minutes | 3 minutes |
| Start gateway | 5 seconds | 0.5 seconds |
| Change code | Rebuild image | Auto-reload |
| View logs | `docker logs` | Direct output |
| Stop | Ctrl+C or docker-compose down | Ctrl+C |
| Storage used | 800 MB | 200 MB |

**Recommendation:**
- **Development:** Node.js direct (faster iteration)
- **Testing:** Node.js direct (easier debugging)
- **Production:** Docker (isolated, versioned)

---

## Next Steps

1. ✅ Pin version to 2026.4.5 (done)
2. ✅ Run gateway: `npx openclaw gateway run`
3. ✅ Build control-ui: `npm run ui:build`
4. ✅ Run control-ui: `npm run dev`
5. ✅ Test in browser: http://localhost:5173

---

## References

- **OpenClaw CLI docs:** `npx openclaw --help`
- **Gateway commands:** `npx openclaw gateway --help`
- **Config:** `npx openclaw config`
- **Control-UI:** `use-control-ui.md`
- **Sync:** `sync-control-ui.md`
