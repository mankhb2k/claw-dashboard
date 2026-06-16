'use client'

import { useMemo } from 'react'

import { isWebResearchTool } from '@/utils/chat/tool/output'
import type { LiveThreadItem, ToolStreamEntry } from '@/utils/chat/tool/types'

import { ChatMessageBubble } from '../ChatMessageBubble/ChatMessageBubble'
import { ToolActivityBar } from '../ToolActivityBar/ToolActivityBar'
import { ToolActivityCard } from '../ToolActivityCard/ToolActivityCard'
import { ToolResearchBlock } from '../ToolResearchBlock/ToolResearchBlock'

type GroupedLiveItem =
  | { kind: 'text'; id: string; text: string }
  | { kind: 'web'; id: string; entries: ToolStreamEntry[] }
  | { kind: 'card'; id: string; entry: ToolStreamEntry }

function groupLiveItems(items: LiveThreadItem[]): GroupedLiveItem[] {
  const grouped: GroupedLiveItem[] = []

  for (const item of items) {
    if (item.type === 'text') {
      grouped.push({ kind: 'text', id: item.id, text: item.text })
      continue
    }

    if (isWebResearchTool(item.entry.canonicalId)) {
      const last = grouped[grouped.length - 1]
      if (last?.kind === 'web') {
        last.entries.push(item.entry)
        continue
      }
      grouped.push({ kind: 'web', id: item.id, entries: [item.entry] })
      continue
    }

    grouped.push({ kind: 'card', id: item.id, entry: item.entry })
  }

  return grouped
}

type ChatLiveThreadProps = {
  liveItems: LiveThreadItem[]
  showToolPreparing?: boolean
}

export function ChatLiveThread({
  liveItems,
  showToolPreparing = false,
}: ChatLiveThreadProps) {
  const grouped = useMemo(() => groupLiveItems(liveItems), [liveItems])

  return (
    <>
      {grouped.map((item) => {
        if (item.kind === 'text') {
          return (
            <ChatMessageBubble
              key={item.id}
              role="assistant"
              text={item.text}
            />
          )
        }
        if (item.kind === 'web') {
          return <ToolResearchBlock key={item.id} entries={item.entries} />
        }
        return <ToolActivityCard key={item.id} entry={item.entry} />
      })}

      {showToolPreparing && liveItems.length === 0 ? (
        <ToolActivityBar activities={[]} showPreparing />
      ) : null}
    </>
  )
}
