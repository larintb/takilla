'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Pencil, Trash2, X, Check, Loader2 } from 'lucide-react'
import Avatar from '@/components/avatar'
import StarRating from '@/components/star-rating'
import Toggle from '@/components/toggle'
import TicketCard from '@/components/ticket-card'
import { deleteReview, updateReview } from '../resenas/nueva/actions'

type Review = {
  id: string
  rating: number
  comment: string
  photoUrl: string | null
  show_ticket: boolean
  created_at: string
  reviewer_id: string
  reviewer_display_name: string
  tier_name: string | null
  tier_effect: string | null
  isOwn: boolean
  event: { id: string; title: string; event_date: string } | null
}

const BORDER = '1px solid rgba(255,255,255,0.08)'

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)   return 'ahora'
  if (min < 60)  return `hace ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24)   return `hace ${hr} h`
  const days = Math.floor(hr / 24)
  if (days < 30) return `hace ${days} d`
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ReviewRow({ review, onDelete, onUpdate }: {
  review: Review
  onDelete: (id: string) => void
  onUpdate: (id: string, rating: number, comment: string, showTicket: boolean) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editRating, setEditRating] = useState(review.rating)
  const [editComment, setEditComment] = useState(review.comment)
  const [editShowTicket, setEditShowTicket] = useState(review.show_ticket)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, startSave] = useTransition()
  const [deleting, startDelete] = useTransition()

  function handleSave() {
    if (!editComment.trim() || editComment.trim().length < 10) return
    startSave(async () => {
      const result = await updateReview(review.id, editRating, editComment.trim(), editShowTicket)
      if (!result.error) {
        onUpdate(review.id, editRating, editComment.trim(), editShowTicket)
        setEditing(false)
      }
    })
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteReview(review.id)
      if (!result.error) onDelete(review.id)
    })
  }

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
      {/* Author row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={review.reviewer_display_name} size={36} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{review.reviewer_display_name}</p>
            {review.event && (
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{review.event.title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{relativeTime(review.created_at)}</span>
          {review.isOwn && !editing && (
            <>
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <Pencil size={13} />
              </button>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/20" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <Trash2 size={13} />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                    {deleting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <X size={13} />
                  </button>
                </div>
              )}
            </>
          )}
          {editing && (
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <StarRating interactive value={editRating} onChange={setEditRating} size={22} />
          <textarea
            value={editComment}
            onChange={e => setEditComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
          />
          {review.tier_name && (
            <Toggle checked={editShowTicket} onChange={setEditShowTicket} label="Mostrar mi boleto en esta reseña" />
          )}
          <button onClick={handleSave} disabled={saving || editComment.trim().length < 10}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--accent-gradient)' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Guardar
          </button>
        </div>
      ) : (
        <>
          <StarRating value={review.rating} size={16} />
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {review.comment}
          </p>
          {review.photoUrl && (
            <div className="rounded-xl overflow-hidden" style={{ maxWidth: 280 }}>
              <Image src={review.photoUrl} alt="Foto de reseña" width={280} height={200} className="object-cover w-full" unoptimized />
            </div>
          )}
          {review.show_ticket && review.tier_name && review.event && (
            <TicketCard
              tierName={review.tier_name}
              tierEffect={review.tier_effect}
              eventTitle={review.event.title}
              eventDate={review.event.event_date}
              compact
            />
          )}
        </>
      )}
    </div>
  )
}

export default function ReviewsClient({ reviews: initialReviews }: {
  reviews: Review[]
}) {
  const [reviews, setReviews] = useState(initialReviews)

  function handleDelete(id: string) {
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  function handleUpdate(id: string, rating: number, comment: string, showTicket: boolean) {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, rating, comment, show_ticket: showTicket } : r))
  }

  return (
    <div className="space-y-4">
      {reviews.map(r => (
        <ReviewRow key={r.id} review={r} onDelete={handleDelete} onUpdate={handleUpdate} />
      ))}
    </div>
  )
}
