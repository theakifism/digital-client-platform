import type { NextConfig } from 'next'

// Where the site is allowed to load things from (Milestone 11: Content-Security-Policy).
// Everything else is blocked by the browser. Photos come from your Cloudflare R2 address (R2_PUBLIC_URL); the Cloudflare
// address challenges.cloudflare.com is only for the optional Turnstile spam check on the forms.
function originOf(url: string | undefined): string {
  try {
    return new URL(url || '').origin
  } catch {
    return ''
  }
}
const supabaseOrigin = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL) || 'https://*.supabase.co'
const photoOrigin = originOf(process.env.R2_PUBLIC_URL) // where photos are served from (Cloudflare R2, Milestone 18)
const turnstile = 'https://challenges.cloudflare.com'

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${turnstile}`, // Next.js needs inline scripts to start the page
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin} ${photoOrigin}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${turnstile}`,
  `frame-src ${turnstile}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

// The policy is only used on the live build (not in "npm run dev").
// By default it only REPORTS problems in the browser console and blocks nothing.
// When a full test shows no problems, set CSP_ENFORCE=true in the host's settings and deploy again to start blocking.
const cspHeader = {
  key: process.env.CSP_ENFORCE === 'true' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
  value: csp,
}

// Safe browser rules for every page.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  ...(process.env.NODE_ENV === 'production'
    ? [
        cspHeader,
        // Tells browsers to use https only for this site for the next year.
        { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
      ]
    : []),
]

// Tells search engines not to list a page.
const noindex = { key: 'X-Robots-Tag', value: 'noindex, nofollow' }

const nextConfig: NextConfig = {
  poweredByHeader: false, // do not announce which software runs the site
  async headers() {
    const rules = [
      { source: '/:path*', headers: securityHeaders },
      // Private pages are never listed by search engines.
      { source: '/admin/:path*', headers: [noindex] },
      { source: '/dashboard/:path*', headers: [noindex] },
      { source: '/login', headers: [noindex] },
      { source: '/after-login', headers: [noindex] },
      { source: '/api/:path*', headers: [noindex] },
    ]
    // Client cards and small websites decide for themselves (Milestone 12): each page says "noindex" in its own
    // metadata unless the owner switched on "Show my card in search engines". The Save-to-contacts file is never listed.
    rules.push({ source: '/:slug/vcard', headers: [noindex] })
    return rules
  },
}

export default nextConfig
