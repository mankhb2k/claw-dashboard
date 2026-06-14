import type { ConnectorAdapter } from './connector-adapter.types';
import { GOOGLE_CALENDAR_CONNECTOR } from '../adapters/google/calendar/google-calendar.connector';
import { GOOGLE_DRIVE_CONNECTOR } from '../adapters/google/drive/google-drive.connector';

export const CONNECTOR_REGISTRY: ConnectorAdapter[] = [
  GOOGLE_DRIVE_CONNECTOR,
  GOOGLE_CALENDAR_CONNECTOR,
];

export function resolveConnector(slugOrId: string): ConnectorAdapter | undefined {
  const key = slugOrId.trim().toLowerCase();
  return CONNECTOR_REGISTRY.find((c) => c.slug === key || c.id === key);
}

export function listActiveConnectors(): ConnectorAdapter[] {
  return CONNECTOR_REGISTRY.filter((c) => c.status === 'ACTIVE');
}
