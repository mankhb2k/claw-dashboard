# @claw-dashboard/workspace-sync

Sync logic between Claw Dashboard control plane and OpenClaw gateway: merge `openclaw.json`, compile agent workspace markdown, skills, connectors MCP, heartbeat.

## Layout

```
src/
  index.ts          Public barrel — import from @claw-dashboard/workspace-sync
  config/
    openclaw-config.ts       Initial config + constants
    provider-env-keys.ts     Provider → env key mapping
    sync-helpers.ts          Gateway auth token sync
    merge-connectors/
      merge-connectors.ts
    merge-openclaw/
      merge-openclaw.ts
    merge-channel/
      merge-channel.ts
  agents/           Agent form parsing, collaboration, workspace markdown compile
  connectors/       MCP server entries (stdio npx)
  skills/           SKILL.md build/parse
  heartbeat/        Heartbeat config merge + file writes
  paths/            Project data directory layout (OPENCLAW_DATA_ROOT)
```

## Subpath exports

| Import | Module |
|--------|--------|
| `@claw-dashboard/workspace-sync` | Full public API |
| `@claw-dashboard/workspace-sync/agent-workspace-compile` | `compileAgentsMd`, bootstrap compile (web agent panel) |
| `@claw-dashboard/workspace-sync/skill-markdown` | `buildSkillMarkdown`, `parseSkillMarkdown` (web) |

## Dependency direction

- `config/` may import `agents/` and `connectors/`
- `connectors/` imports `config/openclaw-config` (constants only)
- Do not import `config/` from `agents/` (avoid cycles)

## Build

```bash
pnpm --filter @claw-dashboard/workspace-sync build
pnpm --filter @claw-dashboard/workspace-sync test
```
