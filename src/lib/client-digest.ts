// The weekly e-mail to a client (Milestone 15). COUNTS ONLY: it never contains what a visitor wrote.

export type CardWeek = {
  slug: string
  name: string | null
  email: string
  views: number
  views_prev: number
  site_views: number
  taps: number
  saves: number
  new_messages: number
  waiting_messages: number
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function trend(now: number, before: number): string {
  if (now === before) return 'same as the week before'
  if (before === 0) return 'up from none the week before'
  const p = Math.round(((now - before) / before) * 100)
  return p > 0 ? `up ${p}% on the week before` : `down ${-p}% on the week before`
}

export function buildClientDigest(c: CardWeek, siteBase: string): { subject: string; text: string } {
  const base = siteBase.replace(/\/$/, '')
  const who = (c.name || '').replace(/[\r\n]+/g, ' ').trim()
  const quiet = c.views + c.site_views + c.taps + c.saves + c.new_messages === 0
  const lines = [
    who ? `Hello ${who},` : 'Hello,',
    '',
    quiet
      ? 'Your digital card had no visits in the last 7 days. Sharing your link or QR code on WhatsApp, on your shop door or on invoices is the easiest way to get visits.'
      : 'Here is how your digital card did in the last 7 days:',
    '',
    `- Card views: ${c.views} (${trend(c.views, c.views_prev)})`,
    `- Small website views: ${c.site_views}`,
    `- Taps on call, WhatsApp, e-mail, directions and links: ${c.taps}`,
    `- Times your contact was saved: ${c.saves}`,
    `- New messages: ${c.new_messages}`,
  ]
  if (c.waiting_messages > 0) {
    lines.push('', `You have ${plural(c.waiting_messages, 'message', 'messages')} marked New. Please answer them: a quick reply wins customers.`)
  }
  lines.push(
    '',
    `Your dashboard: ${base}/dashboard`,
    `Your card: ${base}/${c.slug}`,
    '',
    'This e-mail only shows numbers. You are getting it because you switched on "Weekly e-mail" in your dashboard. To stop it, log in and untick that box.',
  )
  return { subject: 'Your digital card this week', text: lines.join('\n') }
}
