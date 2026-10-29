// The shape of each small-website block, and one function that cleans anything stored in it.
// It is used when SAVING (server) and again when SHOWING a page (so bad data can never break or abuse a page).

export const BLOCK_TYPES = ['about', 'services', 'gallery', 'testimonials', 'faq', 'contact_map'] as const
export type BlockType = (typeof BLOCK_TYPES)[number]

export const BLOCK_LABELS: Record<BlockType, string> = {
  about: 'About us',
  services: 'Services or products',
  gallery: 'Photo gallery',
  testimonials: 'Customer reviews',
  faq: 'Questions and answers',
  contact_map: 'Contact and location',
}

export const LIMITS = {
  aboutTitle: 80, aboutText: 2000,
  services: 12, serviceName: 80, serviceDesc: 300, servicePrice: 40,
  galleryImages: 8, caption: 100,
  testimonials: 10, quote: 300, author: 80, role: 80,
  faq: 12, question: 150, answer: 600,
  contactNote: 200,
}

export type AboutContent = { title: string; text: string }
export type ServiceItem = { name: string; description: string; price: string }
export type ServicesContent = { items: ServiceItem[] }
export type GalleryImage = { url: string; caption: string }
export type GalleryContent = { images: GalleryImage[] }
export type TestimonialItem = { quote: string; author: string; role: string }
export type TestimonialsContent = { items: TestimonialItem[] }
export type FaqItem = { question: string; answer: string }
export type FaqContent = { items: FaqItem[] }
export type ContactContent = { note: string }
export type BlockContent = AboutContent | ServicesContent | GalleryContent | TestimonialsContent | FaqContent | ContactContent

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim().slice(0, max) : '')
const list = (v: unknown, max: number): Record<string, unknown>[] =>
  Array.isArray(v) ? v.slice(0, max).map((x) => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {})) : []

export function emptyContent(type: BlockType): BlockContent {
  switch (type) {
    case 'about': return { title: '', text: '' }
    case 'services': return { items: [] }
    case 'gallery': return { images: [] }
    case 'testimonials': return { items: [] }
    case 'faq': return { items: [] }
    case 'contact_map': return { note: '' }
  }
}

// A photo link is accepted only if it starts with our storage address AND the rest has exactly the shape we generate:
//  - when saving: "<random letters/numbers>.jpg"
//  - when showing: "<user id>/gallery/<card id>-<random letters/numbers>.jpg"
// No dots, no "..", no extra slashes, so a link can never point anywhere else.
function isOwnGalleryUrl(url: string, prefix: string): boolean {
  if (prefix === '' || !url.startsWith(prefix) || !/^https:\/\/[A-Za-z0-9.\-]+\//.test(url)) return false
  const rest = url.slice(prefix.length)
  return /^[a-z0-9]{6,40}\.jpg$/.test(rest) || /^[0-9a-f-]{36}\/gallery\/[0-9a-f-]{36}-[a-z0-9]{6,40}\.jpg$/.test(rest)
}

// galleryPrefix: photo links must start with this (our own storage), end in .jpg and use only safe characters.
export function coerceContent(type: BlockType, raw: unknown, galleryPrefix: string): BlockContent {
  const c = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  switch (type) {
    case 'about':
      return { title: str(c.title, LIMITS.aboutTitle), text: str(c.text, LIMITS.aboutText) }
    case 'services':
      return {
        items: list(c.items, LIMITS.services)
          .map((i) => ({ name: str(i.name, LIMITS.serviceName), description: str(i.description, LIMITS.serviceDesc), price: str(i.price, LIMITS.servicePrice) }))
          .filter((i) => i.name),
      }
    case 'gallery':
      return {
        images: list(c.images, LIMITS.galleryImages)
          .map((i) => ({ url: str(i.url, 500), caption: str(i.caption, LIMITS.caption) }))
          .filter((i) => isOwnGalleryUrl(i.url, galleryPrefix)),
      }
    case 'testimonials':
      return {
        items: list(c.items, LIMITS.testimonials)
          .map((i) => ({ quote: str(i.quote, LIMITS.quote), author: str(i.author, LIMITS.author), role: str(i.role, LIMITS.role) }))
          .filter((i) => i.quote),
      }
    case 'faq':
      return {
        items: list(c.items, LIMITS.faq)
          .map((i) => ({ question: str(i.question, LIMITS.question), answer: str(i.answer, LIMITS.answer) }))
          .filter((i) => i.question && i.answer),
      }
    case 'contact_map':
      return { note: str(c.note, LIMITS.contactNote) }
  }
}

// A block with nothing to show is left out of the public website.
export function isBlank(type: BlockType, content: BlockContent): boolean {
  switch (type) {
    case 'about': return !(content as AboutContent).text
    case 'services': return (content as ServicesContent).items.length === 0
    case 'gallery': return (content as GalleryContent).images.length === 0
    case 'testimonials': return (content as TestimonialsContent).items.length === 0
    case 'faq': return (content as FaqContent).items.length === 0
    case 'contact_map': return false // always shows the card's own contact details
  }
}
