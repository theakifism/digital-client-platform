import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

// Only the private areas run this check.
// Public card pages (/[slug]) stay fast because they skip it.
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/org/:path*'],
}
