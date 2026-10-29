'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { provisionOrgAdmin } from '@/lib/provision'
import { checkSlug, checkUsername } from '@/lib/rules'
import type { OrgCreateState } from './state'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const val = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

// ---------- Create an organization AND its administrator's login ----------
export async function createOrganizationAction(_prev: OrgCreateState, fd: FormData): Promise<OrgCreateState> {
  await requireAdmin()
  const errors: Record<string, string> = {}

  const name = val(fd, 'name')
  const slug = val(fd, 'slug').toLowerCase()
  const maxCards = parseInt(val(fd, 'max_cards') || '25', 10)
  const username = val(fd, 'username').toLowerCase()
  const adminName = val(fd, 'admin_name') || `${name} administrator`
  const password = val(fd, 'password')

  if (name.length < 2 || name.length > 80) errors.name = 'Please enter the organization name (2 to 80 characters).'
  const s = checkSlug(slug); if (s) errors.slug = s
  if (!Number.isInteger(maxCards) || maxCards < 1 || maxCards > 100000) errors.max_cards = 'Enter a number from 1 to 100000.'
  const u = checkUsername(username); if (u) errors.username = u
  if (password && password.length < 8) errors.password = 'Use at least 8 characters, or leave it empty to generate one.'
  if (Object.keys(errors).length > 0) return { ok: false, message: 'Please fix the highlighted fields.', errors }

  let db: ReturnType<typeof createAdminClient>
  try {
    db = createAdminClient()
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'The server key is missing.', errors: {} }
  }

  const { data: org, error } = await db.from('organizations').insert({ name, slug, max_cards: maxCards }).select('id').single()
  if (error || !org) {
    if (error?.code === '23505') return { ok: false, message: 'Please fix the highlighted fields.', errors: { slug: `The short name "${slug}" is already used.` } }
    console.error('organization insert failed:', error?.message)
    return { ok: false, message: 'Could not create the organization. Run migration 017 first. ' + (error?.message ?? ''), errors: {} }
  }

  const r = await provisionOrgAdmin({ username, fullName: adminName, organizationId: org.id, password })
  if (!r.ok) {
    await db.from('organizations').delete().eq('id', org.id) // undo, so nothing is left half-made
    return { ok: false, message: r.error, errors: {} }
  }

  revalidatePath('/admin', 'layout')
  return { ok: true, message: 'Done.', errors: {}, created: { orgName: name, username: r.username, password: r.password } }
}

// ---------- Pause or resume an organization's panel (its cards are NOT switched off) ----------
export async function toggleOrganizationActive(fd: FormData): Promise<void> {
  await requireAdmin()
  const id = val(fd, 'org_id')
  if (!UUID.test(id)) return
  const { error } = await createAdminClient().from('organizations').update({ is_active: val(fd, 'active') === 'true' }).eq('id', id)
  if (error) console.error('toggleOrganizationActive failed:', error.message)
  revalidatePath('/admin', 'layout')
}
