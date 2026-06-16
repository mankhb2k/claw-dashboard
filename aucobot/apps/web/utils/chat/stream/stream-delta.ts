/**
 * Merge OpenClaw chat deltas — gateway may send cumulative snapshots or incremental chunks.
 */
export function accumulateStreamDelta(previous: string, chunk: string): string {
  const prev = previous
  const next = chunk
  if (!next) return prev
  if (!prev) return next
  if (next === prev) return prev
  if (next.startsWith(prev)) return next
  if (prev.startsWith(next) && next.length <= prev.length) return prev
  return prev + next
}
