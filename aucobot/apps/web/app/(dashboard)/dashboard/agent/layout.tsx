import React from 'react'
import { AgentSectionLayout } from './_components/AgentSectionLayout/AgentSectionLayout'

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <AgentSectionLayout>{children}</AgentSectionLayout>
}
