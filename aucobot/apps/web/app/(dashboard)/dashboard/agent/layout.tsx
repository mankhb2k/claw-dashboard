'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

import { AgentSectionNav } from './_components/AgentSectionNav/AgentSectionNav'
import styles from './layout.module.css'
import { Flex, Container } from '@/components/layout'

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

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (!shouldUseAgentSectionShell(pathname)) {
    return children
  }

  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="lg" display="flex" className={styles.content}>
        <AgentSectionNav />
        <div className={styles.body}>{children}</div>
      </Container>
    </Flex>
  )
}
