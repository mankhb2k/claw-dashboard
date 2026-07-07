/** Base path for the authenticated app shell (no project slug in URL). */
export const DASHBOARD_BASE_PATH = "/dashboard";

export function getDashboardPath(): string {
  return DASHBOARD_BASE_PATH;
}

export function dashboardPath(...segments: string[]): string {
  const tail = segments
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return tail ? `${DASHBOARD_BASE_PATH}/${tail}` : DASHBOARD_BASE_PATH;
}
