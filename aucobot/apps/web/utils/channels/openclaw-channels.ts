/**
 * OpenClaw chat channels — skeleton từ @aucobot/shared; tên/mô tả từ i18n.
 * Tài liệu: https://docs.openclaw.ai/channels
 */
import {
  OPENCLAW_CHANNEL_DEFS,
  OPENCLAW_DOC_ORIGIN,
  openclawDocsUrl,
  type OpenClawChannelDefEntry,
  type OpenClawChannelId,
  type OpenClawChannelDefKind,
} from '@aucobot/shared';
import type { AppDictionary } from '@/lib/i18n/dictionaries';

export {
  OPENCLAW_CHANNEL_DEFS,
  OPENCLAW_DOC_ORIGIN,
  openclawDocsUrl,
  type OpenClawChannelDefEntry as OpenClawChannelDef,
  type OpenClawChannelId,
  type OpenClawChannelDefKind as OpenClawChannelKind,
};

export type OpenClawChannel = OpenClawChannelDefEntry & {
  name: string;
  description: string;
  vendor: string;
};

/** Ghép định nghĩa kênh với `channels.items` trong dictionary i18n. */
export function resolveOpenClawChannels(
  items: AppDictionary['channels']['items'],
): OpenClawChannel[] {
  return OPENCLAW_CHANNEL_DEFS.map((def) => {
    const row = items[def.id];
    return {
      ...def,
      name: row.name,
      description: row.description,
      vendor: row.vendor,
    };
  });
}
