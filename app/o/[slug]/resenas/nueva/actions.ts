'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function submitReview(formData: FormData): Promise<{ error?: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const organizerId   = formData.get('organizer_id') as string
  const eventId       = formData.get('event_id')     as string
  const ticketId      = formData.get('ticket_id')    as string
  const ratingStr     = formData.get('rating')       as string
  const comment       = (formData.get('comment') as string)?.trim()
  const photoPath     = (formData.get('photo_url') as string)?.trim() || null
  const showTicket    = formData.get('show_ticket') === 'true'
  const tierName      = (formData.get('tier_name') as string)?.trim() || null
  const tierEffect    = (formData.get('tier_effect') as string)?.trim() || null
  const displayName   = (formData.get('display_name') as string)?.trim() || 'Usuario'
  const organizerSlug = formData.get('organizer_slug') as string

  const rating = parseInt(ratingStr, 10)
  if (!rating || rating < 1 || rating > 5) return { error: 'Calificación inválida.' }
  if (!comment || comment.length < 10)     return { error: 'El comentario debe tener al menos 10 caracteres.' }

  if (ticketId) {
    // Paid-ticket path: verify ticket is scanned and belongs to user
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, is_used, event_id, owner_id')
      .eq('id', ticketId)
      .eq('owner_id', user.id)
      .single()

    if (!ticket || !ticket.is_used || ticket.event_id !== eventId) {
      return { error: 'Boleto inválido o no escaneado.' }
    }
  } else {
    // Walk-in path: event must belong to organizer and have a free tier
    const { data: freeTier } = await supabase
      .from('ticket_tiers')
      .select('id')
      .eq('event_id', eventId)
      .eq('price', 0)
      .limit(1)
      .single()

    const { data: ev } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single()

    if (!freeTier || !ev || ev.organizer_id !== organizerId) {
      return { error: 'Evento no elegible para reseña sin boleto.' }
    }
  }

  const { error } = await supabase.from('reviews').insert({
    organizer_id:          organizerId,
    event_id:              eventId,
    reviewer_id:           user.id,
    ticket_id:             ticketId || null,
    reviewer_display_name: displayName,
    rating,
    comment,
    photo_url:             photoPath,
    show_ticket:           showTicket,
    tier_name:             showTicket ? tierName : null,
    tier_effect:           showTicket ? tierEffect : null,
  })

  if (error?.code === '23505') return { error: 'Ya dejaste una reseña para este evento.' }
  if (error) return { error: 'Error al guardar la reseña.' }

  revalidatePath(`/o/${organizerSlug}`)
  return {}
}

export async function updateReview(
  reviewId: string,
  rating: number,
  comment: string,
  showTicket: boolean
): Promise<{ error?: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  if (rating < 1 || rating > 5) return { error: 'Calificación inválida.' }
  if (!comment || comment.trim().length < 10) return { error: 'El comentario es demasiado corto.' }

  const { data: existing } = await supabase
    .from('reviews')
    .select('id, tier_name, tier_effect, reviewer_id')
    .eq('id', reviewId)
    .single()

  if (!existing || existing.reviewer_id !== user.id) return { error: 'No autorizado.' }

  const { error } = await supabase
    .from('reviews')
    .update({
      rating,
      comment: comment.trim(),
      show_ticket: showTicket,
      tier_name:   showTicket ? existing.tier_name : null,
      tier_effect: showTicket ? existing.tier_effect : null,
    })
    .eq('id', reviewId)

  if (error) return { error: 'Error al actualizar.' }
  return {}
}

export async function deleteReview(reviewId: string): Promise<{ error?: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('reviewer_id', user.id)

  if (error) return { error: 'Error al eliminar.' }
  return {}
}
