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
  action('call', 'call', 24, 390, 150, 46),
  action('whatsapp', 'whatsapp', 186, 390, 150, 46, { background: 'surface', color: 'accent' }),
  action('message', 'message', 24, 448, 312, 46),
  action('email', 'email', 24, 506, 150, 38, { background: 'surface', color: 'ink', fontSize: 12 }),
  action('vcard', 'vcard', 186, 506, 150, 38, { background: 'surface', color: 'ink', fontSize: 12 }),
]

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: 'signature', name: 'Signature', description: 'Photo-led, calm, and polished', theme: 'teal', accent: '#0b6e62',
    design: {
      version: 1, background: '#ffffff',
      elements: [
        shape('hero-panel', 'rect', 0, 0, 360, 174, 'accent'),
        photo(24, 28, 92, 92, 50),
        field('company', 'company', 24, 143, 312, 20, { fontSize: 12, color: 'onAccent', weight: 800 }),
        field('name', 'name', 24, 184, 312, 42, { fontSize: 31, weight: 800 }),
        field('designation', 'designation', 24, 227, 312, 28, { fontSize: 16, color: 'muted' }),
        field('bio', 'bio', 24, 268, 312, 82, { fontSize: 15, color: 'muted' }),
        ...commonActions,
      ],
    },
  },
  {
    id: 'executive', name: 'Executive', description: 'A confident dark profile with gold accents', theme: 'dark', accent: '#c49a45',
    design: {
      version: 1, background: '#142130',
      elements: [
        shape('gold-rule', 'rect', 0, 0, 360, 13, 'accent'),
        shape('photo-halo', 'circle', 224, 35, 110, 110, '#263746'),
        photo(238, 49, 82, 82, 50),
        field('company', 'company', 28, 48, 185, 22, { fontSize: 12, color: 'accent', weight: 800 }),
        field('name', 'name', 28, 92, 190, 54, { fontSize: 30, color: '#ffffff', weight: 800 }),
        field('designation', 'designation', 28, 151, 300, 28, { fontSize: 15, color: '#c4d0dc' }),
        field('bio', 'bio', 28, 197, 304, 78, { fontSize: 15, color: '#c4d0dc' }),
        ...commonActions.map((item) => ({ ...item, y: item.y + 6, x: item.x + 4, w: item.w - 8 })),
      ],
    },
  },
  {
    id: 'atelier', name: 'Atelier', description: 'Warm paper tones and elegant typography', theme: 'light', accent: '#a85f45',
    design: {
      version: 1, background: '#f4eee5',
      elements: [
        shape('atelier-top', 'rect', 24, 24, 312, 5, 'accent'),
        photo(132, 58, 96, 96, 50),
        field('company', 'company', 32, 176, 296, 20, { fontSize: 12, color: 'accent', weight: 800, align: 'center' }),
        field('name', 'name', 24, 210, 312, 48, { fontSize: 30, font: 'serif', weight: 700, align: 'center' }),
        field('designation', 'designation', 24, 262, 312, 26, { fontSize: 15, color: 'muted', align: 'center' }),
        shape('atelier-line', 'line', 130, 302, 100, 2, 'accent'),
        shape('atelier-bottom', 'rect', 24, 571, 312, 5, 'accent'),
        field('bio', 'bio', 36, 323, 288, 58, { fontSize: 14, color: 'muted', align: 'center' }),
        ...commonActions.map((item) => ({ ...item, x: item.x + 2, w: item.w - 4, y: item.y + 4 })),
      ],
    },
  },
  {
    id: 'midnight', name: 'Midnight', description: 'High-contrast black with a bright accent', theme: 'dark', accent: '#68e0d0',
    design: {
      version: 1, background: '#09151b',
      elements: [
        shape('neon-frame', 'rect', 14, 14, 332, 572, '#13252b', 22),
        shape('neon-glow', 'circle', 26, 27, 132, 132, '#1c3b3e', 30),
        photo(42, 43, 100, 100, 28),
        field('company', 'company', 178, 48, 146, 28, { fontSize: 12, color: 'accent', weight: 800, align: 'right' }),
        field('name', 'name', 28, 181, 304, 44, { fontSize: 31, color: '#f4fffd', weight: 800 }),
        field('designation', 'designation', 28, 225, 304, 25, { fontSize: 16, color: '#a5bebc' }),
        field('bio', 'bio', 28, 269, 304, 74, { fontSize: 15, color: '#a5bebc' }),
        ...commonActions.map((item) => ({ ...item, y: item.y + 4 })),
      ],
    },
  },
  {
    id: 'editorial', name: 'Editorial', description: 'Magazine-inspired type and fine rules', theme: 'light', accent: '#782f43',
    design: {
      version: 1, background: '#f8f6f1',
      elements: [
        shape('editorial-bar', 'rect', 0, 0, 14, 600, 'accent'),
        text('eyebrow', 'PERSONAL PROFILE', 34, 35, 292, 20, { fontSize: 11, color: 'accent', weight: 800 }),
        field('name', 'name', 30, 78, 302, 70, { fontSize: 34, font: 'serif', weight: 700 }),
        field('designation', 'designation', 32, 150, 300, 27, { fontSize: 16, color: 'muted' }),
        photo(238, 202, 86, 86, 50),
        field('company', 'company', 32, 208, 186, 32, { fontSize: 15, color: 'accent', weight: 800 }),
        shape('editorial-rule', 'line', 32, 307, 296, 2, '#d8c9c3'),
        field('bio', 'bio', 32, 326, 296, 55, { fontSize: 14, color: 'muted' }),
        ...commonActions.map((item) => ({ ...item, y: item.y + 6 })),
      ],
    },
  },
  {
    id: 'split-frame', name: 'Split Frame', description: 'A bold color panel paired with a clean profile', theme: 'orion', accent: '#216c9b',
    design: {
      version: 1, background: '#ffffff',
      elements: [
        shape('left-panel', 'rect', 0, 0, 132, 600, '#173d56'),
        photo(22, 40, 88, 88, 50),
        field('company', 'company', 18, 154, 96, 40, { fontSize: 12, color: '#ffffff', weight: 800, align: 'center' }),
        action('call', 'call', 14, 442, 104, 48, { fontSize: 12 }),
        action('whatsapp', 'whatsapp', 14, 500, 104, 48, { fontSize: 12, background: 'surface', color: 'accent' }),
        field('name', 'name', 152, 56, 182, 68, { fontSize: 30, weight: 800 }),
        field('designation', 'designation', 152, 128, 182, 42, { fontSize: 15, color: 'muted' }),
        field('bio', 'bio', 152, 198, 182, 100, { fontSize: 14, color: 'muted' }),
        action('message', 'message', 150, 335, 190, 46, { fontSize: 12 }),
        action('email', 'email', 150, 393, 190, 38, { background: 'surface', color: 'ink', fontSize: 12 }),
        action('vcard', 'vcard', 150, 508, 190, 38, { background: 'surface', color: 'ink', fontSize: 12 }),
      ],
    },
  },
  {
    id: 'modern-grid', name: 'Modern Grid', description: 'Crisp geometry and an airy color system', theme: 'teal', accent: '#176f85',
    design: {
      version: 1, background: '#edf4f4',
      elements: [
        shape('grid-block', 'rect', 0, 0, 360, 218, '#dce9e9'),
        shape('grid-accent', 'rect', 0, 206, 360, 12, 'accent'),
        photo(28, 34, 98, 98, 24),
        field('company', 'company', 150, 45, 180, 22, { fontSize: 12, color: 'accent', weight: 800, align: 'right' }),
        field('name', 'name', 28, 239, 304, 42, { fontSize: 30, weight: 800 }),
        field('designation', 'designation', 28, 281, 304, 26, { fontSize: 15, color: 'muted' }),
        field('bio', 'bio', 28, 322, 304, 64, { fontSize: 14, color: 'muted' }),
        ...commonActions.map((item) => ({ ...item, y: item.y + 5 })),
      ],
    },
  },
  {
    id: 'monogram', name: 'Monogram', description: 'A composed profile with a distinctive initial', theme: 'dark', accent: '#d8a976',
    design: {
      version: 1, background: '#202531',
      elements: [
        shape('mono-disc', 'circle', 216, 28, 112, 112, 'accent'),
        text('mono-letter', '{{initial}}', 216, 30, 112, 104, { fontSize: 54, color: 'onAccent', font: 'serif', weight: 700, align: 'center' }),
        photo(238, 50, 68, 68, 50),
        field('company', 'company', 28, 58, 172, 26, { fontSize: 12, color: 'accent', weight: 800 }),
        field('name', 'name', 28, 166, 304, 46, { fontSize: 31, color: '#ffffff', font: 'serif', weight: 700 }),
        field('designation', 'designation', 28, 212, 304, 26, { fontSize: 15, color: '#c7cbd3' }),
        field('bio', 'bio', 28, 256, 304, 77, { fontSize: 14, color: '#c7cbd3' }),
        ...commonActions.map((item) => ({ ...item, y: item.y + 4 })),
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
