'use client'

import { startTransition, useActionState, useRef, useState } from 'react'
import { uploadPhoto } from '../upload-photo'
import {
  BLOCK_LABELS, LIMITS,
  type AboutContent, type BlockContent, type BlockType, type ContactContent, type FaqContent, type FaqItem,
  type GalleryContent, type ServiceItem, type ServicesContent, type TestimonialItem, type TestimonialsContent,
} from '@/lib/block-schema'
import { saveWebsite } from './actions'
import { initialSiteState } from './state'
import { compressToJpeg } from './image'
import './website.css'

export type EditorBlock = { type: BlockType; visible: boolean; content: BlockContent }

type Field<T> = { key: keyof T & string; label: string; max: number; multiline?: boolean }

function ListEditor<T extends Record<string, string>>(props: {
  items: T[]
  fields: Field<T>[]
  maxItems: number
  blank: T
  itemName: string
  addLabel: string
  onChange: (items: T[]) => void
}) {
  const { items, fields, maxItems, blank, itemName, addLabel, onChange } = props
  return (
    <div className="web-body">
      {items.map((item, n) => (
        <div key={n} className="web-item">
          <div className="web-item-top">
            <strong>{itemName} {n + 1}</strong>
            <button type="button" className="secondary web-small" onClick={() => onChange(items.filter((_, k) => k !== n))}>Remove</button>
          </div>
          {fields.map((f) => (
            <label key={f.key} className="web-field">
              <span>{f.label}</span>
              {f.multiline ? (
                <textarea rows={3} maxLength={f.max} value={item[f.key]} onChange={(e) => onChange(items.map((it, k) => (k === n ? { ...it, [f.key]: e.target.value } : it)))} />
              ) : (
                <input maxLength={f.max} value={item[f.key]} onChange={(e) => onChange(items.map((it, k) => (k === n ? { ...it, [f.key]: e.target.value } : it)))} />
              )}
            </label>
          ))}
        </div>
      ))}
      {items.length < maxItems ? (
        <div><button type="button" className="secondary" onClick={() => onChange([...items, { ...blank }])}>{addLabel}</button></div>
      ) : (
        <p className="web-note">You have reached the limit of {maxItems}.</p>
      )}
    </div>
  )
}

export default function WebsiteEditor({ cardId, initial }: { cardId: string; ownerId: string; initial: EditorBlock[] }) {
  const [state, action, pending] = useActionState(saveWebsite, initialSiteState)
  const [blocks, setBlocks] = useState<EditorBlock[]>(initial)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const setContent = (i: number, content: BlockContent) => setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, content } : b)))
  const setVisible = (i: number, visible: boolean) => setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, visible } : b)))
  const move = (i: number, d: -1 | 1) =>
    setBlocks((bs) => {
      const j = i + d
      if (j < 0 || j >= bs.length) return bs
      const copy = [...bs]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('payload', JSON.stringify({ cardId, blocks: blocks.map((b) => ({ type: b.type, visible: b.visible, content: b.content })) }))
    startTransition(() => action(fd))
  }

  async function addPhotos(files: FileList | null) {
    const gi = blocks.findIndex((b) => b.type === 'gallery')
    if (!files || files.length === 0 || gi < 0) return
    const images = [...(blocks[gi].content as GalleryContent).images]
    setUploading(true)
    setUploadMsg('')
    try {
      for (const file of Array.from(files)) {
        if (images.length >= LIMITS.galleryImages) {
          setUploadMsg(`You can add up to ${LIMITS.galleryImages} photos.`)
          break
        }
        const blob = await compressToJpeg(file)
        const url = await uploadPhoto('gallery', cardId, blob)
        images.push({ url, caption: '' })
        setUploadMsg('Photos added. Press Save to publish them.')
      }
      setContent(gi, { images })
    } catch (error) {
      setContent(gi, { images })
      setUploadMsg(error instanceof Error ? error.message : 'The upload did not work. Please try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function body(b: EditorBlock, i: number) {
    switch (b.type) {
      case 'about': {
        const c = b.content as AboutContent
        return (
          <div className="web-body">
            <label className="web-field"><span>Heading (optional)</span>
              <input maxLength={LIMITS.aboutTitle} value={c.title} placeholder="About us" onChange={(e) => setContent(i, { ...c, title: e.target.value })} />
            </label>
            <label className="web-field"><span>Your story</span>
              <textarea rows={6} maxLength={LIMITS.aboutText} value={c.text} onChange={(e) => setContent(i, { ...c, text: e.target.value })} />
            </label>
            <p className="web-note">Up to {LIMITS.aboutText} characters. Leave an empty line between paragraphs.</p>
          </div>
        )
      }
      case 'services': {
        const c = b.content as ServicesContent
        return (
          <ListEditor<ServiceItem>
            items={c.items} maxItems={LIMITS.services} itemName="Service" addLabel="Add a service"
            blank={{ name: '', description: '', price: '' }}
            fields={[
              { key: 'name', label: 'Name', max: LIMITS.serviceName },
              { key: 'description', label: 'Short description (optional)', max: LIMITS.serviceDesc, multiline: true },
              { key: 'price', label: 'Price (optional), for example ₹5,000 or From ₹999', max: LIMITS.servicePrice },
            ]}
            onChange={(items) => setContent(i, { items })}
          />
        )
      }
      case 'gallery': {
        const c = b.content as GalleryContent
        return (
          <div className="web-body">
            {c.images.length > 0 && (
              <div className="web-thumbs">
                {c.images.map((img, n) => (
                  <div key={img.url} className="web-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.caption || `Photo ${n + 1}`} />
                    <input aria-label={`Caption for photo ${n + 1}`} placeholder="Caption (optional)" maxLength={LIMITS.caption} value={img.caption}
                      onChange={(e) => setContent(i, { images: c.images.map((x, k) => (k === n ? { ...x, caption: e.target.value } : x)) })} />
                    <button type="button" className="secondary web-small" onClick={() => setContent(i, { images: c.images.filter((_, k) => k !== n) })}>Remove</button>
                  </div>
                ))}
              </div>
            )}
            <div>
              <button type="button" className="secondary" disabled={uploading || c.images.length >= LIMITS.galleryImages} onClick={() => fileRef.current?.click()}>
                {uploading ? 'Uploading…' : 'Add photos'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
            </div>
            <p className="web-note" role="status">{uploadMsg || `Up to ${LIMITS.galleryImages} photos. They are shrunk automatically.`}</p>
          </div>
        )
      }
      case 'testimonials': {
        const c = b.content as TestimonialsContent
        return (
          <ListEditor<TestimonialItem>
            items={c.items} maxItems={LIMITS.testimonials} itemName="Review" addLabel="Add a review"
            blank={{ quote: '', author: '', role: '' }}
            fields={[
              { key: 'quote', label: 'What the customer said', max: LIMITS.quote, multiline: true },
              { key: 'author', label: 'Customer name (optional)', max: LIMITS.author },
              { key: 'role', label: 'Customer role or place (optional)', max: LIMITS.role },
            ]}
            onChange={(items) => setContent(i, { items })}
          />
        )
      }
      case 'faq': {
        const c = b.content as FaqContent
        return (
          <ListEditor<FaqItem>
            items={c.items} maxItems={LIMITS.faq} itemName="Question" addLabel="Add a question"
            blank={{ question: '', answer: '' }}
            fields={[
              { key: 'question', label: 'Question', max: LIMITS.question },
              { key: 'answer', label: 'Answer', max: LIMITS.answer, multiline: true },
            ]}
            onChange={(items) => setContent(i, { items })}
          />
        )
      }
      case 'contact_map': {
        const c = b.content as ContactContent
        return (
          <div className="web-body">
            <label className="web-field"><span>Short note (optional), for example opening hours</span>
              <textarea rows={3} maxLength={LIMITS.contactNote} value={c.note} onChange={(e) => setContent(i, { note: e.target.value })} />
            </label>
            <p className="web-note">Your address, phone, WhatsApp, email and map link come from your card details. This section also shows the &quot;Send me a message&quot; form.</p>
          </div>
        )
      }
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {blocks.map((b, i) => (
        <section key={b.type} className={b.visible ? 'web-block' : 'web-block web-off'}>
          <div className="web-head">
            <h2>{BLOCK_LABELS[b.type]}</h2>
            <div className="web-controls">
              <label className="web-show">
                <input type="checkbox" checked={b.visible} onChange={(e) => setVisible(i, e.target.checked)} />
                Show on my website
              </label>
              <button type="button" className="secondary web-small" disabled={i === 0} aria-label={`Move ${BLOCK_LABELS[b.type]} up`} onClick={() => move(i, -1)}>Up</button>
              <button type="button" className="secondary web-small" disabled={i === blocks.length - 1} aria-label={`Move ${BLOCK_LABELS[b.type]} down`} onClick={() => move(i, 1)}>Down</button>
            </div>
          </div>
          {body(b, i)}
        </section>
      ))}

      <div className="dash-actions">
        <button type="submit" disabled={pending || uploading}>{pending ? 'Saving…' : 'Save my website'}</button>
        {state.message && (
          <p className={state.ok ? 'notice' : 'notice dash-error-box'} role="status" style={{ marginTop: '0.75rem' }}>{state.message}</p>
        )}
      </div>
    </form>
  )
}
