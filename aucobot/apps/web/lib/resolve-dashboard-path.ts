import { resolveEntryPath } from "@/lib/entry-route";

/** @deprecated Use resolveEntryPath — respects project / container state. */
export async function resolveDashboardPath(): Promise<string> {
  return resolveEntryPath();
}
