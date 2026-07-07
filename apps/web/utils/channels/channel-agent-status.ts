import type { ChannelCatalogCard } from '@/utils/channels/merge-channel-catalog';

/** Channel added on the Channel tab and ready to enable for an agent. */
export function isChannelReadyForAgent(channel: ChannelCatalogCard): boolean {
  return (
    channel.statusLabel === "Connected" || channel.statusLabel === "Configured"
  );
}
