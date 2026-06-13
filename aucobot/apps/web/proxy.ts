import { NextRequest, NextResponse } from "next/server";
import {
  applySetCookies,
  resolveSession,
} from "@/lib/auth/session-middleware";
import { getServerApiBaseUrl } from "@/lib/http/api-base-url";
import { DASHBOARD_BASE_PATH } from "@/lib/routing/dashboard-route";
import { SETUP_PATH } from "@/lib/routing/entry-route";

const PUBLIC_ROUTES = ["/login", "/register"];
const MOCK_AUTH_BYPASS = process.env.NEXT_PUBLIC_MOCK_API === "true";

const PUBLIC_STATIC_EXT = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i;

function withSessionCookies(
  response: NextResponse,
  setCookies: string[],
): NextResponse {
  return setCookies.length > 0 ? applySetCookies(response, setCookies) : response;
}

export async function proxy(request: NextRequest) {
  // Mock API: not block /login /register (to logout work). Only redirect "/" → dashboard.
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
      const projectsRes = await fetch(
        `${getServerApiBaseUrl()}/api/projects/mine`,
        {
          method: "GET",
          headers: {
            cookie: request.headers.get("cookie") ?? "",
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );
      if (projectsRes.ok) {
        const json: unknown = await projectsRes.json();
        const o =
          json && typeof json === "object"
            ? (json as Record<string, unknown>)
            : null;
        const payload =
          o && o.success === true && Array.isArray(o.data)
            ? o.data
            : Array.isArray(json)
              ? json
              : [];
        const first = payload[0] as { status?: string } | undefined;
        if (first?.status?.toLowerCase() === "running") {
          return withSessionCookies(
            NextResponse.redirect(new URL(DASHBOARD_BASE_PATH, request.url)),
            session.setCookies,
          );
        }
      }
    } catch {
      // fall through to setup
    }
    return withSessionCookies(
      NextResponse.redirect(new URL(SETUP_PATH, request.url)),
      session.setCookies,
    );
  }

  return withSessionCookies(NextResponse.next(), session.setCookies);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
