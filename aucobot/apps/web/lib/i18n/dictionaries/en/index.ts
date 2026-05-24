import { enChannels } from './channels'
import { enConnect } from './connect'
import { enDashboard } from './dashboard'
import { enSkills } from './skills'
import { enSidebarProject } from './sidebarProject'

/**
 * English strings.
 * Keep keys in sync with `vi` locale.
 */
export const en = {
  channels: enChannels,
  connect: enConnect,
  skills: enSkills,
  dashboard: enDashboard,
  sidebar: enSidebarProject,
} as const

export type EnDictionary = typeof en
