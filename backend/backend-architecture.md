# Backend architecture — Phase 1 (2026-05)

Tài liệu cũ (Core + Plugins + Billing + Queue) đã **thay thế** bằng stack tối giản cho **OSS self-host**. Xem **`README.md`** để chạy API.

## Cấu trúc NestJS

| Thư mục | Vai trò |
| ------- | ------- |
| `src/core/database` | Prisma + Postgres |
| `src/core/crypto` | `SecretCryptoService` — `PROJECT_SECRETS_MASTER_KEY` |
| `src/core/auth` | Đăng ký / đăng nhập **JWT** + refresh token hash trong DB |
| `src/core/logging` | `nestjs-pino` |
| `src/core/common` | Exception filter, response wrapper, `DbHealthMiddleware`, `@CurrentUser()` |
| `src/modules/projects` | CRUD project (`slug`, `displayName`, `syncPathHint`, `lifecycle`) |
| `src/modules/workspace` | Lưu `WorkspaceRevision` (`filesJson`: path → nội dung text) |
| `src/modules/project-secrets` | CRUD bí mật mã hoá (`project_secrets`) |

**Global prefix:** `/api`  
**Swagger:** `/api/docs`

## Prisma (`prisma/schema.prisma`)

| Model | Mục đích |
| ----- | -------- |
| `User` | Email + password hash (bcrypt) |
| `RefreshToken` | Hash SHA-256 của opaque refresh token |
| `Project` | Thuộc user; slug unique; optional `syncPathHint` |
| `WorkspaceRevision` | Chuỗi revision per project (`sequence`, `filesJson` JSONB) |
| `ProjectSecret` | Cặp `(projectId, secretKey)` + `payloadEnc` |

**Đã loại bỏ khỏi schema Phase 1:** Plan, Subscription, Invoice, credits, heavy jobs, container instances, connectors, AI model connections, Better-Auth tables.

## Migration

Init: `prisma/migrations/20260520120000_phase1_init/`

DB legacy không tương thích; dùng Postgres sạch hoặc `migrate reset` khi dev.
