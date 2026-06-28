"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { notifyOAuthOpener } from "@/lib/oauth/oauth-popup";

/**
 * When OAuth runs in a popup, the callback page notifies the opener and closes.
 */
export function OAuthPopupBridge() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || !window.opener) return;

    const oauthError = searchParams.get("oauth_error");
    if (oauthError) {
      notifyOAuthOpener({ type: "aucobot-oauth-error", error: oauthError });
      return;
    }

    if (searchParams.get("connected") !== "1") return;

    const slugMatch = pathname.match(/\/dashboard\/connector\/([^/]+)$/);
    const slug = slugMatch?.[1];
    notifyOAuthOpener({ type: "aucobot-oauth-complete", slug });
  }, [pathname, searchParams]);

  return null;
}
