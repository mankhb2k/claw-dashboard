import { viAiModel } from './aiModel'
import { viChannels } from './channels'
import { viChatToolActivity } from './chat/toolActivity'
import { viConnect } from './connect'
import { viDashboard } from './dashboard'
import { viNodes } from './nodes'
import { viOverview } from './overview'
import { viProfile } from './profile'
import { viSkills } from './skills'
import { viSettings } from './settings'
import { viSidebarProject } from './sidebarProject'

/**
 * Chuỗi tiếng Việt.
 * Cấu trúc này là "nguồn chuẩn" cho toàn bộ key i18n.
 */
export const vi = {
  aiModel: viAiModel,
  channels: viChannels,
  chat: {
    toolActivity: viChatToolActivity,
  },
  connect: viConnect,
  nodes: viNodes,
  overview: viOverview,
  profile: viProfile,
  skills: viSkills,
  dashboard: viDashboard,
  settings: viSettings,
  sidebar: viSidebarProject,
} as const

export type ViDictionary = typeof vi
