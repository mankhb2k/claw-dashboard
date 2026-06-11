export type ContextUsageLevel =
  | "unknown"
  | "normal"
  | "warning"
  | "critical"
  | "overflow";

export type ContextUsageSnapshot = {
  totalTokens?: number;
  contextTokens?: number;
  totalTokensFresh?: boolean;
  compactionCount?: number;
};

export function formatTokenCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value < 0) return "—";
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m >= 10 ? `${Math.round(m)}M` : `${m.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 10_000) return `${Math.round(value / 1000)}k`;
  if (value >= 1000) {
    const k = value / 1000;
    return `${k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(Math.round(value));
}

export function resolveContextPercent(
  totalTokens?: number,
  contextTokens?: number,
): number | null {
  if (
    totalTokens == null ||
    contextTokens == null ||
    !Number.isFinite(totalTokens) ||
    !Number.isFinite(contextTokens) ||
    contextTokens <= 0 ||
    totalTokens < 0
  ) {
    return null;
  }
  return Math.min(999, Math.round((totalTokens / contextTokens) * 100));
}

export function resolveContextUsageLevel(
  percent: number | null,
  fresh: boolean,
): ContextUsageLevel {
  if (percent == null || !fresh) return "unknown";
  if (percent > 100) return "overflow";
  if (percent >= 85) return "critical";
  if (percent >= 70) return "warning";
  return "normal";
}

export function buildContextUsageTooltip(
  snapshot: ContextUsageSnapshot,
  modelLabel?: string,
): string {
  const { totalTokens, contextTokens, totalTokensFresh, compactionCount } =
    snapshot;
  const percent = resolveContextPercent(totalTokens, contextTokens);
  const used = formatTokenCount(totalTokens);
  const max = formatTokenCount(contextTokens);

  const lines: string[] = [];

  if (percent != null && totalTokensFresh) {
    lines.push(`Context: ${used} / ${max} (${percent}%)`);
  } else if (contextTokens != null) {
    lines.push(`Context: — / ${max}`);
    lines.push("No usage data from the latest chat turn yet");
  } else {
    lines.push("Context: —");
    lines.push("No context data yet");
  }

  if (modelLabel?.trim()) {
    lines.push(`Model: ${modelLabel.trim()}`);
  }

  if (typeof compactionCount === "number" && compactionCount > 0) {
    lines.push(`Compacted ${compactionCount} time${compactionCount === 1 ? "" : "s"}`);
  }

  return lines.join("\n");
}
