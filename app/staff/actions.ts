'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type ValidationResult =
  | { success: true;  kind: 'ticket'; message: string; ticket: { eventTitle: string; tierName: string; ownerName: string; items: string[] } }
  | { success: true;  kind: 'perk';   message: string; perk:   { eventTitle: string; perkName: string; ownerName: string } }
  | { success: false; message: string }

type TicketEventInfo   = { title?: string | null }
type TicketTierInfo    = { name?: string | null; items?: string | null }
type TicketProfileInfo = { full_name?: string | null }
type PerkInfo          = { name?: string | null }

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

  // Admins pass null so the RPC skips the event filter (same behavior as before)
  const rpcAllowedIds = role === 'admin' ? null : allowedEventIds

  // ── Try ticket first ──────────────────────────────────────────────────────
  const { data: ticketData, error: ticketError } = await supabase.rpc('validate_ticket', {
    hash_input: hash,
    allowed_event_ids: rpcAllowedIds,
  })
  if (ticketError) return { success: false, message: ticketError.message }

  const ticketRpc = ticketData as { success: boolean; message: string; ticket_id?: string }

  if (ticketRpc.success) {
    const { data: ticket } = await admin
      .from('tickets')
      .select('event_id, events(title), ticket_tiers(name, items), profiles(full_name)')
      .eq('id', ticketRpc.ticket_id!)
      .single()

    const tierInfo = ticket?.ticket_tiers as TicketTierInfo | null
    const rawItems = tierInfo?.items ?? ''
    const items    = rawItems ? rawItems.split('\n').map(s => s.trim()).filter(Boolean) : []

    return {
      success: true,
      kind: 'ticket',
      message: ticketRpc.message,
      ticket: {
        eventTitle: (ticket?.events as TicketEventInfo | null)?.title ?? '—',
        tierName:   tierInfo?.name ?? '—',
        ownerName:  (ticket?.profiles as TicketProfileInfo | null)?.full_name ?? 'Sin nombre',
        items,
      },
    }
  }

  // If the ticket RPC returned an event-isolation error, stop here (don't try perks with same hash)
  if (ticketRpc.message !== 'Boleto no encontrado') {
    return { success: false, message: ticketRpc.message }
  }

  // ── Fallback: try perk ────────────────────────────────────────────────────
  const { data: perkData, error: perkError } = await supabase.rpc('validate_perk', {
    hash_input: hash,
    allowed_event_ids: rpcAllowedIds,
  })
  if (perkError) return { success: false, message: perkError.message }

  const perkRpc = perkData as { success: boolean; message: string; perk_purchase_id?: string; perk_id?: string; event_id?: string }

  if (!perkRpc.success) {
    // If it's a "not found" in perks too, give a combined message
    if (perkRpc.message === 'Perk no encontrado') {
      return { success: false, message: 'QR no encontrado' }
    }
    return { success: false, message: perkRpc.message }
  }

  // Fetch perk name, event title, owner name
  const { data: purchase } = await admin
    .from('perk_purchases')
    .select('event_id, perks(name), profiles(full_name), events(title)')
    .eq('id', perkRpc.perk_purchase_id!)
    .single()

  return {
    success: true,
    kind: 'perk',
    message: perkRpc.message,
    perk: {
      eventTitle: (purchase?.events as TicketEventInfo | null)?.title ?? '—',
      perkName:   (purchase?.perks as PerkInfo | null)?.name ?? '—',
      ownerName:  (purchase?.profiles as TicketProfileInfo | null)?.full_name ?? 'Sin nombre',
    },
  }
}
