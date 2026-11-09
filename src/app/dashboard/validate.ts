// Checks and cleans everything a client typed. Runs on the SERVER, so it cannot be skipped.
import { safeUrl, telHref, emailHref } from '@/lib/links'
import { THEME_IDS } from './themes'
import { isHexAccent } from '@/lib/card-accent'
import { isTemplateId, parseCardDesign, type CardDesign } from '@/lib/card-design'

export const SOCIAL_KEYS = ['instagram', 'facebook', 'linkedin', 'youtube', 'x'] as const

export type CardValues = {
  name: string
  designation: string | null
  company: string | null
  bio: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  map_url: string | null
  website: string | null
  social_links: Record<string, string>
  theme: string
  accent_color: string | null
  template: string
  design_config: CardDesign
  photo_url: string | null
}

const clean = (v: FormDataEntryValue | null) => String(v ?? '').replace(/\r\n/g, '\n').trim()

// A link must be http(s) and have a real website name (with a dot), like instagram.com
function validUrl(v: string): string | null {
  const u = safeUrl(v)
  if (!u) return null
  try {
    return new URL(u).hostname.includes('.') ? u : null
  } catch {
    return null
  }
}

export function validateCard(fd: FormData, photoPrefix: string) {
  const errors: Record<string, string> = {}

  const text = (key: string, max: number) => {
    const v = clean(fd.get(key))
    if (v.length > max) errors[key] = `Too long. Please keep it under ${max} characters.`
    return v
  }

  const name = text('name', 80)
  if (!name) errors.name = 'Please enter your name.'
  const designation = text('designation', 80)
  const company = text('company', 80)
  const bio = text('bio', 500)
  const address = text('address', 200)

  const phoneField = (key: string) => {
    const v = text(key, 30)
    if (v && !telHref(v)) errors[key] = 'Please enter a valid number, for example +91 98765 43210.'
    return v
  }
  const phone = phoneField('phone')
  const whatsapp = phoneField('whatsapp')

  const email = text('email', 120)
  if (email && !emailHref(email)) errors.email = 'Please enter a valid email address.'

  const linkField = (key: string, max: number, example: string) => {
    const v = text(key, max)
    if (!v) return null
    const u = validUrl(v)
    if (!u) {
      errors[key] = `Please enter a full link, for example ${example}`
      return null
    }
    return u
  }
  const website = linkField('website', 300, 'https://yourbusiness.com')
  const map_url = linkField('map_url', 400, 'https://maps.app.goo.gl/...')

  const social_links: Record<string, string> = {}
  for (const k of SOCIAL_KEYS) {
    const u = linkField(`social_${k}`, 300, `https://${k}.com/yourname`)
    if (u) social_links[k] = u
  }

  const theme = clean(fd.get('theme'))
  if (!THEME_IDS.includes(theme)) errors.theme = 'Please choose one of the themes.'
  const rawAccent = clean(fd.get('accent_color'))
  if (rawAccent && !isHexAccent(rawAccent)) errors.accent_color = 'Please choose a valid six-digit color.'
  const accent_color = rawAccent || null

  const template = clean(fd.get('template'))
  if (!isTemplateId(template)) errors.template = 'Please choose one of the card designs.'
  const rawDesign = clean(fd.get('design_config'))
  let design_config: CardDesign | null = null
  if (!rawDesign || rawDesign.length > 45000) {
    errors.design_config = 'The card design is too large. Please remove some elements and try again.'
  } else {
    try {
      design_config = parseCardDesign(JSON.parse(rawDesign))
    } catch {
      design_config = null
    }
    if (!design_config) errors.design_config = 'This card design is invalid. Please choose a template and try again.'
  }

  const photo = clean(fd.get('photo_url'))
  if (photo && (photo.length > 500 || photoPrefix === '' || !photo.startsWith(photoPrefix))) {
    errors.photo = 'That photo is not valid. Please upload it again.'
  }

  if (Object.keys(errors).length > 0) return { values: null, errors }

  const values: CardValues = {
    name,
    designation: designation || null,
    company: company || null,
    bio: bio || null,
    phone: phone || null,
    whatsapp: whatsapp || null,
    email: email || null,
    address: address || null,
    map_url,
    website,
    social_links,
    theme,
    accent_color,
    template,
    design_config: design_config!,
    photo_url: photo || null,
  }
  return { values, errors }
}
