'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

import { stabilizeStreamingMarkdown } from './stabilize-streaming-markdown'
import styles from './ChatMarkdown.module.css'

export type ChatMarkdownProps = {
  content: string
  streaming?: boolean
}

export function ChatMarkdown({ content, streaming = false }: ChatMarkdownProps) {
  const safeContent = useMemo(() => {
    if (!content) return ''
    return streaming ? stabilizeStreamingMarkdown(content) : content
  }, [content, streaming])

  if (!safeContent.trim()) return null

  return (
    <div
      className={`${styles.markdown}${streaming ? ` ${styles.streamingCursor}` : ''}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  )
}
