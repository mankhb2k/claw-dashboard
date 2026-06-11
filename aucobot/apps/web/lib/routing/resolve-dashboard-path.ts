import { resolveEntryPath } from "@/lib/routing/entry-route";

/** @deprecated Use resolveEntryPath — respects project / container state. */
export async function resolveDashboardPath(): Promise<string> {
  return resolveEntryPath();
}
