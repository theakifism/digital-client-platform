import { Footer, ExtraLinks, FloatingBar, IconButtons, Photo, Rows, Socials, Tail, Wave, type CardCtx } from './card-parts'
import ShareButtons from './share-buttons'
import LeadForm from './lead-form'
import type { TemplateId } from '@/lib/card-templates'

// The nine card layouts (Milestone 22). Each one arranges the same card data in its own way; its look is in templates.css.
// Every template shows only what the card has (no empty rows), and every link keeps its data-track name so activity counting still works.

function Role({ ctx, className = 'tp-role' }: { ctx: CardCtx; className?: string }) {
  const { designation, company } = ctx.card
  if (!designation && !company) return null
  return <p className={className}>{[designation, company].filter(Boolean).join(' · ')}</p>
}

function Bio({ ctx, title }: { ctx: CardCtx; title?: string }) {
  if (!ctx.card.bio) return null
  return (
    <div className="tp-reveal">
      {title && <h2 className="tp-aboutH">{title}</h2>}
      <p className="tp-bio">{ctx.card.bio}</p>
    </div>
  )
}

// ---------- 1. Classic: exactly the card every existing client already has ----------
function Classic({ ctx }: { ctx: CardCtx }) {
  const { card } = ctx
  return (
    <article className="pc-card">
      {ctx.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pc-photo" src={ctx.photo} alt={ctx.displayName} width={112} height={112} />
      ) : (
        <div className="pc-photo pc-initial" aria-hidden="true">{ctx.initial}</div>
      )}
      <h1 className="pc-name">{ctx.displayName}</h1>
      {(card.designation || card.company) && <p className="pc-role">{[card.designation, card.company].filter(Boolean).join(' · ')}</p>}
      {card.bio && <p className="pc-bio">{card.bio}</p>}

      <div className="pc-actions">
        {ctx.contacts.map((c) => (
          <a
            key={c.key}
            className={`pc-btn${c.key === 'call' || c.key === 'whatsapp' ? ' pc-primary' : ''}`}
            href={c.href}
            data-track={c.key}
            {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {c.label}
          </a>
        ))}
      </div>

      {ctx.hasSite && <a className="pc-btn pc-primary" style={{ marginTop: 10 }} href={`/${card.slug}/site`}>Our website</a>}
      <a className="pc-btn pc-save" href={`/${card.slug}/vcard`} download>Save to contacts</a>
      <Socials ctx={ctx} />
      <LeadForm slug={card.slug} />

      <section className="pc-share" aria-label="Share this card">
        <div className="pc-qr" role="img" aria-label="QR code for this card" dangerouslySetInnerHTML={{ __html: ctx.qrSvg }} />
        <p className="pc-link">{ctx.pageUrl.replace(/^https?:\/\//, '')}</p>
        <ShareButtons url={ctx.pageUrl} title={ctx.displayName} />
      </section>
      <Footer />
    </article>
  )
}

// ---------- 2. Wave: big photo, curved edge with a round badge, coloured icon rows ----------
function WaveTpl({ ctx }: { ctx: CardCtx }) {
  return (
    <article className="pc-card tp t-wave">
      <div className="tp-hero">
        <Photo ctx={ctx} />
        <Wave />
        <span className="tp-badge" aria-hidden="true">{ctx.badge}</span>
      </div>
      <div className="tp-body">
        <div className="tp-head">
          <h1 className="tp-name">{ctx.displayName}</h1>
          <Role ctx={ctx} />
        </div>
        <Bio ctx={ctx} />
        <Rows ctx={ctx} />
        <ExtraLinks ctx={ctx} />
        <Socials ctx={ctx} />
      </div>
      <Tail ctx={ctx} />
    </article>
  )
}

// ---------- 3. Overlap: photo with a curved bottom, a name panel floating over it ----------
function Overlap({ ctx }: { ctx: CardCtx }) {
  return (
    <article className="pc-card tp t-overlap">
      <div className="tp-hero"><Photo ctx={ctx} /></div>
      <div className="tp-namebox">
        <span className="tp-badge" aria-hidden="true">{ctx.badge}</span>
        <h1 className="tp-name">{ctx.displayName}</h1>
        <Role ctx={ctx} />
      </div>
      {ctx.card.bio && (
        <div className="tp-about">
          <Bio ctx={ctx} title="About me" />
        </div>
      )}
      <div className="tp-body">
        <Rows ctx={ctx} />
        <ExtraLinks ctx={ctx} />
        <Socials ctx={ctx} />
      </div>
      <Tail ctx={ctx} />
    </article>
  )
}

// ---------- 4. Band: wide photo band with a colour line, clean left-aligned text ----------
function Band({ ctx }: { ctx: CardCtx }) {
  return (
    <article className="pc-card tp t-band">
      <div className="tp-hero"><Photo ctx={ctx} /></div>
      <span className="tp-badge" aria-hidden="true">{ctx.badge}</span>
      <div className="tp-body">
        <h1 className="tp-name">{ctx.displayName}</h1>
        <Role ctx={ctx} />
        <Bio ctx={ctx} />
        <Rows ctx={ctx} />
        <ExtraLinks ctx={ctx} />
        <Socials ctx={ctx} />
      </div>
      <Tail ctx={ctx} />
    </article>
  )
}

// ---------- 5. Midnight: dark, full photo fading into deep colour, glass icons, floating bar ----------
function Midnight({ ctx }: { ctx: CardCtx }) {
  return (
    <article className="pc-card tp t-midnight">
      <div className="tp-hero">
        <Photo ctx={ctx} />
        <div className="tp-heroText">
          <h1 className="tp-name">{ctx.displayName}</h1>
          <Role ctx={ctx} />
        </div>
      </div>
      <div className="tp-body">
        <IconButtons ctx={ctx} />
      </div>
      {ctx.card.bio && (
        <section className="tp-panel tp-reveal"><Bio ctx={ctx} title="About me" /></section>
      )}
      {ctx.contacts.length > 0 && (
        <section className="tp-panel"><Rows ctx={ctx} /></section>
      )}
      <div className="tp-body">
        <ExtraLinks ctx={ctx} />
        <Socials ctx={ctx} />
      </div>
      <Tail ctx={ctx} />
      <FloatingBar ctx={ctx} />
    </article>
  )
}

// ---------- 6. Neon: black, grayscale photo, big capital name, bright highlights ----------
function Neon({ ctx }: { ctx: CardCtx }) {
  const [first, ...rest] = ctx.displayName.trim().split(/\s+/)
  return (
    <article className="pc-card tp t-neon">
      <div className="tp-hero">
        <Photo ctx={ctx} />
        <div className="tp-heroText">
          <h1 className="tp-nameBig">
            <span>{first}</span>
            {rest.length > 0 && <em>{rest.join(' ')}</em>}
          </h1>
          <Role ctx={ctx} />
        </div>
      </div>
      <div className="tp-body">
        <IconButtons ctx={ctx} />
      </div>
      {ctx.card.bio && (
        <section className="tp-about tp-reveal"><Bio ctx={ctx} title="About me" /></section>
      )}
      {ctx.contacts.length > 0 && (
        <section className="tp-panel"><Rows ctx={ctx} /></section>
      )}
      <div className="tp-body">
        <ExtraLinks ctx={ctx} />
        <Socials ctx={ctx} />
      </div>
      <Tail ctx={ctx} />
      <FloatingBar ctx={ctx} />
    </article>
  )
}

// ---------- 7. Deep Wave: grayscale photo, big colour wave with a round badge, bright round icons ----------
function Deep({ ctx }: { ctx: CardCtx }) {
  return (
    <article className="pc-card tp t-deep">
      <div className="tp-hero">
        <Photo ctx={ctx} />
        <Wave />
        <span className="tp-badge" aria-hidden="true">{ctx.badge}</span>
      </div>
      <div className="tp-body">
        <h1 className="tp-name">{ctx.displayName}</h1>
        <Role ctx={ctx} />
        <IconButtons ctx={ctx} />
      </div>
      {ctx.card.bio && (
        <section className="tp-panel tp-reveal"><Bio ctx={ctx} title="About" /></section>
      )}
      {ctx.contacts.length > 0 && (
        <section className="tp-panel"><Rows ctx={ctx} /></section>
      )}
      <div className="tp-body">
        <ExtraLinks ctx={ctx} />
        <Socials ctx={ctx} />
      </div>
      <Tail ctx={ctx} />
      <FloatingBar ctx={ctx} />
    </article>
  )
}

// ---------- 8. Paper: torn-paper edge, round photo overlapping it, rounded cards ----------
function Paper({ ctx }: { ctx: CardCtx }) {
  return (
    <article className="pc-card tp t-paper">
      <div className="tp-hero" aria-hidden="true" />
      <div className="tp-body">
        <div className="tp-photoWrap"><Photo ctx={ctx} size={260} /></div>
        <h1 className="tp-name">{ctx.displayName}</h1>
        <Role ctx={ctx} />
        <IconButtons ctx={ctx} />
      </div>
      {ctx.card.bio && (
        <section className="tp-panel tp-reveal"><Bio ctx={ctx} title="About me" /></section>
      )}
      {ctx.contacts.length > 0 && (
        <section className="tp-panel"><Rows ctx={ctx} /></section>
      )}
      <div className="tp-body">
        <ExtraLinks ctx={ctx} />
        <Socials ctx={ctx} />
      </div>
      <Tail ctx={ctx} />
      <FloatingBar ctx={ctx} />
    </article>
  )
}

// ---------- 9. Formal: flat, plain, still. A small square photo, a details list, outlined buttons ----------
const FORMAL_LABELS: Record<string, string> = { call: 'Phone', whatsapp: 'WhatsApp', email: 'Email', directions: 'Address', website: 'Website' }

function Formal({ ctx }: { ctx: CardCtx }) {
  return (
    <article className="pc-card tp t-formal">
      <div className="tp-fhead">
        <div className="tp-fphoto"><Photo ctx={ctx} size={192} /></div>
        <div>
          <h1 className="tp-name">{ctx.displayName}</h1>
          <Role ctx={ctx} />
        </div>
      </div>
      {ctx.card.bio && <div className="tp-body"><p className="tp-bio">{ctx.card.bio}</p></div>}
      {ctx.contacts.length > 0 && (
        <dl className="tp-dl">
          {ctx.contacts.map((c) => (
            <div key={c.key} className="tp-dlrow">
              <dt>{FORMAL_LABELS[c.key] ?? c.label}</dt>
              <dd>
                <a href={c.href} data-track={c.key} {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{c.value}</a>
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="tp-body">
        <ExtraLinks ctx={ctx} />
        <Socials ctx={ctx} />
      </div>
      <Tail ctx={ctx} />
    </article>
  )
}

export function CardTemplate({ id, ctx }: { id: TemplateId; ctx: CardCtx }) {
  switch (id) {
    case 'wave': return <WaveTpl ctx={ctx} />
    case 'overlap': return <Overlap ctx={ctx} />
    case 'band': return <Band ctx={ctx} />
    case 'midnight': return <Midnight ctx={ctx} />
    case 'neon': return <Neon ctx={ctx} />
    case 'deep': return <Deep ctx={ctx} />
    case 'paper': return <Paper ctx={ctx} />
    case 'formal': return <Formal ctx={ctx} />
    default: return <Classic ctx={ctx} />
  }
}
