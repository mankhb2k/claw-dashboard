'use client'

import { useParams } from 'next/navigation'
import { ProjectSettingsContent } from '@/app/(dashboard)/_components/ProjectSettingsContent'

export default function ProjectSettingPage() {
  const params = useParams()
  const segment = typeof params.projectSlug === 'string' ? params.projectSlug : ''

  return <ProjectSettingsContent projectSegment={segment} />
}
