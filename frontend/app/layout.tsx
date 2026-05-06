import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import '@radix-ui/themes/styles.css'
import './globals.css'
import { Providers } from './providers'
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies()
  const fromCookie = jar.get(THEME_APPEARANCE_COOKIE)?.value
  const defaultAppearance: 'light' | 'dark' = fromCookie === 'dark' ? 'dark' : 'light'
  const isDark = defaultAppearance === 'dark'

  return (
    <html
      lang="vi"
      className={inter.variable}
      suppressHydrationWarning
      data-theme={isDark ? 'dark' : undefined}
    >
      <body>
        <Script id="openclaw-theme-init" strategy="beforeInteractive">
          {getThemeBootstrapInlineScript()}
        </Script>
        <Providers defaultAppearance={defaultAppearance}>{children}</Providers>
      </body>
    </html>
  )
}
