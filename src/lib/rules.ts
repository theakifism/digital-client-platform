// Small rules and helpers with no server code inside, so they are easy to test.
import { randomInt } from 'node:crypto'

export const RESERVED_SLUGS = [
  'admin', 'dashboard', 'login', 'after-login', 'auth', 'contact', 'api', 'about', 'privacy', 'terms',
  'help', 'support', 'pricing', 'signup', 'register', 'logout', 'public', 'static', 'robots', 'sitemap', 'vcard',
]

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function checkUsername(v: string): string | null {
  if (v.length < 3 || v.length > 30) return 'The username must be 3 to 30 characters.'
  if (!NAME_RE.test(v)) return 'Use only small letters, numbers and single hyphens (example: ravi-sharma).'
  return null
}

export function checkSlug(v: string): string | null {
  if (v.length < 3 || v.length > 40) return 'The card link must be 3 to 40 characters.'
  if (!NAME_RE.test(v)) return 'Use only small letters, numbers and single hyphens (example: ravi-sharma).'
  if (RESERVED_SLUGS.includes(v)) return 'That link is reserved for the website. Please choose another.'
  return null
}

// "Sharma Interiors Pvt. Ltd." -> "sharma-interiors-pvt-ltd"
export function slugify(s: string, max = 30): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '')
}

// No look-alike characters (0/O, 1/l/I), so passwords are easy to read out and type.
export function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < length; i++) out += chars[randomInt(chars.length)]
  return out
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}
