// After any successful login, send admins to /admin, organization admins to /org and clients to /dashboard.
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  url.search = ''

  if (!user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  url.pathname = profile?.role === 'admin' ? '/admin' : profile?.role === 'org_admin' ? '/org' : '/dashboard'
  return NextResponse.redirect(url)
}
