'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, Camera } from 'lucide-react'
import Image from 'next/image'
import StarRating from '@/components/star-rating'
import Toggle from '@/components/toggle'
import TicketCard from '@/components/ticket-card'
import { createClient } from '@/utils/supabase/client'
import { REVIEW_PHOTOS_BUCKET } from '@/utils/supabase/storage'
import { submitReview } from '../actions'

type Ticket = {
  id: string
  event_id: string
  tier_name: string | null
  tier_effect: string | null
  event: { id: string; title: string; event_date: string } | null
}

type FreeEvent = {
  event_id: string
  event_title: string
  event_date: string
}

// Unified item: ticket-based (ticketId set) or walk-in free event (ticketId null)
type Item =
  | { kind: 'ticket'; key: string; eventId: string; ticketId: string; tierName: string | null; tierEffect: string | null; title: string; date: string }
  | { kind: 'free';   key: string; eventId: string; title: string; date: string }

export default function ReviewForm({ organizerId, organizerSlug, displayName, tickets, freeEvents }: {
  organizerId:   string
  organizerSlug: string
  displayName:   string
  tickets:       Ticket[]
  freeEvents:    FreeEvent[]
}) {
  const router = useRouter()

  const items: Item[] = [
    ...tickets.map(t => ({
      kind:       'ticket' as const,
      key:        `ticket:${t.id}`,
      eventId:    t.event_id,
      ticketId:   t.id,
      tierName:   t.tier_name,
      tierEffect: t.tier_effect,
      title:      t.event?.title ?? 'Evento',
      date:       t.event?.event_date ?? '',
    })),
    ...freeEvents.map(e => ({
      kind:    'free' as const,
      key:     `free:${e.event_id}`,
      eventId: e.event_id,
      title:   e.event_title,
      date:    e.event_date,
    })),
  ]

  const [selectedKey, setSelectedKey] = useState(items[0]?.key ?? '')
  const [rating,    setRating]    = useState(0)
  const [comment,   setComment]   = useState('')
  const [showTicket, setShowTicket] = useState(false)
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]   = useState('')
  const [saving, startSave] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const selected = items.find(i => i.key === selectedKey) ?? items[0]

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
  }
  const inputClass = "w-full px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"

  async function handlePhotoFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Solo se aceptan imágenes.'); return }
    setError('')
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No autenticado.'); setUploading(false); return }
    const ext = /^[a-z0-9]+$/.test(file.name.split('.').pop() ?? '') ? file.name.split('.').pop() : 'jpg'
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from(REVIEW_PHOTOS_BUCKET).upload(path, file, { contentType: file.type, upsert: false })
    if (uploadErr) { setError('Error al subir imagen.'); setUploading(false); return }
    setPhotoPath(path)
    setPhotoPreview(URL.createObjectURL(file))
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!rating)               { setError('Elige una calificación de 1 a 5 estrellas.'); return }
    if (comment.trim().length < 10) { setError('El comentario debe tener al menos 10 caracteres.'); return }

    const fd = new FormData()
    fd.set('organizer_id',   organizerId)
    fd.set('organizer_slug', organizerSlug)
    fd.set('event_id',       selected.eventId)
    fd.set('ticket_id',      selected.kind === 'ticket' ? selected.ticketId : '')
    fd.set('rating',         String(rating))
    fd.set('comment',        comment.trim())
    fd.set('display_name',   displayName)
    fd.set('show_ticket',    String(selected.kind === 'ticket' && showTicket))
    fd.set('tier_name',      selected.kind === 'ticket' ? (selected.tierName ?? '') : '')
    fd.set('tier_effect',    selected.kind === 'ticket' ? (selected.tierEffect ?? '') : '')
    if (photoPath) fd.set('photo_url', photoPath)

    startSave(async () => {
      const result = await submitReview(fd)
      if (result.error) { setError(result.error); return }
      router.push(`/o/${organizerSlug}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Event selector (if multiple options) */}
      {items.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
            ¿Para qué evento?
          </label>
          <div className="space-y-2">
            {items.map(item => (
              <label key={item.key} className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
                style={{
                  background: selectedKey === item.key ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedKey === item.key ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                <input type="radio" name="item" value={item.key} checked={selectedKey === item.key}
                  onChange={() => setSelectedKey(item.key)} className="sr-only" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {item.kind === 'ticket' ? item.tierName : 'Entrada libre'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Star rating */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Calificación
        </label>
        <StarRating interactive value={rating} onChange={setRating} size={28} />
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Tu opinión
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Comparte tu experiencia en el evento..."
          rows={4}
          className={`${inputClass} resize-none`}
          style={inputStyle}
          maxLength={2000}
        />
        <p className="text-xs text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {comment.length}/2000
        </p>
      </div>

      {/* Photo upload */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Foto (opcional)
        </label>
        {photoPreview ? (
          <div className="relative rounded-xl overflow-hidden" style={{ maxWidth: 200 }}>
            <Image src={photoPreview} alt="Vista previa" width={200} height={150} className="object-cover w-full" unoptimized />
            <button type="button" onClick={() => { setPhotoPath(null); setPhotoPreview(null) }}
              className="absolute top-2 right-2 rounded-full p-1 bg-black/60 text-white hover:bg-black/80 transition-colors">
              ✕
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-colors hover:bg-white/10"
            style={{ border: '1px dashed rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)' }}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {uploading ? 'Subiendo...' : 'Agregar foto'}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && handlePhotoFile(e.target.files[0])} />
      </div>

      {/* Show ticket toggle (only for ticket-based reviews with a named tier) */}
      {selected?.kind === 'ticket' && selected.tierName && (
        <div className="space-y-3">
          <Toggle
            checked={showTicket}
            onChange={setShowTicket}
            label="Mostrar el boleto que compré en mi reseña"
          />
          {showTicket && (
            <TicketCard
              tierName={selected.tierName}
              tierEffect={selected.tierEffect}
              eventTitle={selected.title}
              eventDate={selected.date}
              compact
            />
          )}
        </div>
      )}

      {error && <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>}

      <button type="submit" disabled={saving || uploading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ background: 'var(--accent-gradient)' }}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        {saving ? 'Publicando...' : 'Publicar reseña'}
      </button>
    </form>
  )
}
