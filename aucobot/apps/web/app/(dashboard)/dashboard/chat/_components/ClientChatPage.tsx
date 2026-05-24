'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, MessageSquare, RefreshCw, Send, Square } from 'lucide-react'
import { SETUP_PATH, shouldRedirectToSetup } from '@/lib/entry-route'
import { isOssRuntime } from '@/lib/runtime-mode'
import { useProjectStore } from '@/stores/project.store'
import { chatApi, type ChatModelsResponse } from '@/lib/api/chat'
import { ProjectChatClient, type GatewayEventFrame } from '@/lib/chat/project-chat-client'
import { extractText, roleOf } from '@/lib/chat/message-extract'
import { matchesSessionKey, sessionKeyForAgent } from '@/lib/chat/session-key'
import { Button, Select, Spinner } from '@/components/ui'
import { ChatMessageBubble } from './ChatMessageBubble'
import { ChatTypingIndicator } from './ChatTypingIndicator'
import styles from './ClientChatPage.module.css'

type ChatRow = {
  id: string
  role: string
  text: string
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error'

const STATUS_LABEL: Record<ConnectionState, string> = {
  idle: 'Chờ kết nối',
  connecting: 'Đang kết nối…',
  connected: 'Đã kết nối',
  error: 'Lỗi kết nối',
}

function rowFromMessage(message: unknown, index: number): ChatRow | null {
  const text = extractText(message)
  if (!text?.trim()) return null
  const role = roleOf(message)
  if (role === 'toolresult') return null
  return { id: `m-${index}-${role}`, role, text: text.trim() }
}

export function ClientChatPage() {
  const router = useRouter()
  const projects = useProjectStore((s) => s.projects)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const project = projects[0]
  const projectId = project?.id ?? ''

  const [statusLoading, setStatusLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([])
  const [agentId, setAgentId] = useState('main')
  const [modelOptions, setModelOptions] = useState<ChatModelsResponse | null>(null)
  const [modelsLoading, setModelsLoading] = useState(true)
  const [providerId, setProviderId] = useState('')
  const [modelId, setModelId] = useState('')
  const [modelSaving, setModelSaving] = useState(false)
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('idle')
  const [messages, setMessages] = useState<ChatRow[]>([])
  const [streamText, setStreamText] = useState('')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<ProjectChatClient | null>(null)
  const streamRef = useRef('')
  const sessionKey = useMemo(() => sessionKeyForAgent(agentId), [agentId])
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const loadHistory = useCallback(async (client: ProjectChatClient, key: string) => {
    const res = await client.request<{ messages?: unknown[] }>('chat.history', {
      sessionKey: key,
      limit: 100,
    })
    const rows: ChatRow[] = []
    const list = Array.isArray(res.messages) ? res.messages : []
    list.forEach((msg, i) => {
      const row = rowFromMessage(msg, i)
      if (row) rows.push(row)
    })
    setMessages(rows)
  }, [])

  const connectChat = useCallback(() => {
    if (!projectId || !ready) return
    clientRef.current?.disconnect()
    setConnectionState('connecting')
    setError(null)
    setStreamText('')

    const client = new ProjectChatClient({
      projectId,
      onReady: () => {
        setConnectionState('connected')
        void loadHistory(client, sessionKey).catch((err) => {
          setError(err instanceof Error ? err.message : 'Không tải lịch sử chat')
        })
      },
      onEvent: (evt: GatewayEventFrame) => {
        if (evt.event !== 'chat') return
        const payload = evt.payload as {
          sessionKey?: string
          state?: string
          message?: unknown
        }
        if (payload.sessionKey && !matchesSessionKey(payload.sessionKey, sessionKey)) return
        if (payload.state === 'delta') {
          const deltaPayload = payload as {
            message?: unknown
            deltaText?: string
          }
          const t =
            (typeof deltaPayload.deltaText === 'string' && deltaPayload.deltaText) ||
            extractText(deltaPayload.message)
          if (t) {
            streamRef.current = t
            setStreamText(t)
          }
        } else if (payload.state === 'final') {
          const t = extractText(payload.message)
          if (t?.trim()) {
            setMessages((prev) => [
              ...prev,
              { id: `a-${Date.now()}`, role: 'assistant', text: t.trim() },
            ])
          } else if (streamRef.current.trim()) {
            setMessages((prev) => [
              ...prev,
              { id: `a-${Date.now()}`, role: 'assistant', text: streamRef.current.trim() },
            ])
          }
          streamRef.current = ''
          setStreamText('')
          setSending(false)
        } else if (payload.state === 'error') {
          setSending(false)
          setStreamText('')
          setError('Agent trả lỗi khi xử lý tin nhắn')
        } else if (payload.state === 'aborted') {
          setSending(false)
          setStreamText('')
        }
      },
      onClose: ({ code, reason }) => {
        if (code === 1008) {
          setConnectionState('error')
          setError(
            'WebSocket bị từ chối (hết phiên đăng nhập). Đăng xuất rồi đăng nhập lại, hoặc F5 trang.',
          )
          return
        }
        if (code === 1013 || reason.includes('not running')) {
          setConnectionState('error')
          setError('Gateway chưa sẵn sàng. Đợi vài giây rồi bấm Thử lại.')
          return
        }
        setConnectionState('idle')
      },
      onError: (msg) => {
        setConnectionState('error')
        setError(
          msg === 'WebSocket error'
            ? isOssRuntime()
              ? 'Cannot reach the shared gateway. Ensure aucobot-gateway-dev is running on port 18789 and the API proxy is enabled.'
              : 'Cannot reach the gateway. Check the worker container and WebSocket proxy.'
            : msg,
        )
      },
    })
    clientRef.current = client
    client.connect()
  }, [projectId, ready, sessionKey, loadHistory])

  const applyModel = useCallback(
    async (nextModel: string, nextProviderId?: string) => {
      if (!projectId || !nextModel.trim()) return
      setModelSaving(true)
      setError(null)
      try {
        const res = await chatApi.setModel(projectId, {
          agentId,
          model: nextModel.trim(),
        })
        setModelId(res.model)
        if (nextProviderId) setProviderId(nextProviderId)
        setModelOptions((prev) =>
          prev ? { ...prev, primaryModel: res.primaryModel } : prev,
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không đổi model')
      } finally {
        setModelSaving(false)
      }
    },
    [projectId, agentId],
  )

  useEffect(() => {
    if (!projectId) {
      setModelsLoading(false)
      return
    }
    setModelsLoading(true)
    void chatApi
      .listModels(projectId)
      .then((res) => {
        setModelOptions(res)
        const primary = res.primaryModel?.trim()
        const provider =
          res.providers.find((p) =>
            p.models.some((m) => m.openclawId === primary),
          ) ?? res.providers[0]
        if (provider) {
          setProviderId(provider.providerId)
          const model =
            primary && provider.models.some((m) => m.openclawId === primary)
              ? primary
              : (provider.defaultModel ??
                provider.models[0]?.openclawId ??
                '')
          setModelId(model)
        }
      })
      .catch((err) => {
        setModelOptions({ primaryModel: null, providers: [] })
        setError(err instanceof Error ? err.message : 'Không tải danh sách model')
      })
      .finally(() => setModelsLoading(false))
  }, [projectId])

  const activeProvider = useMemo(
    () => modelOptions?.providers.find((p) => p.providerId === providerId),
    [modelOptions, providerId],
  )

  const providerSelectOptions = useMemo(
    () =>
      (modelOptions?.providers ?? []).map((p) => ({
        value: p.providerId,
        label: p.displayName,
      })),
    [modelOptions],
  )

  const modelSelectOptions = useMemo(
    () =>
      (activeProvider?.models ?? []).map((m) => ({
        value: m.openclawId,
        label: m.name,
      })),
    [activeProvider],
  )

  const handleProviderChange = (nextProviderId: string) => {
    setProviderId(nextProviderId)
    const provider = modelOptions?.providers.find((p) => p.providerId === nextProviderId)
    const nextModel =
      provider?.defaultModel ?? provider?.models[0]?.openclawId ?? ''
    if (nextModel) {
      void applyModel(nextModel, nextProviderId)
    } else {
      setModelId('')
    }
  }

  const handleModelChange = (nextModel: string) => {
    setModelId(nextModel)
    void applyModel(nextModel)
  }

  useEffect(() => {
    void fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (project && shouldRedirectToSetup(project)) {
      router.replace(SETUP_PATH)
    }
  }, [project, router])

  useEffect(() => {
    if (!projectId) {
      setStatusLoading(false)
      return
    }
    setStatusLoading(true)
    void chatApi
      .status(projectId)
      .then((s) => {
        setReady(s.ready)
        setAgents(s.agents)
        setAgentId(s.defaultAgentId)
        if (!s.ready) {
          router.replace(SETUP_PATH)
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không tải trạng thái chat')
      })
      .finally(() => setStatusLoading(false))
  }, [projectId, router])

  useEffect(() => {
    if (ready && projectId) connectChat()
    return () => clientRef.current?.disconnect()
  }, [ready, projectId, agentId, connectChat])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamText])

  const handleSend = async () => {
    const text = input.trim()
    const client = clientRef.current
    if (!text || !client?.connected || sending) return
    setInput('')
    setSending(true)
    setError(null)
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }])
    const runId = crypto.randomUUID()
    try {
      await client.request('chat.send', {
        sessionKey,
        message: text,
        deliver: false,
        idempotencyKey: runId,
      })
    } catch (err) {
      setSending(false)
      setError(err instanceof Error ? err.message : 'Gửi tin thất bại')
      return
    }
    // Fallback when chat.final was missed (reconnect / proxy timing).
    window.setTimeout(() => {
      setSending((active) => {
        if (!active) return active
        void loadHistory(client, sessionKey).catch(() => undefined)
        return false
      })
    }, 8000)
  }

  const handleAbort = async () => {
    const client = clientRef.current
    if (!client?.connected) return
    try {
      await client.request('chat.abort', { sessionKey })
    } catch {
      /* ignore */
    }
    setSending(false)
    setStreamText('')
  }

  const canSend =
    ready && connectionState === 'connected' && !sending && input.trim().length > 0

  const statusClass =
    connectionState === 'connected'
      ? styles.statusConnected
      : connectionState === 'connecting'
        ? styles.statusConnecting
        : connectionState === 'error'
          ? styles.statusError
          : styles.statusIdle

  if (!projectId) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Chưa có project. Tạo project tại Tổng quan trước.</p>
      </div>
    )
  }

  const agentOptions = agents.map((a) => ({
    value: a.id,
    label: a.name ? `${a.name} (${a.id})` : a.id,
  }))

  const showEmpty =
    messages.length === 0 && !streamText && !sending && connectionState === 'connected'

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <p className={styles.headerTitle}>OpenClaw Chat</p>
            <p className={styles.headerSub}>
              {project?.displayName ?? 'Project'} ·{' '}
              {statusLoading
                ? 'Checking…'
                : ready
                  ? 'Gateway ready'
                  : `Status: ${project?.status ?? '—'}`}
            </p>
          </div>

          <div className={styles.agentField}>
            <Select
              id="chat-agent"
              label="Agent"
              value={agentId}
              onValueChange={setAgentId}
              options={agentOptions.length ? agentOptions : [{ value: 'main', label: 'main' }]}
              disabled={connectionState === 'connecting' || sending || statusLoading}
              placeholder="Chọn agent"
            />
          </div>

          <div className={styles.agentField}>
            <Select
              id="chat-provider"
              label="Provider"
              value={providerId || undefined}
              onValueChange={handleProviderChange}
              options={providerSelectOptions}
              disabled={
                modelsLoading ||
                modelSaving ||
                providerSelectOptions.length === 0 ||
                connectionState === 'connecting' ||
                sending
              }
              placeholder={
                modelsLoading
                  ? 'Đang tải…'
                  : providerSelectOptions.length === 0
                    ? 'Chưa có API key'
                    : 'Chọn provider'
              }
            />
          </div>

          <div className={styles.agentField}>
            <Select
              id="chat-model"
              label="Model"
              value={modelId || undefined}
              onValueChange={handleModelChange}
              options={modelSelectOptions}
              disabled={
                modelsLoading ||
                modelSaving ||
                modelSelectOptions.length === 0 ||
                connectionState === 'connecting' ||
                sending
              }
              placeholder={
                modelsLoading
                  ? 'Đang tải…'
                  : modelSelectOptions.length === 0
                    ? 'Chọn provider trước'
                    : 'Chọn model'
              }
            />
          </div>

          <div className={styles.headerActions}>
            <span
              className={`${styles.statusPill} ${statusClass}`}
              title={STATUS_LABEL[connectionState]}
            >
              <span className={styles.statusDot} />
              {statusLoading ? 'Đang kiểm tra…' : STATUS_LABEL[connectionState]}
            </span>

            {ready && connectionState === 'error' && (
              <Button size="sm" variant="outline" onClick={connectChat}>
                <RefreshCw size={14} />
                Kết nối lại
              </Button>
            )}
          </div>
        </header>

        {!modelsLoading && (modelOptions?.providers.length ?? 0) === 0 && (
          <div className={styles.modelHint} role="status">
            Chưa có API key LLM.{' '}
            <Link href="/dashboard/ai-model/gemini">Thêm Gemini API key</Link> rồi chọn model bên
            trên.
          </div>
        )}

        {error && (
          <div className={styles.alert} role="alert">
            <AlertCircle size={18} className={styles.alertIcon} />
            <div className={styles.alertBody}>
              <span className={styles.alertTitle}>Không thể chat</span>
              {error}
            </div>
            {ready && (
              <Button size="sm" variant="outline" onClick={connectChat}>
                Thử lại
              </Button>
            )}
            {!ready && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.replace(SETUP_PATH)}
              >
                Mở setup
              </Button>
            )}
          </div>
        )}

        <div ref={listRef} className={styles.messagePane}>
          {showEmpty && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <MessageSquare size={28} />
              </div>
              <h2 className={styles.emptyTitle}>Bắt đầu hội thoại</h2>
              <p className={styles.emptyHint}>
                {isOssRuntime()
                  ? 'Send a message to chat with your OpenClaw agent via the shared gateway.'
                  : 'Send a message to chat with your OpenClaw agent on your container.'}
                Phím Enter gửi, Shift+Enter xuống dòng.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <ChatMessageBubble key={m.id} role={m.role} text={m.text} />
          ))}

          {streamText && (
            <ChatMessageBubble role="assistant" text={streamText} streaming />
          )}

          {sending && !streamText && <ChatTypingIndicator />}
        </div>

        <footer className={styles.composer}>
          <div className={styles.composerBox}>
            <textarea
              ref={inputRef}
              className={styles.input}
              rows={1}
              placeholder={
                ready && connectionState === 'connected'
                  ? 'Nhập tin nhắn…'
                  : 'Kết nối gateway để chat…'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
              disabled={!ready || connectionState !== 'connected' || sending}
            />
            <div className={styles.composerActions}>
              {sending ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleAbort()}
                  aria-label="Dừng phản hồi"
                >
                  <Square size={16} />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => void handleSend()}
                  disabled={!canSend}
                  aria-label="Gửi tin nhắn"
                >
                  {sending ? <Spinner size="sm" /> : <Send size={16} />}
                </Button>
              )}
            </div>
          </div>
          <p className={styles.composerHint}>
            Enter gửi · Shift+Enter xuống dòng
            {connectionState === 'connected' && (
              <>
                {' '}
                · session <code>{sessionKey}</code>
              </>
            )}
          </p>
        </footer>
      </div>
    </div>
  )
}
