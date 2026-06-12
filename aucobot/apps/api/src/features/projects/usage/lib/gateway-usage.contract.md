# Gateway usage event contract (OSS proxy tap)

Observed / expected shapes for `ModelUsageRecorderService.tapGatewayFrame`.
Verify against a live OpenClaw gateway when upgrading gateway versions.

## Chat (`event: chat`)

Terminal states: `final`, `error`, `aborted`.

```json
{
  "type": "event",
  "event": "chat",
  "payload": {
    "sessionKey": "agent:main:direct",
    "state": "final",
    "idempotencyKey": "<uuid from chat.send>",
    "model": "openai/gpt-5.4-mini",
    "usage": {
      "inputTokens": 100,
      "outputTokens": 40
    }
  }
}
```

Alternate usage field names accepted by parser: `input`/`output`, `prompt_tokens`/`completion_tokens`, Gemini-style `promptTokenCount`/`candidatesTokenCount`.

## Agent / cron (`event: agent` | `event: cron`)

```json
{
  "type": "event",
  "event": "agent",
  "payload": {
    "phase": "final",
    "jobId": "job-1",
    "runId": "run-9",
    "sessionKey": "cron:job-1:...",
    "model": "google/gemini-2.5-flash",
    "usage": { "inputTokens": 10, "outputTokens": 5 }
  }
}
```

## Explicit usage (`event: usage` | `event: model.usage`)

```json
{
  "type": "event",
  "event": "model.usage",
  "payload": {
    "runId": "u-1",
    "source": "CHANNEL",
    "model": "openai/gpt-5.4-mini",
    "usage": { "inputTokens": 3, "outputTokens": 2 }
  }
}
```

## Session key → UsageSource inference

| Prefix | Source |
|--------|--------|
| `cron:` | CRON |
| `channel:` | CHANNEL |
| `heartbeat:` | HEARTBEAT |
| other | CHAT_UI |

## API hooks (implemented)

| Path | Mechanism |
|------|-----------|
| Background (OSS) | `GatewayUsageSubscriberService` — upstream WS per RUNNING project (`USAGE_SUBSCRIBER_ENABLED`, default on) |
| Dashboard chat | `ChatGatewayProxyService` taps upstream WS events (dedup via `externalId`) |
| Agent/skill AI editor | Direct provider response usage |
| Manual cron run | `CronService.run` parses `cron.run` RPC when response includes `runId` + `usage` |
| Channel / background heartbeat | Background subscriber + chat proxy tap |
