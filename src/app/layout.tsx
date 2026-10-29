import type { Metadata } from 'next'
import './globals.css'
import { BRAND } from '@/lib/brand'
import { siteUrl } from '@/lib/card'

const description = 'Your digital business card and small website: one link with call, WhatsApp, email and directions in one tap.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: `${BRAND.name} Digital Cards`,
  description,
  openGraph: {
    title: `${BRAND.name} Digital Cards`,
    description,
    siteName: BRAND.name,
    type: 'website',
    images: [BRAND.logo],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
