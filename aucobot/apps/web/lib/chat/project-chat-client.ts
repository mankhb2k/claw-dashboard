export type GatewayEventFrame = {
  type: 'event'
  event: string
  payload?: unknown
}

export type GatewayResponseFrame = {
  type: 'res'
  id: string
  ok: boolean
  payload?: unknown
  error?: { code?: string; message?: string }
}

import { getPublicApiBaseUrl } from '@/lib/http/api-base-url'

export class ProjectChatClient {
  private ws: WebSocket | null = null
  private pending = new Map<
    string,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >()
  private closed = false

  constructor(
    private readonly opts: {
      projectId: string
      onReady?: () => void
      onEvent?: (evt: GatewayEventFrame) => void
      onClose?: (info: { code: number; reason: string }) => void
      onError?: (message: string) => void
    },
  ) {}

  private wsUrl(): string {
    const configured = getPublicApiBaseUrl()
    const base =
      configured ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8386')
    const wsBase = base.replace(/^http/, 'ws')
    return `${wsBase}/api/projects/${this.opts.projectId}/chat/ws`
  }

  connect(): void {
    this.closed = false
    const ws = new WebSocket(this.wsUrl())
    this.ws = ws

    ws.addEventListener('open', () => {
      /* wait for proxy.ready */
    })

    ws.addEventListener('message', (ev) => {
      let parsed: unknown
      try {
        parsed = JSON.parse(String(ev.data))
      } catch {
        return
      }
      const frame = parsed as Record<string, unknown>
      if (frame.type === 'event') {
        const evt = parsed as GatewayEventFrame
        if (evt.event === 'proxy.ready') {
          this.opts.onReady?.()
          return
        }
        if (evt.event === 'proxy.error') {
          const payload = evt.payload as { message?: string } | undefined
          this.opts.onError?.(payload?.message ?? 'Proxy error')
          return
        }
        this.opts.onEvent?.(evt)
        return
      }
      if (frame.type === 'res') {
        const res = parsed as GatewayResponseFrame
        const pending = this.pending.get(res.id)
        if (!pending) return
        this.pending.delete(res.id)
        if (res.ok) pending.resolve(res.payload)
        else pending.reject(new Error(res.error?.message ?? 'request failed'))
      }
    })

    ws.addEventListener('close', (ev) => {
      this.ws = null
      this.flushPending(new Error('connection closed'))
      this.opts.onClose?.({ code: ev.code, reason: ev.reason })
    })

    ws.addEventListener('error', () => {
      this.opts.onError?.('WebSocket error')
    })
  }

  disconnect(): void {
    this.closed = true
    this.ws?.close()
    this.ws = null
    this.flushPending(new Error('disconnected'))
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  request<T>(method: string, params?: unknown): Promise<T> {
    const ws = this.ws
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Not connected'))
    }
    const id = crypto.randomUUID()
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (v) => resolve(v as T),
        reject,
      })
      ws.send(JSON.stringify({ type: 'req', id, method, params }))
    })
  }

  private flushPending(err: Error): void {
    for (const p of this.pending.values()) p.reject(err)
    this.pending.clear()
  }
}
