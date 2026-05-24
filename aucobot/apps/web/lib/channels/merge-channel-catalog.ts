import type { ChannelDefinition, ProjectChannel } from '@/schemas/project.schema';
import { channelIconFor } from './channel-icons';

export type ChannelCatalogCard = {
  channelId: string;
  name: string;
  description: string;
  statusLabel: string;
  isConnected: boolean;
  isActive: boolean;
  iconSrc?: string;
  iconLabel?: string;
  projectChannelId?: string;
};

function statusLabelFor(row: ProjectChannel | undefined, def: ChannelDefinition): string {
  if (def.status === 'DISABLED') return 'Coming soon';

  if (!row) return 'Disconnected';

  if (row.connectionStatus === 'error') return 'Error';
  if (row.connectionStatus === 'needs_reauth') return 'Needs re-auth';
  if (row.enabled && row.connectionStatus === 'connected') return 'Connected';
  if (row.connectionStatus === 'connected') return 'Configured';
  if (row.connectionStatus === 'configured') return 'Configured';

  return 'Disconnected';
}

export function mergeChannelCatalog(
  definitions: ChannelDefinition[],
  projectChannels: ProjectChannel[],
): ChannelCatalogCard[] {
  const byChannelId = new Map(projectChannels.map((c) => [c.channelId, c]));

  return definitions.map((def) => {
    const channelId = def.channelId || def.id;
    const row = byChannelId.get(channelId);
    const icons = channelIconFor(channelId);
    const statusLabel = statusLabelFor(row, def);
    const isConnected = statusLabel === 'Connected';

    return {
      channelId,
      name: def.displayName,
      description: def.description,
      statusLabel,
      isConnected,
      isActive: def.status === 'ACTIVE',
      iconSrc: icons?.iconSrc,
      iconLabel: icons?.iconLabel,
      projectChannelId: row?.id,
    };
  });
}
