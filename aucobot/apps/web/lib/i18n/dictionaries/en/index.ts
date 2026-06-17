import { enAgent } from './agent'
import { enAiModel } from './aiModel'
import { enChannels } from './channels'
import { enChatToolActivity } from './chat/toolActivity'
import { enConnect } from './connect'
import { enDashboard } from './dashboard'
import { enNodes } from './nodes'
import { enOverview } from './overview'
import { enProfile } from './profile'
import { enSkills } from './skills'
import { enSettings } from './settings'
import { enSidebarProject } from './sidebarProject'

/**
 * English strings.
 * Keep keys in sync with `vi` locale.
 */
export const en = {
  agent: enAgent,
  aiModel: enAiModel,
  channels: enChannels,
  chat: {
    toolActivity: enChatToolActivity,
  },
  connect: enConnect,
  nodes: enNodes,
  overview: enOverview,
  profile: enProfile,
  skills: enSkills,
  dashboard: enDashboard,
  settings: enSettings,
  sidebar: enSidebarProject,
} as const

export type EnDictionary = typeof en
