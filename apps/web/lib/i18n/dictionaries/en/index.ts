import { enAgent } from './agent'
import { enAiModel } from './aiModel'
import { enAuth } from './auth'
import { enChannels } from './channels'
import { enChatComposer } from './chat/composer'
import { enChatErrors } from './chat/errors'
import { enChatPanel } from './chat/panel'
import { enChatSidebar } from './chat/sidebar'
import { enChatToolActivity } from './chat/toolActivity'
import { enCommon } from './common'
import { enConnect } from './connect'
import { enDashboard } from './dashboard'
import { enHttp } from './http'
import { enNodes } from './nodes'
import { enOverview } from './overview'
import { enProfile } from './profile'
import { enProject } from './project'
import { enSettings } from './settings'
import { enSetup } from './setup'
import { enSidebarProject } from './sidebarProject'
import { enSkills } from './skills'

/**
 * English strings.
 * Keep keys in sync with `vi` locale.
 */
export const en = {
  auth: enAuth,
  agent: enAgent,
  aiModel: enAiModel,
  channels: enChannels,
  chat: {
    errors: enChatErrors,
    composer: enChatComposer,
    panel: enChatPanel,
    sidebar: enChatSidebar,
    toolActivity: enChatToolActivity,
  },
  common: enCommon,
  connect: enConnect,
  nodes: enNodes,
  overview: enOverview,
  project: enProject,
  profile: enProfile,
  skills: enSkills,
  dashboard: enDashboard,
  http: enHttp,
  settings: enSettings,
  sidebar: enSidebarProject,
  setup: enSetup,
} as const

export type EnDictionary = typeof en
