'use client'

import { useParams } from 'next/navigation'
import { ProjectDetailContent } from '@/app/(dashboard)/_components/ProjectDetailContent'

export default function ProjectDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  return <ProjectDetailContent projectSegment={id} />
}
