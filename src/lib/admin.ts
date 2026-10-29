import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Use at the top of every admin page AND every admin server action.
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, username').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect(profile?.role === 'org_admin' ? '/org' : '/dashboard')

  return { supabase, user, username: profile.username as string }
}
