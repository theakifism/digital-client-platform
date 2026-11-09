import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { getPublicCard, getSearchChoice, siteUrl } from '@/lib/card'
import { getPublicBlocks } from '@/lib/blocks'
import { BRAND } from '@/lib/brand'
import { safeUrl, telHref, whatsappHref, emailHref, directionsHref } from '@/lib/links'
import { accentTextColor, accentTextOnSurface, DEFAULT_ACCENTS, isHexAccent } from '@/lib/card-accent'
import { safeCardDesign } from '@/lib/card-design'
import Tracker from './tracker'
import { SignatureCard } from './signature-card'
import type { CardCtx, Contact } from './card-parts'
import './card.css'
import '../card-canvas.css'

// Always fresh, so edits made by a client show up immediately.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

const THEMES = ['light', 'dark', 'teal', 'orion']
const SOCIALS: [string, string][] = [
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['linkedin', 'LinkedIn'],
  ['youtube', 'YouTube'],
  ['x', 'X'],
]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const card = await getPublicCard(slug)
  if (!card) return { title: 'Card not found' }

  const title = [card.name, card.designation].filter(Boolean).join(' | ') || 'Digital card'
  const description =
    card.bio?.trim().slice(0, 160) || [card.designation, card.company].filter(Boolean).join(', ') || 'Digital business card'
  const image = safeUrl(card.photo_url)
  const listed = await getSearchChoice(slug)

  return {
    metadataBase: new URL(siteUrl()),
    title,
    description,
    // Hidden from search engines unless the owner switched it on in their dashboard.
    robots: listed ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title, description, url: `${siteUrl()}/${slug}`, type: 'profile', images: [image ?? `${siteUrl()}${BRAND.logo}`] },
  }
}

export default async function CardPage({ params }: Props) {
  const { slug } = await params
  const card = await getPublicCard(slug)
  if (!card) notFound()

  const hasSite = (await getPublicBlocks(card.slug)).length > 0
  const pageUrl = `${siteUrl()}/${card.slug}`
  const qrSvg = await QRCode.toString(pageUrl, { type: 'svg', margin: 1, width: 200, errorCorrectionLevel: 'M' })

  const theme = THEMES.includes(card.theme) ? card.theme : 'light'
  const storedAccent = card.accent_color ?? ''
  const accentColor = isHexAccent(storedAccent) ? storedAccent : DEFAULT_ACCENTS[theme as keyof typeof DEFAULT_ACCENTS]
  const cardStyle = {
    '--pc-user-accent': accentColor,
    '--pc-user-accent-ink': accentTextColor(accentColor),
    '--pc-user-accent-text': accentTextOnSurface(accentColor, theme === 'dark'),
  } as CSSProperties
  const design = safeCardDesign(card.template, card.design_config)
  const photo = safeUrl(card.photo_url)
  const displayName = card.name || card.company || 'Digital card'

  const call = telHref(card.phone)
  const whatsapp = whatsappHref(card.whatsapp)
  const mail = emailHref(card.email)
  const directions = directionsHref(card.map_url, card.address)
  const website = safeUrl(card.website)

  // One list of ways to reach the person. The order is the same as before: Call, WhatsApp, Email, Directions, Website.
  const contacts: Contact[] = []
  if (call) contacts.push({ key: 'call', label: 'Call', value: card.phone ?? 'Call', href: call, icon: 'phone', external: false })
  if (whatsapp) contacts.push({ key: 'whatsapp', label: 'WhatsApp', value: card.whatsapp ?? 'WhatsApp', href: whatsapp, icon: 'chat', external: true })
  if (mail) contacts.push({ key: 'email', label: 'Email', value: card.email ?? 'Email', href: mail, icon: 'mail', external: false })
  if (directions) contacts.push({ key: 'directions', label: 'Directions', value: card.address || 'Get directions', href: directions, icon: 'pin', external: true })
  if (website) contacts.push({ key: 'website', label: 'Website', value: website.replace(/^https?:\/\//, '').replace(/\/$/, ''), href: website, icon: 'globe', external: true })

  const socials = SOCIALS.map(([key, label]) => ({ label, href: safeUrl(card.social_links?.[key]) })).filter(
    (s): s is { label: string; href: string } => s.href !== null
  )

  const ctx: CardCtx = { card, photo, displayName, contacts, hasSite, socials, pageUrl, qrSvg, design, theme, accentColor }

  return (
    <main className="pc-page" data-theme={theme} style={cardStyle}>
      <Tracker slug={card.slug} />
      <SignatureCard ctx={ctx} />
    </main>
  )
}
