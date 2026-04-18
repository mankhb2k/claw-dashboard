# OpenClaw 2026.4.5 — Built-in Tools & Features Inventory

**Version**: 2026.4.5 (April 13, 2026)  
**Runtime**: Node 24 (recommended) / Node 22.16+  
**Architecture**: Multi-channel gateway + extensible plugin system

---

## 📡 Built-in Channels (23 core)

Communication channels that work out-of-the-box with the gateway:

| Channel | Type | Setup | Status |
|---------|------|-------|--------|
| **Discord** | Chat | OAuth/Token | ✅ Core |
| **Slack** | Chat | OAuth/Token | ✅ Core |
| **Telegram** | Chat | Bot Token | ✅ Core |
| **WhatsApp** | Chat | Webhooks | ✅ Core |
| **Signal** | Chat | Local bridge | ✅ Core |
| **iMessage** | Chat | MacOS/BlueBubbles | ✅ Core |
| **Google Chat** | Chat | OAuth/Webhook | ✅ Core |
| **Microsoft Teams** | Chat | OAuth/Webhook | ✅ Core |
| **WebChat** | Web | Browser | ✅ Built-in |
| **RFC-7486 (Voice)** | Voice | Local/Remote | ✅ Core |
| **Matrix** | Chat | Homeserver | 📦 Plugin |
| **Mattermost** | Chat | Self-hosted | 📦 Plugin |
| **Nextcloud Talk** | Chat | Self-hosted | 📦 Plugin |
| **IRC** | Chat | Legacy | 📦 Plugin |
| **Feishu** (ByteDance) | Chat | OAuth | 📦 Plugin |
| **LINE** | Chat | Channel Token | 📦 Plugin |
| **Zalo** | Chat | Messenger | 📦 Plugin |
| **Zalo Personal** | Chat | Direct | 📦 Plugin |
| **BlueBubbles** | iMessage Bridge | Network | 📦 Plugin |
| **Nostr** | Decentralized | Relay | 📦 Plugin |
| **Synology Chat** | Self-hosted | Local | 📦 Plugin |
| **Tlon** (Urbit) | Network | Urbit | 📦 Plugin |
| **Twitch** | Streaming | Channel | 📦 Plugin |

---

## 🛠️ Built-in Tools (Core & Optional)

### Web & Search Tools

| Tool | Purpose | Tier | Notes |
|------|---------|------|-------|
| **Web Browser** | Headless Chromium + Playwright | Free+ | Needs `OPENCLAW_INSTALL_BROWSER=1` |
| **Brave Search** | Privacy-focused search | Pro | API key required |
| **DuckDuckGo** | Anonymous search | Free | No API needed |
| **Exa** | AI-powered search | Pro | Freemium tier |
| **Firecrawl** | Web scraping + markdown | Pro | API key |
| **Perplexity** | AI search aggregator | Pro | API key |
| **Tavily** | Research agent API | Pro | Freemium |
| **Searxng** | Meta-search engine | Self-hosted | Open source |
| **Gemini Search** | Google Gemini search | Pro | API key |
| **Kimi Search** | Moonshot AI search | Pro | CN region |
| **Minimax Search** | Chinese search | Pro | Regional |
| **Ollama Search** | Local LLM search | Self-hosted | Must run locally |
| **Grok Search** | X/Twitter AI search | Pro | xAI API |

### Code & Development

| Tool | Purpose | Notes |
|------|---------|-------|
| **Code Execution** | Run `sh`, `python`, `node`, `tsx`, etc | With approval system |
| **Exec** | Shell command execution | Sandboxed, approval-gated |
| **Elevated** | Sudo/privilege escalation | Explicit user approval |
| **GitHub Integration** | Issues, PRs, commits | OAuth token auth |
| **Diffs** | Git diff parsing & application | Apply patches to files |
| **Apply Patch** | Auto-apply code patches | Validation before apply |

### Media Generation & Processing

| Tool | Purpose | Type | Notes |
|------|---------|------|-------|
| **Video Generation** | Text-to-video via providers | Pro | Runway, Synthesia, FAL |
| **Image Generation** | Text-to-image | Pro | Midjourney, Runway, FAL |
| **Music Generation** | Text-to-music | Pro | Soundraw, FAL, Chutes |
| **TTS** (Text-to-Speech) | Voice synthesis | Free+* | Elevenlabs, local: Sherpa-ONNX |
| **OpenAI Whisper** | Speech-to-text | Free+* | Local or API |
| **Deepgram** | Speech-to-text | Pro | Real-time transcription |
| **Video Frames** | Extract frames from video | Free | Built-in (ffmpeg) |

### AI Model Providers (35+ supported)

**Major providers:**
- **Anthropic** (Claude 3.5 Sonnet, Opus, Haiku)
- **OpenAI** (GPT-4o, o1, o1-mini)
- **Google** (Gemini 2.0, 1.5 Pro/Flash)
- **Meta** (Llama 3.1, 3.2)
- **DeepSeek** (R1, V3)

**Code-focused models:**
- **GitHub Copilot** (Copilot Pro API)
- **OpenCode** / **OpenCode-Go**
- **Kilocode** (ByteDance)
- **Kimi** (Moonshot, 128K context)

**Chinese providers:**
- **Alibaba Qwen** (Qwen 2.5, Max)
- **Baidu Qianfan** (Ernie models)
- **ByteBalance Byteplus** (Doubao)
- **Minimax** (abab models)
- **Volcengine** (MegaService)
- **ZAI** (Zhe Ai)

**Open source / Self-hosted:**
- **Ollama** (Local models)
- **vLLM** (Local inference)
- **SGLang** (Optimized inference)
- **Together AI** (Open source models)

**Specialized:**
- **Groq** (Speed-optimized inference)
- **Mistral AI** (MoE models)
- **Perplexity** (Search + answer)
- **OpenRouter** (Model marketplace)
- **LiteLLM** (Provider proxy)
- **Hugging Face** (Text generation)
- **Fireworks AI** (Enterprise inference)
- **Chutes** (Model optimization)
- **FAL** (Serverless ML)
- **CloudFlare AI Gateway** (Provider routing)
- **Amazon Bedrock** (AWS managed)
- **Amazon Bedrock Mantle** (Custom foundation models)
- **NVIDIA** (NIM inference)
- **Microsoft Foundry** (Custom models)
- **Vercel AI Gateway** (Routing proxy)
- **XAI Grok** (X's AI)
- **Anthropic Vertex** (GCP integration)

### Session & Memory Tools

| Tool | Purpose | Status |
|------|---------|--------|
| **Sessions** | Conversation context isolation | ✅ Core |
| **Memory (LanceDB)** | Vector DB memory storage | 📦 Plugin |
| **Memory (LiteDB)** | SQLite memory backend | 📦 Plugin |
| **Memory (Postgres)** | Managed memory persistence | Coming |
| **Thread Ownership** | Group chat threading | ✅ Core |
| **Context Limits** | Token management per tier | ✅ Core |

---

## 🧠 Built-in Skills (65+)

Core bundled skills available via CLI or chat:

### System & Info
- `healthcheck` — Health status
- `session-logs` — View logs
- `model-usage` — Check API usage
- `weather` — Weather info
- `summarize` — Document summarization

### Productivity
- **Apple** (1Password, Apple Notes, Apple Reminders, Bear Notes, Things)
- **Notion** — Database integration
- **Obsidian** — Note sync
- **Trello** — Task board
- **Slack** — Send messages from skill
- **Discord** — Chat integration

### Development & Code
- **GitHub** (`gh-issues`, GitHub API)
- **Coding Agent** — Sub-agent for code tasks
- **Skill Creator** — Create new skills dynamically

### Media & Entertainment
- **Spotify** — Music control
- **YouTube** — Video tools
- **Notion** — Knowledge base
- **ScreenShot/GifGrep** — Capture frames
- **PeekABoo** — Desktop monitoring

### Audio & Voice
- **Voice Call** — Voice communication
- **OpenAI Whisper** — Speech recognition
- **Sherpa-ONNX TTS** — Local voice synthesis

### System Control
- **TMux** — Terminal multiplexer control
- **Eightctl** (Node) — Display control
- **Wacli** — Windows actions
- **Ordercli** — Order management
- **BlueCLI** — Bluetooth control
- **GoPlaces** — Navigation
- **Oracle** — Database queries
- **Node Connect** — SSH/remote exec
- **SonOS CLI** — Speaker control
- **XUrl** — URL utilities

### Special/Experimental
- `canvas` — Visual rendering surface
- `taskflow` — Automation workflows
- `taskflow-inbox-triage` — Email triage
- `blogwatcher` — Blog monitoring
- `clawhub` — Plugin marketplace
- `llm-task` — LLM task delegation
- `lobster` — OpenClaw lobster emoji
- `mcporter` — MCP bridge tool
- `nano-pdf` — PDF processing
- `himalaya` — Email client
- `imsg` — iMessage direct access
- `sag` — System agent group
- `sayonara` — Goodbye handler

---

## 🤖 Agent & Automation Features

### Sub-agent Capabilities
| Feature | Purpose |
|---------|---------|
| **Native Sub-agents** | Run OpenClaw agents recursively |
| **ACP Sessions** | Run external harnesses (Codex, Claude Code, Cursor, Gemini CLI) |
| **Multi-agent Routing** | Workspace isolation, per-agent sessions |
| **Agent Send** | Message delivery between agents |

### Automation & Workflows
| Automation | Type | Use Case |
|-----------|------|----------|
| **Cron Jobs** | Schedule | Recurring tasks |
| **Webhooks** | Event-driven | External triggers |
| **Standing Orders** | Template-based | Repeating workflows |
| **ClawFlow** | Visual workflow | Low-code automation |
| **TaskFlow** | Background jobs | Long-running ops |
| **Tasks** | Background execution | Async work tracking |
| **Polling** | Interval-based | Periodic checks |
| **Gmail PubSub** | Real-time | Email triggers |
| **Heartbeat** | Keep-alive | Session persistence |
| **Auth Monitoring** | Security | Token refresh tracking |

### Channel-specific Features
- **Broadcast Groups** — Multi-recipient messaging
- **Channel Routing** — Smart message routing
- **Group Mention Rules** — @mention patterns
- **Reactions** — Emoji reaction handling
- **Call Forwarding** — Voice routing

---

## 🔌 Plugin Ecosystem (103 extensions)

**Bundled by default:**
```
Extensions (opt-in via docker build --build-arg):
├── acpx              ← ACP runtime harness bridge
├── anthropic         ← Claude integration
├── google            ← Gemini integration
├── openai            ← GPT models
├── github-copilot    ← Copilot integration
├── brave             ← Brave Search
├── browser           ← Playwright/Chromium
└── ... (97 more)
```

**Categories:**
1. **LLM Providers** (35+): Model API integrations
2. **Channels** (23): Messaging platforms
3. **Search** (8): Web search variants
4. **Media** (5): Generation, TTS, video
5. **Code Tools** (6): GitHub, exec, diffs
6. **Voice** (3): Speech recognition, TTS
7. **Memory** (2): LanceDB, LiteDB
8. **Observability** (1): OpenTelemetry
9. **Specialized** (13+): Device control, browser, etc.

---

## 📱 Mobile & Device Support

### Nodes (iOS/Android)
- **Canvas**: Live rendering surface
- **Camera**: Photo/video capture
- **Voice**: Voice-enabled workflows
- **Device Control**: Phone actions
- **Pairing**: Secure node binding

### Desktop
- **macOS**: App + daemon
- **iOS**: Native app
- **Android**: Native app
- **Windows**: WSL2 + CLI
- **Linux**: Desktop / headless

---

## 🔐 Security & Control Features

- **Allowlist/Denylist** per channel
- **Rate limiting** per user/channel
- **Exec approvals** for code execution
- **Token rotation** via credential semantics
- **Group chat mentions** (optional @mention required)
- **Session isolation** per agent/workspace
- **Audit logging** (90-day retention)

---

## 📊 Architecture Summary

```
┌─────────────────────────────────────────────────┐
│  OpenClaw Gateway (Node.js)                     │
├─────────────────────────────────────────────────┤
│  Channels (23 built-in, 80+ plugins)            │
│  ├─ Chat: Discord, Slack, Telegram, WhatsApp   │
│  ├─ Video: Twitch, Voice call                  │
│  └─ Specialized: Nostr, Matrix, Feishu         │
├─────────────────────────────────────────────────┤
│  Tools & Skills (65+ bundled)                   │
│  ├─ Web/Search (13 variants)                   │
│  ├─ Code (GitHub, exec, diffs)                 │
│  ├─ Media (video, image, music, TTS)           │
│  └─ Productivity (Notion, Slack, 1Password)    │
├─────────────────────────────────────────────────┤
│  LLM Providers (35+)                            │
│  ├─ Anthropic, OpenAI, Google, Meta            │
│  ├─ DeepSeek, Groq, Mistral, xAI               │
│  └─ Local: Ollama, vLLM, SGLang                │
├─────────────────────────────────────────────────┤
│  Automation                                     │
│  ├─ Cron, Webhooks, Standing Orders            │
│  ├─ ClawFlow visual workflows                  │
│  └─ Sub-agents + ACP runtime bridges           │
└─────────────────────────────────────────────────┘
```

---

## 📦 For SaaS Integration (Proposed)

**What can free tier (1GB/0.5vCPU) safely use?**
- ✅ All 23 core channels
- ✅ Search tools (no browser)
- ✅ TTS (lightweight)
- ✅ Native sub-agents
- ✅ Basic automation (cron, webhooks)
- ⚠️ Code exec (approval-gated)
- ❌ Browser (Playwright, 300MB+)
- ❌ Video/image generation
- ❌ Expensive LLM providers (without rate limiting)

**Recommendation**: Gate media generation (video, image, music) to Pro tier. Keep chat + search + basic code-exec on Free tier.

---

## 📋 Feature Parity Checklist

| Feature | MVP Ready | Notes |
|---------|-----------|-------|
| Multi-channel gateway | ✅ Yes | 23 channels, extensible |
| Web search | ✅ Yes | 8 providers |
| Code execution | ✅ Yes | Approval-gated |
| Automation (cron/webhook) | ✅ Yes | All major types |
| Sub-agents | ✅ Yes | Native OpenClaw |
| ACP harness bridge | ✅ Yes | Codex, Claude Code, etc |
| Mobile nodes | ✅ Yes | iOS, Android |
| Memory/persistence | ✅ Yes | LanceDB, LiteDB |
| Voice (TTS/STT) | ✅ Yes | Multiple providers |
| **Video generation** | ⚠️ Ready | Requires Pro tier |
| **Image generation** | ⚠️ Ready | Requires Pro tier |
| **Browser automation** | ⚠️ Ready | 300MB, Pro tier |
| GPU inference | 🚧 Coming | NVIDIA NIM, custom nodes |

---

Generated from upstream copy: `worker/.tmp-openclaw-upstream/` (v2026.4.5)  
Last updated: April 18, 2026
