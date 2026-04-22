import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'OpenClaw',
  description: 'Run your bots without managing servers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={geistSans.variable}>
      <body>{children}</body>
    </html>
  )
}
