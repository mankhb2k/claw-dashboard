# @aucobot-cloud/avatar-storage

Cloud runtime user avatars via S3-compatible object storage.

Set `RUNTIME_MODE=cloud` on API and configure `AVATAR_S3_*` env vars (see repo `.env.example`).

OSS uses Postgres `avatar_data` via `OssAvatarStorage` in `apps/api` — no S3 required.
