import type { ChannelDefinition } from './channel.types';
import { TELEGRAM_CHANNEL } from './telegram.channel';

export const CHANNEL_REGISTRY: ChannelDefinition[] = [TELEGRAM_CHANNEL];

export function resolveChannel(channelId: string): ChannelDefinition | undefined {
  const key = channelId.trim().toLowerCase();
  return CHANNEL_REGISTRY.find((c) => c.id === key);
}

export function listActiveChannels(): ChannelDefinition[] {
  return CHANNEL_REGISTRY.filter((c) => c.status === 'ACTIVE');
}
