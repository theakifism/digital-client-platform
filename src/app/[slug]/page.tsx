import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { getPublicCard, getSearchChoice, siteUrl } from '@/lib/card'
import { getPublicBlocks } from '@/lib/blocks'
import { BRAND } from '@/lib/brand'
import { safeUrl, telHref, whatsappHref, emailHref, directionsHref } from '@/lib/links'
import ShareButtons from './share-buttons'
import Tracker from './tracker'
import LeadForm from './lead-form'
import './card.css'

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
  const photo = safeUrl(card.photo_url)
  const displayName = card.name || card.company || 'Digital card'
  const initial = displayName.trim().charAt(0).toUpperCase()

  const call = telHref(card.phone)
  const whatsapp = whatsappHref(card.whatsapp)
  const mail = emailHref(card.email)
  const directions = directionsHref(card.map_url, card.address)
  const website = safeUrl(card.website)

  const socials = SOCIALS.map(([key, label]) => ({ label, href: safeUrl(card.social_links?.[key]) })).filter(
    (s): s is { label: string; href: string } => s.href !== null
  )

  const ext = { target: '_blank', rel: 'noopener noreferrer' } as const

  return (
    <main className="pc-page" data-theme={theme}>
      <article className="pc-card">
        <Tracker slug={card.slug} />
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="pc-photo" src={photo} alt={displayName} width={112} height={112} />
        ) : (
          <div className="pc-photo pc-initial" aria-hidden="true">{initial}</div>
        )}

        <h1 className="pc-name">{displayName}</h1>
        {(card.designation || card.company) && (
          <p className="pc-role">{[card.designation, card.company].filter(Boolean).join(' · ')}</p>
        )}
        {card.bio && <p className="pc-bio">{card.bio}</p>}

        <div className="pc-actions">
          {call && <a className="pc-btn pc-primary" href={call} data-track="call">Call</a>}
          {whatsapp && <a className="pc-btn pc-primary" href={whatsapp} data-track="whatsapp" {...ext}>WhatsApp</a>}
          {mail && <a className="pc-btn" href={mail} data-track="email">Email</a>}
          {directions && <a className="pc-btn" href={directions} data-track="directions" {...ext}>Directions</a>}
          {website && <a className="pc-btn" href={website} data-track="website" {...ext}>Website</a>}
        </div>

        {hasSite && (
          <a className="pc-btn pc-primary" style={{ marginTop: 10 }} href={`/${card.slug}/site`}>Our website</a>
        )}

        <a className="pc-btn pc-save" href={`/${card.slug}/vcard`} download>Save to contacts</a>

        {socials.length > 0 && (
          <ul className="pc-socials">
            {socials.map((s) => (
              <li key={s.label}><a href={s.href} data-track="social" {...ext}>{s.label}</a></li>
            ))}
          </ul>
        )}

        <LeadForm slug={card.slug} />

        <section className="pc-share" aria-label="Share this card">
          <div className="pc-qr" role="img" aria-label="QR code for this card" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <p className="pc-link">{pageUrl.replace(/^https?:\/\//, '')}</p>
          <ShareButtons url={pageUrl} title={displayName} />
        </section>

        <footer className="pc-footer">
          <span>Gifted by</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pc-brand" src={BRAND.logo} alt={BRAND.name} width={BRAND.logoWidth} height={BRAND.logoHeight} />
        </footer>
      </article>
    </main>
  )
}
