/** Connector integrations only — always logoship CDN. Sync connector-logos.json from logoship after changes. */
import connectorLogos from './connector-logos.json';

const DEFAULT_CDN_BASE = 'https://cdn.jsdelivr.net/gh/logoship/logoship@latest';

function cdnBase(): string {
  const custom = process.env.NEXT_PUBLIC_LOGOSHIP_CDN_BASE?.trim();
  if (custom) {
    return custom.replace(/\/$/, '');
  }
  return DEFAULT_CDN_BASE;
}

/** Resolve connector logo URL via logoship CDN (not used for channels / AI models / brand). */
export function connectorLogo(name: string): string {
  const key = name.replace(/\.svg$/i, '');
  const rel = connectorLogos[key as keyof typeof connectorLogos];
  if (!rel) {
    return `${cdnBase()}/${key}.svg`;
  }
  return `${cdnBase()}/${rel}`;
}
