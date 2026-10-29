// Creates a client's LOGIN and their CARD together (server only).
import { createAdminClient } from '@/lib/supabase/admin'
import { usernameToEmail } from '@/lib/supabase/auth'
import { checkSlug, checkUsername, generatePassword } from '@/lib/rules'

export type ProvisionInput = {
  username: string
  slug: string
  name: string
  company?: string | null
  designation?: string | null
  phone?: string | null
  email?: string | null
  theme?: string
  password?: string
  organizationId?: string | null // Milestone 21: set when the card belongs to an organization
}

export type ProvisionResult =
  | { ok: true; username: string; password: string; slug: string }
  | { ok: false; error: string }

export async function provisionClient(input: ProvisionInput): Promise<ProvisionResult> {
  const bad = checkUsername(input.username) || checkSlug(input.slug)
  if (bad) return { ok: false, error: bad }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'The server key is missing.' }
  }

  const { data: takenName } = await admin.from('profiles').select('id').eq('username', input.username).maybeSingle()
  if (takenName) return { ok: false, error: `The username "${input.username}" is already taken.` }

  const { data: takenSlug } = await admin.from('cards').select('id').eq('slug', input.slug).maybeSingle()
  if (takenSlug) return { ok: false, error: `The card link "${input.slug}" is already used.` }

  const password = input.password || generatePassword()
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email: usernameToEmail(input.username),
    password,
    email_confirm: true,
  })
  if (userError || !created.user) {
    console.error('createUser failed:', userError?.message)
    return { ok: false, error: 'Could not create the login. ' + (userError?.message ?? '') }
  }

  const { error: cardError } = await admin.from('cards').insert({
    owner_id: created.user.id,
    slug: input.slug,
    name: input.name,
    company: input.company || null,
    designation: input.designation || null,
    phone: input.phone || null,
    email: input.email || null,
    theme: input.theme || 'orion',
    organization_id: input.organizationId ?? null,
  })
  if (cardError) {
    console.error('card insert failed:', cardError.message)
    await admin.auth.admin.deleteUser(created.user.id) // undo, so nothing is left half-made
    return { ok: false, error: 'Could not create the card. Nothing was saved. ' + cardError.message }
  }

  // The dashboard greets the client by name. A failure here is harmless.
  const { error: nameError } = await admin.from('profiles').update({ full_name: input.name, organization_id: input.organizationId ?? null }).eq('id', created.user.id)
  if (nameError) console.error('could not save the name on the profile:', nameError.message)

  return { ok: true, username: input.username, password, slug: input.slug }
}

// ---------- Milestone 21: the login of an organization's own administrator (no card) ----------
export type ProvisionOrgAdminInput = { username: string; fullName: string; organizationId: string; password?: string }
export type ProvisionOrgAdminResult = { ok: true; username: string; password: string } | { ok: false; error: string }

export async function provisionOrgAdmin(input: ProvisionOrgAdminInput): Promise<ProvisionOrgAdminResult> {
  const bad = checkUsername(input.username)
  if (bad) return { ok: false, error: bad }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'The server key is missing.' }
  }

  const { data: takenName } = await admin.from('profiles').select('id').eq('username', input.username).maybeSingle()
  if (takenName) return { ok: false, error: `The username "${input.username}" is already taken.` }

  const password = input.password || generatePassword()
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email: usernameToEmail(input.username),
    password,
    email_confirm: true,
  })
  if (userError || !created.user) {
    console.error('createUser (org admin) failed:', userError?.message)
    return { ok: false, error: 'Could not create the login. ' + (userError?.message ?? '') }
  }

  const { error: roleError } = await admin
    .from('profiles')
    .update({ role: 'org_admin', organization_id: input.organizationId, full_name: input.fullName })
    .eq('id', created.user.id)
  if (roleError) {
    console.error('could not make the login an organization admin:', roleError.message)
    await admin.auth.admin.deleteUser(created.user.id) // undo, so nothing is left half-made
    return { ok: false, error: 'Could not set up the administrator. Nothing was saved. ' + roleError.message }
  }

  return { ok: true, username: input.username, password }
}
