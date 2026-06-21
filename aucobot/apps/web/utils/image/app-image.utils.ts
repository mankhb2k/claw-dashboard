export function isBlobOrDataUrl(src: string): boolean {
  return src.startsWith("blob:") || src.startsWith("data:");
}

export function isLocalAsset(src: string): boolean {
  return src.startsWith("/") && !src.startsWith("//");
}

export function isSvgSrc(src: string): boolean {
  const path = src.split("?")[0] ?? src;
  return path.toLowerCase().endsWith(".svg");
}

/** Blob/data previews and SVG from /public skip the optimizer pipeline. */
export function shouldUseUnoptimized(src: string): boolean {
  return isBlobOrDataUrl(src) || isSvgSrc(src);
}
