export type OAuthPopupMessage =
  | { type: 'aucobot-oauth-complete'; slug?: string }
  | { type: 'aucobot-oauth-error'; error: string };

const POPUP_NAME = 'aucobot-oauth';
const DEFAULT_WIDTH = 520;
const DEFAULT_HEIGHT = 720;

export function openOAuthPopup(
  url: string,
  options?: { width?: number; height?: number },
): Window | null {
  const width = options?.width ?? DEFAULT_WIDTH;
  const height = options?.height ?? DEFAULT_HEIGHT;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'scrollbars=yes',
    'resizable=yes',
  ].join(',');

  const popup = window.open(url, POPUP_NAME, features);
  popup?.focus();
  return popup;
}

export function waitForOAuthPopupResult(
  popup: Window,
  options: {
    expectedSlug?: string;
    onComplete?: (slug?: string) => void;
    onError?: (error: string) => void;
    onClosed?: () => void;
  },
): () => void {
  const origin = window.location.origin;

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== origin) return;
    const data = event.data as OAuthPopupMessage | undefined;
    if (!data || typeof data !== 'object' || !('type' in data)) return;

    if (data.type === 'aucobot-oauth-complete') {
      if (options.expectedSlug && data.slug && data.slug !== options.expectedSlug) {
        return;
      }
      cleanup();
      options.onComplete?.(data.slug);
      return;
    }

    if (data.type === 'aucobot-oauth-error') {
      cleanup();
      options.onError?.(data.error);
    }
  };

  const interval = window.setInterval(() => {
    if (popup.closed) {
      cleanup();
      options.onClosed?.();
    }
  }, 400);

  function cleanup() {
    window.removeEventListener('message', onMessage);
    window.clearInterval(interval);
  }

  window.addEventListener('message', onMessage);
  return cleanup;
}

export function notifyOAuthOpener(message: OAuthPopupMessage): boolean {
  if (typeof window === 'undefined' || !window.opener) {
    return false;
  }
  try {
    window.opener.postMessage(message, window.location.origin);
    window.close();
    return true;
  } catch {
    return false;
  }
}
