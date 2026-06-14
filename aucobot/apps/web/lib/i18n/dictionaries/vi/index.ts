import { viChannels } from './channels'
import { viChatToolActivity } from './chat/toolActivity'
import { viConnect } from './connect'
import { viDashboard } from './dashboard'
import { viSkills } from './skills'
import { viSidebarProject } from './sidebarProject'

/**
 * Chuỗi tiếng Việt.
 * Cấu trúc này là "nguồn chuẩn" cho toàn bộ key i18n.
 */
export const vi = {
  channels: viChannels,
  chat: {
    toolActivity: viChatToolActivity,
  },
  connect: viConnect,
  skills: viSkills,
  dashboard: viDashboard,
  sidebar: viSidebarProject,
} as const

export type ViDictionary = typeof vi
