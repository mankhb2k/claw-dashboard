import { viAgent } from './agent'
import { viAiModel } from './aiModel'
import { viAuth } from './auth'
import { viChannels } from './channels'
import { viChatComposer } from './chat/composer'
import { viChatErrors } from './chat/errors'
import { viChatPanel } from './chat/panel'
import { viChatSidebar } from './chat/sidebar'
import { viChatToolActivity } from './chat/toolActivity'
import { viCommon } from './common'
import { viConnect } from './connect'
import { viDashboard } from './dashboard'
import { viHttp } from './http'
import { viNodes } from './nodes'
import { viOverview } from './overview'
import { viProfile } from './profile'
import { viProject } from './project'
import { viSettings } from './settings'
import { viSetup } from './setup'
import { viSidebarProject } from './sidebarProject'
import { viSkills } from './skills'

/**
 * Vietnamese strings.
 * This structure is the source of truth for all i18n keys.
 */
export const vi = {
  auth: viAuth,
  agent: viAgent,
  aiModel: viAiModel,
  channels: viChannels,
  chat: {
    errors: viChatErrors,
    composer: viChatComposer,
    panel: viChatPanel,
    sidebar: viChatSidebar,
    toolActivity: viChatToolActivity,
  },
  common: viCommon,
  connect: viConnect,
  nodes: viNodes,
  overview: viOverview,
  project: viProject,
  profile: viProfile,
  skills: viSkills,
  dashboard: viDashboard,
  http: viHttp,
  settings: viSettings,
  sidebar: viSidebarProject,
  setup: viSetup,
} as const

export type ViDictionary = typeof vi
