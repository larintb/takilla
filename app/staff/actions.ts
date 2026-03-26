'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type ValidationResult =
  | { success: true;  message: string; ticket: { eventTitle: string; tierName: string; ownerName: string } }
  | { success: false; message: string }

type TicketEventInfo = { title?: string | null }
type TicketTierInfo = { name?: string | null }
type TicketProfileInfo = { full_name?: string | null }

export async function validateTicket(hash: string): Promise<ValidationResult> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase.rpc('validate_ticket', { hash_input: hash })

  if (error) return { success: false, message: error.message }

  const rpc = data as { success: boolean; message: string; ticket_id?: string }

  if (!rpc.success) return { success: false, message: rpc.message }

  // Fetch ticket details bypassing RLS — the ticket was already authenticated via RPC
  const admin = createAdminClient()
  const { data: ticket } = await admin
    .from('tickets')
    .select('events(title), ticket_tiers(name), profiles(full_name)')
    .eq('id', rpc.ticket_id!)
    .single()

  return {
    success: true,
    message: rpc.message,
    ticket: {
      eventTitle: (ticket?.events as TicketEventInfo | null)?.title ?? '—',
      tierName:   (ticket?.ticket_tiers as TicketTierInfo | null)?.name ?? '—',
      ownerName:  (ticket?.profiles as TicketProfileInfo | null)?.full_name ?? 'Sin nombre',
    },
  }
}
