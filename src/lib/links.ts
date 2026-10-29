// Small helpers that turn what a client typed into safe links.
// Anything a client types is untrusted, so only http(s) links are ever allowed.

export function safeUrl(input?: string | null): string | null {
  if (!input) return null
  const v = input.trim()
  if (!v) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`
  try {
    const u = new URL(withScheme)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null
  } catch {
    return null
  }
}

export function telHref(input?: string | null): string | null {
  const raw = input?.trim()
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 7) return null
  return `tel:${raw.startsWith('+') ? '+' : ''}${digits}`
}

// WhatsApp links need the country code. A plain 10-digit number is assumed to be Indian (+91).
export function whatsappHref(input?: string | null): string | null {
  if (!input) return null
  const digits = input.replace(/\D/g, '').replace(/^0+/, '')
  if (digits.length < 7) return null
  const full = digits.length === 10 ? `91${digits}` : digits
  return `https://wa.me/${full}`
}

export function emailHref(input?: string | null): string | null {
  const v = input?.trim()
  if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null
  return `mailto:${v}`
}

export function directionsHref(mapUrl?: string | null, address?: string | null): string | null {
  const fromMap = safeUrl(mapUrl)
  if (fromMap) return fromMap
  const a = address?.trim()
  return a ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}` : null
}
