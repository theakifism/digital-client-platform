import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type OrgInfo = { id: string; name: string; slug: string; max_cards: number; is_active: boolean }

// Use at the top of every organization page AND every organization server action (Milestone 21).
// The organization panel talks to the database with the server key (like the admin panel), so EVERY query it makes
// must add .eq('organization_id', org.id). This function is the only place that decides which organization that is:
// it comes from the logged-in person's own profile, never from the browser.
export async function requireOrgAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, username, organization_id')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.role !== 'org_admin' || !profile.organization_id) redirect('/dashboard')

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, max_cards, is_active')
    .eq('id', profile.organization_id)
    .maybeSingle()
  if (!org) redirect('/dashboard')

  return { supabase, db: createAdminClient(), user, username: profile.username as string, org: org as OrgInfo }
}
