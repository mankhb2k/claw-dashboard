export type HeartbeatIntervalPreset = "off" | "15m" | "30m" | "1h" | "custom";

export function intervalFromPreset(
  preset: HeartbeatIntervalPreset,
  customAmount: string,
  customUnit: "m" | "h",
): { enabled: boolean; every: string } {
  if (preset === "off") {
    return { enabled: false, every: "0m" };
  }
  if (preset === "15m" || preset === "30m" || preset === "1h") {
    return { enabled: true, every: preset };
  }
  const amount = Number.parseInt(customAmount, 10);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { enabled: true, every: "30m" };
  }
  return { enabled: true, every: `${amount}${customUnit}` };
}

export function presetFromInterval(
  enabled: boolean,
  every: string,
): {
  preset: HeartbeatIntervalPreset;
  customAmount: string;
  customUnit: "m" | "h";
} {
  if (!enabled || every === "0m") {
    return { preset: "off", customAmount: "45", customUnit: "m" };
  }
  if (every === "15m" || every === "30m" || every === "1h") {
    return { preset: every, customAmount: "45", customUnit: "m" };
  }
  const match = /^(\d+)(m|h)$/i.exec(every.trim());
  if (match) {
    return {
      preset: "custom",
      customAmount: match[1] ?? "45",
      customUnit: (match[2]?.toLowerCase() === "h" ? "h" : "m") as "m" | "h",
    };
  }
  return { preset: "30m", customAmount: "45", customUnit: "m" };
}

export const HEARTBEAT_MD_PLACEHOLDER = `# HEARTBEAT checklist

- Review inbox or pending tasks
- Check calendar for the next few hours
- If nothing needs attention, reply HEARTBEAT_OK
`;
