# @aucobot/control-plane-core

Pure control-plane logic **without NestJS** — imported by `apps/api` (and later `cloud/api`).

## Current exports

- `gatewayTokenForNewProject()` — env `OPENCLAW_GATEWAY_TOKEN` or random token for DB
- `encryptSecret` / `decryptSecret` / `maskSecret` — AES-256-GCM for connector/channel/provider secrets
- `openGatewayUpstream(wsBaseUrl, token, projectDataDir)` — signed gateway WS connect + device pairing
- `CHAT_RPC_WHITELIST`, `isAllowedChatRpc`, `sessionKeyForAgent`
- Gateway device auth/identity/pairing helpers (used by upstream connect)
- **OSS JWT auth:** `signAccessToken`, `verifyAccessToken`, refresh token helpers, cookie specs, `ensureSelfHostDefaultUser`

Key derivation: `PROVIDER_KEY_ENCRYPTION_SECRET` or fallback `JWT_SECRET`.

## Planned moves from `apps/api` (Phase 3b)

| Module | Source today | Status |
| ------ | ------------- | ------ |
| Secret crypto | ~~`core/crypto/secret-crypto.ts`~~ | ✅ moved |
| Chat upstream | ~~`plugins/projects/chat/gateway-*.ts`~~ | ✅ moved |
| Auth helpers (JWT OSS) | ~~`core/auth/*.util.ts`~~ | ✅ moved |
| Project orchestration | `projects.service` (non-Nest parts) | pending |

Nest modules/controllers/DTOs **stay in apps/api**.
