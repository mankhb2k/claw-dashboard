import type { RawData } from 'ws';

/** Parse a gateway WebSocket message into a JSON frame object. */
export function parseWsFrame(raw: RawData): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(String(raw)) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
