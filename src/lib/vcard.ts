// Builds the .vcf file that "Save to contacts" downloads (vCard 3.0, works on iPhone and Android).

type VCardInput = {
  name?: string | null
  designation?: string | null
  company?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  website?: string | null
  address?: string | null
  pageUrl: string
}

const esc = (s: string) =>
  s.replace(/\r/g, '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

// A web address is not "text" in a vCard: commas and semicolons stay as they are.
const uri = (s: string) => s.replace(/[\r\n]/g, '').trim()

// vCard lines must not be longer than 75 bytes: longer lines are continued on the next line, starting with one space.
function fold(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const parts: string[] = []
  let cur = ''
  let bytes = 0
  let limit = 75
  for (const ch of line) {
    const b = enc.encode(ch).length
    if (bytes + b > limit) {
      parts.push(cur)
      cur = ''
      bytes = 0
      limit = 74
    }
    cur += ch
    bytes += b
  }
  parts.push(cur)
  return parts.join('\r\n ')
}

function cleanTel(input?: string | null): string | null {
  const raw = input?.trim()
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 7) return null
  return `${raw.startsWith('+') ? '+' : ''}${digits}`
}

export function buildVCard(c: VCardInput): string {
  const full = (c.name || c.company || 'Contact').trim()
  const parts = full.split(/\s+/)
  const family = parts.length > 1 ? (parts.pop() as string) : ''
  const given = parts.join(' ')

  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${esc(full)}`, `N:${esc(family)};${esc(given)};;;`]
  if (c.company) lines.push(`ORG:${esc(c.company)}`)
  if (c.designation) lines.push(`TITLE:${esc(c.designation)}`)

  const phone = cleanTel(c.phone)
  const wa = cleanTel(c.whatsapp)
  if (phone) lines.push(`TEL;TYPE=CELL:${phone}`)
  if (wa && wa.replace(/\D/g, '') !== phone?.replace(/\D/g, '')) lines.push(`TEL;TYPE=CELL:${wa}`)
  if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(c.email.trim())}`)
  if (c.website) lines.push(`URL:${uri(c.website)}`)
  lines.push(`URL:${uri(c.pageUrl)}`)
  if (c.address) lines.push(`ADR;TYPE=WORK:;;${esc(c.address.trim())};;;;`)
  lines.push('END:VCARD')
  return lines.map(fold).join('\r\n') + '\r\n'
}
