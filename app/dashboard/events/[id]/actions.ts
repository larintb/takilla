'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function createEmptyEvent() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, terms_accepted_at')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer') redirect('/dashboard')
  if (!profile?.terms_accepted_at) redirect('/dashboard/onboarding')

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

  const title         = formData.get('title') as string
  const description   = formData.get('description') as string
  const event_date    = formData.get('event_date') as string
  const event_end_date = formData.get('event_end_date') as string
  const venue_id      = formData.get('venue_id') as string
  const image_path    = (formData.get('image_path') as string | null)?.trim() || null
  const status        = formData.get('status') as string
  const category      = formData.get('category') as string
  const location_name = (formData.get('location_name') as string | null)?.trim() || null
  const location_lat  = formData.get('location_lat') ? Number(formData.get('location_lat')) : null
  const location_lng  = formData.get('location_lng') ? Number(formData.get('location_lng')) : null

  if (!title?.trim()) return { error: 'El título es requerido' }
  if (!event_date)    return { error: 'La fecha es requerida' }

  const updateData: Record<string, unknown> = {
    title:         title.trim(),
    description:   description?.trim() || null,
    event_date,
    event_end_date: event_end_date || null,
    venue_id:      venue_id || null,
    status:        status || 'draft',
    category:      category || 'otro',
    location_name,
    location_lat:  location_lat && !isNaN(location_lat) ? location_lat : null,
    location_lng:  location_lng && !isNaN(location_lng) ? location_lng : null,
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

  if (status === 'published') {
    const { data: tiers } = await supabase
      .from('ticket_tiers')
      .select('price')
      .eq('event_id', eventId)

    const hasPaidTiers = (tiers ?? []).some(t => Number(t.price) > 0)

    if (hasPaidTiers) {
      const { data: ev } = await supabase
        .from('events')
        .select('organizer_id')
        .eq('id', eventId)
        .single()

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_onboarding_complete')
        .eq('id', ev?.organizer_id ?? user.id)
        .single()

      if (!profile?.stripe_onboarding_complete) {
        redirect('/dashboard/onboarding')
      }
    }
  }

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
  const description    = (formData.get('description') as string | null)?.trim() || null
  const items          = (formData.get('items') as string | null)?.trim() || null
  // ✅ Leer el efecto visual del formulario
  const effect         = (formData.get('effect') as string | null) ?? 'none'

  if (!name?.trim())                         return { error: 'El nombre es requerido' }
  if (isNaN(price) || price < 0)             return { error: 'Precio inválido' }
  if (price > 0 && price < 20)               return { error: 'El precio debe ser $0 (gratis) o mínimo $20 MXN' }
  if (!total_capacity || total_capacity < 1) return { error: 'Capacidad inválida' }
  if (total_capacity > 999)                  return { error: 'La capacidad máxima es 999' }

  if (price > 0) {
    const { data: ev } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', event_id)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_onboarding_complete')
      .eq('id', ev?.organizer_id ?? user.id)
      .single()

    if (!profile?.stripe_onboarding_complete) {
      return { error: 'El organizador del evento aún no ha configurado su cuenta de pagos.' }
    }
  }

  const { error } = await supabase.from('ticket_tiers').insert({
    event_id,
    name: name.trim(),
    price,
    total_capacity,
    available_tickets: total_capacity,
    description,
    items,
    effect, // ✅ Guardar efecto en Supabase
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/events/${event_id}`)
  return null
}

export async function updateTierDescription(tierId: string, eventId: string, description: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('ticket_tiers')
    .update({ description: description.trim() || null })
    .eq('id', tierId)

  revalidatePath(`/dashboard/events/${eventId}`)
}

export async function updateTierItems(tierId: string, eventId: string, items: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('ticket_tiers')
    .update({ items: items.trim() || null })
    .eq('id', tierId)

  revalidatePath(`/dashboard/events/${eventId}`)
}

// ✅ Nuevo action para editar el efecto de un tier existente
export async function updateTierEffect(tierId: string, eventId: string, effect: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('ticket_tiers')
    .update({ effect })
    .eq('id', tierId)

  revalidatePath(`/dashboard/events/${eventId}`)
}

export async function deleteTier(tierId: string, eventId: string): Promise<{ error: string } | null> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { count } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('tier_id', tierId)

  if (count && count > 0) {
    return { error: `No se puede eliminar: hay ${count} boleto(s) vendido(s) en este tier.` }
  }

  await supabase.from('ticket_tiers').delete().eq('id', tierId)
  revalidatePath(`/dashboard/events/${eventId}`)
  return null
}

// ── Perks ────────────────────────────────────────────────────────────────────

export async function addPerk(
  prevState: { error: string } | null,
  formData: FormData
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const event_id    = formData.get('event_id') as string
  const name        = formData.get('name') as string
  const price       = Number(formData.get('price'))
  const description = (formData.get('description') as string | null)?.trim() || null
  const image_path  = (formData.get('image_path') as string | null)?.trim() || null

  if (!name?.trim())             return { error: 'El nombre es requerido' }
  if (isNaN(price) || price < 0) return { error: 'Precio inválido' }
  if (price > 0 && price < 20)   return { error: 'El precio debe ser $0 (gratis) o mínimo $20 MXN' }

  if (price > 0) {
    const { data: ev } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', event_id)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_onboarding_complete')
      .eq('id', ev?.organizer_id ?? user.id)
      .single()

    if (!profile?.stripe_onboarding_complete) {
      return { error: 'El organizador del evento aún no ha configurado su cuenta de pagos.' }
    }
  }

  const { error } = await supabase.from('perks').insert({
    event_id,
    name: name.trim(),
    price,
    description,
    ...(image_path ? { image_url: image_path } : {}),
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/events/${event_id}`)
  return null
}

export async function updatePerkDescription(perkId: string, eventId: string, description: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('perks')
    .update({ description: description.trim() || null })
    .eq('id', perkId)

  revalidatePath(`/dashboard/events/${eventId}`)
}

export async function updatePerkPrice(perkId: string, eventId: string, price: number) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('perks')
    .update({ price })
    .eq('id', perkId)

  revalidatePath(`/dashboard/events/${eventId}`)
}

export async function updatePerkImage(perkId: string, eventId: string, imagePath: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('perks')
    .update({ image_url: imagePath })
    .eq('id', perkId)

  revalidatePath(`/dashboard/events/${eventId}`)
}

export async function deletePerk(perkId: string, eventId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  await supabase.from('perks').delete().eq('id', perkId)
  revalidatePath(`/dashboard/events/${eventId}`)
}

// ── Discounts ─────────────────────────────────────────────────────────────────

export async function addDiscount(
  prevState: { error: string } | null,
  formData: FormData
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const event_id    = formData.get('event_id') as string
  const name        = (formData.get('name') as string | null)?.trim()
  const codeRaw     = (formData.get('code') as string | null)?.trim().toUpperCase() || null
  const kind        = formData.get('kind') as string
  const tier_id     = (formData.get('tier_id') as string | null)?.trim() || null
  const max_uses_raw = formData.get('max_uses') as string | null
  const expires_at_raw = formData.get('expires_at') as string | null

  if (!name) return { error: 'El nombre es requerido' }
  if (!['percent', 'fixed', 'bogo'].includes(kind)) return { error: 'Tipo de descuento inválido' }
  if (codeRaw && !/^[A-Z0-9_-]{3,32}$/.test(codeRaw)) {
    return { error: 'El código debe tener entre 3 y 32 caracteres (A-Z, 0-9, _ -)' }
  }

  // Verify ownership
  const { data: ev } = await supabase
    .from('events')
    .select('organizer_id, status')
    .eq('id', event_id)
    .single()
  if (!ev) return { error: 'Evento no encontrado' }
  if (ev.organizer_id !== user.id) return { error: 'No tienes permiso' }
  if (ev.status !== 'draft') return { error: 'El evento debe estar en borrador para agregar descuentos' }

  const insert: Record<string, unknown> = {
    event_id,
    name,
    code: codeRaw,
    kind,
    tier_id,
    max_uses: max_uses_raw ? Number(max_uses_raw) : null,
    expires_at: expires_at_raw || null,
  }

  if (kind === 'percent') {
    const v = Number(formData.get('percent_off'))
    if (isNaN(v) || v < 1 || v > 100) return { error: 'Porcentaje debe ser entre 1 y 100' }
    insert.percent_off = v
  } else if (kind === 'fixed') {
    const v = Number(formData.get('amount_off'))
    if (isNaN(v) || v < 1) return { error: 'Monto debe ser al menos $1' }
    insert.amount_off = v
  } else {
    const buy = Number(formData.get('buy_quantity'))
    const get = Number(formData.get('get_quantity'))
    if (!Number.isInteger(buy) || buy < 1) return { error: 'buy_quantity inválido' }
    if (!Number.isInteger(get) || get < 1) return { error: 'get_quantity inválido' }
    insert.buy_quantity = buy
    insert.get_quantity = get
  }

  const { error } = await supabase.from('discounts').insert(insert)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/events/${event_id}`)
  return null
}

export async function toggleDiscountActive(discountId: string, eventId: string, active: boolean) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  await supabase.from('discounts').update({ is_active: active }).eq('id', discountId)
  revalidatePath(`/dashboard/events/${eventId}`)
}

export async function deleteDiscount(discountId: string, eventId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Only delete if no redemptions
  const { data: d } = await supabase
    .from('discounts')
    .select('used_count')
    .eq('id', discountId)
    .single()
  if (d && d.used_count > 0) return

  await supabase.from('discounts').delete().eq('id', discountId)
  revalidatePath(`/dashboard/events/${eventId}`)
}

// ── Duplicate event ───────────────────────────────────────────────────────────

export async function duplicateEvent(eventId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: event }, { data: tiers }, { data: perks }] = await Promise.all([
    supabase.from('events').select('*').eq('id', eventId).single(),
    supabase.from('ticket_tiers').select('*').eq('event_id', eventId).order('price'),
    supabase.from('perks').select('*').eq('event_id', eventId).order('price'),
  ])

  if (!event) redirect('/dashboard')
  if (event.organizer_id !== user.id) redirect('/dashboard')

  // Default date: same month/day next year
  const originalDate = new Date(event.event_date)
  const nextDate = new Date(originalDate)
  nextDate.setFullYear(nextDate.getFullYear() + 1)

  const { data: newEvent, error } = await supabase
    .from('events')
    .insert({
      organizer_id:  user.id,
      title:         event.title,
      description:   event.description ?? null,
      event_date:    nextDate.toISOString(),
      event_end_date: null,
      status:        'draft',
      image_url:     event.image_url ?? null,
      venue_id:      event.venue_id ?? null,
      category:      event.category ?? null,
      location_name: event.location_name ?? null,
      location_lat:  event.location_lat ?? null,
      location_lng:  event.location_lng ?? null,
    })
    .select('id')
    .single()

  if (error || !newEvent) redirect('/dashboard')

  // Copy tiers — reset availability to full capacity
  if (tiers && tiers.length > 0) {
    await supabase.from('ticket_tiers').insert(
      tiers.map(t => ({
        event_id:          newEvent.id,
        name:              t.name,
        price:             t.price,
        total_capacity:    t.total_capacity,
        available_tickets: t.total_capacity,
        description:       t.description ?? null,
        items:             t.items ?? null,
        effect:            t.effect ?? 'none',
      }))
    )
  }

  // Copy perks
  if (perks && perks.length > 0) {
    await supabase.from('perks').insert(
      perks.map(p => ({
        event_id:    newEvent.id,
        name:        p.name,
        price:       p.price,
        description: p.description ?? null,
        image_url:   p.image_url ?? null,
      }))
    )
  }

  revalidatePath('/dashboard/events')
  redirect(`/dashboard/events/${newEvent.id}`)
}