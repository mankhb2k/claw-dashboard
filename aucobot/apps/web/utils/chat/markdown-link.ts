/** Same-page fragment — use plain `<a>`, not `next/link`. */
export function isHashMarkdownHref(href: string): boolean {
  return href.startsWith("#");
}

/** App route under `/` — client navigation via `next/link`. */
export function isInternalAppHref(href: string | undefined): boolean {
  if (!href) {
    return false;
  }
  if (isHashMarkdownHref(href)) {
    return false;
  }
  if (/^(https?:|mailto:|tel:|\/\/)/i.test(href)) {
    return false;
  }
  return href.startsWith("/");
}
