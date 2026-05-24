# @aucobot/shared

Types and pure helpers shared by **apps/api** and **apps/web** (no Nest, no React).

## Exports

- Project / connector / channel status constants
- Telegram `dmPolicy` / `allowFrom` validation (`validateTelegramAccessForm`, `validateTelegramAccessConfig`)

## Usage

```typescript
import { TELEGRAM_DM_POLICIES, validateTelegramAccessForm } from '@aucobot/shared';
```

Web Zod schemas stay in `apps/web/schemas/` — they should align with types here.
