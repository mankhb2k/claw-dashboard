import type {
  ProjectEnvMaskedRow,
  ProviderDefinition,
} from '@/schemas/project.schema'
import {
  getProviderUiMetadata,
  PHASE1_AI_PROVIDER_IDS,
  PHASE1_FOUNDATION_IDS,
} from './providers-data'

export type MergedProviderCard = {
  id: string
  name: string
  envKey: string
  uiGroup: 'foundation' | 'ai-provider'
  icon: string
  iconSrc?: string
  color: string
  status: string
  ready: boolean
}

function connectionStatus(
  row: ProjectEnvMaskedRow | undefined,
): { status: string; ready: boolean } {
  if (!row) {
    return { status: 'No connection', ready: false }
  }
  if (row.enabled === false) {
    return { status: 'Disabled', ready: false }
  }
  if (row.lastTestOk === false) {
    return { status: 'Error', ready: false }
  }
  return { status: 'Connected', ready: true }
}

function mergeCard(
  definition: ProviderDefinition,
  envByKey: Record<string, ProjectEnvMaskedRow>,
): MergedProviderCard {
  const ui = getProviderUiMetadata(definition.id)
  const row = envByKey[definition.envKey]
  const { status, ready } = connectionStatus(row)

  return {
    id: definition.id,
    name: definition.displayName,
    envKey: definition.envKey,
    uiGroup: definition.uiGroup,
    icon: ui?.icon ?? 'smart_toy',
    iconSrc: ui?.iconSrc,
    color: ui?.color ?? '#64748B',
    status,
    ready,
  }
}

export function mergeProviderCatalog(
  definitions: ProviderDefinition[],
  envRows: ProjectEnvMaskedRow[],
): { foundation: MergedProviderCard[]; aiProvider: MergedProviderCard[] } {
  const envByKey: Record<string, ProjectEnvMaskedRow> = {}
  for (const row of envRows) {
    envByKey[row.key] = row
  }

  const byId = new Map(definitions.map((d) => [d.id, d]))

  const foundation = PHASE1_FOUNDATION_IDS.flatMap((id) => {
    const def = byId.get(id)
    return def ? [mergeCard(def, envByKey)] : []
  })

  const aiProvider = PHASE1_AI_PROVIDER_IDS.flatMap((id) => {
    const def = byId.get(id)
    return def ? [mergeCard(def, envByKey)] : []
  })

  return { foundation, aiProvider }
}
