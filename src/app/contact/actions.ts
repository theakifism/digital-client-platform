'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTurnstile } from '@/lib/turnstile'
import { limitByIp } from '@/lib/ratelimit'
import { sendRequestEmail } from '@/lib/mail'
import { siteUrl } from '@/lib/card'
import { emailHref, telHref } from '@/lib/links'
import type { RequestState } from './state'

const clean = (v: FormDataEntryValue | null) => String(v ?? '').replace(/\r\n/g, '\n').trim()

export async function submitRequest(_prev: RequestState, fd: FormData): Promise<RequestState> {
  // A hidden field that real people never see. If it is filled in, it is a robot: pretend all is well.
  if (clean(fd.get('company_website'))) return { ok: true, message: '', errors: {} }

  const errors: Record<string, string> = {}
  const name = clean(fd.get('name'))
  const company = clean(fd.get('company'))
  const phone = clean(fd.get('phone'))
  const email = clean(fd.get('email'))
  const message = clean(fd.get('message'))

  if (!name) errors.name = 'Please tell us your name.'
  if (name.length > 80) errors.name = 'Too long (80 characters at most).'
  if (company.length > 80) errors.company = 'Too long (80 characters at most).'
  if (!email || !emailHref(email)) errors.email = 'Please enter a valid email address.'
  if (email.length > 120) errors.email = 'Too long.'
  if (phone && (!telHref(phone) || phone.length > 30)) errors.phone = 'Please enter a valid phone number.'
  if (message.length > 1000) errors.message = 'Too long (1000 characters at most).'
  if (fd.get('consent') !== 'on') errors.consent = 'Please tick the box so we may contact you.'

  if (Object.keys(errors).length > 0) return { ok: false, message: 'Please fix the highlighted fields.', errors }

  if (!(await verifyTurnstile(clean(fd.get('cf-turnstile-response'))))) {
    return { ok: false, message: 'The spam check did not pass. Please try again.', errors: {} }
  }

  // One visitor address may send 5 requests an hour (the limit is kept in the database).
  if (!(await limitByIp('request', await headers(), 5, 3600))) {
    return { ok: false, message: 'You have already sent several requests. Please try again later, or call the team.', errors: {} }
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (e) {
    console.error(e)
    return { ok: false, message: 'Sorry, the form is not working right now. Please try again later.', errors: {} }
  }

  // Simple flood protection.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const [{ count: fromSameEmail }, { count: lastHour }] = await Promise.all([
    admin.from('requests').select('*', { count: 'exact', head: true }).eq('email', email).gte('created_at', since),
    admin.from('requests').select('*', { count: 'exact', head: true }).gte('created_at', since),
  ])
  if ((fromSameEmail ?? 0) >= 3) {
    return { ok: false, message: 'We already have your request. We will contact you soon.', errors: {} }
  }
  if ((lastHour ?? 0) >= 60) {
    return { ok: false, message: 'We are getting many requests right now. Please try again in a little while.', errors: {} }
  }

  const { error } = await admin.from('requests').insert({
    name, email, company: company || null, phone: phone || null, message: message || null, consent: true,
  })
  if (error) {
    console.error('request insert failed:', error.message)
    return { ok: false, message: 'Sorry, we could not send your request. Please try again.', errors: {} }
  }

  await sendRequestEmail({ name, email, company, phone, message }, `${siteUrl()}/admin/requests`)
  return { ok: true, message: '', errors: {} }
}
