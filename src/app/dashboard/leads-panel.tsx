import { createClient } from '@/lib/supabase/server'
import { whatsappHref } from '@/lib/links'
import { LEAD_LABELS, LEAD_STATUSES, isLeadStatus, parseLeadFilter, tallyStatuses, type LeadFilter, type LeadStatus } from '@/lib/lead-status'
import { deleteLead } from './lead-actions'
import DeleteLeadButton from './delete-lead-button'
import LeadFollowup from './lead-followup'

type Lead = {
  id: string
  created_at: string
  name: string
  email: string | null
  phone: string | null
  message: string | null
  status?: string | null
  note?: string | null
}

type Props = { cardId: string; slug: string; filter?: string }

export default async function LeadsPanel({ cardId, slug, filter: filterParam }: Props) {
  const supabase = await createClient()
  const filter: LeadFilter = parseLeadFilter(filterParam)

  // Follow-up numbers (Milestone 14). If migration 011 has not been run yet this fails,
  // and the list below falls back to the plain messages list, so nothing breaks.
  const statuses = await supabase.from('leads').select('status').eq('card_id', cardId).limit(5000)
  const followUp = !statuses.error
  const counts = tallyStatuses((statuses.data ?? []) as { status?: string | null }[])

  const fields = followUp ? 'id, created_at, name, email, phone, message, status, note' : 'id, created_at, name, email, phone, message'
  let query = supabase.from('leads').select(fields, { count: 'exact' }).eq('card_id', cardId)
  if (followUp && filter !== 'all') query = query.eq('status', filter)
  const { data, count } = await query.order('created_at', { ascending: false }).limit(50)
  const leads = (data ?? []) as unknown as Lead[]
  const shown = count ?? leads.length
  const everything = followUp ? LEAD_STATUSES.reduce((n, s) => n + counts[s], 0) : shown

  const tabHref = (f: LeadFilter) => `/dashboard?card=${encodeURIComponent(slug)}${f === 'all' ? '' : `&leads=${f}`}#messages`

  return (
    <section className="dash-section" id="messages">
      <div className="dash-row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>
          Messages from visitors ({everything})
          {followUp && counts.new > 0 && <span className="lead-badge lead-badge-new" style={{ marginLeft: '0.5rem' }}>{counts.new} new</span>}
        </h2>
        {everything > 0 && (
          <a className="button secondary" href={`/dashboard/leads/export?card=${encodeURIComponent(slug)}`}>Download all (CSV)</a>
        )}
      </div>

      {followUp && everything > 0 && (
        <nav className="lead-tabs" aria-label="Filter messages by status">
          <a href={tabHref('all')} className="lead-tab" aria-current={filter === 'all' ? 'page' : undefined}>All ({everything})</a>
          {LEAD_STATUSES.map((s) => (
            <a key={s} href={tabHref(s)} className="lead-tab" aria-current={filter === s ? 'page' : undefined}>
              {LEAD_LABELS[s]} ({counts[s]})
            </a>
          ))}
        </nav>
      )}

      {leads.length === 0 ? (
        <p className="muted" style={{ marginBottom: 0 }}>
          {everything === 0
            ? 'When someone uses "Send me a message" on your card, it appears here.'
            : 'No messages with this status.'}
        </p>
      ) : (
        <>
          {shown > leads.length && <p className="muted">Showing the latest {leads.length}. Download the CSV to get all {everything}.</p>}
          {leads.map((l) => {
            const status: LeadStatus = isLeadStatus(l.status) ? l.status : 'new'
            const wa = whatsappHref(l.phone)
            return (
              <article key={l.id} className={`dash-lead${followUp && status === 'new' ? ' dash-lead-new' : ''}`}>
                <div className="dash-row" style={{ justifyContent: 'space-between' }}>
                  <strong>
                    {l.name}
                    {followUp && <span className={`lead-badge lead-badge-${status}`} style={{ marginLeft: '0.5rem' }}>{LEAD_LABELS[status]}</span>}
                  </strong>
                  <span className="muted">{new Date(l.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}</span>
                </div>
                <p style={{ margin: '0.25rem 0' }}>
                  {l.phone && <a href={`tel:${l.phone.replace(/[^\d+]/g, '')}`}>{l.phone}</a>}
                  {l.phone && wa && ' · '}
                  {wa && <a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
                  {(l.phone || wa) && l.email && ' · '}
                  {l.email && <a href={`mailto:${l.email}`}>{l.email}</a>}
                </p>
                {l.message && <p style={{ whiteSpace: 'pre-wrap', margin: '0.25rem 0' }}>{l.message}</p>}
                {followUp && <LeadFollowup key={`${l.id}-${status}-${l.note ?? ''}`} id={l.id} status={status} note={l.note ?? null} />}
                <form action={deleteLead} style={{ marginTop: '0.5rem' }}>
                  <input type="hidden" name="lead_id" value={l.id} />
                  <DeleteLeadButton />
                </form>
              </article>
            )
          })}
        </>
      )}
    </section>
  )
}
