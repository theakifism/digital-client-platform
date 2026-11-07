import { ExtraLinks, Ico, Photo, Rows, Socials, Tail, Wave, type CardCtx } from './card-parts'

function QuickActions({ ctx }: { ctx: CardCtx }) {
  const actions = ctx.contacts.filter((contact) => contact.key === 'call' || contact.key === 'whatsapp').slice(0, 2)

  return (
    <nav className="sig-actions" aria-label="Quick contact">
      {actions.map((action) => (
        <a
          key={action.key}
          className="sig-action"
          href={action.href}
          data-track={action.key}
          {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          <Ico name={action.icon} />
          <span>{action.label}</span>
        </a>
      ))}
      <a className="sig-action sig-actionPrimary sig-actionMessage" href="#message">
        <Ico name="mail" />
        <span>Send a message</span>
      </a>
    </nav>
  )
}
export function SignatureCard({ ctx }: { ctx: CardCtx }) {
  const company = ctx.card.company?.trim()
  return (
    <article className="pc-card tp t-signature">
      <header className="sig-hero">
        <Photo ctx={ctx} />
        <div className="sig-heroShade" />
        <div className="sig-heroMeta">
          <span className="sig-liveMark" aria-hidden="true" />
          <span>Digital profile</span>
        </div>
        <Wave />
        <span className="tp-badge sig-brandMark" aria-label={company ? `${company} initials` : 'Business card mark'}>{ctx.badge}</span>
      </header>

      <div className="sig-body">
        <div className="sig-identity">
          {company && <p className="sig-company">{company}</p>}
          <h1 className="tp-name">{ctx.displayName}</h1>
          {ctx.card.designation && <p className="tp-role">{ctx.card.designation}</p>}
        </div>

        {ctx.card.bio && <p className="sig-bio">{ctx.card.bio}</p>}

        <QuickActions ctx={ctx} />

        {ctx.contacts.length > 0 && (
          <section className="sig-contactSection" aria-label="Contact details">
            <div className="sig-sectionTitle"><span>Connect</span><i aria-hidden="true" /></div>
            <Rows ctx={ctx} />
          </section>
        )}

        <div className="sig-links"><ExtraLinks ctx={ctx} /></div>
        <Socials ctx={ctx} />
      </div>

      <div id="message" className="sig-tail"><Tail ctx={ctx} /></div>
    </article>
  )
}
