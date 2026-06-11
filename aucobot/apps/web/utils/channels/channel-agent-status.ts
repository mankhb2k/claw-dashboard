import type { ChannelCatalogCard } from '@/utils/channels/merge-channel-catalog';

/** Kênh đã thêm ở tab Channel và sẵn sàng bật cho agent. */
export function isChannelReadyForAgent(channel: ChannelCatalogCard): boolean {
  return (
    channel.statusLabel === "Connected" || channel.statusLabel === "Configured"
  );
}
