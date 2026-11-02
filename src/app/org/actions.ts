'use server'

import { revalidatePath } from 'next/cache'
import { requireOrgAdmin } from '@/lib/org'
import { provisionClient } from '@/lib/provision'
import { checkSlug, checkUsername } from '@/lib/rules'
import { telHref, emailHref } from '@/lib/links'
import { BRAND } from '@/lib/brand'
import { THEME_IDS } from '@/app/dashboard/themes'
import { TEMPLATE_IDS } from '@/lib/card-templates'
import type { CreateState } from '@/app/admin/state'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const val = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

// ---------- Create one staff card (login + card) for the caller's OWN organization ----------
// The organization comes from requireOrgAdmin(), never from the form, so the browser cannot choose it.
export async function createStaffAction(_prev: CreateState, fd: FormData): Promise<CreateState> {
  const { db, org } = await requireOrgAdmin()
  if (!org.is_active) return { ok: false, message: `This panel is paused. Please contact ${BRAND.name}.`, errors: {} }

  const errors: Record<string, string> = {}
  const username = val(fd, 'username').toLowerCase()
  let slug = val(fd, 'slug').toLowerCase()
  if (!slug) slug = username
  const name = val(fd, 'name')
  const company = val(fd, 'company')
  const designation = val(fd, 'designation')
  const phone = val(fd, 'phone')
  const email = val(fd, 'email')
  const theme = val(fd, 'theme') || 'orion'
  const template = val(fd, 'template')

  const u = checkUsername(username); if (u) errors.username = u
  const s = checkSlug(slug); if (s) errors.slug = s
  if (!name) errors.name = 'Please enter the name.'
  if (name.length > 80) errors.name = 'Too long (80 characters at most).'
  if (phone && !telHref(phone)) errors.phone = 'Please enter a valid phone number.'
  if (email && !emailHref(email)) errors.email = 'Please enter a valid email address.'
  if (!THEME_IDS.includes(theme)) errors.theme = 'Please choose a theme.'
  if (template && !TEMPLATE_IDS.includes(template)) errors.template = 'Please choose a design.'
  if (Object.keys(errors).length > 0) return { ok: false, message: 'Please fix the highlighted fields.', errors }

  // Card limit of this organization (checked on the server; a very fast double click could slip one extra card through).
  const { count } = await db.from('cards').select('id', { count: 'exact', head: true }).eq('organization_id', org.id)
  if ((count ?? 0) >= org.max_cards) {
    return { ok: false, message: `Your organization has used all ${org.max_cards} cards. Please contact ${BRAND.name}.`, errors: {} }
  }

  const result = await provisionClient({ username, slug, name, company, designation, phone, email, theme, template: template || null, organizationId: org.id })
  if (!result.ok) return { ok: false, message: result.error, errors: {} }

  revalidatePath('/org', 'layout')
  return { ok: true, message: 'Done.', errors: {}, created: { username: result.username, password: result.password, slug: result.slug, name } }
}

// ---------- Switch a staff card on or off (only cards of the caller's own organization) ----------
export async function toggleStaffActive(fd: FormData): Promise<void> {
  const { db, org } = await requireOrgAdmin()
  if (!org.is_active) return
  const id = val(fd, 'card_id')
  if (!UUID.test(id)) return
  const { error } = await db
    .from('cards')
    .update({ is_active: val(fd, 'active') === 'true' })
    .eq('id', id)
    .eq('organization_id', org.id) // a card of another organization matches nothing
  if (error) console.error('toggleStaffActive failed:', error.message)
  revalidatePath('/org', 'layout')
}

// ---------- Choose the design (layout and colours) of one staff card ----------
// Staff cannot change their own design: the organization decides. The database enforces this too (migration 018).
export async function setStaffDesign(fd: FormData): Promise<void> {
  const { db, org } = await requireOrgAdmin()
  if (!org.is_active) return
  const id = val(fd, 'card_id')
  const template = val(fd, 'template')
  const theme = val(fd, 'theme')
  if (!UUID.test(id) || !TEMPLATE_IDS.includes(template) || !THEME_IDS.includes(theme)) return
  const { error } = await db
    .from('cards')
    .update({ template, theme })
    .eq('id', id)
    .eq('organization_id', org.id) // a card of another organization matches nothing
  if (error) console.error('setStaffDesign failed:', error.message)
  revalidatePath('/org', 'layout')
}
