'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { AgentPageShell } from '../AgentPageShell/AgentPageShell'

const SECTION_SLUGS = new Set(['collaboration', 'schedules', 'heartbeat'])

function shouldUseAgentSectionShell(pathname: string): boolean {
  if (pathname === '/dashboard/agent') {
    return true
  }

  if (!pathname.startsWith('/dashboard/agent/')) {
    return false
  }

  const slug = pathname.slice('/dashboard/agent/'.length).split('/')[0]
  return SECTION_SLUGS.has(slug)
}

export function AgentSectionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (shouldUseAgentSectionShell(pathname)) {
    return <AgentPageShell>{children}</AgentPageShell>
  }

  return <>{children}</>
}
