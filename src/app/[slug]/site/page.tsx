import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicCard, getSearchChoice, siteUrl } from '@/lib/card'
import { getPublicBlocks, type PublicBlock } from '@/lib/blocks'
import {
  BLOCK_LABELS, type AboutContent, type ContactContent, type FaqContent, type GalleryContent,
  type ServicesContent, type TestimonialsContent,
} from '@/lib/block-schema'
import { BRAND } from '@/lib/brand'
import { directionsHref, emailHref, safeUrl, telHref, whatsappHref } from '@/lib/links'
import { accentTextColor, accentTextOnSurface, isHexAccent } from '@/lib/card-accent'
import Tracker from '../tracker'
import LeadForm from '../lead-form'
import '../card.css'
import './site.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }
const THEMES = ['light', 'dark', 'teal', 'orion']

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const card = await getPublicCard(slug)
  if (!card) return { title: 'Page not found' }
  const blocks = await getPublicBlocks(slug)
  const about = blocks.find((b) => b.type === 'about')?.content as AboutContent | undefined
  const name = card.name || card.company || 'Website'
  const description = about?.text.slice(0, 160) || [card.designation, card.company].filter(Boolean).join(', ') || 'Small website'
  const photo = safeUrl(card.photo_url)
  const listed = await getSearchChoice(slug)
  return {
    metadataBase: new URL(siteUrl()),
    title: `${name} | ${card.company || 'Website'}`,
    description,
    robots: listed ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title: name, description, url: `${siteUrl()}/${slug}/site`, type: 'website', images: [photo ?? `${siteUrl()}${BRAND.logo}`] },
  }
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params
  const card = await getPublicCard(slug)
  if (!card) notFound()
  const blocks = await getPublicBlocks(slug)
  if (blocks.length === 0) notFound()

  const theme = THEMES.includes(card.theme) ? card.theme : 'light'
  const storedAccent = card.accent_color ?? ''
  const accentColor = isHexAccent(storedAccent) ? storedAccent : null
  const siteStyle = accentColor
    ? ({
        '--pc-user-accent': accentColor,
        '--pc-user-accent-ink': accentTextColor(accentColor),
        '--pc-user-accent-text': accentTextOnSurface(accentColor, theme === 'dark'),
      } as CSSProperties)
    : undefined
  const photo = safeUrl(card.photo_url)
  const displayName = card.name || card.company || 'Website'
  const call = telHref(card.phone)
  const whatsapp = whatsappHref(card.whatsapp)
  const ext = { target: '_blank', rel: 'noopener noreferrer' } as const

  return (
    <main className="pc-page" data-theme={theme} style={siteStyle}>
      <Tracker slug={card.slug} viewType="site_view" />
      <div className="site">
        <header className="site-panel site-head">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="site-photo" src={photo} alt={displayName} width={72} height={72} />
          ) : (
            <div className="site-photo site-initial" aria-hidden="true">{displayName.trim().charAt(0).toUpperCase()}</div>
          )}
          <div className="site-head-text">
            <h1>{displayName}</h1>
            {(card.designation || card.company) && <p>{[card.designation, card.company].filter(Boolean).join(' · ')}</p>}
          </div>
          <div className="site-head-actions">
            {call && <a className="pc-btn pc-primary" href={call} data-track="call">Call</a>}
            {whatsapp && <a className="pc-btn pc-primary" href={whatsapp} data-track="whatsapp" {...ext}>WhatsApp</a>}
            <Link className="pc-btn" href={`/${card.slug}`}>Digital card</Link>
          </div>
        </header>

        {blocks.map((b) => (
          <Section key={b.type} block={b} card={card} />
        ))}

        <footer className="site-foot">
          <span>Gifted by</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pc-brand" src={BRAND.logo} alt={BRAND.name} width={BRAND.logoWidth} height={BRAND.logoHeight} />
        </footer>
      </div>
    </main>
  )
}

type CardInfo = NonNullable<Awaited<ReturnType<typeof getPublicCard>>>

function Section({ block, card }: { block: PublicBlock; card: CardInfo }) {
  const ext = { target: '_blank', rel: 'noopener noreferrer' } as const

  switch (block.type) {
    case 'about': {
      const c = block.content as AboutContent
      return (
        <section className="site-panel" id="about">
          <h2>{c.title || BLOCK_LABELS.about}</h2>
          {c.text.split(/\n{2,}/).map((p, i) => (<p key={i} className="site-text">{p}</p>))}
        </section>
      )
    }
    case 'services': {
      const c = block.content as ServicesContent
      return (
        <section className="site-panel" id="services">
          <h2>{BLOCK_LABELS.services}</h2>
          <ul className="site-list">
            {c.items.map((s, i) => (
              <li key={i}>
                <div className="site-row"><strong>{s.name}</strong>{s.price && <span className="site-price">{s.price}</span>}</div>
                {s.description && <p className="site-text">{s.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )
    }
    case 'gallery': {
      const c = block.content as GalleryContent
      return (
        <section className="site-panel" id="gallery">
          <h2>{BLOCK_LABELS.gallery}</h2>
          <div className="site-gallery">
            {c.images.map((img, i) => (
              <figure key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.caption || `Photo ${i + 1}`} loading="lazy" />
                {img.caption && <figcaption>{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )
    }
    case 'testimonials': {
      const c = block.content as TestimonialsContent
      return (
        <section className="site-panel" id="reviews">
          <h2>{BLOCK_LABELS.testimonials}</h2>
          {c.items.map((t, i) => (
            <blockquote key={i} className="site-quote">
              <p>{t.quote}</p>
              {(t.author || t.role) && <footer>{[t.author, t.role].filter(Boolean).join(', ')}</footer>}
            </blockquote>
          ))}
        </section>
      )
    }
    case 'faq': {
      const c = block.content as FaqContent
      return (
        <section className="site-panel" id="faq">
          <h2>{BLOCK_LABELS.faq}</h2>
          {c.items.map((f, i) => (
            <details key={i} className="site-faq">
              <summary>{f.question}</summary>
              <p className="site-text">{f.answer}</p>
            </details>
          ))}
        </section>
      )
    }
    case 'contact_map': {
      const c = block.content as ContactContent
      const call = telHref(card.phone)
      const whatsapp = whatsappHref(card.whatsapp)
      const mail = emailHref(card.email)
      const directions = directionsHref(card.map_url, card.address)
      return (
        <section className="site-panel" id="contact">
          <h2>{BLOCK_LABELS.contact_map}</h2>
          {card.address && <p className="site-text">{card.address}</p>}
          {c.note && <p className="site-text">{c.note}</p>}
          <div className="site-actions">
            {call && <a className="pc-btn pc-primary" href={call} data-track="call">Call</a>}
            {whatsapp && <a className="pc-btn pc-primary" href={whatsapp} data-track="whatsapp" {...ext}>WhatsApp</a>}
            {mail && <a className="pc-btn" href={mail} data-track="email">Email</a>}
            {directions && <a className="pc-btn" href={directions} data-track="directions" {...ext}>Directions</a>}
          </div>
          <LeadForm slug={card.slug} />
        </section>
      )
    }
  }
}
