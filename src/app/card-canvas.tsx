'use client'

import type { CSSProperties, PointerEvent as ReactPointerEvent, KeyboardEvent, ReactNode } from 'react'
import type { CardAction, CardDesign, CardDesignElement, CardField } from '@/lib/card-design'
import { CARD_HEIGHT, CARD_WIDTH, defaultActionLabel, resolveDesignColor } from '@/lib/card-design'
import { accentTextColor } from '@/lib/card-accent'

export type CanvasValues = {
  name: string
  company: string
  designation: string
  bio: string
  phone: string
  whatsapp: string
  email: string
  address: string
  website: string
  social_links: Record<string, string>
}

export type CanvasActionLink = { href: string; label?: string; external?: boolean; track?: string }
export type CanvasActionLinks = Partial<Record<CardAction, CanvasActionLink>>
type Props = {
  design: CardDesign
  values: CanvasValues
  photoUrl: string | null
  accentColor: string
  theme: string
  actions: CanvasActionLinks
  editMode?: boolean
  selectedId?: string | null
  onSelect?: (id: string) => void
  onElementPointerDown?: (element: CardDesignElement, x: number, y: number, width: number, height: number, mode?: 'move' | 'resize') => void
  onPointerMove?: (x: number, y: number, width: number, height: number) => void
  onPointerUp?: () => void
}

function fieldValue(field: CardField, values: CanvasValues): string {
  return values[field] ?? ''
}

function fittedFieldFontSize(element: CardDesignElement, value: string): number {
  if (element.type !== 'field' || !['name', 'company', 'designation'].includes(element.field ?? '') || !value.trim()) {
    return element.fontSize
  }
  const averageGlyphWidth = element.font === 'mono' ? 0.62 : element.font === 'serif' ? 0.56 : 0.54
  const availableWidth = Math.max(1, element.w - 8)
  const estimatedWidth = value.trim().length * element.fontSize * averageGlyphWidth
  return estimatedWidth > availableWidth
    ? Math.max(10, Math.floor(element.fontSize * availableWidth / estimatedWidth))
    : element.fontSize
}

const FONT_FAMILY = {
  sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
}

export default function CardCanvas({
  design,
  values,
  photoUrl,
  accentColor,
  theme,
  actions,
  editMode = false,
  selectedId = null,
  onSelect,
  onElementPointerDown,
  onPointerMove,
  onPointerUp,
}: Props) {
  const palette = theme === 'dark'
    ? { ink: '#f0f4f6', muted: '#b4c0ca' }
    : theme === 'teal'
      ? { ink: '#162b2a', muted: '#526a68' }
      : theme === 'orion'
        ? { ink: '#172b3a', muted: '#566d7d' }
        : { ink: '#10202e', muted: '#4f6170' }
  const colors = { accent: accentColor, onAccent: accentTextColor(accentColor), ink: palette.ink, muted: palette.muted, surface: design.background }
  const width = design.width ?? CARD_WIDTH
  const height = design.height ?? CARD_HEIGHT
  const companyMark = values.company.trim().split(/\s+/).filter(Boolean).map((word) => word[0]).join('').slice(0, 2).toUpperCase() || values.name.trim().charAt(0).toUpperCase() || '?'
  const initial = values.name.trim().charAt(0).toUpperCase() || companyMark.charAt(0)
  const canvasStyle = { '--card-design-background': design.background } as CSSProperties & Record<string, string>

  function startPointer(e: ReactPointerEvent<HTMLElement>, element: CardDesignElement, mode: 'move' | 'resize' = 'move') {
    if (!editMode) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const bounds = e.currentTarget.closest('.card-design-canvas')?.getBoundingClientRect()
    if (bounds) onElementPointerDown?.(element, e.clientX, e.clientY, bounds.width, bounds.height, mode)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLElement>, id: string) {
    if (!editMode || (e.key !== 'Enter' && e.key !== ' ')) return
    e.preventDefault()
    onSelect?.(id)
  }

  return (
    <div
      className={`card-design-canvas${editMode ? ' is-editable' : ''} ${width === height ? 'is-square' : 'is-portrait'}`}
      style={{ ...canvasStyle, aspectRatio: `${width} / ${height}` }}
      onPointerMove={(e) => {
        const bounds = e.currentTarget.getBoundingClientRect()
        onPointerMove?.(e.clientX, e.clientY, bounds.width, bounds.height)
      }}
      onPointerUp={() => onPointerUp?.()}
      onPointerCancel={() => onPointerUp?.()}
      onClick={() => { if (editMode) onSelect?.('') }}
    >
      {design.elements.map((element, index) => {
        const selected = editMode && selectedId === element.id
        const value = element.type === 'field' && element.field ? fieldValue(element.field, values) : ''
        const position: CSSProperties = {
          left: `${(element.x / width) * 100}%`,
          top: `${(element.y / height) * 100}%`,
          width: `${(element.w / width) * 100}%`,
          height: `${(element.h / height) * 100}%`,
          zIndex: selected ? 999 : index + 1,
          fontSize: `${(fittedFieldFontSize(element, value) / width) * 100}cqw`,
          color: resolveDesignColor(element.color, colors),
          fontFamily: FONT_FAMILY[element.font],
          fontWeight: element.weight,
          textAlign: element.align,
          backgroundColor: element.background ? resolveDesignColor(element.background, colors) : undefined,
          borderRadius: element.radius ? `${(element.radius / width) * 100}cqw` : undefined,
        }
        let contents: ReactNode = null

        if (element.type === 'field' && element.field) {
          if (value || editMode) {
            contents = <span className={`card-design-text field-${element.field}${['name', 'company', 'designation'].includes(element.field) ? ' is-single-line' : ''}`}>{value || fieldLabel(element.field)}</span>
          }
        } else if (element.type === 'text') {
          contents = <span className="card-design-text">{element.text === '{{initial}}' ? initial : element.text}</span>
        } else if (element.type === 'photo') {
          contents = photoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img className="card-design-photo" src={photoUrl} alt={editMode ? 'Your profile image' : values.name} />
            : <span className="card-design-photo-fallback">{companyMark}</span>
        } else if (element.type === 'shape') {
          contents = <span className={`card-design-shape shape-${element.shape ?? 'rect'}`} aria-hidden="true" />
        } else if (element.type === 'action' && element.action) {
          const action = actions[element.action]
          if (action || editMode) {
            const label = element.label || action?.label || defaultActionLabel(element.action)
            const actionStyle: CSSProperties = {
              backgroundColor: element.background ? resolveDesignColor(element.background, colors) : 'transparent',
              color: resolveDesignColor(element.color, colors),
              borderRadius: `${(element.radius / width) * 100}cqw`,
              border: `1px solid ${resolveDesignColor(element.background === 'surface' ? 'accent' : 'transparent', colors)}`,
              fontFamily: FONT_FAMILY[element.font],
              fontSize: `${(element.fontSize / width) * 100}cqw`,
              fontWeight: element.weight,
              textAlign: element.align,
            }
            contents = editMode ? (
              <span className="card-design-action" style={actionStyle}>{label}</span>
            ) : (
              <a
                className="card-design-action"
                style={actionStyle}
                href={action?.href}
                data-track={action?.track}
                {...(action?.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {label}
              </a>
            )
          }
        }

        if (contents === null) return null
        const className = `card-design-element element-${element.type}${editMode ? ' is-editable' : ''}${selected ? ' is-selected' : ''}${element.type === 'shape' ? ` is-shape shape-${element.shape ?? 'rect'}` : ''}`
        return (
          <div
            key={element.id}
            className={className}
            style={position}
            data-element-id={element.id}
            role={editMode ? 'button' : undefined}
            tabIndex={editMode ? 0 : undefined}
            aria-label={editMode ? elementLabel(element, values) : undefined}
            aria-pressed={editMode ? selected : undefined}
            onClick={(e) => { if (editMode) { e.stopPropagation(); onSelect?.(element.id) } }}
            onKeyDown={(e) => handleKeyDown(e, element.id)}
            onPointerDown={(e) => startPointer(e, element)}
          >
            {contents}
            {selected && (
              <span
                className="card-design-resize-handle"
                aria-hidden="true"
                onPointerDown={(e) => startPointer(e, element, 'resize')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function fieldLabel(field: CardField): string {
  const labels: Record<CardField, string> = {
    name: 'Your name', company: 'Business name', designation: 'Your role', bio: 'Your introduction', phone: 'Phone number',
    whatsapp: 'WhatsApp number', email: 'Email address', address: 'Your address', website: 'Website',
  }
  return labels[field]
}

function elementLabel(element: CardDesignElement, values: CanvasValues): string {
  if (element.type === 'field' && element.field) return `${fieldLabel(element.field)}: ${fieldValue(element.field, values) || 'empty'}`
  if (element.type === 'text') {
    const initial = values.name.trim().charAt(0).toUpperCase()
    return `Text: ${element.text === '{{initial}}' ? initial || 'empty' : element.text || 'empty'}`
  }
  if (element.type === 'photo') return 'Profile photo'
  if (element.type === 'shape') return 'Decoration'
  return element.label || defaultActionLabel(element.action ?? 'message')
}
