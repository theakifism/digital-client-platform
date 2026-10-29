// A plain-words health check of the live settings, shown on the admin Overview. Server only.
// It only reports whether things are set. It never shows a key or a password.
import { createAdminClient } from '@/lib/supabase/admin'

export type SetupCheck = { label: string; ok: boolean; detail: string }

export async function getSetupChecks(): Promise<SetupCheck[]> {
  const env = process.env
  const site = env.NEXT_PUBLIC_SITE_URL || ''
  const checks: SetupCheck[] = []

  checks.push({
    label: 'Website address',
    ok: /^https:\/\//.test(site) && !/localhost|127\.0\.0\.1/.test(site),
    detail: 'NEXT_PUBLIC_SITE_URL must be the real https address. QR codes, links and e-mails use it.',
  })

  const spamOn = Boolean(env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  checks.push({
    label: 'Spam check (Turnstile)',
    ok: spamOn,
    detail: env.TURNSTILE_DISABLED === 'true'
      ? 'Switched off on purpose with TURNSTILE_DISABLED=true. Anyone or any robot can use the forms.'
      : 'Set NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY. Without them the live forms are blocked.',
  })

  const mailOn = Boolean(env.RESEND_API_KEY && env.RESEND_FROM && env.REQUEST_NOTIFY_EMAIL)
  checks.push({
    label: 'E-mail (Resend)',
    ok: mailOn && !/onboarding@resend\.dev/i.test(env.RESEND_FROM || ''),
    detail: 'Needs RESEND_API_KEY, RESEND_FROM (an address on your own verified domain, not onboarding@resend.dev) and REQUEST_NOTIFY_EMAIL.',
  })

  checks.push({
    label: 'Daily admin e-mail check',
    ok: (env.CRON_SECRET || '').length >= 24,
    detail: 'Set CRON_SECRET (24 or more characters) here and as the GitHub secret of the same name.',
  })

  checks.push({
    label: 'Security rules in the browser (CSP)',
    ok: env.CSP_ENFORCE === 'true',
    detail: 'Still in report-only mode. After a full test with no console problems, set CSP_ENFORCE=true and deploy (see MILESTONE-11.md).',
  })

  // Is migration 011 in the database? (The counter function exists only after it.)
  let dbOk = false
  try {
    const { error } = await createAdminClient().rpc('hit_rate_limit', { p_key: 'selftest', p_window_seconds: 60, p_max: 1000000 })
    dbOk = !error
  } catch {
    dbOk = false
  }
  checks.push({
    label: 'Database upgrade 011 (limits and permissions)',
    ok: dbOk,
    detail: 'Run supabase/migrations/011_hardening.sql in the Supabase SQL Editor. Until then rate limits and the new database rules are not active.',
  })

  return checks
}
