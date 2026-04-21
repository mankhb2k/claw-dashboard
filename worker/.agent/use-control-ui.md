# Using Control-UI Instead of Original OpenClaw UI

> How to run OpenClaw (2026.4.5) with control-ui fork instead of the upstream ui package.
>
> Setup: 2026-04-21

---

## Overview

OpenClaw's default UI is in `ui/` (upstream). To use your custom fork (`control-ui/`) instead, you need to:

1. **Build control-ui** → produces `vendor/control-ui/`
2. **Replace the UI** in the OpenClaw runtime/build
3. **Run OpenClaw** pointing to control-ui

---

## Prerequisites

✅ Done:
- Upstream cloned to `.tmp-openclaw-upstream/` (v2026.4.5)
- Junctions created: `src/` → upstream/src, `apps/` → upstream/apps
- `control-ui/` source synced from upstream

Required:
- control-ui built and tested
- Node.js 18+
- Docker (if running containers)

---

## Step 1: Build Control-UI

```bash
cd worker/control-ui

# Install dependencies
npm install

# Build to vendor/control-ui/
npm run build
```

**Output:** `worker/vendor/control-ui/index.html` + assets

Verify build succeeded:
```bash
ls vendor/control-ui/index.html
# Should exist
```

---

## Step 2: Understand the Deployment Strategies

There are 3 ways to use control-ui in OpenClaw:

### Strategy A: Replace UI at Build Time (Recommended for Docker)

When building the OpenClaw Docker image, **embed control-ui** instead of original ui.

**How it works:**

OpenClaw Docker image includes a web server that serves the UI. You can:
1. Mount `control-ui/vendor/` when running the container
2. Or build a custom Docker image that includes control-ui in the image

**Example — Mount volume (Dev/Testing):**
```bash
docker run \
  -p 3000:3000 \
  -v $(pwd)/vendor/control-ui:/app/ui/dist:ro \
  openclaw:2026.4.5
```

**Example — Custom Docker image (Production):**
```dockerfile
# Dockerfile.control-ui
FROM openclaw:2026.4.5

# Copy control-ui build into the image
COPY vendor/control-ui /app/ui/dist
```

### Strategy B: Proxy/Reverse Proxy (For Running Locally)

Run **two separate servers**:
1. OpenClaw API on port 3000
2. Control-UI dev server on port 5173 (Vite default)

Browser makes requests to both:
```
http://localhost:3000/api/...        ← OpenClaw API
http://localhost:5173                ← Control-UI (dev mode)
                                        (imports from ../../../src/ via junctions)
```

**Setup:**
```bash
# Terminal 1: Run OpenClaw (Docker container or local)
docker run -p 3000:3000 openclaw:2026.4.5

# Terminal 2: Run control-ui dev server
cd worker/control-ui
npm run dev
# Vite listens on http://localhost:5173
```

Browser navigates to `http://localhost:5173` → loads control-ui UI → makes API calls to `http://localhost:3000`.

### Strategy C: Serve UI from OpenClaw (Custom Build)

Build OpenClaw with embedded control-ui. Requires modifying OpenClaw's build process to use control-ui instead of ui/.

---

## Step 3: Choose Your Strategy

| Strategy | Use Case | Complexity | Notes |
|----------|----------|-----------|-------|
| **A: Mount Volume** | Local testing, quick iteration | Low | No Docker build, just mount |
| **B: Proxy** | Development, debugging | Low | Two servers, browser handles CORS |
| **C: Custom Build** | Production, single image | High | Requires Dockerfile modification |

---

## Recommended: Strategy A (Local Testing)

### Build control-ui
```bash
cd worker
npm run ui:build
# Produces: vendor/control-ui/
```

### Run OpenClaw with mounted control-ui
```bash
# Assuming OpenClaw image exists: openclaw:2026.4.5
docker run \
  --name openclaw-dev \
  -p 3000:3000 \
  -e DEBUG=openclaw:* \
  -v $(pwd)/vendor/control-ui:/app/ui/dist:ro \
  openclaw:2026.4.5
```

### Test
```bash
# API health check
curl http://localhost:3000/api/health

# UI should load from control-ui
open http://localhost:3000
```

---

## Recommended: Strategy B (Development with Hot Reload)

Best for **active development** of control-ui.

### Terminal 1: Run OpenClaw API
```bash
docker run \
  -p 3000:3000 \
  -e NODE_ENV=development \
  openclaw:2026.4.5
```

### Terminal 2: Run Control-UI with Hot Reload
```bash
cd worker/control-ui
npm run dev
# Vite dev server on http://localhost:5173
```

### Terminal 3: Access UI
Open browser to `http://localhost:5173`

**How it works:**
- Control-UI (port 5173) imports from `../../../src/` (resolves via junctions)
- Control-UI makes API calls to `http://localhost:3000`
- CORS: Configure OpenClaw API to allow `http://localhost:5173` origin

**If CORS errors occur:**

In OpenClaw API, ensure CORS is enabled for localhost:
```typescript
// Example: OpenClaw API (src/main.ts or similar)
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
});
```

---

## Step 4: Build OpenClaw Container (If Needed)

If using **Strategy A or C**, you may need to build the OpenClaw image locally.

Check if image exists:
```bash
docker images | grep openclaw
```

If not, build from upstream:
```bash
cd .tmp-openclaw-upstream

# Build worker image
docker build -t openclaw:2026.4.5 -f Dockerfile.worker .

# Or build with custom control-ui (Strategy C)
docker build -t openclaw-custom:2026.4.5 \
  --build-arg UI_PATH=../control-ui/vendor/control-ui \
  -f Dockerfile.worker .
```

---

## Summary: Quick Start Commands

### For Development (Strategy B — Recommended)

```bash
# Terminal 1: OpenClaw API
docker run -p 3000:3000 openclaw:2026.4.5

# Terminal 2: Control-UI with hot reload
cd worker/control-ui && npm run dev

# Terminal 3: Browser
open http://localhost:5173
```

### For Testing (Strategy A)

```bash
# Build control-ui once
cd worker && npm run ui:build

# Run with mounted volume
docker run -p 3000:3000 \
  -v $(pwd)/vendor/control-ui:/app/ui/dist:ro \
  openclaw:2026.4.5

# Browser
open http://localhost:3000
```

---

## Troubleshooting

### CORS Errors When Control-UI Calls API

**Problem:** `Access to XMLHttpRequest at 'http://localhost:3000/api/...' blocked by CORS`

**Solution:** OpenClaw API must allow control-ui origin:
```typescript
app.enableCors({
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:5173', 'http://localhost:3000']
    : ['https://yourdomain.com'],
  credentials: true,
});
```

### Junctions Not Resolving (Build Fails)

**Problem:** `UNRESOLVED_IMPORT ../../../src/...`

**Solution:** Recreate junctions:
```powershell
cd worker
powershell -Command "New-Item -ItemType Junction -Path 'src' -Target '.tmp-openclaw-upstream\src' -Force"
powershell -Command "New-Item -ItemType Junction -Path 'apps' -Target '.tmp-openclaw-upstream\apps' -Force"
```

### control-ui Build Fails

**Problem:** Decorator syntax errors or TypeScript errors

**Solution:** Ensure `control-ui/tsconfig.json` has:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  }
}
```

Then rebuild:
```bash
cd worker/control-ui && npm run build
```

---

## Next Steps

1. **Choose strategy** (A, B, or C above)
2. **Build control-ui:** `npm run ui:build`
3. **Run OpenClaw** with your chosen strategy
4. **Test:** Verify UI loads and API works
5. **Iterate:** Modify control-ui, rebuild, test

---

## References

- **Sync documentation:** See `sync-control-ui.md`
- **Upstream:** https://github.com/openclaw/openclaw
- **Control-UI:** `worker/control-ui/`
- **Pinned version:** `worker/openclaw-version.pin`
