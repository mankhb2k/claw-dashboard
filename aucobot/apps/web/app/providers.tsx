"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

import { ToastProvider } from "@/components/ui";
import { I18nProvider } from "@/lib/i18n";
import {
  readThemeAppearance,
  subscribeThemeAppearance,
} from "@/lib/theme/theme-sync";

import type { Locale } from "@/lib/i18n";

/** Sync `data-theme` with theme store / localStorage. */
function ThemeDocumentSync({ appearance }: { appearance: "light" | "dark" }) {
  useLayoutEffect(() => {
    const mode = readThemeAppearance();
    if (mode === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [appearance]);

  return null;
}

export function Providers({
  children,
  defaultAppearance,
  defaultLocale,
}: {
  children: React.ReactNode;
  defaultAppearance: "light" | "dark";
  defaultLocale: Locale;
}) {
  const appearance = useSyncExternalStore(
    subscribeThemeAppearance,
    readThemeAppearance,
    () => defaultAppearance,
  );

  return (
    <div suppressHydrationWarning>
      <I18nProvider defaultLocale={defaultLocale}>
        <ToastProvider>
          <ThemeDocumentSync appearance={appearance} />
          {children}
        </ToastProvider>
      </I18nProvider>
    </div>
  );
}
