import CardCanvas, { type CanvasActionLinks, type CanvasValues } from '../card-canvas'
import type { CardAction } from '@/lib/card-design'
import type { CardCtx } from './card-parts'
import { ExtraLinks, Rows, Socials, Tail } from './card-parts'

function publicActions(ctx: CardCtx): CanvasActionLinks {
  const actions: CanvasActionLinks = {}
  for (const contact of ctx.contacts) {
    const key = contact.key as CardAction
    actions[key] = { href: contact.href, label: contact.label, external: contact.external, track: contact.key }
  }
  actions.message = { href: '#message', label: 'Send a message' }
  actions.vcard = { href: `/${ctx.card.slug}/vcard`, label: 'Save to contacts' }
  if (ctx.hasSite) actions.site = { href: `/${ctx.card.slug}/site`, label: 'Our website' }
  for (const [name, label] of [
    ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['linkedin', 'LinkedIn'], ['youtube', 'YouTube'], ['x', 'X'],
  ]) {
    const href = ctx.socials.find((social) => social.label === label)?.href
    if (href) actions[`social_${name}` as CardAction] = { href, label, external: true, track: 'social' }
  }
  return actions
}

export function SignatureCard({ ctx }: { ctx: CardCtx }) {
  const values: CanvasValues = {
    name: ctx.card.name ?? '',
    company: ctx.card.company ?? '',
    designation: ctx.card.designation ?? '',
    bio: ctx.card.bio ?? '',
    phone: ctx.card.phone ?? '',
    whatsapp: ctx.card.whatsapp ?? '',
    email: ctx.card.email ?? '',
    address: ctx.card.address ?? '',
    website: ctx.card.website ?? '',
    social_links: ctx.card.social_links ?? {},
  }

  return (
    <article className="visual-card">
      <h1 className="visual-card-heading">{ctx.displayName}</h1>
      <CardCanvas
        design={ctx.design}
        values={values}
        photoUrl={ctx.photo}
        accentColor={ctx.accentColor}
        theme={ctx.theme}
        actions={publicActions(ctx)}
      />
      {(ctx.contacts.length > 0 || ctx.hasSite || ctx.socials.length > 0) && (
        <section className="visual-card-connect" aria-label="Contact and social links">
          {ctx.contacts.length > 0 && <><h2>Connect</h2><Rows ctx={ctx} /></>}
          {(ctx.hasSite || ctx.socials.length > 0) && <div className="visual-card-extras"><ExtraLinks ctx={ctx} /><Socials ctx={ctx} /></div>}
        </section>
      )}
      <div className="visual-card-tail" id="message"><Tail ctx={ctx} /></div>
    </article>
  )
}
