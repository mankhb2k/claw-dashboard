export type ToolActivityStatus = 'running' | 'done' | 'error'

export type ToolActivity = {
  id: string
  name: string
  canonicalId: string | null
  status: ToolActivityStatus
  i18nKey: string
  displayName?: string
  startedAt: number
  updatedAt: number
}

export type ToolStreamEntry = ToolActivity & {
  phase?: string
  args?: Record<string, unknown>
  argsPreview?: string
  outputPreview?: string
  outputFull?: string
  outputTruncated?: boolean
  errorMessage?: string
  sources?: ToolSource[]
  steps?: ToolStep[]
}

export type ToolSource = {
  url: string
  domain: string
  title?: string
}

export type ToolStep = {
  id: string
  label: string
  status: ToolActivityStatus
  icon?: 'globe' | 'link' | 'terminal' | 'file' | 'tool'
}

export type AssistantLiveSegment = {
  type: 'text'
  id: string
  text: string
}

export type LiveThreadItem =
  | AssistantLiveSegment
  | { type: 'tool'; id: string; entry: ToolStreamEntry }

export type ToolActivityPatch = {
  id: string
  name: string
  status: ToolActivityStatus
  phase?: string
  startedAt?: number
  updatedAt: number
  args?: Record<string, unknown>
  partialResult?: unknown
  result?: unknown
  errorMessage?: string
}

export type AgentToolEventPayload = {
  sessionKey?: string
  key?: string
  stream?: string
  phase?: string
  toolCallId?: string
  id?: string
  name?: string
  toolName?: string
  args?: Record<string, unknown>
  partialResult?: unknown
  isError?: boolean
  error?: unknown
  result?: unknown
  data?: {
    phase?: string
    toolCallId?: string
    id?: string
    name?: string
    toolName?: string
    args?: Record<string, unknown>
    partialResult?: unknown
    isError?: boolean
    error?: unknown
    result?: unknown
  }
}

export type ToolGatewayEventName = 'agent' | 'session.tool'
