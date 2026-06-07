"use client";

import {
  buildContextUsageTooltip,
  resolveContextPercent,
  resolveContextUsageLevel,
  type ContextUsageSnapshot,
} from "./context-usage.utils";
import styles from "./ContextUsageRing.module.css";

const SIZE = 22;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export type ContextUsageRingProps = ContextUsageSnapshot & {
  modelLabel?: string;
  className?: string;
};

export function ContextUsageRing({
  totalTokens,
  contextTokens,
  totalTokensFresh = false,
  compactionCount,
  modelLabel,
  className,
}: ContextUsageRingProps) {
  const percent = resolveContextPercent(totalTokens, contextTokens);
  const level = resolveContextUsageLevel(percent, totalTokensFresh);
  const displayPercent =
    percent != null && totalTokensFresh ? Math.min(100, percent) : 0;
  const dashOffset =
    level === "unknown"
      ? CIRCUMFERENCE * 0.75
      : CIRCUMFERENCE - (displayPercent / 100) * CIRCUMFERENCE;

  const fillClass =
    level === "unknown"
      ? styles.fillUnknown
      : level === "warning"
        ? styles.fillWarning
        : level === "critical" || level === "overflow"
          ? styles.fillCritical
          : styles.fillNormal;

  const tooltip = buildContextUsageTooltip(
    { totalTokens, contextTokens, totalTokensFresh, compactionCount },
    modelLabel,
  );

  const ariaLabel =
    percent != null && totalTokensFresh
      ? `Context usage ${percent} percent`
      : "Context usage unknown";

  return (
    <button
      type="button"
      className={[
        styles.root,
        styles.rootInteractive,
        !totalTokensFresh ? styles.stale : "",
        level === "overflow" ? styles.pulse : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      title={tooltip}
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <svg
        className={styles.ring}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden
      >
        <circle
          className={styles.track}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
        />
        <circle
          className={fillClass}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
        />
      </svg>
    </button>
  );
}
