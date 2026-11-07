'use client'

import { startTransition, useActionState, useRef, useState } from 'react'
import { uploadPhoto } from './upload-photo'
import { saveCard } from './actions'
import { initialState } from './state'
import { THEMES } from './themes'
import { compressToSquareJpeg } from './image'
import { formatKb } from '@/lib/image-shrink'
import { DEFAULT_ACCENTS, isHexAccent } from '@/lib/card-accent'

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
  const fileRef = useRef<HTMLInputElement>(null)

  const err = (key: string) =>
    state.errors[key] ? (
      <p className="dash-error" id={`err-${key}`} role="alert">
        {state.errors[key]}
      </p>
    ) : null

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(() => formAction(data))
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
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

  const initial = (card.name || card.company || '?').trim().charAt(0).toUpperCase()
  const field = (key: keyof EditableCard) => (card[key] as string | null) ?? ''

  return (
    <form onSubmit={onSubmit} noValidate>
      <input type="hidden" name="card_id" value={card.id} />
      <input type="hidden" name="photo_url" value={photo} />

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
    </form>
  )
}
