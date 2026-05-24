import type { ConnectorDefinition } from '@/schemas/project.schema'
import type { ServiceConnectData } from './projectConnectData'

/** Icon & metadata UI — catalog tên/mô tả lấy từ API backend. */
const CONNECTOR_UI: Record<string, Pick<ServiceConnectData, 'iconSrc' | 'author'>> = {
  'google-drive': {
    author: 'Google',
    iconSrc: '/tools-provider-icon/GoogleDrive-icon.svg',
  },
  'google-calendar': {
    author: 'Google',
    iconSrc: '/tools-provider-icon/GoogleCalendar-icon.svg',
  },
}

export function toServiceConnectData(def: ConnectorDefinition): ServiceConnectData {
  const ui = CONNECTOR_UI[def.slug] ?? {}
  return {
    id: def.slug,
    name: def.displayName,
    slug: def.slug,
    type: def.kind,
    author: ui.author ?? 'Third party',
    description: def.description,
    iconSrc: ui.iconSrc,
  }
}

export function findServiceBySlug(
  slug: string,
  definitions?: ConnectorDefinition[],
): ServiceConnectData | undefined {
  const def = definitions?.find((d) => d.slug === slug)
  if (def) return toServiceConnectData(def)
  const ui = CONNECTOR_UI[slug]
  if (!ui) return undefined
  return {
    id: slug,
    slug,
    name: slug,
    type: 'OAUTH',
    author: ui.author,
    description: '',
    iconSrc: ui.iconSrc,
  }
}
