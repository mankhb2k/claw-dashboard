# Claw Dashboard — MCP Connectors (OSS)

> **Scope:** Self-host OSS only. Connectors run as **stdio subprocesses** spawned by the OpenClaw gateway.

## Stack (4 services)

`web` + `api` + `gateway` + `postgres` — no separate MCP HTTP service.

## Flow

1. User connects a connector in the dashboard → API stores encrypted secrets.
2. API merges `mcp.servers` entries into `openclaw.json` on the project volume.
3. Gateway spawns MCP via stdio when the agent needs tools.

## Supported connectors (community packages)

| Connector | stdio command |
| --------- | ------------- |
| Google Drive | `npx -y @modelcontextprotocol/server-gdrive` |
| Google Calendar | `npx -y @franciscpd/calendar-mcp-server` |

Implementation: `packages/workspace-sync/src/connectors/connector-mcp.ts`

## Gateway image

Use upstream `alpine/openclaw:latest` — MCP packages are fetched via `npx` at runtime (first spawn may need network).

See also: [`workflow.md`](workflow.md), [`deploy/README.md`](deploy/README.md).
