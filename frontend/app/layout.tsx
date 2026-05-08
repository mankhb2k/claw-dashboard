import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import '@radix-ui/themes/styles.css'
import './globals.css'
import { Providers } from './providers'
import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from '@/lib/i18n'
import { THEME_APPEARANCE_COOKIE } from '@/lib/theme-constants'
import { getThemeBootstrapInlineScript } from '@/lib/theme-bootstrap'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'vietnamese'],
})

export const metadata: Metadata = {
  title: 'OpenClaw',
  description: 'Run your bots without managing servers',
}

function resolveLocaleFromAcceptLanguage(headerValue: string | null): Locale {
  if (!headerValue) return DEFAULT_LOCALE
  const lower = headerValue.toLowerCase()
  if (lower.includes('vi')) return 'vi'
  if (lower.includes('en')) return 'en'
  return DEFAULT_LOCALE
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies()
  const hdr = await headers()
  const fromCookie = jar.get(THEME_APPEARANCE_COOKIE)?.value
  const defaultAppearance: 'light' | 'dark' = fromCookie === 'dark' ? 'dark' : 'light'
  const isDark = defaultAppearance === 'dark'
  const defaultLocale = resolveLocaleFromAcceptLanguage(hdr.get('accept-language'))
  const htmlLang = (SUPPORTED_LOCALES as readonly string[]).includes(defaultLocale)
    ? defaultLocale
    : DEFAULT_LOCALE

  return (
    <html
      lang={htmlLang}
      className={inter.variable}
      suppressHydrationWarning
      data-theme={isDark ? 'dark' : undefined}
    >
      <body>
        <Script id="openclaw-theme-init" strategy="beforeInteractive">
          {getThemeBootstrapInlineScript()}
        </Script>
        <Providers defaultAppearance={defaultAppearance} defaultLocale={defaultLocale}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
