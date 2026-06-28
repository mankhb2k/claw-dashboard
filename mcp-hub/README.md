# AucoBot MCP Hub

First-party MCP connector packages published under `@aucobot/*`.

## Packages

| Package | Binary | Description |
| ------- | ------ | ----------- |
| `@aucobot/mcp-core` | — | Shared utilities (register tools, Google OAuth loader) |
| `@aucobot/mcp-google-drive` | `aucobot-mcp-google-drive` | Google Drive tools (stdio) |

## Development

```bash
pnpm install
pnpm build
```

## Publish (org `aucobot`)

Requires npm login + 2FA OTP. From `mcp-hub/`:

```bash
pnpm build

# Step 1 — core first (replace 123456 with authenticator code)
pnpm publish:core -- --otp=123456

# Step 2 — google-drive (new OTP code)
pnpm publish:drive -- --otp=123456
```

Or one-shot after core is live:

```bash
pnpm publish:all -- --otp=123456
```

`pnpm publish` rewrites `workspace:*` → semver automatically.

## Runtime env (Google Drive)

Matches AucoBot `openclaw.json` sync:

```env
GDRIVE_CREDENTIALS_PATH=/path/to/credentials.json
GDRIVE_OAUTH_PATH=/path/to/gcp-oauth.keys.json   # optional fallback for client_id/secret
```

## Local pack (Docker pre-bake without npm registry)

```bash
pnpm build
pnpm pack:all
# → packages/mcp-google-drive/aucobot-mcp-google-drive-0.1.0.tgz
```
