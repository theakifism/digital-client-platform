'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { limitByIp, rateLimit } from '@/lib/ratelimit'
import { verifyTurnstile } from '@/lib/turnstile'
import { sendLeadEmail } from '@/lib/mail'
import { siteUrl } from '@/lib/card'
import { validateLead } from './lead-validate'
import type { LeadState } from './lead-state'

export async function submitLead(_prev: LeadState, fd: FormData): Promise<LeadState> {
  // Hidden robot trap: if it is filled in, pretend all is well and save nothing.
  if (String(fd.get('contact_website') ?? '').trim()) return { ok: true, message: '', errors: {} }

  const { values, errors } = validateLead(fd)
  if (!values) return { ok: false, message: errors.form || 'Please fix the highlighted fields.', errors }

  if (!(await verifyTurnstile(String(fd.get('cf-turnstile-response') ?? '')))) {
    return { ok: false, message: 'The spam check did not pass. Please try again.', errors: {} }
  }

  // One visitor address may send 6 messages an hour (the limit is kept in the database).
  if (!(await limitByIp('lead', await headers(), 6, 3600))) {
    return { ok: false, message: 'You have sent several messages already. Please try again a little later.', errors: {} }
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (e) {
    console.error(e)
    return { ok: false, message: 'Sorry, messages cannot be sent right now. Please try again later.', errors: {} }
  }

  const { data: card } = await admin.from('cards').select('id, name, email').eq('slug', values.slug).eq('is_active', true).maybeSingle()
  if (!card) return { ok: false, message: 'This card is not available.', errors: {} }

  // Flood protection: per card, and per person.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const base = () => admin.from('leads').select('*', { count: 'exact', head: true }).eq('card_id', card.id).gte('created_at', since)
  const [all, sameEmail, samePhone] = await Promise.all([
    base(),
    values.email ? base().eq('email', values.email) : Promise.resolve({ count: 0 }),
    values.phone ? base().eq('phone', values.phone) : Promise.resolve({ count: 0 }),
  ])
  if ((all.count ?? 0) >= 40) return { ok: false, message: 'This card is receiving many messages right now. Please try again later.', errors: {} }
  if ((sameEmail.count ?? 0) >= 2 || (samePhone.count ?? 0) >= 2) {
    return { ok: false, message: 'Your message has already been sent. They will contact you soon.', errors: {} }
  }

  const { error } = await admin.from('leads').insert({
    card_id: card.id, name: values.name, email: values.email, phone: values.phone, message: values.message, consent: true,
  })
  if (error) {
    console.error('lead insert failed:', error.message)
    return { ok: false, message: 'Sorry, your message could not be sent. Please try again.', errors: {} }
  }

  // The message is always saved (the client sees it in the dashboard). The e-mail copy has limits, so that a flood
  // cannot use up the e-mail allowance that your own admin alerts need: 10 an hour per card, and a daily total for all cards.
  if (card.email) {
    const dailyCap = Math.max(1, Number(process.env.LEAD_EMAIL_DAILY_CAP) || 80)
    const mailOk = (await rateLimit(`leadmail:${card.id}`, 10, 3600)) && (await rateLimit('leadmail:all', dailyCap, 86400))
    if (mailOk) {
      await sendLeadEmail(
        card.email,
        { name: values.name, email: values.email ?? undefined, phone: values.phone ?? undefined, message: values.message ?? undefined },
        card.name || 'your card',
        `${siteUrl()}/dashboard`
      )
    }
  }
  return { ok: true, message: '', errors: {} }
}
