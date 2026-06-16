# Gateway usage event contract (OSS proxy tap)

Observed / expected shapes for `ModelUsageRecorderService.tapGatewayFrame`.
Verify against a live OpenClaw gateway when upgrading gateway versions.

## Chat (`event: chat`)

Terminal states: `final`, `error`, `aborted`.

**OpenClaw SSOT for Dashboard Overview:** prefer `chat.final` payload fields `usage` + `model` (or nested `message.usage` / `message.model`). When absent, AUCOBOT enriches from OpenClaw session store (`agents/<slug>/sessions/sessions.json`) or `agent` lifecycle `phase: "usage"`.

```json
{
  "type": "event",
  "event": "chat",
  "payload": {
    "runId": "<uuid from chat.send idempotencyKey>",
    "sessionKey": "agent:main:direct",
    "state": "final",
    "model": "openai/gpt-5.4-mini",
    "usage": {
      "inputTokens": 100,
      "outputTokens": 40
    }
  }
}
```

Alternate usage field names accepted by parser: `input`/`output`, `prompt_tokens`/`completion_tokens`, Gemini-style `promptTokenCount`/`candidatesTokenCount`, nested `message.usage`.

**Dedup:** `externalId = run:<runId>` shared across chat proxy + usage subscriber + lifecycle usage.

## Agent lifecycle usage (`event: agent`, `stream: lifecycle`, `phase: usage`)

```json
{
  "type": "event",
  "event": "agent",
  "payload": {
    "runId": "...",
    "sessionKey": "agent:main:main",
    "stream": "lifecycle",
    "data": {
      "phase": "usage",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6",
      "usage": { "input": 1234, "output": 567 },
      "durationMs": 4521
    }
  }
}
```

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
