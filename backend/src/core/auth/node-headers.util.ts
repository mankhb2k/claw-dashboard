import { IncomingHttpHeaders } from 'http';

export function toHeaders(nodeHeaders: IncomingHttpHeaders): Headers {
  const headers = new Headers();

  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (typeof value === 'string') {
      headers.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
    }
  }

  return headers;
}
