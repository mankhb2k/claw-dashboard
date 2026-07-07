# @claw-dashboard/shared

Types and pure helpers shared by **apps/api** and **apps/web** (no Nest, no React).

## Layout

```text
src/
├── index.ts           # public exports (import @claw-dashboard/shared)
├── types/             # cross-app contracts (e.g. ApiResponse)
├── auth/              # cookie names, auth-related constants
└── channels/          # project/channel enums + Telegram validation
```

## Exports

- `types/api-response` — REST envelope `{ success, data, error }`
- `auth/auth` — `AUTH_COOKIES`
- `channels/channels` — status/kind constants, Telegram helpers

## Usage

```typescript
import { type ApiResponse, AUTH_COOKIES, validateTelegramAccessForm } from '@claw-dashboard/shared';
```

Web Zod schemas stay in `apps/web/schemas/` — they should align with types here.
