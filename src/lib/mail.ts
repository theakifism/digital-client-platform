// Sends emails through Resend (free plan). Optional: if the settings are missing, nothing is sent
// and the request or enquiry is still saved.
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ')

export type SendResult = 'sent' | 'not_configured' | 'failed'

async function send(opts: { to: string[]; subject: string; text: string; replyTo?: string }): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  if (!key || !from || opts.to.length === 0) return 'not_configured'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: opts.to, reply_to: opts.replyTo, subject: opts.subject, text: opts.text }),
    })
    if (!res.ok) {
      console.error('Email failed:', res.status, await res.text())
      return 'failed'
    }
    return 'sent'
  } catch (e) {
    console.error('Email failed:', e)
    return 'failed'
  }
}

// ---- A short status e-mail for the admin (Milestone 13). Goes to the same address(es) as card requests. ----
export async function sendAdminEmail(subject: string, text: string): Promise<SendResult> {
  const to = (process.env.REQUEST_NOTIFY_EMAIL || '').split(',').map((s) => s.trim()).filter(Boolean)
  return send({ to, subject: oneLine(subject), text })
}

// ---- The weekly numbers e-mail to one client (Milestone 15). Goes to the e-mail on that client's card. ----
export async function sendClientEmail(to: string, subject: string, text: string): Promise<SendResult> {
  const address = oneLine(to).trim()
  return send({ to: address ? [address] : [], subject: oneLine(subject), text })
}

// ---- A visitor asked for a card (goes to the one person who handles requests) ----
type RequestInfo = { name: string; email: string; company?: string; phone?: string; message?: string }

export async function sendRequestEmail(r: RequestInfo, adminUrl: string) {
  const to = (process.env.REQUEST_NOTIFY_EMAIL || '').split(',').map((s) => s.trim()).filter(Boolean)
  await send({
    to,
    replyTo: r.email,
    subject: `New card request from ${oneLine(r.name)}`,
    text: [
      'A new card request has arrived.', '',
      `Name: ${oneLine(r.name)}`,
      `Business: ${oneLine(r.company || '-')}`,
      `Phone: ${oneLine(r.phone || '-')}`,
      `Email: ${oneLine(r.email)}`, '',
      'Message:', r.message || '-', '',
      `Open the admin panel: ${adminUrl}`,
    ].join('\n'),
  })
}

// ---- A visitor sent a message through a client's card (goes to the email on that card) ----
type LeadInfo = { name: string; email?: string; phone?: string; message?: string }

export async function sendLeadEmail(to: string, lead: LeadInfo, cardName: string, dashboardUrl: string) {
  await send({
    to: [to],
    replyTo: lead.email || undefined,
    subject: `New message for ${oneLine(cardName)} from ${oneLine(lead.name)}`,
    text: [
      `Someone sent you a message through your digital card.`, '',
      `Name: ${oneLine(lead.name)}`,
      `Phone: ${oneLine(lead.phone || '-')}`,
      `Email: ${oneLine(lead.email || '-')}`, '',
      'Message:', lead.message || '-', '',
      `See all your messages: ${dashboardUrl}`,
    ].join('\n'),
  })
}
