// Checks what a visitor typed into the "Send me a message" form. Runs on the SERVER.
import { emailHref, telHref } from '@/lib/links'

const clean = (v: FormDataEntryValue | null) => String(v ?? '').replace(/\r\n/g, '\n').trim()

export type LeadValues = { slug: string; name: string; phone: string | null; email: string | null; message: string | null }

export function validateLead(fd: FormData): { values: LeadValues | null; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  const slug = clean(fd.get('slug'))
  if (slug.length > 40 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.form = 'Something went wrong. Please refresh the page.'

  const name = clean(fd.get('name'))
  if (!name) errors.name = 'Please tell us your name.'
  if (name.length > 80) errors.name = 'Too long (80 characters at most).'

  const phone = clean(fd.get('phone'))
  if (phone && (!telHref(phone) || phone.length > 30)) errors.phone = 'Please enter a valid phone number.'

  const email = clean(fd.get('email'))
  if (email && (!emailHref(email) || email.length > 120)) errors.email = 'Please enter a valid email address.'

  if (!phone && !email) errors.contact = 'Please give a phone number or an email so they can reply.'

  const message = clean(fd.get('message'))
  if (message.length > 1000) errors.message = 'Too long (1000 characters at most).'

  if (fd.get('consent') !== 'on') errors.consent = 'Please tick the box so they may contact you.'

  if (Object.keys(errors).length > 0) return { values: null, errors }
  return { values: { slug, name, phone: phone || null, email: email || null, message: message || null }, errors }
}
