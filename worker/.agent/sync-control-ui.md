# Sync Control-UI with Upstream OpenClaw

> Procedures for keeping control-ui (fork of openclaw/ui/) synchronized with upstream releases.
>
> Current pinned version: **2026.4.5** (from `../openclaw-version.pin`)  
> Last updated: 2026-04-21

---

## Overview

Control-UI is a Lit + Vite web application forked from [openclaw/ui](https://github.com/openclaw/openclaw). The upstream repository is a monorepo where the UI package imports shared TypeScript utilities from the root `src/` and `apps/` directories.

**The Challenge:**  
When forked to `openclaw-saas/worker/control-ui/`, relative imports like `../../../src/gateway/events.ts` no longer resolve (no `src/` exists at `worker/src/`). Build fails with 23+ unresolved import errors.

**The Solution:**  
Use Windows directory junctions to transparently link `src/` and `apps/` to upstream source without copying files.

---

## Architecture: Why Junctions Work

### Import Resolution Problem

In upstream monorepo structure:
```
openclaw/                          ← monorepo root
├── src/                           ← shared source
│   ├── gateway/events.ts
│   ├── shared/operator-scope-compat.ts
│   └── auto-reply/commands-registry.shared.ts
├── apps/                          ← native app resources
│   └── shared/OpenClawKit/.../tool-display.json
└── ui/                            ← Control UI package
    └── src/ui/
        └── app-gateway.ts         → imports '../../../src/gateway/events.ts' ✓
```

When the UI is forked and relocated:
```
worker/control-ui/                 ← forked, renamed from ui/
├── src/ui/
│   └── app-gateway.ts             → tries to import '../../../src/gateway/events.ts'
│                                     resolves to: worker/src/ (doesn't exist!) ✗
└── (no ../../../src path matches upstream)
```

### Solution: Directory Junctions (Windows)

Directory junctions are OS-level symbolic references that transparently redirect filesystem reads. They appear as real directories to Vite/Rolldown.

```
worker/                            ← project root
├── src/                           ← junction → points to .tmp-openclaw-upstream/src
│   └── gateway/events.ts          (actually reads from .tmp-openclaw-upstream/src/gateway/events.ts)
├── apps/                          ← junction → points to .tmp-openclaw-upstream/apps
├── control-ui/                    ← control-ui source (fork)
│   └── src/ui/app-gateway.ts     → imports '../../../src/gateway/events.ts' ✓ (resolves via junction)
└── .tmp-openclaw-upstream/        ← upstream clone (temporary, in .gitignore)
    ├── src/
    ├── apps/
    └── ui/
```

**Why not Vite alias?**  
Vite 8 + Rolldown fail to resolve imports before checking aliases. The directory must physically (or virtually via junction) exist.

**Why not copy files?**  
Large, error-prone during sync, creates divergence when upstream updates.

---

## Prerequisites

Upstream source must be cloned before building. Verify:

```bash
ls .tmp-openclaw-upstream/src/gateway/events.ts
```

If missing:
```bash
npm run clone:upstream
# (or manually clone to .tmp-openclaw-upstream/)
```

---

## Sync Procedure

### Step 1: Review Upstream Changes

Check what changed between pinned version and upstream:

```bash
npm run compare:upstream
# Typically shows: control-ui/src/, control-ui/public/ diffs
```

### Step 2: Copy UI Source

Copy the upstream `ui/` into `control-ui/`:

```bash
# Copy source code
cp -r .tmp-openclaw-upstream/ui/src/          control-ui/src/

# Copy public assets
cp -r .tmp-openclaw-upstream/ui/public/       control-ui/public/
```

**Do NOT copy:**
- `ui/vite.config.ts` — fork has its own config
- `ui/package.json` — fork has custom dependencies
- `ui/tsconfig.json` — fork adds `experimentalDecorators` (required for TypeScript decorators)
- `ui/node_modules/` — never copy

### Step 3: Verify/Create Junctions

After copying source, ensure junctions exist:

```powershell
# Create junction: src → .tmp-openclaw-upstream/src
powershell -Command "New-Item -ItemType Junction -Path 'src' -Target '.tmp-openclaw-upstream\src' -Force"

# Create junction: apps → .tmp-openclaw-upstream/apps
powershell -Command "New-Item -ItemType Junction -Path 'apps' -Target '.tmp-openclaw-upstream\apps' -Force"
```

**Verify junctions exist and are correct:**

```bash
# Should show as junctions (symlink arrows in Windows Explorer)
dir src/gateway/events.ts
dir apps/shared/OpenClawKit/

# Or verify via PowerShell:
# powershell -Command "Get-Item src -Force | Select-Object LinkType"
# LinkType: SymbolicLink
```

### Step 4: Ensure TypeScript Config Exists

Control-UI requires decorators support. Verify `control-ui/tsconfig.json` contains:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  }
}
```

This is **required** — without it, Vite emits unprocessed decorator syntax (`@customElement` → `@ne(...)`) that crashes at runtime in Electron/Chromium.

### Step 5: Install Dependencies

```bash
npm run ui:install
# Installs control-ui/node_modules/
```

### Step 6: Build and Test

```bash
npm run ui:build
# Output: vendor/control-ui/ (ready for Electron)
```

**If build fails:**

| Error | Cause | Fix |
|-------|-------|-----|
| `UNRESOLVED_IMPORT ../../../src/...` | Junction `src/` missing | Re-run Step 3 |
| `UNRESOLVED_IMPORT ../../../apps/...` | Junction `apps/` missing | Re-run Step 3 |
| `SyntaxError: Invalid ... token` (runtime) | `tsconfig.json` missing `experimentalDecorators` | Re-run Step 4 |

---

## Complete Sync Workflow (Version Bump)

When upstream releases a new version (e.g., 2026.5.0), follow this:

```bash
# 1. Update version pin
echo "2026.5.0" > openclaw-version.pin
git add openclaw-version.pin

# 2. Clone/update upstream
npm run clone:upstream

# 3. Review changes
npm run compare:upstream
# Manually verify changes are intentional

# 4. Copy UI source
cp -r .tmp-openclaw-upstream/ui/src/    control-ui/src/
cp -r .tmp-openclaw-upstream/ui/public/ control-ui/public/

# 5. Recreate junctions
powershell -Command "New-Item -ItemType Junction -Path 'src' -Target '.tmp-openclaw-upstream\src' -Force"
powershell -Command "New-Item -ItemType Junction -Path 'apps' -Target '.tmp-openclaw-upstream\apps' -Force"

# 6. Install & build
npm run ui:install
npm run ui:build

# 7. Commit
git add control-ui/ openclaw-version.pin
git commit -m "chore: sync control-ui to upstream 2026.5.0"

# 8. Deploy (see workflow.md for full deployment steps)
```

---

## Pre-Commit Checklist

Before committing control-ui changes:

- [ ] **Version pin updated** — `openclaw-version.pin` matches upstream tag
- [ ] **Junctions exist** — `src/` and `apps/` are junctions (not real directories)
- [ ] **tsconfig.json preserved** — `control-ui/tsconfig.json` has `experimentalDecorators: true`
- [ ] **Build succeeds** — `npm run ui:build` → no errors
- [ ] **Output generated** — `vendor/control-ui/index.html` exists
- [ ] **vendor/ not committed** — `.gitignore` excludes `vendor/control-ui/`
- [ ] **No local customization lost** — Diff reviewed to ensure intentional changes only

---

## Troubleshooting

### Junctions Not Working (Windows)

```powershell
# Verify junction exists
Get-Item src -Force | Select-Object Target

# If corrupted, remove and recreate
Remove-Item src -Force -Recurse
New-Item -ItemType Junction -Path 'src' -Target '.tmp-openclaw-upstream\src'
```

### Import Still Unresolved After Creating Junctions

1. Verify upstream source is actually cloned:
   ```bash
   ls .tmp-openclaw-upstream/src/gateway/
   ```

2. Check junction target is correct:
   ```powershell
   Get-Item src -Force
   # Should show: Target = .../worker/.tmp-openclaw-upstream/src
   ```

3. Restart Vite dev server:
   ```bash
   npm run ui:build
   # or: npm run ui:dev
   ```

### TypeScript Decorator Errors at Runtime

If UI crashes with `Uncaught SyntaxError: Invalid or unexpected token` when @customElement is used:

1. Verify `control-ui/tsconfig.json` exists
2. Confirm it contains:
   ```json
   {
     "compilerOptions": {
       "experimentalDecorators": true,
       "useDefineForClassFields": false
     }
   }
   ```
3. Rebuild: `npm run ui:build`

---

## Git Configuration

Ensure `.gitignore` excludes junctions and temporary files:

```gitignore
# Windows directory junctions (recreated during build)
/src/
/apps/

# Temporary upstream clone
/.tmp-openclaw-upstream/

# Build output
/vendor/
```

---

## References

- **Upstream repository:** https://github.com/openclaw/openclaw
- **Pinned version location:** `openclaw-version.pin` (same directory as this file's parent)
- **Main workflow:** See `workflow.md` for version management policy and deployment schedule
- **Architecture notes:** See `ARCHITECTURE_DECOUPLING_STRATEGY.md` for image versioning details
