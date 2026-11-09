import type { ReactNode } from 'react'
import type { PublicCard } from '@/lib/card'
import type { CardDesign } from '@/lib/card-design'
import { BRAND } from '@/lib/brand'
import ShareButtons from './share-buttons'
import LeadForm from './lead-form'

// Shared server components used by the public card.
export type IconName = 'phone' | 'chat' | 'mail' | 'pin' | 'globe'

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
  contacts: Contact[]
  hasSite: boolean
  socials: { label: string; href: string }[]
  pageUrl: string
  qrSvg: string
  design: CardDesign
  theme: string
  accentColor: string
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
}

export function Ico({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
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

// Message form, QR code, share buttons and the "Powered by" footer for the public card.
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
