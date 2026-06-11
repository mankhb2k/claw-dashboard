import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Be_Vietnam_Pro } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { THEME_APPEARANCE_COOKIE } from "@/lib/theme/theme-constants";
import { getThemeBootstrapInlineScript } from "@/lib/theme/theme-bootstrap";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "OpenClaw",
  description: "Run your bots without managing servers",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

function resolveLocaleFromAcceptLanguage(headerValue: string | null): Locale {
  if (!headerValue) return DEFAULT_LOCALE;
  const lower = headerValue.toLowerCase();
  if (lower.includes("vi")) return "vi";
  if (lower.includes("en")) return "en";
  return DEFAULT_LOCALE;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const hdr = await headers();
  const fromCookie = jar.get(THEME_APPEARANCE_COOKIE)?.value;
  const defaultAppearance: "light" | "dark" =
    fromCookie === "dark" ? "dark" : "light";
  const isDark = defaultAppearance === "dark";
  const defaultLocale = resolveLocaleFromAcceptLanguage(
    hdr.get("accept-language"),
  );
  const htmlLang = (SUPPORTED_LOCALES as readonly string[]).includes(
    defaultLocale,
  )
    ? defaultLocale
    : DEFAULT_LOCALE;

  return (
    <html
      lang={htmlLang}
      className={beVietnamPro.variable}
      suppressHydrationWarning
      data-theme={isDark ? "dark" : undefined}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>
        <Script id="openclaw-theme-init" strategy="beforeInteractive">
          {getThemeBootstrapInlineScript()}
        </Script>
        <Providers
          defaultAppearance={defaultAppearance}
          defaultLocale={defaultLocale}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
