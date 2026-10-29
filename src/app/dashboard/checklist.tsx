import { createClient } from '@/lib/supabase/server'
import { buildChecklist, progress } from '@/lib/checklist'
import './checklist.css'

type Card = {
  id: string
  slug: string
  photo_url: string | null
  bio: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  social_links: unknown
}

// Shows what is still missing on the client's card. Runs as the client, so it only ever counts their own data.
export default async function Checklist({ card }: { card: Card }) {
  const supabase = await createClient()
  const [blocks, views] = await Promise.all([
    supabase.from('card_blocks').select('id', { count: 'exact', head: true }).eq('card_id', card.id).eq('is_visible', true),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('card_id', card.id).eq('type', 'view'),
  ])

  const items = buildChecklist(
    {
      photo_url: card.photo_url,
      bio: card.bio,
      phone: card.phone,
      whatsapp: card.whatsapp,
      email: card.email,
      social_links: (card.social_links as Record<string, string> | null) ?? null,
      visibleBlocks: blocks.error ? null : (blocks.count ?? 0),
      viewsEver: views.error ? null : (views.count ?? 0),
    },
    card.slug,
  )
  const p = progress(items)

  if (p.done === p.total) {
    return (
      <section className="dash-section check-done">
        <p style={{ margin: 0 }}><strong>Your card is fully set up.</strong> Keep sharing your link and QR code.</p>
      </section>
    )
  }

  return (
    <section className="dash-section" aria-labelledby="check-title">
      <h2 id="check-title">Get your card ready</h2>
      <div className="check-top">
        <progress className="check-bar" max={100} value={p.percent} aria-label="Setup progress" />
        <span className="muted">{p.done} of {p.total} done</span>
      </div>
      <ul className="check-list">
        {items.map((i) => (
          <li key={i.id} className={i.done ? 'check-item is-done' : 'check-item'}>
            <span className="check-mark" aria-hidden="true">{i.done ? '✓' : '○'}</span>
            <span>
              {i.done ? (
                <>
                  <span className="sr-only">Done: </span>{i.label}
                </>
              ) : (
                <>
                  <a href={i.href}><strong>{i.label}</strong></a>
                  <br />
                  <span className="muted">{i.hint}</span>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
