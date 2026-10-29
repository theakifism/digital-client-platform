// Draws a social media post on a canvas (Milestone 8).
// It runs in the browser only. Nothing is uploaded or saved anywhere: the picture is made on the client's own device.
import { PALETTES, type LayoutId, type MotifId, type Palette, type PostTemplate } from './post-templates'

export type PostSizeId = 'square' | 'story'

export const POST_SIZES: Record<PostSizeId, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: 'Square (feed post)' },
  story: { w: 1080, h: 1920, label: 'Tall (story or status)' },
}

export type PostText = {
  headline: string
  message: string
  offer: string
  business: string
  phone: string
}

type Ctx = CanvasRenderingContext2D

const SANS = '"Segoe UI", system-ui, -apple-system, Roboto, "Noto Sans", Arial, sans-serif'
const SERIF = 'Georgia, "Noto Serif", "Times New Roman", serif'

type TextBlock = { kind: 'text'; lines: string[]; size: number; weight: number; family: string; color: string; lh: number; after: number }
type RuleBlock = { kind: 'rule'; w: number; h: number; color: string; after: number }
type Block = TextBlock | RuleBlock

// ---------- text helpers ----------

function wrap(ctx: Ctx, text: string, maxW: number): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    const words = para.trim().split(/\s+/).filter(Boolean)
    let line = ''
    for (const word of words) {
      const attempt = line ? `${line} ${word}` : word
      if (ctx.measureText(attempt).width <= maxW) {
        line = attempt
        continue
      }
      if (line) {
        out.push(line)
        line = ''
      }
      if (ctx.measureText(word).width <= maxW) {
        line = word
        continue
      }
      // A very long word (or text without spaces): break it by characters.
      let chunk = ''
      for (const ch of Array.from(word)) {
        if (chunk && ctx.measureText(chunk + ch).width > maxW) {
          out.push(chunk)
          chunk = ch
        } else {
          chunk += ch
        }
      }
      line = chunk
    }
    if (line) out.push(line)
  }
  return out
}

function ellipsize(ctx: Ctx, line: string, maxW: number): string {
  let s = line
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1)
  return s + '…'
}

type FitOptions = { maxW: number; maxLines: number; size: number; min: number; weight: number; family?: string; color: string; lh?: number; after?: number }

// Makes the text as big as allowed, and shrinks it until it fits in the given lines.
function fit(ctx: Ctx, text: string, o: FitOptions): TextBlock | null {
  const clean = (text || '').trim()
  if (!clean) return null
  const family = o.family ?? SANS
  let size = o.size
  for (;;) {
    ctx.font = `${o.weight} ${size}px ${family}`
    let lines = wrap(ctx, clean, o.maxW)
    if (lines.length <= o.maxLines || size <= o.min) {
      if (lines.length > o.maxLines) {
        lines = lines.slice(0, o.maxLines)
        lines[lines.length - 1] = ellipsize(ctx, lines[lines.length - 1], o.maxW)
      }
      return { kind: 'text', lines, size, weight: o.weight, family, color: o.color, lh: o.lh ?? 1.15, after: o.after ?? 0 }
    }
    size -= 4
  }
}

// Keeps short text on ONE line as long as it can stay big enough (minSingle). Otherwise it wraps like fit().
function fitPreferOne(ctx: Ctx, text: string, o: FitOptions, minSingle: number): TextBlock | null {
  const clean = (text || '').trim()
  if (!clean) return null
  const family = o.family ?? SANS
  if (!clean.includes('\n')) {
    for (let size = o.size; size >= minSingle; size -= 4) {
      ctx.font = `${o.weight} ${size}px ${family}`
      if (ctx.measureText(clean).width <= o.maxW) {
        return { kind: 'text', lines: [clean], size, weight: o.weight, family, color: o.color, lh: o.lh ?? 1.15, after: o.after ?? 0 }
      }
    }
  }
  return fit(ctx, text, o)
}

const compact = (...items: (Block | null)[]): Block[] => items.filter((b): b is Block => b !== null)

function stackHeight(blocks: Block[]): number {
  return blocks.reduce((sum, b, i) => {
    const own = b.kind === 'text' ? b.lines.length * b.size * b.lh : b.h
    return sum + own + (i < blocks.length - 1 ? b.after : 0)
  }, 0)
}

// Draws blocks one under another, centred vertically inside the box.
function drawStack(ctx: Ctx, blocks: Block[], x: number, y: number, w: number, h: number, align: 'center' | 'left') {
  let cy = y + Math.max(0, (h - stackHeight(blocks)) / 2)
  const ax = align === 'center' ? x + w / 2 : x
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  for (const b of blocks) {
    if (b.kind === 'rule') {
      ctx.fillStyle = b.color
      ctx.fillRect(align === 'center' ? ax - b.w / 2 : ax, cy, b.w, b.h)
      cy += b.h + b.after
      continue
    }
    ctx.font = `${b.weight} ${b.size}px ${b.family}`
    ctx.fillStyle = b.color
    b.lines.forEach((line, i) => ctx.fillText(line, ax, cy + b.size * b.lh * (i + 0.5)))
    cy += b.lines.length * b.size * b.lh + b.after
  }
}

// ---------- background and decorations ----------

function drawBackground(ctx: Ctx, w: number, h: number, p: Palette) {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, p.bg1)
  g.addColorStop(1, p.bg2)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function drawMotif(ctx: Ctx, motif: MotifId, w: number, h: number, p: Palette, footerTop: number) {
  const ink = p.light ? '0,0,0' : '255,255,255'
  ctx.save()
  if (motif === 'rays') {
    const cx = w / 2
    const cy = footerTop * 0.36
    const reach = Math.max(w, h)
    const count = 28
    ctx.fillStyle = `rgba(${ink},0.07)`
    for (let i = 0; i < count; i += 2) {
      const a1 = (i / count) * Math.PI * 2
      const a2 = ((i + 1) / count) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(a1) * reach, cy + Math.sin(a1) * reach)
      ctx.lineTo(cx + Math.cos(a2) * reach, cy + Math.sin(a2) * reach)
      ctx.closePath()
      ctx.fill()
    }
  } else if (motif === 'dots') {
    ctx.fillStyle = `rgba(${ink},0.2)`
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.beginPath()
        ctx.arc(w - 60 - c * 36, 56 + r * 36, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.beginPath()
        ctx.arc(60 + c * 36, footerTop - 56 - r * 36, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else if (motif === 'circles') {
    ctx.strokeStyle = `rgba(${ink},0.18)`
    ctx.lineWidth = 3
    for (let r = 200; r <= 700; r += 100) {
      ctx.beginPath()
      ctx.arc(w, 0, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    for (let r = 160; r <= 460; r += 100) {
      ctx.beginPath()
      ctx.arc(0, footerTop, r, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else if (motif === 'diagonals') {
    ctx.beginPath()
    ctx.rect(0, 0, w, footerTop)
    ctx.clip()
    ctx.strokeStyle = `rgba(${ink},0.09)`
    ctx.lineWidth = 16
    for (let x = -footerTop; x < w + footerTop; x += 80) {
      ctx.beginPath()
      ctx.moveTo(x, footerTop)
      ctx.lineTo(x + footerTop, 0)
      ctx.stroke()
    }
  } else {
    ctx.fillStyle = `rgba(${ink},0.2)`
    const diamond = (cx: number, cy: number, s: number) => {
      ctx.beginPath()
      ctx.moveTo(cx, cy - s)
      ctx.lineTo(cx + s, cy)
      ctx.lineTo(cx, cy + s)
      ctx.lineTo(cx - s, cy)
      ctx.closePath()
      ctx.fill()
    }
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5 - r; c++) diamond(70 + c * 46 + r * 0, 70 + r * 46, 12)
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5 - r; c++) diamond(w - 70 - c * 46, footerTop - 70 - r * 46, 12)
  }
  ctx.restore()
}

// ---------- footer: photo, business name and phone ----------

function drawFooter(ctx: Ctx, w: number, h: number, F: number, p: Palette, txt: PostText, photo: HTMLImageElement | null) {
  const top = h - F
  ctx.fillStyle = p.light ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.28)'
  ctx.fillRect(0, top, w, F)
  ctx.fillStyle = p.light ? p.strong : p.accent
  ctx.fillRect(0, top, w, 8)

  const m = 64
  let x = m
  const midY = top + 8 + (F - 8) / 2

  if (photo && photo.width > 0 && photo.height > 0) {
    const d = Math.min(136, F - 64)
    const cx = x + d / 2
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, midY, d / 2, 0, Math.PI * 2)
    ctx.clip()
    const s = Math.max(d / photo.width, d / photo.height)
    const dw = photo.width * s
    const dh = photo.height * s
    ctx.drawImage(photo, cx - dw / 2, midY - dh / 2, dw, dh)
    ctx.restore()
    ctx.beginPath()
    ctx.arc(cx, midY, d / 2, 0, Math.PI * 2)
    ctx.lineWidth = 6
    ctx.strokeStyle = p.light ? p.strong : p.accent
    ctx.stroke()
    x += d + 28
  }

  const maxW = w - x - m
  const biz = fit(ctx, txt.business, { maxW, maxLines: 1, size: 56, min: 30, weight: 700, color: p.text, lh: 1.2, after: 6 })
  const phone = txt.phone.trim() ? fit(ctx, `Call ${txt.phone.trim()}`, { maxW, maxLines: 1, size: 46, min: 28, weight: 600, color: p.text, lh: 1.2 }) : null
  drawStack(ctx, compact(biz, phone), x, top + 8, maxW, F - 8, 'left')
}

// ---------- the five layouts ----------

type Geo = { w: number; h: number; F: number; m: number; bodyH: number }

function layoutCenter(ctx: Ctx, g: Geo, p: Palette, tpl: PostTemplate, txt: PostText) {
  const maxW = g.w - 2 * g.m
  const family = tpl.category === 'festival' ? SERIF : SANS
  const hasOffer = txt.offer.trim().length > 0
  const offer = fitPreferOne(ctx, txt.offer, { maxW, maxLines: 2, size: 170, min: 70, weight: 900, color: p.accent, lh: 1.05, after: 28 }, 90)
  const head = fit(ctx, txt.headline, { maxW, maxLines: 3, size: hasOffer ? 88 : 140, min: 52, weight: 800, family, color: p.text, lh: 1.1, after: 34 })
  const rule: RuleBlock | null = head ? { kind: 'rule', w: 140, h: 8, color: p.accent, after: 34 } : null
  const msg = fit(ctx, txt.message, { maxW, maxLines: 4, size: 46, min: 30, weight: 400, color: p.text, lh: 1.3 })
  drawStack(ctx, compact(offer, head, msg ? rule : null, msg), g.m, 70, maxW, g.bodyH - 70, 'center')
}

function layoutBand(ctx: Ctx, g: Geo, p: Palette, tpl: PostTemplate, txt: PostText) {
  const bandH = Math.round(g.bodyH * 0.34)
  ctx.fillStyle = p.accent
  ctx.fillRect(0, 0, g.w, bandH)
  ctx.fillStyle = p.light ? p.strong : 'rgba(0,0,0,0.18)'
  ctx.fillRect(0, bandH, g.w, 10)
  const maxW = g.w - 2 * g.m
  const family = tpl.category === 'festival' ? SERIF : SANS
  const head = fitPreferOne(ctx, txt.headline, { maxW, maxLines: 3, size: 108, min: 50, weight: 800, family, color: p.accentText, lh: 1.08 }, 68)
  drawStack(ctx, compact(head), g.m, 0, maxW, bandH, 'left')

  const hasOffer = txt.offer.trim().length > 0
  const offer = fitPreferOne(ctx, txt.offer, { maxW, maxLines: 2, size: 140, min: 60, weight: 900, color: p.light ? p.strong : p.accent, lh: 1.05, after: 30 }, 80)
  const msg = fit(ctx, txt.message, { maxW, maxLines: 5, size: hasOffer ? 48 : 60, min: 30, weight: 500, color: p.text, lh: 1.3 })
  drawStack(ctx, compact(offer, msg), g.m, bandH + 10, maxW, g.bodyH - bandH - 10, 'left')
}

function layoutFrame(ctx: Ctx, g: Geo, p: Palette, tpl: PostTemplate, txt: PostText) {
  const edge = 44
  ctx.lineWidth = 7
  ctx.strokeStyle = p.light ? p.strong : p.accent
  ctx.strokeRect(edge, edge, g.w - 2 * edge, g.bodyH - 2 * edge + 24)
  ctx.lineWidth = 2
  ctx.strokeStyle = p.light ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)'
  ctx.strokeRect(edge + 20, edge + 20, g.w - 2 * (edge + 20), g.bodyH - 2 * (edge + 20) + 24)

  const pad = 130
  const maxW = g.w - 2 * pad
  const family = tpl.category === 'festival' ? SERIF : SANS
  const hasOffer = txt.offer.trim().length > 0
  const offer = fitPreferOne(ctx, txt.offer, { maxW, maxLines: 2, size: 130, min: 60, weight: 900, color: p.light ? p.strong : p.accent, lh: 1.05, after: 26 }, 76)
  const head = fit(ctx, txt.headline, { maxW, maxLines: 3, size: hasOffer ? 80 : 118, min: 48, weight: 700, family, color: p.text, lh: 1.12, after: 30 })
  const rule: RuleBlock | null = head ? { kind: 'rule', w: 110, h: 6, color: p.light ? p.strong : p.accent, after: 30 } : null
  const msg = fit(ctx, txt.message, { maxW, maxLines: 4, size: 42, min: 28, weight: 400, color: p.text, lh: 1.32 })
  drawStack(ctx, compact(offer, head, msg ? rule : null, msg), pad, edge + 30, maxW, g.bodyH - 2 * edge - 30, 'center')
}

function layoutSplit(ctx: Ctx, g: Geo, p: Palette, tpl: PostTemplate, txt: PostText) {
  const topH = Math.round(g.bodyH * 0.5)
  const maxW = g.w - 2 * g.m
  const family = tpl.category === 'festival' ? SERIF : SANS
  const head = fit(ctx, txt.headline, { maxW, maxLines: 3, size: 128, min: 52, weight: 800, family, color: p.text, lh: 1.08 })
  drawStack(ctx, compact(head), g.m, 40, maxW, topH - 40, 'center')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, topH, g.w, g.bodyH - topH)
  ctx.fillStyle = p.light ? p.strong : p.accent
  ctx.fillRect(0, topH, g.w, 12)

  const hasOffer = txt.offer.trim().length > 0
  const offer = fitPreferOne(ctx, txt.offer, { maxW, maxLines: 2, size: 128, min: 56, weight: 900, color: p.strong, lh: 1.05, after: 26 }, 76)
  const msg = fit(ctx, txt.message, { maxW, maxLines: 4, size: hasOffer ? 44 : 54, min: 30, weight: 500, color: '#1b1b1f', lh: 1.3 })
  drawStack(ctx, compact(offer, msg), g.m, topH + 12, maxW, g.bodyH - topH - 12, 'center')
}

function layoutBadge(ctx: Ctx, g: Geo, p: Palette, tpl: PostTemplate, txt: PostText) {
  const R = Math.round(g.w * 0.265)
  const cx = g.w / 2
  const hasOffer = txt.offer.trim().length > 0
  const family = tpl.category === 'festival' ? SERIF : SANS

  const belowMaxW = g.w - 2 * g.m
  const headBelow = hasOffer ? fit(ctx, txt.headline, { maxW: belowMaxW, maxLines: 2, size: 84, min: 44, weight: 800, family, color: p.text, lh: 1.1, after: 22 }) : null
  const msg = fit(ctx, txt.message, { maxW: belowMaxW, maxLines: hasOffer ? 3 : 4, size: hasOffer ? 42 : 50, min: 28, weight: 400, color: p.text, lh: 1.3 })
  const below = compact(headBelow, msg)
  const belowH = stackHeight(below)

  const gap = 56
  const circleBlock = 2 * R + 48
  const total = circleBlock + (below.length ? gap + belowH : 0)
  const startY = 40 + Math.max(0, (g.bodyH - 40 - total) / 2)
  const cy = startY + 24 + R

  ctx.beginPath()
  ctx.arc(cx, cy, R + 22, 0, Math.PI * 2)
  ctx.lineWidth = 8
  ctx.strokeStyle = p.light ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.55)'
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fillStyle = p.light ? p.strong : p.accent
  ctx.fill()

  const inner = hasOffer ? txt.offer : txt.headline
  const innerBlock = fit(ctx, inner, {
    maxW: R * 1.5,
    maxLines: 3,
    size: 112,
    min: 40,
    weight: 900,
    family: hasOffer ? SANS : family,
    color: p.accentText,
    lh: 1.08,
  })
  drawStack(ctx, compact(innerBlock), cx - R, cy - R, 2 * R, 2 * R, 'center')

  if (below.length) drawStack(ctx, below, g.m, startY + circleBlock + gap, belowMaxW, belowH, 'center')
}

const LAYOUTS: Record<LayoutId, (ctx: Ctx, g: Geo, p: Palette, tpl: PostTemplate, txt: PostText) => void> = {
  center: layoutCenter,
  band: layoutBand,
  frame: layoutFrame,
  split: layoutSplit,
  badge: layoutBadge,
}

// ---------- public functions ----------

export function drawPost(ctx: Ctx, sizeId: PostSizeId, tpl: PostTemplate, txt: PostText, photo: HTMLImageElement | null) {
  const { w, h } = POST_SIZES[sizeId]
  const p = PALETTES[tpl.palette]
  const F = sizeId === 'story' ? 250 : 200
  const geo: Geo = { w, h, F, m: 72, bodyH: h - F }

  ctx.save()
  ctx.clearRect(0, 0, w, h)
  drawBackground(ctx, w, h, p)
  drawMotif(ctx, tpl.motif, w, h, p, geo.bodyH)
  LAYOUTS[tpl.layout](ctx, geo, p, tpl, txt)
  drawFooter(ctx, w, h, F, p, txt, photo)
  ctx.restore()
}

// Loads the client's photo so it can be drawn in the footer. Gives back null if it cannot be loaded.
export function loadPhoto(url: string | null | undefined): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url || !/^https?:\/\//i.test(url)) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}
