export const CARD_WIDTH = 360
export const CARD_HEIGHT = 600
export const MAX_CARD_ELEMENTS = 32

export const CARD_FIELDS = [
  'name', 'company', 'designation', 'bio', 'phone', 'whatsapp', 'email', 'address', 'website',
] as const
export type CardField = typeof CARD_FIELDS[number]

export const CARD_ACTIONS = [
  'call', 'whatsapp', 'email', 'directions', 'website', 'message', 'vcard', 'site',
  'social_instagram', 'social_facebook', 'social_linkedin', 'social_youtube', 'social_x',
] as const
export type CardAction = typeof CARD_ACTIONS[number]

export type CardElementKind = 'field' | 'text' | 'photo' | 'shape' | 'action'
export type CardFont = 'sans' | 'serif' | 'mono'
export type CardAlign = 'left' | 'center' | 'right'
export type CardShape = 'rect' | 'circle' | 'line'

export type CardDesignElement = {
  id: string
  type: CardElementKind
  x: number
  y: number
  w: number
  h: number
  fontSize: number
  color: string
  font: CardFont
  weight: number
  align: CardAlign
  background: string | null
  radius: number
  field?: CardField
  text?: string
  action?: CardAction
  label?: string
  shape?: CardShape
}

export type CardDesign = {
  version: 1
  width?: number
  height?: number
  background: string
  elements: CardDesignElement[]
}

export type CardTemplate = {
  id: string
  name: string
  description: string
  theme: 'light' | 'dark' | 'teal' | 'orion'
  accent: string
  design: CardDesign
}

type ElementOptions = Partial<Omit<CardDesignElement, 'id' | 'type' | 'x' | 'y' | 'w' | 'h' | 'field' | 'action' | 'shape' | 'text'>>

function field(id: string, name: CardField, x: number, y: number, w: number, h: number, options: ElementOptions = {}): CardDesignElement {
  return { id, type: 'field', field: name, x, y, w, h, fontSize: 18, color: 'ink', font: 'sans', weight: 500, align: 'left', background: null, radius: 0, ...options }
}

function text(id: string, content: string, x: number, y: number, w: number, h: number, options: ElementOptions = {}): CardDesignElement {
  return { id, type: 'text', text: content, x, y, w, h, fontSize: 18, color: 'ink', font: 'sans', weight: 500, align: 'left', background: null, radius: 0, ...options }
}

function photo(x: number, y: number, w: number, h: number, radius: number): CardDesignElement {
  return { id: 'portrait', type: 'photo', x, y, w, h, fontSize: 18, color: 'accent', font: 'sans', weight: 500, align: 'center', background: 'surface', radius }
}

function shape(id: string, kind: CardShape, x: number, y: number, w: number, h: number, background: string, radius = 0): CardDesignElement {
  return { id, type: 'shape', shape: kind, x, y, w, h, fontSize: 18, color: 'ink', font: 'sans', weight: 500, align: 'center', background, radius }
}

function action(id: string, kind: CardAction, x: number, y: number, w: number, h: number, options: ElementOptions = {}): CardDesignElement {
  return { id, type: 'action', action: kind, x, y, w, h, fontSize: 14, color: 'onAccent', font: 'sans', weight: 700, align: 'center', background: 'accent', radius: 14, ...options }
}

const commonActions = [
  action('call', 'call', 24, 406, 150, 44, { radius: 12, fontSize: 13 }),
  action('whatsapp', 'whatsapp', 186, 406, 150, 44, { background: 'surface', color: 'accent', radius: 12, fontSize: 13 }),
  action('message', 'message', 24, 462, 312, 44, { radius: 12, fontSize: 13 }),
  action('email', 'email', 24, 520, 150, 40, { background: 'surface', color: 'ink', fontSize: 12, radius: 11 }),
  action('vcard', 'vcard', 186, 520, 150, 40, { background: 'surface', color: 'ink', fontSize: 12, radius: 11 }),
]

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: 'signature', name: 'Signature', description: 'A polished introduction with clear contact actions', theme: 'teal', accent: '#147568',
    design: {
      version: 1, background: '#f5f8f6',
      elements: [
        shape('hero-panel', 'rect', 0, 0, 360, 185, '#123c38'),
        shape('hero-accent', 'rect', 0, 178, 360, 7, 'accent'),
        photo(25, 32, 94, 94, 50),
        field('company', 'company', 137, 47, 194, 27, { fontSize: 12, color: '#cde9df', weight: 800, align: 'right' }),
        text('profile-label', 'DIGITAL BUSINESS CARD', 137, 79, 194, 18, { fontSize: 10, color: '#a4c9bc', weight: 700, align: 'right' }),
        field('name', 'name', 26, 211, 308, 48, { fontSize: 31, weight: 800 }),
        field('designation', 'designation', 27, 261, 306, 28, { fontSize: 15, color: 'accent', weight: 700 }),
        shape('identity-rule', 'line', 27, 301, 306, 1, '#d6e2dc'),
        field('bio', 'bio', 27, 315, 306, 70, { fontSize: 14, color: 'muted' }),
        ...commonActions,
      ],
    },
  },
  {
    id: 'executive', name: 'Executive', description: 'A confident, refined profile for client-facing professionals', theme: 'dark', accent: '#d3ac68',
    design: {
      version: 1, background: '#101a27',
      elements: [
        shape('gold-rule', 'rect', 0, 0, 360, 8, 'accent'),
        shape('photo-halo', 'circle', 27, 34, 112, 112, '#273849'),
        photo(39, 46, 88, 88, 50),
        field('company', 'company', 158, 51, 173, 30, { fontSize: 12, color: 'accent', weight: 800, align: 'right' }),
        text('profile-label', 'PRIVATE CLIENT PROFILE', 158, 83, 173, 18, { fontSize: 10, color: '#9dabb8', weight: 700, align: 'right' }),
        field('name', 'name', 27, 176, 306, 48, { fontSize: 30, color: '#ffffff', weight: 800 }),
        field('designation', 'designation', 28, 227, 304, 28, { fontSize: 15, color: 'accent', weight: 600 }),
        shape('gold-divider', 'line', 28, 268, 304, 1, '#394553'),
        field('bio', 'bio', 28, 282, 304, 88, { fontSize: 14, color: '#c4d0dc' }),
        ...commonActions.map((item) => ({ ...item, y: item.y + 4, x: item.x + 4, w: item.w - 8 })),
      ],
    },
  },
  {
    id: 'atelier', name: 'Atelier', description: 'Warm paper, graceful type, and an understated finish', theme: 'light', accent: '#96543e',
    design: {
      version: 1, background: '#f3ede3',
      elements: [
        shape('atelier-top', 'rect', 25, 24, 310, 2, 'accent'),
        text('atelier-label', 'INDEPENDENT PROFESSIONAL', 35, 42, 290, 18, { fontSize: 10, color: 'accent', weight: 800, align: 'center' }),
        photo(137, 73, 86, 86, 50),
        field('company', 'company', 32, 174, 296, 24, { fontSize: 12, color: 'accent', weight: 800, align: 'center' }),
        field('name', 'name', 24, 211, 312, 49, { fontSize: 30, font: 'serif', weight: 700, align: 'center' }),
        field('designation', 'designation', 24, 262, 312, 26, { fontSize: 14, color: 'muted', align: 'center' }),
        shape('atelier-line', 'line', 145, 302, 70, 1, 'accent'),
        field('bio', 'bio', 36, 319, 288, 66, { fontSize: 13, color: 'muted', align: 'center' }),
        shape('atelier-bottom', 'rect', 25, 574, 310, 2, 'accent'),
        ...commonActions.map((item) => ({ ...item, x: item.x + 2, w: item.w - 4, y: item.y + 4 })),
      ],
    },
  },
  {
    id: 'midnight', name: 'Midnight', description: 'A crisp, contemporary look with a vivid signature accent', theme: 'dark', accent: '#5ee0cd',
    design: {
      version: 1, background: '#0b151b',
      elements: [
        shape('neon-frame', 'rect', 12, 12, 336, 576, '#111f26', 22),
        shape('neon-glow', 'circle', 28, 26, 116, 116, '#173b3a', 58),
        photo(40, 38, 92, 92, 50),
        field('company', 'company', 159, 43, 164, 27, { fontSize: 12, color: 'accent', weight: 800, align: 'right' }),
        text('profile-label', 'CONNECTED · AVAILABLE', 159, 74, 164, 18, { fontSize: 10, color: '#91aaa7', weight: 700, align: 'right' }),
        shape('neon-divider', 'line', 28, 157, 304, 1, '#27413f'),
        field('name', 'name', 28, 183, 304, 48, { fontSize: 30, color: '#f4fffd', weight: 800 }),
        field('designation', 'designation', 28, 233, 304, 27, { fontSize: 15, color: 'accent', weight: 600 }),
        field('bio', 'bio', 28, 276, 304, 92, { fontSize: 14, color: '#b6c8c6' }),
        ...commonActions.map((item) => ({ ...item, y: item.y + 4 })),
      ],
    },
  },
  {
    id: 'editorial', name: 'Editorial', description: 'Distinctive magazine-style typography with a clean grid', theme: 'light', accent: '#843b4e',
    design: {
      version: 1, background: '#f7f5ef',
      elements: [
        shape('editorial-bar', 'rect', 0, 0, 8, 600, 'accent'),
        text('eyebrow', 'A PERSONAL INTRODUCTION', 28, 33, 304, 18, { fontSize: 10, color: 'accent', weight: 800 }),
        field('name', 'name', 27, 72, 306, 58, { fontSize: 32, font: 'serif', weight: 700 }),
        field('designation', 'designation', 29, 134, 302, 27, { fontSize: 15, color: 'muted' }),
        shape('editorial-rule', 'line', 29, 179, 302, 1, '#d9d2c8'),
        photo(29, 202, 72, 72, 36),
        field('company', 'company', 116, 211, 213, 28, { fontSize: 14, color: 'accent', weight: 800 }),
        text('company-label', 'WORKING WITH', 116, 239, 213, 16, { fontSize: 10, color: 'muted', weight: 700 }),
        field('bio', 'bio', 29, 298, 302, 80, { fontSize: 14, color: 'muted' }),
        ...commonActions.map((item) => ({ ...item, y: item.y + 3 })),
      ],
    },
  },
  {
    id: 'split-frame', name: 'Split Frame', description: 'A memorable color panel and a well-organized profile', theme: 'orion', accent: '#216c9b',
    design: {
      version: 1, background: '#ffffff',
      elements: [
        shape('left-panel', 'rect', 0, 0, 120, 600, '#173d56'),
        shape('left-panel-accent', 'rect', 0, 0, 7, 600, 'accent'),
        photo(20, 42, 80, 80, 40),
        field('company', 'company', 15, 145, 90, 46, { fontSize: 11, color: '#ffffff', weight: 800, align: 'center' }),
        text('brand-label', 'PROFILE', 17, 208, 86, 16, { fontSize: 10, color: '#bad0dc', weight: 700, align: 'center' }),
        action('call', 'call', 12, 439, 96, 42, { fontSize: 11, radius: 10 }),
        action('whatsapp', 'whatsapp', 12, 491, 96, 42, { fontSize: 10, background: 'surface', color: 'accent', radius: 10 }),
        field('name', 'name', 139, 52, 193, 70, { fontSize: 29, weight: 800 }),
        field('designation', 'designation', 141, 127, 190, 45, { fontSize: 14, color: 'muted' }),
        shape('split-rule', 'line', 141, 190, 190, 1, '#d6e0e6'),
        field('bio', 'bio', 141, 208, 190, 112, { fontSize: 13, color: 'muted' }),
        action('message', 'message', 136, 347, 204, 42, { fontSize: 11, radius: 10 }),
        action('email', 'email', 136, 401, 204, 38, { background: 'surface', color: 'ink', fontSize: 11, radius: 10 }),
        action('vcard', 'vcard', 136, 508, 204, 38, { background: 'surface', color: 'ink', fontSize: 11, radius: 10 }),
      ],
    },
  },
  {
    id: 'modern-grid', name: 'Modern Grid', description: 'Fresh color, crisp structure, and easy-to-find details', theme: 'teal', accent: '#176f85',
    design: {
      version: 1, background: '#f2f6f5',
      elements: [
        shape('grid-block', 'rect', 0, 0, 360, 178, '#e3eeeb'),
        shape('grid-accent', 'rect', 0, 170, 360, 8, 'accent'),
        photo(26, 30, 92, 92, 22),
        field('company', 'company', 138, 39, 190, 28, { fontSize: 12, color: 'accent', weight: 800, align: 'right' }),
        text('grid-label', 'PEOPLE · IDEAS · BUSINESS', 138, 72, 190, 18, { fontSize: 10, color: 'muted', weight: 700, align: 'right' }),
        field('name', 'name', 27, 204, 306, 48, { fontSize: 30, weight: 800 }),
        field('designation', 'designation', 29, 255, 302, 28, { fontSize: 15, color: 'accent', weight: 600 }),
        shape('grid-rule', 'line', 29, 296, 302, 1, '#d7e2de'),
        field('bio', 'bio', 29, 311, 302, 76, { fontSize: 14, color: 'muted' }),
        ...commonActions.map((item) => ({ ...item, y: item.y + 3 })),
      ],
    },
  },
  {
    id: 'monogram', name: 'Monogram', description: 'A distinctive, photo-free identity with warm metallic detail', theme: 'dark', accent: '#d8ae79',
    design: {
      version: 1, background: '#202631',
      elements: [
        shape('mono-disc-ring', 'circle', 129, 28, 102, 102, '#39404a'),
        shape('mono-disc', 'circle', 137, 36, 86, 86, 'accent'),
        text('mono-letter', '{{initial}}', 137, 37, 86, 84, { fontSize: 47, color: 'onAccent', font: 'serif', weight: 700, align: 'center' }),
        field('company', 'company', 28, 155, 304, 24, { fontSize: 12, color: 'accent', weight: 800, align: 'center' }),
        field('name', 'name', 27, 190, 306, 50, { fontSize: 30, color: '#ffffff', font: 'serif', weight: 700, align: 'center' }),
        field('designation', 'designation', 28, 243, 304, 27, { fontSize: 14, color: '#c7cbd3', align: 'center' }),
        shape('mono-divider', 'line', 132, 286, 96, 1, '#555964'),
        field('bio', 'bio', 32, 303, 296, 78, { fontSize: 13, color: '#c7cbd3', align: 'center' }),
        ...commonActions.map((item) => ({ ...item, y: item.y + 3 })),
      ],
    },
  },
]

const TOKEN_COLORS = new Set(['accent', 'onAccent', 'ink', 'muted', 'surface', 'transparent'])
const ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/

export function isTemplateId(value: unknown): value is string {
  return typeof value === 'string' && CARD_TEMPLATES.some((template) => template.id === value)
}

export function getCardTemplate(id: unknown): CardTemplate {
  return CARD_TEMPLATES.find((template) => template.id === id) ?? CARD_TEMPLATES[0]
}

export function createTemplateDesign(id: unknown): CardDesign {
  const template = getCardTemplate(id)
  return {
    version: 1,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    background: template.design.background,
    elements: template.design.elements.map((element) => ({ ...element })),
  }
}

function validColor(value: unknown): value is string {
  return typeof value === 'string' && (/^#[0-9a-fA-F]{6}$/.test(value) || TOKEN_COLORS.has(value))
}

export function parseCardDesign(value: unknown): CardDesign | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>
  if (candidate.version !== 1 || !/^#[0-9a-fA-F]{6}$/.test(String(candidate.background ?? ''))) return null
  if (!Array.isArray(candidate.elements) || candidate.elements.length > MAX_CARD_ELEMENTS) return null

  const ids = new Set<string>()
  const elements: CardDesignElement[] = []
  for (const raw of candidate.elements) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
    const item = raw as Record<string, unknown>
    const id = item.id
    const kind = item.type
    if (typeof id !== 'string' || !ID_RE.test(id) || ids.has(id)) return null
    if (!['field', 'text', 'photo', 'shape', 'action'].includes(String(kind))) return null
    ids.add(id)

    const numbers = ['x', 'y', 'w', 'h', 'fontSize', 'weight', 'radius'] as const
    if (numbers.some((key) => typeof item[key] !== 'number' || !Number.isFinite(item[key] as number))) return null
    const x = Math.round(item.x as number)
    const y = Math.round(item.y as number)
    const w = Math.round(item.w as number)
    const h = Math.round(item.h as number)
    const fontSize = Math.round(item.fontSize as number)
    const weight = Math.round(item.weight as number)
    const radius = Math.round(item.radius as number)
    const minimumHeight = kind === 'shape' ? 1 : 16
    if (x < 0 || y < 0 || w < 8 || h < minimumHeight || x + w > CARD_WIDTH || y + h > CARD_HEIGHT) return null
    if (fontSize < 10 || fontSize > 64 || ![400, 500, 600, 700, 800].includes(weight) || radius < 0 || radius > 180) return null
    if (!validColor(item.color) || !(item.background === null || validColor(item.background))) return null
    if (!['sans', 'serif', 'mono'].includes(String(item.font)) || !['left', 'center', 'right'].includes(String(item.align))) return null

    const element: CardDesignElement = {
      id, type: kind as CardElementKind, x, y, w, h, fontSize, weight, radius,
      color: item.color as string,
      font: item.font as CardFont,
      align: item.align as CardAlign,
      background: item.background as string | null,
    }

    if (element.type === 'field') {
      if (!CARD_FIELDS.includes(item.field as CardField)) return null
      element.field = item.field as CardField
    } else if (element.type === 'text') {
      if (typeof item.text !== 'string' || item.text.length > 240) return null
      element.text = item.text
    } else if (element.type === 'action') {
      if (!CARD_ACTIONS.includes(item.action as CardAction)) return null
      if (item.label !== undefined && (typeof item.label !== 'string' || item.label.length > 40)) return null
      element.action = item.action as CardAction
      if (typeof item.label === 'string') element.label = item.label
    } else if (element.type === 'shape') {
      if (!['rect', 'circle', 'line'].includes(String(item.shape))) return null
      element.shape = item.shape as CardShape
    }
    elements.push(element)
  }

  return { version: 1, width: CARD_WIDTH, height: CARD_HEIGHT, background: String(candidate.background), elements }
}

export function safeCardDesign(templateId: unknown, value: unknown): CardDesign {
  return parseCardDesign(value) ?? createTemplateDesign(templateId)
}

export function resolveDesignColor(token: string, colors: { accent: string; onAccent: string; ink: string; muted: string; surface: string }): string {
  if (token === 'accent') return colors.accent
  if (token === 'onAccent') return colors.onAccent
  if (token === 'ink') return colors.ink
  if (token === 'muted') return colors.muted
  if (token === 'surface') return colors.surface
  if (token === 'transparent') return 'transparent'
  return /^#[0-9a-fA-F]{6}$/.test(token) ? token : colors.ink
}

export function defaultActionLabel(actionId: CardAction): string {
  const labels: Record<CardAction, string> = {
    call: 'Call', whatsapp: 'WhatsApp', email: 'Email', directions: 'Directions', website: 'Website',
    message: 'Send a message', vcard: 'Save to contacts', site: 'Our website', social_instagram: 'Instagram',
    social_facebook: 'Facebook', social_linkedin: 'LinkedIn', social_youtube: 'YouTube', social_x: 'X',
  }
  return labels[actionId]
}
