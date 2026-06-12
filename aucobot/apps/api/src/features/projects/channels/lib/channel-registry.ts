import type { ChannelAdapter } from './channel-adapter.types';
import { DISCORD_CHANNEL } from '../adapters/discord/discord.channel';
import { TELEGRAM_CHANNEL } from '../adapters/telegram/telegram.channel';

export const CHANNEL_REGISTRY: ChannelAdapter[] = [TELEGRAM_CHANNEL, DISCORD_CHANNEL];

export function resolveChannel(channelId: string): ChannelAdapter | undefined {
  const key = channelId.trim().toLowerCase();
  return CHANNEL_REGISTRY.find((c) => c.id === key);
}

export function listActiveChannels(): ChannelAdapter[] {
  return CHANNEL_REGISTRY.filter((c) => c.status === 'ACTIVE');
}
