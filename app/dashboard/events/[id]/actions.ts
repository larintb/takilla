'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

async function getAuthorizedOrganizer(eventId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: event } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single()

  if (!event) throw new Error('Evento no encontrado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isOwner = event.organizer_id === user.id
  const isAdmin = profile?.role === 'admin'
  if (!isOwner && !isAdmin) throw new Error('No autorizado')

  return { supabase, user }
}

export async function updateEventStatus(eventId: string, status: 'draft' | 'published' | 'cancelled') {
  const { supabase } = await getAuthorizedOrganizer(eventId)

  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', eventId)

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/events/${eventId}`)
}

export async function addTier(
  prevState: { error: string } | null,
  formData: FormData
) {
  const eventId        = formData.get('event_id') as string
  const name           = formData.get('name') as string
  const price          = Number(formData.get('price'))
  const total_capacity = Number(formData.get('total_capacity'))

  if (!name?.trim())              return { error: 'El nombre es requerido' }
  if (isNaN(price) || price < 0) return { error: 'El precio no es válido' }
  if (total_capacity < 1)         return { error: 'La capacidad debe ser mayor a 0' }

  const { supabase } = await getAuthorizedOrganizer(eventId)

  const { error } = await supabase.from('ticket_tiers').insert({
    event_id:          eventId,
    name:              name.trim(),
    price,
    total_capacity,
    available_tickets: total_capacity,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/events/${eventId}`)
  return null
}

export async function deleteTier(tierId: string, eventId: string) {
  const { supabase } = await getAuthorizedOrganizer(eventId)

  const { error } = await supabase
    .from('ticket_tiers')
    .delete()
    .eq('id', tierId)

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/events/${eventId}`)
}
