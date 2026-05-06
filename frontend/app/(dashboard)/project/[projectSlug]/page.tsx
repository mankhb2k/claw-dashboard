'use client'

import { useParams } from 'next/navigation'
import { ProjectDetailContent } from '@/app/(dashboard)/_components/ProjectDetailContent'

export default function ProjectOverviewPage() {
  const params = useParams()
  const segment =
    typeof params.projectSlug === 'string' ? params.projectSlug : ''
  return <ProjectDetailContent projectSegment={segment} />
}
