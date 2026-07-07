import type { RawData } from 'ws';

function wsRawToUtf8(raw: RawData): string {
  if (typeof raw === 'string') return raw;
  if (Buffer.isBuffer(raw)) return raw.toString('utf8');
  if (Array.isArray(raw)) return Buffer.concat(raw).toString('utf8');
  return Buffer.from(raw).toString('utf8');
}

/** Parse a gateway WebSocket message into a JSON frame object. */
export function parseWsFrame(raw: RawData): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(wsRawToUtf8(raw)) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
