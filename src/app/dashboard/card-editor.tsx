'use client'

/* eslint-disable @next/next/no-img-element */

import {
  startTransition,
  useActionState,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from 'react'
import CardCanvas, { type CanvasActionLinks, type CanvasValues, type CanvasDragMode } from '@/app/card-canvas'
import {
  CARD_ACTIONS,
  CARD_FIELDS,
  CARD_HEIGHT,
  MAX_CARD_ELEMENTS,
  CARD_TEMPLATES,
  CARD_WIDTH,
  createTemplateDesign,
  defaultActionLabel,
  getCardTemplate,
  isTemplateId,
  safeCardDesign,
  type CardAction,
  type CardDesign,
  type CardDesignElement,
  type CardField,
  type CardShape,
} from '@/lib/card-design'
import { uploadPhoto } from './upload-photo'
import { saveCard } from './actions'
import { initialState } from './state'
import { compressToSquareJpeg } from './image'
import { formatKb } from '@/lib/image-shrink'
import { accentTextColor, DEFAULT_ACCENTS, isHexAccent } from '@/lib/card-accent'

export type EditableCard = {
  id: string
  slug: string
  name: string | null
  designation: string | null
  company: string | null
  bio: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  map_url: string | null
  website: string | null
  social_links: Record<string, string> | null
  theme: string
  accent_color: string | null
  template: string | null
  design_config: unknown
  locked?: boolean
  photo_url: string | null
}

type ProfileValues = CanvasValues & { map_url: string }

type SimpleProfileField = Exclude<keyof ProfileValues, 'social_links' | 'map_url'>

const PROFILE_FIELDS: { id: SimpleProfileField; label: string; type?: string; multiline?: boolean }[] = [
  { id: 'name', label: 'Full name' },
  { id: 'designation', label: 'Job title or role' },
  { id: 'company', label: 'Business name' },
  { id: 'bio', label: 'Short introduction', multiline: true },
  { id: 'phone', label: 'Phone', type: 'tel' },
  { id: 'whatsapp', label: 'WhatsApp', type: 'tel' },
  { id: 'email', label: 'Email', type: 'email' },
  { id: 'address', label: 'Address' },
  { id: 'website', label: 'Website', type: 'url' },
]

const SOCIALS = [
  ['instagram', 'Instagram', 'https://instagram.com/yourname'],
  ['facebook', 'Facebook', 'https://facebook.com/yourpage'],
  ['linkedin', 'LinkedIn', 'https://linkedin.com/in/yourname'],
  ['youtube', 'YouTube', 'https://youtube.com/@yourchannel'],
  ['x', 'X', 'https://x.com/yourname'],
] as const

function initialProfile(card: EditableCard): ProfileValues {
  return {
    name: card.name ?? '',
    designation: card.designation ?? '',
    company: card.company ?? '',
    bio: card.bio ?? '',
    phone: card.phone ?? '',
    whatsapp: card.whatsapp ?? '',
    email: card.email ?? '',
    address: card.address ?? '',
    website: card.website ?? '',
    map_url: card.map_url ?? '',
    social_links: card.social_links ?? {},
  }
}

function makeElement(type: 'text' | 'shape' | 'action' | 'photo' | 'field', id: string, index: number): CardDesignElement {
  const base = {
    id,
    x: 38 + (index % 3) * 16,
    y: 390 + (index % 2) * 24,
    w: 284,
    h: 38,
    fontSize: 18,
    color: 'ink',
    font: 'sans' as const,
    weight: 600,
    align: 'left' as const,
    background: null,
    radius: 0,
  }
  if (type === 'text') return { ...base, type, text: 'Your text' }
  if (type === 'shape') return { ...base, type, y: 370, w: 120, h: 8, background: 'accent', shape: 'rect' }
  if (type === 'action') return { ...base, type, y: 470, h: 46, fontSize: 14, color: 'onAccent', background: 'accent', radius: 14, weight: 700, align: 'center', action: 'website' }
  if (type === 'photo') return { ...base, type, x: 24, y: 28, w: 92, h: 92, color: 'accent', background: 'surface', radius: 50, align: 'center' }
  return { ...base, type, field: 'name' }
}

function editorActionLinks(): CanvasActionLinks {
  const links: CanvasActionLinks = {
    call: { href: '#preview', label: 'Call' },
    whatsapp: { href: '#preview', label: 'WhatsApp' },
    email: { href: '#preview', label: 'Email' },
    directions: { href: '#preview', label: 'Directions' },
    website: { href: '#preview', label: 'Website' },
    message: { href: '#preview', label: 'Send a message' },
    vcard: { href: '#preview', label: 'Save to contacts' },
    site: { href: '#preview', label: 'Our website' },
    social_instagram: { href: '#preview', label: 'Instagram' },
    social_facebook: { href: '#preview', label: 'Facebook' },
    social_linkedin: { href: '#preview', label: 'LinkedIn' },
    social_youtube: { href: '#preview', label: 'YouTube' },
    social_x: { href: '#preview', label: 'X' },
  }
  return links
}

function templateActions(): CanvasActionLinks {
  return editorActionLinks()
}

export default function CardEditor({ card }: { card: EditableCard; ownerId: string }) {
  const [state, formAction, pending] = useActionState(saveCard, initialState)
  const [profile, setProfile] = useState(() => initialProfile(card))
  const [photo, setPhoto] = useState(card.photo_url ?? '')
  const [photoMsg, setPhotoMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [templateId, setTemplateId] = useState(() => isTemplateId(card.template) ? card.template : 'signature')
  const [design, setDesign] = useState<CardDesign>(() => safeCardDesign(card.template, card.design_config))
  const [theme, setTheme] = useState(card.theme || getCardTemplate(card.template).theme)
  const [accentColor, setAccentColor] = useState(() => {
    const stored = card.accent_color ?? ''
    return isHexAccent(stored) ? stored : DEFAULT_ACCENTS[card.theme as keyof typeof DEFAULT_ACCENTS] ?? getCardTemplate(card.template).accent
  })
  const [mode, setMode] = useState<'gallery' | 'editor'>(() => card.locked || isTemplateId(card.template) ? 'editor' : 'gallery')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const drag = useRef<{
    id: string; mode: CanvasDragMode; startX: number; startY: number; startW: number; startH: number; startClientX: number; startClientY: number; viewportW: number; viewportH: number
  } | null>(null)
  const locked = Boolean(card.locked)
  const selected = design.elements.find((item) => item.id === selectedId) ?? null
  const selectedFillColor = selected && selected.background?.startsWith('#') ? selected.background : '#ffffff'
  const editorInk = theme === 'dark' ? '#f0f4f6' : theme === 'teal' ? '#162b2a' : theme === 'orion' ? '#172b3a' : '#10202e'
  const editorMuted = theme === 'dark' ? '#b4c0ca' : theme === 'teal' ? '#526a68' : theme === 'orion' ? '#566d7d' : '#4f6170'
  const editorColorTokens: Record<string, string> = {
    accent: accentColor, onAccent: accentTextColor(accentColor), ink: editorInk, muted: editorMuted, surface: design.background, transparent: '#ffffff',
  }
  const selectedTextColor = selected
    ? selected.color.startsWith('#')
      ? selected.color
      : editorColorTokens[selected.color] ?? accentTextColor(accentColor)
    : '#ffffff'
  const template = getCardTemplate(templateId)

  const err = (key: string) => state.errors[key] ? <p className="dash-error" id={`err-${key}`} role="alert">{state.errors[key]}</p> : null

  function chooseTemplate(id: string) {
    const next = getCardTemplate(id)
    setTemplateId(next.id)
    setDesign(createTemplateDesign(next.id))
    setTheme(next.theme)
    setAccentColor(next.accent)
    setSelectedId(null)
    setMode('editor')
  }

  function updateProfile(key: keyof ProfileValues, value: string) {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  function updateSocial(key: string, value: string) {
    setProfile((current) => ({ ...current, social_links: { ...current.social_links, [key]: value } }))
  }

  function updateElement(patch: Partial<CardDesignElement>) {
    if (locked || !selectedId) return
    setDesign((current) => ({
      ...current,
      elements: current.elements.map((item) => item.id === selectedId ? { ...item, ...patch } : item),
    }))
  }

  function addElement(type: 'text' | 'shape' | 'action' | 'photo' | 'field') {
    if (locked || design.elements.length >= MAX_CARD_ELEMENTS) return
    const id = `${type}-${Date.now().toString(36)}`
    const next = makeElement(type, id, design.elements.length)
    setDesign((current) => ({ ...current, elements: [...current.elements, next] }))
    setSelectedId(id)
  }

  function removeElement() {
    if (!selectedId || locked) return
    setDesign((current) => ({ ...current, elements: current.elements.filter((item) => item.id !== selectedId) }))
    setSelectedId(null)
  }

  function onElementPointerDown(element: CardDesignElement, pointerMode: CanvasDragMode, x: number, y: number, width: number, height: number) {
    if (locked) return
    setSelectedId(element.id)
    drag.current = {
      id: element.id, mode: pointerMode, startX: element.x, startY: element.y, startW: element.w, startH: element.h,
      startClientX: x, startClientY: y, viewportW: width, viewportH: height,
    }
  }

  function onPointerMove(x: number, y: number) {
    const active = drag.current
    if (!active) return
    const dx = Math.round((x - active.startClientX) * (CARD_WIDTH / active.viewportW))
    const dy = Math.round((y - active.startClientY) * (CARD_HEIGHT / active.viewportH))
    setDesign((current) => ({
      ...current,
      elements: current.elements.map((item) => {
        if (item.id !== active.id) return item
        if (active.mode === 'move') {
          return {
            ...item,
            x: Math.max(0, Math.min(CARD_WIDTH - item.w, active.startX + dx)),
            y: Math.max(0, Math.min(CARD_HEIGHT - item.h, active.startY + dy)),
          }
        }
        return {
          ...item,
          w: Math.max(Math.min(24, CARD_WIDTH - active.startX), Math.min(CARD_WIDTH - active.startX, active.startW + dx)),
          h: Math.max(Math.min(16, CARD_HEIGHT - active.startY), Math.min(CARD_HEIGHT - active.startY, active.startH + dy)),
        }
      }),
    }))
  }

  function finishPointer() { drag.current = null }

  async function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setPhotoMsg('')
    try {
      const blob = await compressToSquareJpeg(file)
      const url = await uploadPhoto('profile', card.id, blob)
      setPhoto(`${url}?v=${Date.now()}`)
      setPhotoMsg(`Photo ready: ${formatKb(file.size)} reduced to ${formatKb(blob.size)}. Save to publish it.`)
      if (!design.elements.some((element) => element.type === 'photo')) addElement('photo')
    } catch (error) {
      setPhotoMsg(error instanceof Error ? error.message : 'The upload did not work. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    data.set('card_id', card.id)
    data.set('photo_url', photo)
    data.set('name', profile.name)
    data.set('designation', profile.designation)
    data.set('company', profile.company)
    data.set('bio', profile.bio)
    data.set('phone', profile.phone)
    data.set('whatsapp', profile.whatsapp)
    data.set('email', profile.email)
    data.set('address', profile.address)
    data.set('map_url', profile.map_url)
    data.set('website', profile.website)
    for (const [key] of SOCIALS) data.set(`social_${key}`, profile.social_links[key] ?? '')
    data.set('template', templateId)
    data.set('theme', theme)
    data.set('accent_color', accentColor)
    data.set('design_config', JSON.stringify(design))
    startTransition(() => formAction(data))
  }

  const values: CanvasValues = profile
  const galleryValues: CanvasValues = {
    ...values,
    name: values.name || 'Avery Brooks',
    company: values.company || 'Northstar Studio',
    designation: values.designation || 'Founder & Creative Director',
    bio: values.bio || 'Thoughtful design and service, built around the people behind every business.',
    phone: values.phone || '+1 415 555 0132',
    whatsapp: values.whatsapp || '+1 415 555 0132',
    email: values.email || 'hello@northstar.studio',
    address: values.address || 'San Francisco, California',
    website: values.website || 'northstar.studio',
  }
  const actions = editorActionLinks()
  const initial = (profile.name || profile.company || '?').trim().charAt(0).toUpperCase()

  if (mode === 'gallery') {
    return (
      <section className="dash-section card-start-gallery" aria-labelledby="card-designs-title">
        <div className="card-editor-intro">
          <span className="card-editor-eyebrow">YOUR BUSINESS CARD</span>
          <h2 id="card-designs-title">Choose a starting design</h2>
          <p>Pick one professional design, then make it yours. Move, resize, recolor, rewrite, or add pieces on the editing canvas.</p>
        </div>
        {locked && <p className="notice">Your organization manages the card design. You can still update your personal details and photo.</p>}
        <div className="card-template-grid">
          {CARD_TEMPLATES.map((item) => (
            <article key={item.id} className="card-template-tile">
              <div className="card-template-preview" style={{ '--template-accent': item.accent } as CSSProperties}>
                <CardCanvas
                  design={createTemplateDesign(item.id)} values={galleryValues} photoUrl={photo || null}
                  accentColor={item.accent} theme={item.theme} actions={templateActions()}
                />
              </div>
              <div className="card-template-copy">
                <div><h3>{item.name}</h3><p>{item.description}</p></div>
                <button type="button" onClick={() => chooseTemplate(item.id)} disabled={locked}>Use design</button>
              </div>
            </article>
          ))}
        </div>
        {locked && isTemplateId(card.template) && (
          <button type="button" className="secondary" onClick={() => { setMode('editor'); setTemplateId(card.template!); setDesign(safeCardDesign(card.template, card.design_config)) }}>
            Open my card
          </button>
        )}
      </section>
    )
  }

  return (
    <form className="card-editor" onSubmit={onSubmit} noValidate>
      <input type="hidden" name="card_id" value={card.id} />
      <input type="hidden" name="photo_url" value={photo} />
      <input type="hidden" name="template" value={templateId} />
      <input type="hidden" name="theme" value={theme} />
      <input type="hidden" name="accent_color" value={accentColor} />
      <input type="hidden" name="design_config" value={JSON.stringify(design)} />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />

      <div className="card-editor-heading">
        <div>
          <span className="card-editor-eyebrow">YOUR BUSINESS CARD</span>
          <h2>Edit your card</h2>
          <p>Click an item on the card to select it. Drag to move it and pull the blue corner to resize.</p>
        </div>
        <button type="button" className="secondary" onClick={() => setMode('gallery')} disabled={locked}>Change starting design</button>
      </div>
      {locked && <p className="notice">Your organization controls this card’s layout and colors. You can change your details and photo below.</p>}

      <div className="card-editor-workspace">
        <div className="card-editor-canvas-panel">
          <div className="card-editor-canvas-toolbar" aria-label="Add to your card">
            <span>Add to card</span>
            <button type="button" className="secondary" disabled={locked || design.elements.length >= MAX_CARD_ELEMENTS} onClick={() => addElement('text')}>+ Text</button>
            <button type="button" className="secondary" disabled={locked || design.elements.length >= MAX_CARD_ELEMENTS} onClick={() => addElement('shape')}>+ Shape</button>
            <button type="button" className="secondary" disabled={locked || design.elements.length >= MAX_CARD_ELEMENTS} onClick={() => addElement('action')}>+ Contact button</button>
            <button type="button" className="secondary" disabled={locked || design.elements.length >= MAX_CARD_ELEMENTS} onClick={() => addElement('field')}>+ Profile field</button>
            <button type="button" className="secondary" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? 'Uploading…' : photo ? 'Change photo' : 'Upload photo'}</button>
          </div>
          <div className="card-editor-canvas-stage">
            <CardCanvas
              design={design} values={values} photoUrl={photo || null} accentColor={accentColor} theme={theme} actions={actions}
              editMode={!locked} selectedId={selectedId} onSelect={setSelectedId}
              onElementPointerDown={onElementPointerDown} onPointerMove={onPointerMove} onPointerUp={finishPointer}
            />
          </div>
          <p className="card-editor-photo-note" role="status">{photoMsg || (selected ? `Selected: ${selected.type === 'field' ? selected.field : selected.type}` : 'Choose any card piece to edit it.')}</p>
          {err('template')}{err('theme')}{err('accent_color')}{err('design_config')}

          <section className="card-profile-section">
            <div className="card-inspector-title"><div><h3>Your information</h3><p>Update the profile details shown on your card.</p></div></div>
            <div className="card-profile-grid">
              {PROFILE_FIELDS.map((field) => (
                <div key={field.id} className={field.multiline ? 'is-wide' : ''}>
                  <label htmlFor={`card-${field.id}`}>{field.label}</label>
                  {field.multiline ? (
                    <textarea id={`card-${field.id}`} value={profile[field.id]} maxLength={500} rows={3} onChange={(e) => updateProfile(field.id, e.target.value)} />
                  ) : (
                    <input id={`card-${field.id}`} type={field.type ?? 'text'} value={profile[field.id]} maxLength={field.id === 'address' ? 200 : 300} onChange={(e) => updateProfile(field.id, e.target.value)} />
                  )}
                  {err(field.id)}
                </div>
              ))}
              <div className="is-wide">
                <label htmlFor="card-map_url">Map link (optional)</label>
                <input id="card-map_url" type="url" value={profile.map_url} maxLength={400} placeholder="https://maps.app.goo.gl/..." onChange={(e) => updateProfile('map_url', e.target.value)} />
                {err('map_url')}
              </div>
            </div>
            <details className="card-social-fields">
              <summary>Social media links</summary>
              <div className="card-profile-grid">
                {SOCIALS.map(([key, label, example]) => (
                  <div key={key}>
                    <label htmlFor={`card-social-${key}`}>{label}</label>
                    <input id={`card-social-${key}`} type="url" value={profile.social_links[key] ?? ''} maxLength={300} placeholder={example} onChange={(e) => updateSocial(key, e.target.value)} />
                    {err(`social_${key}`)}
                  </div>
                ))}
              </div>
            </details>
          </section>
        </div>

        <aside className="card-editor-inspector" aria-label="Card design controls">
          <div className="card-inspector-title"><div><span className="card-editor-eyebrow">DESIGN CONTROLS</span><h3>{selected ? 'Selected item' : 'Card appearance'}</h3></div></div>
          <fieldset disabled={locked} className="card-color-controls">
            <label htmlFor="card-background">Card background</label>
            <div className="card-color-row"><input id="card-background" type="color" value={design.background} onChange={(e) => setDesign((current) => ({ ...current, background: e.target.value }))} /><span>{design.background}</span></div>
            <label htmlFor="card-accent">Accent color</label>
            <div className="card-color-row"><input id="card-accent" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} /><span>Used by accent-colored items</span></div>
          </fieldset>

          {selected ? (
            <fieldset className="card-element-inspector" disabled={locked}>
              <label className="card-inspector-label">Element type</label>
              <p className="card-element-kind">{selected.type === 'field' ? 'Profile information' : selected.type === 'action' ? 'Contact button' : selected.type === 'photo' ? 'Profile photo' : selected.type === 'shape' ? 'Shape' : 'Text'}</p>

              {selected.type === 'field' && selected.field && (
                <>
                  <label htmlFor="selected-field">Show information</label>
                  <select id="selected-field" value={selected.field} onChange={(e) => updateElement({ field: e.target.value as CardField })}>
                    {CARD_FIELDS.map((field) => <option key={field} value={field}>{PROFILE_FIELDS.find((item) => item.id === field)?.label ?? field}</option>)}
                  </select>
                  <label htmlFor="selected-field-value">Text on card</label>
                  {selected.field === 'bio' ? (
                    <textarea id="selected-field-value" value={profile[selected.field]} maxLength={500} rows={3} onChange={(e) => updateProfile(selected.field!, e.target.value)} />
                  ) : (
                    <input id="selected-field-value" value={profile[selected.field]} maxLength={300} onChange={(e) => updateProfile(selected.field!, e.target.value)} />
                  )}
                </>
              )}

              {selected.type === 'text' && <><label htmlFor="selected-text">Text</label><textarea id="selected-text" value={selected.text === '{{initial}}' ? initial : selected.text ?? ''} maxLength={240} rows={3} onChange={(e) => updateElement({ text: e.target.value })} /></>}

              {selected.type === 'action' && (
                <>
                  <label htmlFor="selected-action">Button destination</label>
                  <select id="selected-action" value={selected.action ?? 'call'} onChange={(e) => updateElement({ action: e.target.value as CardAction })}>
                    {CARD_ACTIONS.map((action) => <option value={action} key={action}>{defaultActionLabel(action)}</option>)}
                  </select>
                  <label htmlFor="selected-action-label">Button label</label>
                  <input id="selected-action-label" value={selected.label ?? ''} placeholder={defaultActionLabel(selected.action ?? 'call')} maxLength={40} onChange={(e) => updateElement({ label: e.target.value })} />
                </>
              )}

              {selected.type === 'shape' && (
                <>
                  <label htmlFor="selected-shape">Shape</label>
                  <select id="selected-shape" value={selected.shape ?? 'rect'} onChange={(e) => updateElement({ shape: e.target.value as CardShape })}>
                    <option value="rect">Rectangle</option><option value="circle">Circle</option><option value="line">Line</option>
                  </select>
                </>
              )}

              {(selected.type === 'field' || selected.type === 'text' || selected.type === 'action') && (
                <>
                  <label htmlFor="selected-font">Font</label>
                  <select id="selected-font" value={selected.font} onChange={(e) => updateElement({ font: e.target.value as CardDesignElement['font'] })}>
                    <option value="sans">Modern sans</option><option value="serif">Elegant serif</option><option value="mono">Monospaced</option>
                  </select>
                  <label htmlFor="selected-weight">Text weight</label>
                  <select id="selected-weight" value={selected.weight} onChange={(e) => updateElement({ weight: Number(e.target.value) as CardDesignElement['weight'] })}>
                    <option value={400}>Regular</option><option value={500}>Medium</option><option value={600}>Semibold</option><option value={700}>Bold</option><option value={800}>Extra bold</option>
                  </select>
                  <label htmlFor="selected-align">Text alignment</label>
                  <select id="selected-align" value={selected.align} onChange={(e) => updateElement({ align: e.target.value as CardDesignElement['align'] })}>
                    <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                  </select>
                </>
              )}

              <label htmlFor="selected-font-size">Size: {selected.fontSize}px</label>
              <input id="selected-font-size" type="range" min={10} max={64} value={selected.fontSize} onChange={(e) => updateElement({ fontSize: Number(e.target.value) })} />
              <label htmlFor="selected-radius">Rounded corners: {selected.radius}px</label>
              <input id="selected-radius" type="range" min={0} max={180} value={selected.radius} onChange={(e) => updateElement({ radius: Number(e.target.value) })} />
              <label htmlFor="selected-color-token">Text or shape color</label>
              <select id="selected-color-token" value={selected.color.startsWith('#') ? 'custom' : selected.color} onChange={(e) => updateElement({ color: e.target.value === 'custom' ? '#ffffff' : e.target.value })}>
                <option value="accent">Accent</option><option value="onAccent">Contrast color</option><option value="ink">Main text</option><option value="muted">Muted text</option><option value="surface">Card background</option><option value="transparent">Transparent</option><option value="custom">Custom color</option>
              </select>
              {selected.color.startsWith('#') && <div className="card-color-row"><input aria-label="Custom text or shape color" type="color" value={selectedTextColor} onChange={(e) => updateElement({ color: e.target.value })} /><span>Custom color</span></div>}
              <label htmlFor="selected-fill">Fill color</label>
              <select id="selected-fill" value={selected.background?.startsWith('#') ? 'custom' : selected.background ?? 'none'} onChange={(e) => updateElement({ background: e.target.value === 'none' ? null : e.target.value === 'custom' ? '#ffffff' : e.target.value })}>
                <option value="none">No fill</option><option value="accent">Accent</option><option value="surface">Card background</option><option value="transparent">Transparent</option><option value="#ffffff">White</option><option value="#172635">Dark ink</option><option value="custom">Custom color</option>
              </select>
              {selected.background?.startsWith('#') && (
                <div className="card-color-row"><input aria-label="Custom fill color" type="color" value={selectedFillColor} onChange={(e) => updateElement({ background: e.target.value })} /><span>Custom fill</span></div>
              )}
              <button type="button" className="card-delete-element" onClick={removeElement}>Remove this item</button>
            </fieldset>
          ) : (
            <p className="card-inspector-help">Select a piece on the card to edit its text, size, font, color, or shape. Use the blue handle to resize it.</p>
          )}
          <div className="card-inspector-footer"><span>{template.name} design</span><span>{design.elements.length} / {MAX_CARD_ELEMENTS} items</span></div>
        </aside>
      </div>

      <section className="card-editor-photo-controls dash-section">
        <div className="card-editor-photo-summary">
          {photo ? <img src={photo} alt="Your profile" width={60} height={60} /> : <span>{initial}</span>}
          <div><h3>Profile photo</h3><p>{photoMsg || 'Add or replace the portrait used by photo items on your card.'}</p></div>
          <div className="dash-row"><button type="button" className="secondary" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? 'Uploading…' : photo ? 'Change photo' : 'Upload photo'}</button>{photo && <button type="button" className="secondary" onClick={() => setPhoto('')}>Remove</button>}</div>
        </div>
        {err('photo')}
      </section>

      <div className="card-editor-save dash-actions">
        <button type="submit" disabled={pending || uploading}>{pending ? 'Saving…' : 'Save and publish card'}</button>
        <p className={state.ok ? 'notice' : state.message ? 'notice dash-error-box' : ''} role="status">{state.message}</p>
      </div>
    </form>
  )
}
