export type LogLineTone = "default" | "success" | "warn" | "error" | "muted";

export function getLogLineTone(line: string): LogLineTone {
  const text = line.trim();
  if (!text) return "muted";

  if (
    /\b(error|failed|fail|fatal|refused|exited)\b/i.test(text) ||
    /process exited/i.test(text) ||
    text.startsWith("[stderr]")
  ) {
    return "error";
  }

  if (/\bwarn(ing)?\b/i.test(text) || text.includes("⚠")) {
    return "warn";
  }

  if (
    /✓|success|connected|redeem|starting|reconnect|saved|ok\b/i.test(text) ||
    /\b200\b/.test(text)
  ) {
    return "success";
  }

  if (/^\[.*\]$/.test(text) || /^\d{2}:\d{2}:\d{2}/.test(text)) {
    return "muted";
  }

  return "default";
}
