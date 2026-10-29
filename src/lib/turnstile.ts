// Cloudflare Turnstile (free spam check).
// On the LIVE site, a missing TURNSTILE_SECRET_KEY blocks every form (safe by default). While testing on your computer it is skipped.
// To run the live site without the spam check ON PURPOSE (not recommended), set TURNSTILE_DISABLED=true.
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === 'production' && process.env.TURNSTILE_DISABLED !== 'true') {
      console.error('TURNSTILE_SECRET_KEY is not set, so every form is blocked. Set the Turnstile keys, or set TURNSTILE_DISABLED=true to switch the check off on purpose.')
      return false
    }
    return true
  }
  if (!token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
    })
    const json = (await res.json()) as { success?: boolean }
    return json.success === true
  } catch {
    return false
  }
}
