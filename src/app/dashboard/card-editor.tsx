'use client'

import {
  startTransition,
  useActionState,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from 'react'
import { uploadPhoto } from './upload-photo'
import { saveCard } from './actions'
import { initialState } from './state'
import { THEMES } from './themes'
import { compressToSquareJpeg } from './image'
import { formatKb } from '@/lib/image-shrink'
import { accentTextColor, DEFAULT_ACCENTS, isHexAccent } from '@/lib/card-accent'

export type EditableCard = {
  id: string
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
  locked?: boolean // true when the card belongs to an organization: the organization chooses the palette
  photo_url: string | null
}

type PreviewFields = {
  name: string
  designation: string
  company: string
  bio: string
  phone: string
  whatsapp: string
  email: string
  address: string
  website: string
  social_links: Record<string, string>
}

const PREVIEW_FIELDS = ['name', 'designation', 'company', 'bio', 'phone', 'whatsapp', 'email', 'address', 'website'] as const
type PreviewTextField = typeof PREVIEW_FIELDS[number]

const SOCIALS: [string, string, string][] = [
  ['instagram', 'Instagram', 'https://instagram.com/yourname'],
  ['facebook', 'Facebook', 'https://facebook.com/yourpage'],
  ['linkedin', 'LinkedIn', 'https://linkedin.com/in/yourname'],
  ['youtube', 'YouTube', 'https://youtube.com/@yourchannel'],
  ['x', 'X', 'https://x.com/yourname'],
]

export default function CardEditor({ card }: { card: EditableCard; ownerId: string }) {
  const [state, formAction, pending] = useActionState(saveCard, initialState)
  const [photo, setPhoto] = useState(card.photo_url ?? '')
  const [photoMsg, setPhotoMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const initialTheme = THEMES.some((t) => t.id === card.theme) ? card.theme : 'light'
  const storedAccent = card.accent_color ?? ''
  const [theme, setTheme] = useState(initialTheme)
  const [accentColor, setAccentColor] = useState(isHexAccent(storedAccent) ? storedAccent : DEFAULT_ACCENTS[initialTheme])
  const [preview, setPreview] = useState<PreviewFields>({
    name: card.name ?? '',
    designation: card.designation ?? '',
    company: card.company ?? '',
    bio: card.bio ?? '',
    phone: card.phone ?? '',
    whatsapp: card.whatsapp ?? '',
    email: card.email ?? '',
    address: card.address ?? '',
    website: card.website ?? '',
    social_links: card.social_links ?? {},
  })
  const fileRef = useRef<HTMLInputElement>(null)

  const err = (key: string) =>
    state.errors[key] ? (
      <p className="dash-error" id={`err-${key}`} role="alert">
        {state.errors[key]}
      </p>
    ) : null

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(() => formAction(data))
  }

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
      setPhotoMsg(`Photo ready: shrunk from ${formatKb(file.size)} to ${formatKb(blob.size)}. Press Save to publish it.`)
    } catch (error) {
      setPhotoMsg(error instanceof Error ? error.message : 'The upload did not work. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function updatePreview(e: ChangeEvent<HTMLFormElement>) {
    const target = e.target
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return
    if (target.name.startsWith('social_')) {
      const key = target.name.slice('social_'.length)
      setPreview((current) => ({ ...current, social_links: { ...current.social_links, [key]: target.value } }))
      return
    }
    if ((PREVIEW_FIELDS as readonly string[]).includes(target.name)) {
      const key = target.name as PreviewTextField
      setPreview((current) => ({ ...current, [key]: target.value }))
    }
  }

  const initial = (preview.name || preview.company || '?').trim().charAt(0).toUpperCase()
  const field = (key: keyof EditableCard) => (card[key] as string | null) ?? ''
  const companyMark = preview.company.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || initial
  const previewPalette = theme === 'dark'
    ? { surface: '#152532', ink: '#e8eef2', muted: '#a3b3bf', line: '#304452', deep: '#0a1824' }
    : theme === 'teal'
      ? { surface: '#ffffff', ink: '#162b2a', muted: '#526a68', line: '#d3e2df', deep: '#064a42' }
      : theme === 'orion'
        ? { surface: '#ffffff', ink: '#172b3a', muted: '#566d7d', line: '#d6e1e8', deep: '#0d3d61' }
        : { surface: '#ffffff', ink: '#10202e', muted: '#4f6170', line: '#d8e0e6', deep: '#12314a' }
  const previewStyle = {
    '--dash-preview-surface': previewPalette.surface,
    '--dash-preview-ink': previewPalette.ink,
    '--dash-preview-muted': previewPalette.muted,
    '--dash-preview-line': previewPalette.line,
    '--dash-preview-accent': accentColor,
    '--dash-preview-accent-ink': accentTextColor(accentColor),
    '--dash-preview-deep': previewPalette.deep,
  } as CSSProperties & Record<string, string>

  return (
    <form onSubmit={onSubmit} onChange={updatePreview} noValidate>
      <input type="hidden" name="card_id" value={card.id} />
      <input type="hidden" name="photo_url" value={photo} />

      <div className="dash-editor-layout">
        <div className="dash-editor-fields">
          <section className="dash-section dash-editor-intro">
            <h2>Edit your card</h2>
            <p className="muted">Personalize the single card design. The preview updates as you edit; save to publish your changes.</p>
          </section>

          <section className="dash-section">
            <h2>Photo</h2>
            <div className="dash-photo">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="dash-photo-img" src={photo} alt="Your photo" width={88} height={88} />
              ) : (
                <div className="dash-photo-img" aria-hidden="true">{initial}</div>
              )}
              <div>
                <div className="dash-row">
                  <button type="button" className="secondary" disabled={uploading} onClick={() => fileRef.current?.click()}>
                    {uploading ? 'Uploading…' : photo ? 'Change photo' : 'Choose photo'}
                  </button>
                  {photo && (
                    <button type="button" className="secondary" onClick={() => { setPhoto(''); setPhotoMsg('Photo removed. Press Save to confirm.') }}>
                      Remove
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
                <p className="muted" role="status" style={{ margin: '0.5rem 0 0' }}>
                  {photoMsg || 'A clear portrait or logo works best. It will be cropped to fit the wide card header.'}
                </p>
                {err('photo')}
              </div>
            </div>
          </section>

          <section className="dash-section">
            <h2>About you</h2>
            <div className="dash-grid">
              <div>
                <label htmlFor="name">Your name</label>
                <input id="name" name="name" defaultValue={field('name')} maxLength={80} autoComplete="name" aria-describedby="err-name" />
                {err('name')}
              </div>
              <div className="dash-grid two">
                <div>
                  <label htmlFor="designation">Your role</label>
                  <input id="designation" name="designation" defaultValue={field('designation')} maxLength={80} placeholder="Interior Designer" />
                  {err('designation')}
                </div>
                <div>
                  <label htmlFor="company">Business name</label>
                  <input id="company" name="company" defaultValue={field('company')} maxLength={80} />
                  {err('company')}
                </div>
              </div>
              <div>
                <label htmlFor="bio">Short description</label>
                <textarea id="bio" name="bio" defaultValue={field('bio')} maxLength={500} rows={4} />
                <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Up to 500 characters.</p>
                {err('bio')}
              </div>
            </div>
          </section>

          <section className="dash-section">
            <h2>How people can reach you</h2>
            <div className="dash-grid">
              <div className="dash-grid two">
                <div>
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" type="tel" defaultValue={field('phone')} maxLength={30} placeholder="+91 98765 43210" autoComplete="tel" />
                  {err('phone')}
                </div>
                <div>
                  <label htmlFor="whatsapp">WhatsApp number</label>
                  <input id="whatsapp" name="whatsapp" type="tel" defaultValue={field('whatsapp')} maxLength={30} placeholder="+91 98765 43210" />
                  {err('whatsapp')}
                </div>
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" defaultValue={field('email')} maxLength={120} autoComplete="email" />
                {err('email')}
              </div>
              <div>
                <label htmlFor="website">Website</label>
                <input id="website" name="website" defaultValue={field('website')} maxLength={300} placeholder="https://yourbusiness.com" autoCapitalize="none" />
                {err('website')}
              </div>
              <div>
                <label htmlFor="address">Address</label>
                <input id="address" name="address" defaultValue={field('address')} maxLength={200} autoComplete="street-address" />
                {err('address')}
              </div>
              <div>
                <label htmlFor="map_url">Google Maps link (optional)</label>
                <input id="map_url" name="map_url" defaultValue={field('map_url')} maxLength={400} placeholder="https://maps.app.goo.gl/..." autoCapitalize="none" />
                <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>If empty, the Directions button uses your address.</p>
                {err('map_url')}
              </div>
            </div>
          </section>

          <section className="dash-section">
            <h2>Social media</h2>
            <div className="dash-grid">
              {SOCIALS.map(([key, label, example]) => (
                <div key={key}>
                  <label htmlFor={`social_${key}`}>{label}</label>
                  <input id={`social_${key}`} name={`social_${key}`} defaultValue={card.social_links?.[key] ?? ''} maxLength={300} placeholder={example} autoCapitalize="none" />
                  {err(`social_${key}`)}
                </div>
              ))}
            </div>
          </section>

          <section className="dash-section">
            <h2>Card look</h2>
            {card.locked ? (
              <>
                <p className="muted">Your organization manages the card colours. You can personalize your card with your photo, profile, and contact details above.</p>
                <input type="hidden" name="theme" value={theme} />
                <input type="hidden" name="accent_color" value={accentColor} />
              </>
            ) : (
              <>
                <fieldset className="dash-themes">
                  <legend className="muted">Choose a base style</legend>
                  {THEMES.map((t) => (
                    <label key={t.id}>
                      <input type="radio" name="theme" value={t.id} checked={theme === t.id} onChange={() => { setTheme(t.id); setAccentColor(DEFAULT_ACCENTS[t.id]) }} />
                      <span className="dash-dot" style={{ background: t.swatch }} />
                      {t.label}
                    </label>
                  ))}
                </fieldset>
                {err('theme')}
                <div className="dash-accent-picker">
                  <label htmlFor="accent_color">Your card accent</label>
                  <div className="dash-accent-row">
                    <input id="accent_color" name="accent_color" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                    <span className="muted">Choose any brand color. Text contrast adjusts automatically.</span>
                  </div>
                  {err('accent_color')}
                </div>
                <p className="muted" style={{ marginTop: '0.75rem' }}>Your card keeps one clear layout while the colors, photo, and profile details make it yours.</p>
              </>
            )}
          </section>

          <div className="dash-actions">
            <button type="submit" disabled={pending || uploading}>{pending ? 'Saving…' : 'Save changes'}</button>
            <p className={state.ok ? 'notice' : state.message ? 'notice dash-error-box' : ''} role="status" style={{ marginTop: '0.75rem' }}>
              {state.message}
            </p>
          </div>
        </div>

        <aside className="dash-preview-panel" aria-label="Live card preview">
          <div className="dash-preview-heading">
            <div>
              <h2>Live preview</h2>
              <p className="muted">Updates as you type</p>
            </div>
            <span className="dash-preview-status"><span /> Preview</span>
          </div>
          <article className={`dash-preview-card${theme === 'dark' ? ' is-dark' : ''}`} style={previewStyle}>
            <header className="dash-preview-hero">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="dash-preview-photo" src={photo} alt="" />
              ) : (
                <span className="dash-preview-initial">{initial}</span>
              )}
              <div className="dash-preview-shade" />
              <span className="dash-preview-label"><i /> Digital profile</span>
              <span className="dash-preview-wave" />
              <span className="dash-preview-mark">{companyMark}</span>
            </header>
            <div className="dash-preview-body">
              {preview.company && <p className="dash-preview-company">{preview.company}</p>}
              <h3>{preview.name || 'Your name'}</h3>
              <p className="dash-preview-role">{preview.designation || 'Your role'}</p>
              {preview.bio && <p className="dash-preview-bio">{preview.bio}</p>}
              <div className="dash-preview-actions">
                {preview.phone && <span>Call</span>}
                {preview.whatsapp && <span>WhatsApp</span>}
                <span className="is-primary">Send a message</span>
              </div>
              {(preview.phone || preview.whatsapp || preview.email || preview.address) && (
                <div className="dash-preview-contacts">
                  {preview.phone && <p><span>Phone</span><b>{preview.phone}</b></p>}
                  {preview.whatsapp && <p><span>WhatsApp</span><b>{preview.whatsapp}</b></p>}
                  {preview.email && <p><span>Email</span><b>{preview.email}</b></p>}
                  {preview.address && <p><span>Address</span><b>{preview.address}</b></p>}
                </div>
              )}
              {(preview.website || Object.values(preview.social_links).some(Boolean)) && (
                <div className="dash-preview-links">
                  {preview.website && <span>Website</span>}
                  {Object.entries(preview.social_links).filter(([, value]) => value).map(([key]) => (
                    <span key={key}>{key}</span>
                  ))}
                </div>
              )}
            </div>
          </article>
          <p className="dash-preview-note">Your layout stays clean and consistent while the content, photo, and colors are yours to customize.</p>
        </aside>
      </div>
    </form>
  )
}
