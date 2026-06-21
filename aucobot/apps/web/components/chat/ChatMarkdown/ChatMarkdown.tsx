'use client'

import Link from 'next/link'
import { useMemo, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import styles from './ChatMarkdown.module.css'
import { stabilizeStreamingMarkdown } from './stabilize-streaming-markdown'
import { isInternalAppHref } from '@/utils/chat/markdown-link'

export type ChatMarkdownProps = {
  content: string
  streaming?: boolean
}

function MarkdownLink({
  href,
  children,
}: {
  href?: string
  children?: ReactNode
}) {
  if (!href) {
    return <span>{children}</span>
  }

  if (isInternalAppHref(href)) {
    return <Link href={href}>{children}</Link>
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

const CHAT_MARKDOWN_COMPONENTS = {
  a: MarkdownLink,
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
        components={CHAT_MARKDOWN_COMPONENTS}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  )
}
