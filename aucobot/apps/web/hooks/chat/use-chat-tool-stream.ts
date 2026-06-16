'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { GatewayEventFrame } from '@/lib/chat/project-chat-client'
import { isHiddenToolPayloadText } from '@/utils/chat/stream/history-filter'
import {
  applyToolActivityPatch,
  parseToolGatewayEvent,
  toActivityList,
  toStreamEntryList,
  toolEntryToActivity,
} from '@/utils/chat/tool/stream'
import type {
  LiveThreadItem,
  ToolActivity,
  ToolStreamEntry,
} from '@/utils/chat/tool/types'

export function useChatToolStream(
  activeSessionKey: string,
  sending: boolean,
  streamText = '',
) {
  const [entryMap, setEntryMap] = useState<Map<string, ToolStreamEntry>>(
    () => new Map(),
  )
  const [liveItems, setLiveItems] = useState<LiveThreadItem[]>([])
  const sessionKeyRef = useRef(activeSessionKey)
  const flushCallbackRef = useRef<(() => string) | null>(null)

  useEffect(() => {
    sessionKeyRef.current = activeSessionKey
  }, [activeSessionKey])

  const resetToolStream = useCallback(() => {
    setEntryMap(new Map())
    setLiveItems([])
  }, [])

  useEffect(() => {
    resetToolStream()
  }, [activeSessionKey, resetToolStream])

  const registerStreamFlush = useCallback((getStreamText: () => string) => {
    flushCallbackRef.current = getStreamText
  }, [])

  const flushStreamText = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isHiddenToolPayloadText(trimmed)) return
    setLiveItems((prev) => [
      ...prev,
      { type: 'text', id: `seg-${Date.now()}-${prev.length}`, text: trimmed },
    ])
  }, [])

  const handleGatewayToolEvent = useCallback((evt: GatewayEventFrame) => {
    if (evt.event !== 'agent' && evt.event !== 'session.tool') return

    const patch = parseToolGatewayEvent(
      evt.event,
      evt.payload,
      sessionKeyRef.current,
    )
    if (!patch) return

    if (patch.phase === 'start') {
      const pending = flushCallbackRef.current?.() ?? ''
      if (pending.trim()) {
        flushStreamText(pending)
      }
    }

    setEntryMap((prev) => {
      const next = applyToolActivityPatch(prev, patch)
      const entry = next.get(patch.id)
      if (entry && patch.phase === 'start') {
        setLiveItems((items) => {
          if (items.some((item) => item.type === 'tool' && item.id === patch.id)) {
            return items.map((item) =>
              item.type === 'tool' && item.id === patch.id
                ? { type: 'tool', id: patch.id, entry }
                : item,
            )
          }
          return [...items, { type: 'tool', id: patch.id, entry }]
        })
      } else if (entry) {
        setLiveItems((items) =>
          items.map((item) =>
            item.type === 'tool' && item.id === patch.id
              ? { type: 'tool', id: patch.id, entry }
              : item,
          ),
        )
      }
      return next
    })
  }, [flushStreamText])

  const entries = useMemo(() => toStreamEntryList(entryMap), [entryMap])
  const activities = useMemo(
    () => toActivityList(new Map([...entryMap].map(([id, e]) => [id, toolEntryToActivity(e)]))),
    [entryMap],
  ) as ToolActivity[]

  const showPreparing =
    sending &&
    !streamText.trim() &&
    entries.length === 0 &&
    liveItems.length === 0

  return {
    entries,
    activities,
    liveItems,
    showPreparing,
    handleGatewayToolEvent,
    resetToolStream,
    flushStreamText,
    registerStreamFlush,
  }
}
