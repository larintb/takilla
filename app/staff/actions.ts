'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type ValidationResult =
  | { success: true;  message: string; ticket: { eventTitle: string; tierName: string; ownerName: string; items: string[] } }
  | { success: false; message: string }

type TicketEventInfo    = { title?: string | null }
type TicketTierInfo     = { name?: string | null; items?: string | null }
type TicketProfileInfo  = { full_name?: string | null }

export async function validateTicket(hash: string): Promise<ValidationResult> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  if (!role || role === 'user') return { success: false, message: 'No autorizado' }

  // Build the set of event IDs this user is allowed to validate
  let allowedEventIds: string[]

  if (role === 'admin') {
    // Admins can validate any ticket — no restriction
    allowedEventIds = []
  } else if (role === 'organizer') {
    const { data: ownedEvents } = await supabase
      .from('events')
      .select('id')
      .eq('organizer_id', user.id)
      .eq('status', 'published')

    allowedEventIds = (ownedEvents ?? []).map(e => e.id)

    if (!allowedEventIds.length) {
      return { success: false, message: 'No tienes eventos publicados activos' }
    }
  } else {
    // Team member
    const { data: teamEntries } = await supabase
      .from('team_members')
      .select('event_id, events(status)')
      .eq('member_user_id', user.id)

    allowedEventIds = (teamEntries ?? [])
      .filter(e => (e.events as { status?: string } | null)?.status === 'published')
      .map(e => e.event_id)

    if (!allowedEventIds.length) {
      return { success: false, message: 'No tienes eventos asignados activos' }
    }
  }

  // Validate ticket via RPC
  const { data, error } = await supabase.rpc('validate_ticket', { hash_input: hash })
  if (error) return { success: false, message: error.message }

  const rpc = data as { success: boolean; message: string; ticket_id?: string }
  if (!rpc.success) return { success: false, message: rpc.message }

  // Fetch ticket to check event
  const { data: ticket } = await admin
    .from('tickets')
    .select('event_id, events(title), ticket_tiers(name, items), profiles(full_name)')
    .eq('id', rpc.ticket_id!)
    .single()

  // Admins bypass event restriction; everyone else is scoped to their allowed events
  if (role !== 'admin') {
    if (!ticket?.event_id || !allowedEventIds.includes(ticket.event_id)) {
      return { success: false, message: 'Este boleto no pertenece a tu evento asignado' }
    }
  }

  const tierInfo = ticket?.ticket_tiers as TicketTierInfo | null
  const rawItems = tierInfo?.items ?? ''
  const items    = rawItems ? rawItems.split('\n').map(s => s.trim()).filter(Boolean) : []

  return {
    success: true,
    message: rpc.message,
    ticket: {
      eventTitle: (ticket?.events as TicketEventInfo | null)?.title ?? '—',
      tierName:   tierInfo?.name ?? '—',
      ownerName:  (ticket?.profiles as TicketProfileInfo | null)?.full_name ?? 'Sin nombre',
      items,
    },
  }
}