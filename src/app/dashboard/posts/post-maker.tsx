'use client'

import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, PALETTES, TEMPLATES, getTemplate, type Category } from '@/lib/post-templates'
import { POST_SIZES, drawPost, loadPhoto, type PostSizeId } from '@/lib/post-render'
import './posts.css'

export type PostCard = {
  slug: string
  name: string | null
  company: string | null
  phone: string | null
  whatsapp: string | null
  photo_url: string | null
}

export default function PostMaker({ card }: { card: PostCard }) {
  const first = TEMPLATES[0]
  const [category, setCategory] = useState<Category>(first.category)
  const [templateId, setTemplateId] = useState(first.id)
  const [sizeId, setSizeId] = useState<PostSizeId>('square')
  const [headline, setHeadline] = useState(first.headline)
  const [message, setMessage] = useState(first.message)
  const [offer, setOffer] = useState(first.offer)
  const [business, setBusiness] = useState(card.company || card.name || '')
  const [phone, setPhone] = useState(card.phone || card.whatsapp || '')
  const [showPhoto, setShowPhoto] = useState(true)
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null)
  const [photoChecked, setPhotoChecked] = useState(false)
  const [status, setStatus] = useState('')
  const [canShareFiles, setCanShareFiles] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const template = getTemplate(templateId)

  // Load the client's photo once, so it can be drawn in the footer.
  useEffect(() => {
    let alive = true
    loadPhoto(card.photo_url).then((img) => {
      if (!alive) return
      setPhoto(img)
      setPhotoChecked(true)
    })
    return () => {
      alive = false
    }
  }, [card.photo_url])

  useEffect(() => {
    setCanShareFiles(typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function')
  }, [])

  // Draw the picture again whenever anything changes.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { w, h } = POST_SIZES[sizeId]
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawPost(ctx, sizeId, getTemplate(templateId), { headline, message, offer, business, phone }, showPhoto ? photo : null)
  }, [sizeId, templateId, headline, message, offer, business, phone, showPhoto, photo])

  function pick(id: string) {
    const t = getTemplate(id)
    setTemplateId(t.id)
    setHeadline(t.headline)
    setMessage(t.message)
    setOffer(t.offer)
    setStatus('')
  }

  function makeBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const canvas = canvasRef.current
      if (!canvas) return resolve(null)
      try {
        canvas.toBlob((b) => resolve(b), 'image/png')
      } catch {
        resolve(null)
      }
    })
  }

  const fileName = `${card.slug}-${templateId}-${sizeId}.png`

  async function download() {
    const blob = await makeBlob()
    if (!blob) {
      setStatus('Sorry, the picture could not be saved. Try again without your photo (untick "Show my photo").')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    setStatus('Your picture is downloaded. Look in your Downloads or Gallery.')
  }

  async function share() {
    const blob = await makeBlob()
    if (!blob) {
      setStatus('Sorry, the picture could not be shared. Try again without your photo (untick "Show my photo").')
      return
    }
    const file = new File([blob], fileName, { type: 'image/png' })
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: headline })
      } else {
        setStatus('Sharing is not supported here. Please use Download instead.')
      }
    } catch {
      // The person closed the share sheet. Nothing to do.
    }
  }

  const visible = TEMPLATES.filter((t) => t.category === category)

  return (
    <div className="pm">
      <section className="dash-section">
        <h2>1. Choose a design</h2>
        <div className="pm-row" role="group" aria-label="Kind of post">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className="secondary pm-tab" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="pm-templates">
          {visible.map((t) => {
            const p = PALETTES[t.palette]
            return (
              <button
                key={t.id}
                type="button"
                className="pm-template"
                aria-pressed={t.id === templateId}
                onClick={() => pick(t.id)}
              >
                <span className="pm-swatch" style={{ background: `linear-gradient(135deg, ${p.bg1}, ${p.bg2})`, color: p.text }} aria-hidden="true">
                  <span className="pm-dot" style={{ background: p.accent }} />
                </span>
                <span className="pm-template-name">{t.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="dash-section">
        <h2>2. Check the words</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Change anything you like. {template.category === 'offer' && 'For an offer, put your real offer in the big offer box before you share.'}
        </p>
        <div className="pm-fields">
          <label className="pm-field">
            <span>Big offer text (optional)</span>
            <input value={offer} onChange={(e) => setOffer(e.target.value)} maxLength={30} placeholder="For example: FLAT 20% OFF" />
          </label>
          <label className="pm-field">
            <span>Heading</span>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={60} />
          </label>
          <label className="pm-field">
            <span>Message</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={160} rows={3} />
          </label>
          <label className="pm-field">
            <span>Business name</span>
            <input value={business} onChange={(e) => setBusiness(e.target.value)} maxLength={50} />
          </label>
          <label className="pm-field">
            <span>Phone number (optional)</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} inputMode="tel" />
          </label>
          {card.photo_url && (
            <label className="pm-check">
              <input type="checkbox" checked={showPhoto} onChange={(e) => setShowPhoto(e.target.checked)} />
              <span>Show my photo</span>
            </label>
          )}
          {card.photo_url && photoChecked && !photo && (
            <p className="notice">Your photo could not be loaded for the picture, so the post is made without it.</p>
          )}
        </div>
      </section>

      <section className="dash-section">
        <h2>3. Download and share</h2>
        <div className="pm-row" role="group" aria-label="Picture shape">
          {(Object.keys(POST_SIZES) as PostSizeId[]).map((id) => (
            <button key={id} type="button" className="secondary pm-tab" aria-pressed={sizeId === id} onClick={() => setSizeId(id)}>
              {POST_SIZES[id].label}
            </button>
          ))}
        </div>
        <div className="pm-preview">
          <canvas ref={canvasRef} className={`pm-canvas pm-${sizeId}`} role="img" aria-label={`Preview of your post: ${headline}`} />
        </div>
        <div className="pm-row">
          <button type="button" onClick={download}>Download picture</button>
          {canShareFiles && (
            <button type="button" className="secondary" onClick={share}>Share</button>
          )}
        </div>
        <p className="pm-status" role="status" aria-live="polite">{status}</p>
      </section>
    </div>
  )
}
