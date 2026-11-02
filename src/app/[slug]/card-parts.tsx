import type { ReactNode } from 'react'
import type { PublicCard } from '@/lib/card'
import { BRAND } from '@/lib/brand'
import ShareButtons from './share-buttons'
import LeadForm from './lead-form'

// Shared building blocks of the card templates (Milestone 22). Server code: no state, no effects.
export type IconName = 'phone' | 'chat' | 'mail' | 'pin' | 'globe' | 'user-plus' | 'qr' | 'share'

export type Contact = {
  key: 'call' | 'whatsapp' | 'email' | 'directions' | 'website' // also the name used for activity counting (data-track)
  label: string // short name, used for buttons and screen readers
  value: string // what a contact row shows
  href: string
  icon: IconName
  external: boolean
}

export type CardCtx = {
  card: PublicCard
  photo: string | null
  displayName: string
  initial: string
  badge: string // up to two letters from the company or name, shown in round badges
  contacts: Contact[]
  hasSite: boolean
  socials: { label: string; href: string }[]
  pageUrl: string
  qrSvg: string
}

const EXT = { target: '_blank', rel: 'noopener noreferrer' } as const

// Icons: Feather icon set (MIT licence), drawn inline so they cost no extra download.
const PATHS: Record<IconName, ReactNode> = {
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  chat: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
  mail: (
    <>
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  ),
  pin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  'user-plus': (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </>
  ),
}

export function Ico({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  )
}

// The person's photo, filling the box it sits in. Without a photo: a big first letter on a colour.
export function Photo({ ctx, size = 440 }: { ctx: CardCtx; size?: number }) {
  if (ctx.photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="tp-photo" src={ctx.photo} alt={ctx.displayName} width={size} height={size} />
  }
  return <div className="tp-photo tp-noPhoto" aria-hidden="true">{ctx.initial}</div>
}

// Wavy edge drawn with CSS-coloured SVG paths (colours come from templates.css, so every theme works).
export function Wave({ stroke = true }: { stroke?: boolean }) {
  return (
    <svg className="tp-wave" viewBox="0 0 440 64" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="tp-waveFill" d="M0 40 C 90 2, 200 72, 300 32 S 420 8, 440 24 L440 64 L0 64 Z" />
      {stroke && <path className="tp-waveLine" d="M0 40 C 90 2, 200 72, 300 32 S 420 8, 440 24" />}
    </svg>
  )
}

export function Rows({ ctx }: { ctx: CardCtx }) {
  if (ctx.contacts.length === 0) return null
  return (
    <ul className="tp-rows tp-reveal">
      {ctx.contacts.map((c) => (
        <li key={c.key}>
          <a className="tp-row" href={c.href} data-track={c.key} {...(c.external ? EXT : {})}>
            <span className="tp-ico"><Ico name={c.icon} /></span>
            <span className="tp-val">{c.value}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

export function IconButtons({ ctx }: { ctx: CardCtx }) {
  if (ctx.contacts.length === 0) return null
  return (
    <div className="tp-icons">
      {ctx.contacts.map((c) => (
        <a key={c.key} className="tp-ibtn" href={c.href} aria-label={c.label} data-track={c.key} {...(c.external ? EXT : {})}>
          <Ico name={c.icon} />
        </a>
      ))}
    </div>
  )
}

export function ExtraLinks({ ctx }: { ctx: CardCtx }) {
  return (
    <div className="tp-links">
      {ctx.hasSite && <a className="tp-link tp-linkMain" href={`/${ctx.card.slug}/site`}>Our website</a>}
      <a className="tp-link" href={`/${ctx.card.slug}/vcard`} download>Save to contacts</a>
    </div>
  )
}

export function Socials({ ctx }: { ctx: CardCtx }) {
  if (ctx.socials.length === 0) return null
  return (
    <ul className="pc-socials tp-socials">
      {ctx.socials.map((s) => (
        <li key={s.label}><a href={s.href} data-track="social" {...EXT}>{s.label}</a></li>
      ))}
    </ul>
  )
}

// Message form, QR code, share buttons and the "Powered by" footer: the same in every template, styled by each.
export function Tail({ ctx }: { ctx: CardCtx }) {
  return (
    <>
      <section className="tp-panel tp-reveal" aria-label="Send a message">
        <LeadForm slug={ctx.card.slug} />
      </section>
      <section id="share" className="tp-panel tp-share tp-reveal" aria-label="Share this card">
        <div className="pc-qr" role="img" aria-label="QR code for this card" dangerouslySetInnerHTML={{ __html: ctx.qrSvg }} />
        <p className="pc-link">{ctx.pageUrl.replace(/^https?:\/\//, '')}</p>
        <ShareButtons url={ctx.pageUrl} title={ctx.displayName} />
      </section>
      <Footer />
    </>
  )
}

export function Footer() {
  return (
    <footer className="pc-footer">
      <span>Powered by</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pc-brand" src={BRAND.logo} alt={BRAND.name} width={BRAND.logoWidth} height={BRAND.logoHeight} />
    </footer>
  )
}

// Floating bar at the bottom of the card: Add to contact + jump to the QR code.
export function FloatingBar({ ctx }: { ctx: CardCtx }) {
  return (
    <div className="tp-bar">
      <a className="tp-barBtn" href="#share" aria-label="Show the QR code and share"><Ico name="qr" /></a>
      <a className="tp-barPill" href={`/${ctx.card.slug}/vcard`} download><Ico name="user-plus" /> Add to contact</a>
    </div>
  )
}
