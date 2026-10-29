// CHECKS that the Content-Security-Policy header is sent on the main pages of a RUNNING site.
//   node scripts/csp-check.mjs                       (checks http://localhost:3000, started with "npm run start")
//   node scripts/csp-check.mjs https://your-site.com (checks the live site)
// It does not open a browser. It only reads the headers. Use the browser console test in MILESTONE-11.md as well.
const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const sample = process.env.NEXT_PUBLIC_SAMPLE_CARD || 'demo-card'
const paths = ['/', '/contact', '/privacy', '/login', `/${sample}`, `/${sample}/site`, '/dashboard']

const needed = ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"]
let bad = 0
let mode = ''

for (const p of paths) {
  let res
  try {
    res = await fetch(base + p, { redirect: 'manual' })
  } catch (e) {
    console.log(`!!   ${p}: could not reach the site (${e instanceof Error ? e.message : e})`)
    bad++
    continue
  }
  const enforced = res.headers.get('content-security-policy')
  const reportOnly = res.headers.get('content-security-policy-report-only')
  const value = enforced || reportOnly
  if (!value) {
    console.log(`FAIL ${p}: no Content-Security-Policy header (status ${res.status}). Is this a production build ("npm run build" then "npm run start")?`)
    bad++
    continue
  }
  mode = enforced ? 'ENFORCING (blocks)' : 'REPORT ONLY (blocks nothing)'
  const missing = needed.filter((n) => !value.includes(n))
  if (missing.length > 0) {
    console.log(`FAIL ${p}: policy is missing ${missing.join(', ')}`)
    bad++
  } else if (value.includes('unsafe-eval')) {
    console.log(`FAIL ${p}: policy allows unsafe-eval`)
    bad++
  } else {
    console.log(`PASS ${p} (status ${res.status})`)
  }
}
console.log(`\nMode: ${mode || 'unknown'}`)
console.log(bad === 0 ? 'All checked pages send the policy.' : `${bad} problem(s) found.`)
process.exit(bad === 0 ? 0 : 1)
