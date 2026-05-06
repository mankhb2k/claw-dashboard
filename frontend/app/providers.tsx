'use client'

import { useLayoutEffect, useSyncExternalStore } from 'react'
import { Theme } from '@radix-ui/themes'
import { I18nProvider } from '@/lib/i18n'
import { readRadixAppearance, subscribeRadixAppearance } from '@/lib/theme-sync'

/** Đồng bộ `data-theme` với `readRadixAppearance()` (LS / store), không tin `appearance` một mình trên frame hydrate. */
function ThemeDocumentSync({ appearance }: { appearance: 'light' | 'dark' }) {
  useLayoutEffect(() => {
    const mode = readRadixAppearance()
    if (mode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [appearance])

  return null
}

export function Providers({
  children,
  defaultAppearance,
}: {
  children: React.ReactNode
  defaultAppearance: 'light' | 'dark'
}) {
  const appearance = useSyncExternalStore(
    subscribeRadixAppearance,
    readRadixAppearance,
    () => defaultAppearance,
  )

  return (
    <div suppressHydrationWarning>
      <Theme appearance={appearance} accentColor="orange" grayColor="slate" radius="medium" scaling="100%">
        <I18nProvider>
          <ThemeDocumentSync appearance={appearance} />
          {children}
        </I18nProvider>
      </Theme>
    </div>
  )
}
