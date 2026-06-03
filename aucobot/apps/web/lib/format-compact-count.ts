/** Compact number like ClawHub UI: 456369 → "456k". */
export function formatCompactCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  if (value >= 1_000_000) {
    const n = value / 1_000_000;
    return `${n >= 10 ? Math.round(n) : n.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1_000) {
    const n = value / 1_000;
    return `${n >= 10 ? Math.round(n) : n.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(Math.round(value));
}
