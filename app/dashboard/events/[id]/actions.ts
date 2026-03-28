'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

// Crea un evento vacío en borrador y redirige al [id] para editarlo
export async function createEmptyEvent() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      organizer_id: user.id,
      title:        'Nuevo evento',
      status:       'draft',
      event_date:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single()

  if (error || !event) redirect('/dashboard')

  redirect(`/dashboard/events/${event.id}`)
}

export async function updateEvent(
  eventId: string,
  prevState: { error: string } | null,
  formData: FormData
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: event } = await supabase
    .from('events')
    .select('organizer_id, status')
    .eq('id', eventId)
    .single()

  if (!event) return { error: 'Evento no encontrado' }
  if (event.organizer_id !== user.id) return { error: 'No tienes permiso para editar este evento' }
  if (event.status === 'published') return { error: 'El evento está publicado. Regresa a borrador para editar.' }

  const title       = formData.get('title') as string
  const description = formData.get('description') as string
  const event_date  = formData.get('event_date') as string
  const venue_id    = formData.get('venue_id') as string
  const image_path  = (formData.get('image_path') as string | null)?.trim() || null
  const status      = formData.get('status') as string
  const category    = formData.get('category') as string

  if (!title?.trim()) return { error: 'El título es requerido' }
  if (!event_date)    return { error: 'La fecha es requerida' }

  const updateData: Record<string, unknown> = {
    title:       title.trim(),
    description: description?.trim() || null,
    event_date,
    venue_id:    venue_id || null,
    status:      status || 'draft',
    category:    category || 'otro',
  }

  if (image_path) updateData.image_url = image_path

  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/events/${eventId}`)
  revalidatePath('/dashboard/events')
  return null
}

export async function updateEventStatus(eventId: string, status: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('events').update({ status }).eq('id', eventId)
  revalidatePath(`/dashboard/events/${eventId}`)
  revalidatePath('/dashboard/events')
  redirect(`/dashboard/events/${eventId}`)
}

export async function addTier(
  prevState: { error: string } | null,
  formData: FormData
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const event_id       = formData.get('event_id') as string
  const name           = formData.get('name') as string
  const price          = Number(formData.get('price'))
  const total_capacity = Number(formData.get('total_capacity'))

  if (!name?.trim())              return { error: 'El nombre es requerido' }
  if (isNaN(price) || price < 0)  return { error: 'Precio inválido' }
  if (!total_capacity || total_capacity < 1) return { error: 'Capacidad inválida' }
  if (total_capacity > 999)       return { error: 'La capacidad máxima es 999' }

  const { error } = await supabase.from('ticket_tiers').insert({
    event_id,
    name: name.trim(),
    price,
    total_capacity,
    available_tickets: total_capacity,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/events/${event_id}`)
  return null
}

export async function deleteTier(tierId: string, eventId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  await supabase.from('ticket_tiers').delete().eq('id', tierId)
  revalidatePath(`/dashboard/events/${eventId}`)
}