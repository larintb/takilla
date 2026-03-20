'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function buyTicket(tierId: string, eventId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/events/${eventId}`)

  // Verify tier exists and has availability
  const { data: tier } = await supabase
    .from('ticket_tiers')
    .select('id, available_tickets, price, event_id')
    .eq('id', tierId)
    .single()

  if (!tier)                       throw new Error('Tier no encontrado')
  if (tier.available_tickets < 1)  throw new Error('No hay boletos disponibles')

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id:      user.id,
      event_id:     eventId,
      total_amount: tier.price,
      status:       'completed',
    })
    .select('id')
    .single()

  if (orderError) throw new Error(orderError.message)

  // Create ticket with a unique QR hash
  const qrHash = crypto.randomUUID()

  const { error: ticketError } = await supabase
    .from('tickets')
    .insert({
      order_id: order.id,
      tier_id:  tierId,
      owner_id: user.id,
      event_id: eventId,
      qr_hash:  qrHash,
    })

  if (ticketError) throw new Error(ticketError.message)

  // Decrement available tickets
  await supabase
    .from('ticket_tiers')
    .update({ available_tickets: tier.available_tickets - 1 })
    .eq('id', tierId)

  revalidatePath(`/events/${eventId}`)
  redirect('/dashboard/tickets')
}
