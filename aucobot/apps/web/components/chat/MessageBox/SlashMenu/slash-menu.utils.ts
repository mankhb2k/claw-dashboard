import type { SlashMenuItem, SlashMenuSection } from './SlashMenu'

export type FlatSlashMenuEntry = {
  sectionId: string
  item: SlashMenuItem
  flatIndex: number
}

export function flattenSlashMenuSections(
  sections: SlashMenuSection[],
): FlatSlashMenuEntry[] {
  const entries: FlatSlashMenuEntry[] = []

  for (const section of sections) {
    for (const item of section.items) {
      entries.push({
        sectionId: section.id,
        item,
        flatIndex: entries.length,
      })
    }
  }

  return entries
}

/** Fixed popover width — narrower than the composer (max 720px). */
export const SLASH_MENU_WIDTH_PX = 360

export function resolveSlashMenuPosition(
  anchor: HTMLElement,
): { left: number; width: number; bottom: number; maxHeight: number } {
  const rect = anchor.getBoundingClientRect()
  const gap = 6
  const maxHeight = Math.min(320, Math.max(120, rect.top - 16))

  return {
    left: rect.left,
    width: Math.min(
      SLASH_MENU_WIDTH_PX,
      Math.max(0, window.innerWidth - 24),
    ),
    bottom: window.innerHeight - rect.top + gap,
    maxHeight,
  }
}
