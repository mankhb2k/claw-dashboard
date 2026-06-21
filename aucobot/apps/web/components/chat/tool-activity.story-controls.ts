import { buildToolSteps } from '@/utils/chat/tool/output'
import {
  CANONICAL_TOOL_IDS,
  resolveToolActivityI18nKey,
  type CanonicalToolId,
} from '@/utils/chat/tool/stream'

import type {
  ToolActivity,
  ToolActivityStatus,
  ToolStreamEntry,
} from '@/utils/chat/tool/types'

const NOW = 1_700_000_000_000

export const STATUS_OPTIONS = ['running', 'done', 'error'] as const

/** Curated presets for Storybook controls (covers all major label groups). */
export const TOOL_PRESET_OPTIONS = [
  'exec',
  'code_execution',
  'read',
  'write',
  'edit',
  'apply_patch',
  'web_search',
  'web_fetch',
  'x_search',
  'browser',
  'memory_search',
  'memory_get',
  'image',
  'image_generate',
  'message',
  'sessions_list',
  'sessions_send',
  'subagents',
  'gateway',
  'canvas',
  'nodes',
  'cron',
  'tts',
  'mcp_generic',
] as const

export type ToolPreset = (typeof TOOL_PRESET_OPTIONS)[number]

export const RESEARCH_PRESET_OPTIONS = [
  'search_running',
  'search_done',
  'fetch_running',
  'fetch_done',
  'full_flow',
] as const

export type ResearchPreset = (typeof RESEARCH_PRESET_OPTIONS)[number]

type PresetMeta = {
  name: string
  canonicalId: string | null
  displayName?: string
  args?: Record<string, unknown>
  argsPreview?: string
  outputPreview?: string
  outputFull?: string
  outputTruncated?: boolean
  errorMessage?: string
  sources?: ToolStreamEntry['sources']
}

const PRESET_META: Record<ToolPreset, PresetMeta> = {
  exec: {
    name: 'exec',
    canonicalId: 'exec',
    args: { command: 'pnpm test' },
    argsPreview: '{\n  "command": "pnpm test"\n}',
    outputPreview: 'PASS utils/chat/tool-stream.spec.ts\nTests: 12 passed',
    outputFull:
      'PASS utils/chat/tool-stream.spec.ts\nTests: 12 passed\nTime: 1.42s',
    errorMessage: 'Permission denied: operation not allowed in sandbox',
  },
  code_execution: {
    name: 'code_execution',
    canonicalId: 'code_execution',
    args: { code: 'print("hello")' },
    argsPreview: '{\n  "code": "print(\\"hello\\")"\n}',
    outputPreview: 'hello',
    errorMessage: 'Python runtime error: NameError',
  },
  read: {
    name: 'read',
    canonicalId: 'read',
    args: { path: 'src/chat/ChatPanel.tsx' },
    argsPreview: '{\n  "path": "src/chat/ChatPanel.tsx"\n}',
    outputPreview: 'import { ChatLiveThread } from "./ChatLiveThread"',
    outputTruncated: true,
    errorMessage: 'File not found',
  },
  write: {
    name: 'write',
    canonicalId: 'write',
    args: { path: 'notes.txt', content: 'draft' },
    outputPreview: 'Wrote 5 bytes',
    errorMessage: 'Write denied by sandbox',
  },
  edit: {
    name: 'edit',
    canonicalId: 'edit',
    args: { path: 'app.ts', old_string: 'foo', new_string: 'bar' },
    outputPreview: 'Applied edit to app.ts',
    errorMessage: 'Edit conflict',
  },
  apply_patch: {
    name: 'apply_patch',
    canonicalId: 'apply_patch',
    args: { patch: '--- a/file\n+++ b/file' },
    outputPreview: 'Patch applied',
    errorMessage: 'Patch failed to apply',
  },
  web_search: {
    name: 'web_search',
    canonicalId: 'web_search',
    args: { query: 'OpenClaw gateway tool events' },
    sources: [
      {
        url: 'https://docs.openclaw.dev/tools',
        domain: 'docs.openclaw.dev',
        title: 'Tool runtime',
      },
    ],
    errorMessage: 'Web search request failed',
  },
  web_fetch: {
    name: 'web_fetch',
    canonicalId: 'web_fetch',
    args: { url: 'https://docs.openclaw.dev/chat' },
    sources: [{ url: 'https://docs.openclaw.dev/chat', domain: 'docs.openclaw.dev' }],
    outputPreview: '# Chat\n\nSend messages via gateway WebSocket...',
    errorMessage: 'Failed to fetch page',
  },
  x_search: {
    name: 'x_search',
    canonicalId: 'x_search',
    args: { query: 'openclaw release' },
    errorMessage: 'X search unavailable',
  },
  browser: {
    name: 'browser',
    canonicalId: 'browser',
    args: { action: 'click', selector: '#submit' },
    outputPreview: 'Clicked #submit',
    errorMessage: 'Browser session timed out',
  },
  memory_search: {
    name: 'memory_search',
    canonicalId: 'memory_search',
    args: { query: 'project settings' },
    outputPreview: '3 memories matched',
    errorMessage: 'Memory search failed',
  },
  memory_get: {
    name: 'memory_get',
    canonicalId: 'memory_get',
    args: { id: 'mem-1' },
    outputPreview: '{ "topic": "gateway" }',
    errorMessage: 'Memory not found',
  },
  image: {
    name: 'image',
    canonicalId: 'image',
    args: { url: 'https://example.com/photo.png' },
    outputPreview: 'Image analyzed',
    errorMessage: 'Image analysis failed',
  },
  image_generate: {
    name: 'image_generate',
    canonicalId: 'image_generate',
    args: { prompt: 'sunset over mountains' },
    outputPreview: 'image://generated-1',
    errorMessage: 'Image generation failed',
  },
  message: {
    name: 'message',
    canonicalId: 'message',
    args: { to: 'agent:helper', text: 'ping' },
    outputPreview: 'Message sent',
    errorMessage: 'Message delivery failed',
  },
  sessions_list: {
    name: 'sessions_list',
    canonicalId: 'sessions_list',
    outputPreview: 'agent:main:main\nagent:helper:main',
    errorMessage: 'Could not list sessions',
  },
  sessions_send: {
    name: 'sessions_send',
    canonicalId: 'sessions_send',
    args: { sessionKey: 'agent:helper:main', text: 'hello' },
    outputPreview: 'Delivered to helper session',
    errorMessage: 'Session send failed',
  },
  subagents: {
    name: 'subagents',
    canonicalId: 'subagents',
    args: { task: 'summarize logs' },
    outputPreview: 'Sub-agent spawned',
    errorMessage: 'Sub-agent spawn failed',
  },
  gateway: {
    name: 'gateway',
    canonicalId: 'gateway',
    args: { action: 'reload' },
    outputPreview: 'Gateway config reloaded',
    errorMessage: 'Gateway action failed',
  },
  canvas: {
    name: 'canvas',
    canonicalId: 'canvas',
    args: { nodeId: 'panel-1' },
    outputPreview: 'Canvas updated',
    errorMessage: 'Canvas update failed',
  },
  nodes: {
    name: 'nodes',
    canonicalId: 'nodes',
    args: { device: 'phone-1' },
    outputPreview: 'Device connected',
    errorMessage: 'Device connection failed',
  },
  cron: {
    name: 'cron',
    canonicalId: 'cron',
    args: { schedule: '0 9 * * *' },
    outputPreview: 'Schedule updated',
    errorMessage: 'Cron update failed',
  },
  tts: {
    name: 'tts',
    canonicalId: 'tts',
    args: { text: 'Hello world' },
    outputPreview: 'audio://tts-1',
    errorMessage: 'TTS generation failed',
  },
  mcp_generic: {
    name: 'google-drive__list_files',
    canonicalId: null,
    displayName: 'list files',
    args: { folder: 'root' },
    outputPreview: '12 files listed',
    errorMessage: 'MCP connector error',
  },
}

export type ToolCardStoryArgs = {
  toolPreset: ToolPreset
  status: ToolActivityStatus
  withArgs: boolean
  withOutput: boolean
}

export type ToolBarStoryArgs = {
  toolPreset: ToolPreset
  status: ToolActivityStatus
  showPreparing: boolean
}

export type ResearchBlockStoryArgs = {
  researchPreset: ResearchPreset
}

function finalizeEntry(
  partial: Omit<ToolStreamEntry, 'steps'> & { steps?: ToolStreamEntry['steps'] },
): ToolStreamEntry {
  const entry = { ...partial } as ToolStreamEntry
  if (!entry.steps) {
    entry.steps = buildToolSteps(entry)
  }
  return entry
}

export function buildStoryToolEntry({
  toolPreset,
  status,
  withArgs = true,
  withOutput = true,
}: ToolCardStoryArgs): ToolStreamEntry {
  const meta = PRESET_META[toolPreset]
  const i18nKey = resolveToolActivityI18nKey(meta.name, status)

  const entry: ToolStreamEntry = {
    id: `story-${toolPreset}-${status}`,
    name: meta.name,
    canonicalId: meta.canonicalId,
    displayName: meta.displayName,
    status,
    i18nKey,
    startedAt: NOW,
    updatedAt: NOW,
  }

  if (withArgs && meta.args) {
    entry.args = meta.args
    entry.argsPreview =
      meta.argsPreview ?? JSON.stringify(meta.args, null, 2)
  }

  if (withOutput && status === 'done') {
    if (meta.outputPreview) entry.outputPreview = meta.outputPreview
    if (meta.outputFull ?? meta.outputPreview) {
      entry.outputFull = meta.outputFull ?? meta.outputPreview
    }
    if (meta.outputTruncated) entry.outputTruncated = true
  }

  if (status === 'error') {
    entry.errorMessage = meta.errorMessage ?? 'Operation failed'
  }

  if (meta.sources) {
    entry.sources = meta.sources
  }

  return finalizeEntry(entry)
}

export function buildStoryToolActivity(
  toolPreset: ToolPreset,
  status: ToolActivityStatus,
): ToolActivity {
  const meta = PRESET_META[toolPreset]
  return {
    id: `story-${toolPreset}-${status}`,
    name: meta.name,
    canonicalId: meta.canonicalId,
    displayName: meta.displayName,
    status,
    i18nKey: resolveToolActivityI18nKey(meta.name, status),
    startedAt: NOW,
    updatedAt: NOW,
  }
}

export function buildResearchEntries(preset: ResearchPreset): ToolStreamEntry[] {
  switch (preset) {
    case 'search_running':
      return [buildStoryToolEntry({ toolPreset: 'web_search', status: 'running' })]
    case 'search_done':
      return [buildStoryToolEntry({ toolPreset: 'web_search', status: 'done' })]
    case 'fetch_running':
      return [buildStoryToolEntry({ toolPreset: 'web_fetch', status: 'running' })]
    case 'fetch_done':
      return [buildStoryToolEntry({ toolPreset: 'web_fetch', status: 'done' })]
    case 'full_flow':
      return [
        buildStoryToolEntry({ toolPreset: 'web_search', status: 'running' }),
        buildStoryToolEntry({ toolPreset: 'web_fetch', status: 'running' }),
        buildStoryToolEntry({ toolPreset: 'web_fetch', status: 'done' }),
      ]
    default: {
      const _exhaustive: never = preset
      return _exhaustive
    }
  }
}

/** Every canonical tool id for label matrix stories. */
export const ALL_CANONICAL_TOOL_IDS = CANONICAL_TOOL_IDS as readonly CanonicalToolId[]

export function buildCanonicalToolEntry(
  canonicalId: CanonicalToolId,
  status: ToolActivityStatus,
): ToolStreamEntry {
  const preset = TOOL_PRESET_OPTIONS.find(
    (key) => PRESET_META[key].canonicalId === canonicalId,
  )
  if (preset) {
    return buildStoryToolEntry({
      toolPreset: preset,
      status,
      withArgs: false,
      withOutput: status === 'done',
    })
  }

  return finalizeEntry({
    id: `story-${canonicalId}-${status}`,
    name: canonicalId,
    canonicalId,
    status,
    i18nKey: resolveToolActivityI18nKey(canonicalId, status),
    startedAt: NOW,
    updatedAt: NOW,
    errorMessage: status === 'error' ? 'Operation failed' : undefined,
    outputPreview: status === 'done' ? `${canonicalId} completed` : undefined,
  })
}

export const toolCardArgTypes = {
  toolPreset: {
    control: 'select' as const,
    options: [...TOOL_PRESET_OPTIONS],
    description: 'Tool type — drives i18n label key',
  },
  status: {
    control: 'select' as const,
    options: [...STATUS_OPTIONS],
    description: 'Activity status — running / done / error labels',
  },
  withArgs: {
    control: 'boolean' as const,
    description: 'Show arguments section when expanded',
  },
  withOutput: {
    control: 'boolean' as const,
    description: 'Attach output preview when status is done',
  },
}

export const toolBarArgTypes = {
  toolPreset: toolCardArgTypes.toolPreset,
  status: toolCardArgTypes.status,
  showPreparing: {
    control: 'boolean' as const,
    description: 'Show preparing row when no activities',
  },
}

export const researchBlockArgTypes = {
  researchPreset: {
    control: 'select' as const,
    options: [...RESEARCH_PRESET_OPTIONS],
    description: 'Web research flow preset',
  },
}

export const toolCardDefaultArgs: ToolCardStoryArgs = {
  toolPreset: 'exec',
  status: 'running',
  withArgs: true,
  withOutput: true,
}

export const toolBarDefaultArgs: ToolBarStoryArgs = {
  toolPreset: 'exec',
  status: 'running',
  showPreparing: false,
}

export const researchBlockDefaultArgs: ResearchBlockStoryArgs = {
  researchPreset: 'search_running',
}
