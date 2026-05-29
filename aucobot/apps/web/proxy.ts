import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/auth/session-middleware";
import { getServerApiBaseUrl } from "@/lib/api-base-url";
import { DASHBOARD_BASE_PATH } from "@/lib/dashboard-route";
import { SETUP_PATH } from "@/lib/entry-route";

const PUBLIC_ROUTES = ["/login", "/register"];
const MOCK_AUTH_BYPASS = process.env.NEXT_PUBLIC_MOCK_API === "true";

const PUBLIC_STATIC_EXT = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i;

export async function proxy(request: NextRequest) {
  // Mock API: không chặn /login /register (để đăng xuất hoạt động). Chỉ redirect "/" → dashboard.
  if (MOCK_AUTH_BYPASS) {
    const { pathname } = request.nextUrl;
    if (pathname === "/") {
      return NextResponse.redirect(new URL(DASHBOARD_BASE_PATH, request.url));
    }
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (PUBLIC_STATIC_EXT.test(pathname)) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
  const session = await resolveSession(request);
  const validSession = session.valid;

  if (!isPublic && !validSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname === "/" || isPublic) && validSession) {
    try {
      const projectsRes = await fetch(`${getServerApiBaseUrl()}/api/projects/mine`, {
        method: "GET",
        headers: { cookie: request.headers.get("cookie") ?? "", Accept: "application/json" },
        cache: "no-store",
      });
      if (projectsRes.ok) {
        const json: unknown = await projectsRes.json();
        const o = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
        const payload =
          o && o.success === true && Array.isArray(o.data) ? o.data : Array.isArray(json) ? json : [];
        const first = payload[0] as { status?: string } | undefined;
        if (first?.status?.toLowerCase() === "running") {
          return NextResponse.redirect(new URL(DASHBOARD_BASE_PATH, request.url));
        }
      }
    } catch {
      // fall through to setup
    }
    return NextResponse.redirect(new URL(SETUP_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
