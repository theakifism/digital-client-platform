'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { provisionClient } from '@/lib/provision'
import { checkSlug, checkUsername, generatePassword } from '@/lib/rules'
import { telHref, emailHref } from '@/lib/links'
import { keyFromUrl } from '@/lib/photo-url'
import { storeDelete, storeMode } from '@/lib/photo-store'
import { THEME_IDS } from '@/app/dashboard/themes'
import { validateCard } from '@/app/dashboard/validate'
import type { SaveState } from '@/app/dashboard/state'
import type { BulkInput, BulkRow, CreateState, EraseState, ResetState } from './state'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const val = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

// ---------- Create one client (login + card) ----------
export async function createClientAction(_prev: CreateState, fd: FormData): Promise<CreateState> {
  const { supabase } = await requireAdmin()
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
  const password = val(fd, 'password')
  const requestId = val(fd, 'request_id')

  const u = checkUsername(username); if (u) errors.username = u
  const s = checkSlug(slug); if (s) errors.slug = s
  if (!name) errors.name = 'Please enter the client\'s name.'
  if (name.length > 80) errors.name = 'Too long (80 characters at most).'
  if (phone && !telHref(phone)) errors.phone = 'Please enter a valid phone number.'
  if (email && !emailHref(email)) errors.email = 'Please enter a valid email address.'
  if (!THEME_IDS.includes(theme)) errors.theme = 'Please choose a theme.'
  if (password && password.length < 8) errors.password = 'Use at least 8 characters, or leave it empty to generate one.'

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: 'Please fix the highlighted fields.', errors }
  }

  const result = await provisionClient({ username, slug, name, company, designation, phone, email, theme, password })
  if (!result.ok) return { ok: false, message: result.error, errors: {} }

  if (UUID.test(requestId)) {
    await supabase.from('requests').update({ status: 'card_created' }).eq('id', requestId)
  }
  revalidatePath('/admin', 'layout')
  return { ok: true, message: 'Done.', errors: {}, created: { username: result.username, password: result.password, slug: result.slug, name } }
}

// ---------- Bulk create: a small group of clients per call (the browser reads the CSV file and sends the groups) ----------
export async function bulkCreateChunk(rows: BulkInput[]): Promise<BulkRow[]> {
  await requireAdmin()
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 10) return []

  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const out: BulkRow[] = []

  for (const r of rows) {
    const line = Number(r?.line) || 0
    const username = text(r?.username, 40).toLowerCase()
    const slug = (text(r?.slug, 60) || username).toLowerCase()
    const name = text(r?.name, 200)
    const company = text(r?.company, 200)
    const designation = text(r?.designation, 200)
    const phone = text(r?.phone, 60)
    const email = text(r?.email, 200)
    const theme = (text(r?.theme, 20) || 'orion').toLowerCase()
    const fail = (error: string) => out.push({ line, username, slug, status: 'error', error })

    if (!name) { fail('The name is empty.'); continue }
    if (name.length > 80 || company.length > 80 || designation.length > 80) { fail('A name, business or role is longer than 80 characters.'); continue }
    if (phone && (!telHref(phone) || phone.length > 30)) { fail('The phone number is not valid.'); continue }
    if (email && (!emailHref(email) || email.length > 120)) { fail('The email address is not valid.'); continue }
    if (!THEME_IDS.includes(theme)) { fail(`Unknown theme "${theme}".`); continue }

    const res = await provisionClient({ username, slug, name, company, designation, phone, email, theme })
    if (res.ok) out.push({ line, username, slug, status: 'created', password: res.password })
    else fail(res.error)
  }

  revalidatePath('/admin', 'layout')
  return out
}

// ---------- Switch a card on or off ----------
// Done with the server key: since migration 015 even the admin's own login cannot change this column directly.
export async function toggleCardActive(fd: FormData): Promise<void> {
  await requireAdmin()
  const id = val(fd, 'card_id')
  if (!UUID.test(id)) return
  const { error } = await createAdminClient().from('cards').update({ is_active: val(fd, 'active') === 'true' }).eq('id', id)
  if (error) console.error('toggleCardActive failed:', error.message)
  revalidatePath('/admin', 'layout')
}

// ---------- Change a request's status ----------
export async function setRequestStatus(fd: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const id = val(fd, 'request_id')
  const status = val(fd, 'status')
  if (!UUID.test(id) || !['new', 'contacted', 'card_created'].includes(status)) return
  await supabase.from('requests').update({ status }).eq('id', id)
  revalidatePath('/admin', 'layout')
}

// ---------- Delete a request (spam, or when the person asks us to erase their data) ----------
export async function deleteRequest(fd: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const id = val(fd, 'request_id')
  if (!UUID.test(id)) return
  const { error } = await supabase.from('requests').delete().eq('id', id)
  if (error) console.error('deleteRequest failed:', error.message)
  revalidatePath('/admin', 'layout')
}

// ---------- Reset a client's password ----------
export async function resetPasswordAction(_prev: ResetState, fd: FormData): Promise<ResetState> {
  const { supabase } = await requireAdmin()
  const ownerId = val(fd, 'owner_id')
  if (!UUID.test(ownerId)) return { ok: false, message: 'Something went wrong. Please refresh.' }

  // Only client and organization-administrator logins can be reset here (never an Orian admin).
  const { data: target } = await supabase.from('profiles').select('role').eq('id', ownerId).maybeSingle()
  if (!target || (target.role !== 'client' && target.role !== 'org_admin')) return { ok: false, message: 'This login cannot be reset here.' }

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Server key missing.' } }

  // The admin may type a new password, or leave it empty to get a strong generated one.
  const typed = val(fd, 'new_password')
  if (typed && (typed.length < 8 || typed.length > 72)) return { ok: false, message: 'Use 8 to 72 characters, or leave it empty to generate one.' }
  const password = typed || generatePassword()

  // Only the admin can change a client's password (Milestone 17). The database blocks every other way (migration 013),
  // so the change goes through the server-only function admin_set_password.
  const { error } = await admin.rpc('admin_set_password', { target_user: ownerId, new_password: password })
  if (error) {
    // Migration 013 not run yet: the function does not exist and nothing blocks the normal way, so use that.
    const missing = error.code === 'PGRST202' || /could not find the function/i.test(error.message)
    if (!missing) { console.error('reset failed:', error.message); return { ok: false, message: 'Could not reset the password.' } }
    const old = await admin.auth.admin.updateUserById(ownerId, { password })
    if (old.error) { console.error('reset failed:', old.error.message); return { ok: false, message: 'Could not reset the password.' } }
  }
  return { ok: true, message: 'New password (shown once):', password }
}

// ---------- Edit a client's card as the admin ----------
export async function adminSaveCard(_prev: SaveState, fd: FormData): Promise<SaveState> {
  await requireAdmin()
  const cardId = val(fd, 'card_id')
  if (!UUID.test(cardId)) return { ok: false, message: 'Something went wrong. Please refresh the page.', errors: {} }

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Server key missing.', errors: {} } }

  const { data: card } = await admin.from('cards').select('id, photo_url').eq('id', cardId).maybeSingle()
  if (!card) return { ok: false, message: 'This card no longer exists.', errors: {} }

  // The photo is not edited here: keep exactly what the card has now.
  const photo = (card.photo_url as string | null) ?? ''
  fd.set('photo_url', photo)
  const { values, errors } = validateCard(fd, photo.split('?')[0])
  if (!values) return { ok: false, message: 'Please fix the highlighted fields and save again.', errors }

  const { error } = await admin.from('cards').update(values).eq('id', cardId)
  if (error) {
    console.error('adminSaveCard failed:', error.message)
    return { ok: false, message: 'Could not save the card. ' + error.message, errors: {} }
  }
  revalidatePath('/admin', 'layout')
  return { ok: true, message: 'Saved.', errors: {} }
}

// ---------- Erase a client: login, all their cards, messages, activity, feedback and photo files ----------
// The photo files that cards and galleries use are deleted here. Files a client uploaded and never saved are left behind:
// on Supabase Storage they are swept from the client's folder as well, on R2 they show up in Photo storage (clean-up) after a day.
async function deleteClientPhotos(admin: ReturnType<typeof createAdminClient>, ownerId: string): Promise<void> {
  const keys = new Set<string>()
  const { data: cards } = await admin.from('cards').select('id, photo_url').eq('owner_id', ownerId)
  const ids = (cards ?? []).map((c) => c.id as string)
  for (const c of cards ?? []) {
    const k = c.photo_url ? keyFromUrl(String(c.photo_url)) : null
    if (k) keys.add(k)
  }
  if (ids.length > 0) {
    const { data: blocks } = await admin.from('card_blocks').select('content').eq('type', 'gallery').in('card_id', ids)
    for (const b of blocks ?? []) {
      const images = (b.content as { images?: unknown } | null)?.images
      if (!Array.isArray(images)) continue
      for (const i of images) {
        const url = (i as { url?: unknown } | null)?.url
        const k = typeof url === 'string' ? keyFromUrl(url) : null
        if (k) keys.add(k)
      }
    }
  }
  if (storeMode() === 'supabase') {
    const bucket = admin.storage.from('card-photos')
    for (const folder of [ownerId, `${ownerId}/gallery`]) {
      const listed = await bucket.list(folder, { limit: 1000 })
      for (const o of listed.data ?? []) if (o.id) keys.add(`${folder}/${o.name}`)
    }
  }
  const all = [...keys]
  for (let i = 0; i < all.length; i += 100) await storeDelete(all.slice(i, i + 100))
}

export async function eraseClientAction(_prev: EraseState, fd: FormData): Promise<EraseState> {
  await requireAdmin()
  const cardId = val(fd, 'card_id')
  const typed = val(fd, 'confirm').toLowerCase()
  if (!UUID.test(cardId)) return { ok: false, message: 'Something went wrong. Please refresh the page.' }

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Server key missing.' } }

  const { data: card } = await admin.from('cards').select('id, slug, owner_id').eq('id', cardId).maybeSingle()
  if (!card) return { ok: false, message: 'This card no longer exists.' }

  // Cards with a login: erase the whole client. Cards without one (test cards): erase just the card.
  let confirmWord = card.slug as string
  let ownerId: string | null = (card.owner_id as string | null) ?? null
  if (ownerId) {
    const { data: profile } = await admin.from('profiles').select('username, role').eq('id', ownerId).maybeSingle()
    if (!profile) {
      ownerId = null
    } else {
      if (profile.role !== 'client') return { ok: false, message: 'Admin logins cannot be erased here.' }
      confirmWord = profile.username as string
    }
  }
  if (typed !== confirmWord.toLowerCase()) return { ok: false, message: `Type "${confirmWord}" exactly to confirm.` }

  if (!ownerId) {
    const { error } = await admin.from('cards').delete().eq('id', cardId)
    if (error) return { ok: false, message: 'Could not delete the card. ' + error.message }
    revalidatePath('/admin', 'layout')
    return { ok: true, message: 'The card was deleted.' }
  }

  try {
    await deleteClientPhotos(admin, ownerId)
  } catch (e) {
    console.error('photo removal failed:', e instanceof Error ? e.message : e)
  }
  // Cards first (this also deletes their website sections, messages and activity), then the login (and with it the profile and feedback).
  const { error: cardsError } = await admin.from('cards').delete().eq('owner_id', ownerId)
  if (cardsError) return { ok: false, message: 'Could not delete the cards. ' + cardsError.message }
  const { error: userError } = await admin.auth.admin.deleteUser(ownerId)
  if (userError) return { ok: false, message: 'The cards were deleted, but the login could not be: ' + userError.message }

  revalidatePath('/admin', 'layout')
  return { ok: true, message: 'The client was erased: login, cards, messages, activity, feedback and photos.' }
}
