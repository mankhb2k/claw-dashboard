# AucoBot — repository split

The active codebases live in separate GitHub repositories under the **aucobot** organization:

| Repo | SSH | Description |
| ---- | --- | ----------- |
| **aucobot** | `git@github.com:aucobot/aucobot.git` | Control plane — API, web, workspace sync, deploy (OSS) |
| **cloud** | `git@github.com:aucobot/cloud.git` | Hosted Cloud — fleet, billing, S3 storage (`@aucobot-cloud/*`) |
| **mcp** | `git@github.com:aucobot/mcp.git` | Hosted MCP connectors (Google Drive, Calendar) |
| **node-device** | `git@github.com:aucobot/node-device.git` | Electron companion node desktop app |

## Recommended workspace layout

```text
workspace/
├── aucobot/       git clone git@github.com:aucobot/aucobot.git
├── cloud/         git clone git@github.com:aucobot/cloud.git
├── mcp/           git clone git@github.com:aucobot/mcp.git
└── node-device/   git clone git@github.com:aucobot/node-device.git   # optional
```

Full Docker stack (`aucobot/deploy/docker-compose.yml`) expects **`mcp`** as a sibling directory: `../mcp` relative to the `aucobot` repo root.

Cloud development expects **`cloud`** as a sibling: `../cloud` relative to `aucobot` (pnpm workspace link).

## This repo (`openclaw-saas`)

Legacy meta-monorepo. New development should use the repos above. Remaining folders here (`openclaw-worker/`, `workflow.md`, `openclaw-architecture.md`, …) may still be useful as reference until fully migrated.
