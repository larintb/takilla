'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function startFreePerksCheckout(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const eventId  = (formData.get('eventId') as string | null)?.trim()
  const perksCsv = (formData.get('perkIds') as string | null)?.trim()

  if (!eventId || !perksCsv) throw new Error('Faltan datos')

  const perkIds = perksCsv.split(',').map(s => s.trim()).filter(Boolean)
  if (perkIds.length === 0) throw new Error('Selecciona al menos un extra')

  // Verify user has a ticket for this event
  const { data: hasTicket } = await supabase
    .from('tickets')
    .select('id')
    .eq('owner_id', user.id)
    .eq('event_id', eventId)
    .limit(1)
    .single()

  if (!hasTicket) throw new Error('Necesitas un boleto para este evento para comprar extras')

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin.rpc('purchase_perks_free', {
    p_user_id:  user.id,
    p_event_id: eventId,
    p_perk_ids: perkIds,
  })

  if (error) throw new Error(error.message)

  redirect('/tickets')
}
