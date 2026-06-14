# Aucomcp

Hosted MCP connector service for [AucoBot](https://github.com/) / OpenClaw. Runs pre-built connector tools (Google Drive, Google Calendar) over **Streamable HTTP MCP** so the OpenClaw gateway does not need `npx` or local MCP processes.

## Architecture

```
OpenClaw gateway  --streamable-http-->  aucomcp  --internal API-->  aucobot api  -->  Postgres
                                              |
                                              +--> Google APIs (googleapis)
```

- **OAuth & secrets:** AucoBot API (`connectors/adapters/google`)
- **Runtime tools:** aucomcp (`src/connectors/google/`)
- **Config sync:** `AUCOMCP_BASE_URL` → `openclaw.json` `mcp.servers[].url`

## Connectors

| Slug | MCP path | Tools |
|------|----------|-------|
| `google-drive` | `/connectors/google-drive/mcp` | 25 tools (piotr-agier parity, hosted) |
| `google-calendar` | `/connectors/google-calendar/mcp` | 6 tools |

### Google Drive tools

`search`, `createTextFile`, `updateTextFile`, `createFolder`, `listFolder`, `listSharedDrives`, `deleteItem`, `renameItem`, `moveItem`, `copyFile`, `uploadFile`, `downloadFile`, `listPermissions`, `addPermission`, `updatePermission`, `removePermission`, `shareFile`, `convertPdfToGoogleDoc`, `bulkConvertFolderPdfs`, `uploadPdfWithSplit`, `getRevisions`, `restoreRevision`, `createShortcut`, `lockFile`, `unlockFile`

**Hosted adaptations:**

- `uploadFile` / `uploadPdfWithSplit` use `contentBase64` (not local paths)
- `downloadFile` returns content **inline** (`returnInline: true` default) — text export or base64 for binary (~4MB cap)
- Auth debug tools (`authGetStatus`, etc.) are omitted (multi-tenant hosted)

### Google Calendar tools

`listCalendars`, `getCalendarEvents`, `getCalendarEvent`, `createCalendarEvent`, `updateCalendarEvent`, `deleteCalendarEvent`

## Breaking changes (v0.2)

| Old (MVP) | New |
|-----------|-----|
| `list_files` | `listFolder` |
| `read_file` | `downloadFile` (inline) |
| `list_calendars` | `listCalendars` |
| `list_events` | `getCalendarEvents` |
| `create_event` | `createCalendarEvent` |

Update agent prompts/skills to use camelCase tool names.

## OAuth

- **Drive:** full scope `https://www.googleapis.com/auth/drive` (read + write)
- **Calendar:** `https://www.googleapis.com/auth/calendar`

After upgrading Drive scope, users must **disconnect and reconnect** Google Drive on the AucoBot dashboard so the refresh token includes write permissions.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | no (8080) | HTTP port |
| `HOST` | no (0.0.0.0) | Bind address |
| `MCP_SERVICE_SECRET` | yes | Shared with AucoBot API — signs/verifies project tokens |
| `AUCOBOT_INTERNAL_API_URL` | yes | e.g. `http://api:3001` |

Copy [`.env.example`](.env.example) to `.env` for local dev.

## Local development

```bash
cd aucomcp
npm install
cp .env.example .env
# Start aucobot api on :3001 with MCP_SERVICE_SECRET set
npm run dev
curl http://localhost:8080/healthz
npm test
```

## Docker (via AucoBot compose)

From `aucobot/`:

```bash
cp deploy/.env.example deploy/.env
# Set MCP_SERVICE_SECRET and AUCOMCP_BASE_URL=http://mcp:8080
docker compose -f deploy/docker-compose.yml up -d --build mcp api gateway
```

## Auth flow

1. AucoBot sync writes `mcp.servers` with `Authorization: Bearer <project-jwt>` (7-day TTL, re-sync on connector change).
2. Aucomcp verifies JWT (`purpose: mcp_project`, `projectId`, `connectorSlug`).
3. Aucomcp fetches decrypted secrets via `GET /api/internal/mcp/projects/:id/connectors/:slug/secrets` with header `X-Mcp-Service-Secret`.

## Fallback

Unset `AUCOMCP_BASE_URL` on AucoBot API to keep legacy `npx` MCP entries in `openclaw.json`.

## E2E checklist (manual)

1. `docker compose` with api + mcp + gateway
2. Re-connect Google Drive (new OAuth scope) + Calendar
3. Sync workspace → `openclaw.json` has `url` + `streamable-http`
4. Agent calls: `listFolder`, `createTextFile`, `getCalendarEvents`
5. Verify JWT for project A cannot access project B secrets
