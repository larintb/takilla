'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { sendEventReminder, sendTestReminder, type ReminderResult } from '@/utils/email/event-reminder'

export type ReminderState = {
  result?: ReminderResult
  error?: string
  eventId?: string
  testEventId?: string
} | null

export async function sendReminderAction(
  prevState: ReminderState,
  formData: FormData,
): Promise<ReminderState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'No autorizado' }

  const eventId = formData.get('eventId') as string
  if (!eventId) return { error: 'Selecciona un evento' }

  try {
    const result = await sendEventReminder(eventId)
    return { result, eventId }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al enviar correos' }
  }
}

export async function sendTestReminderAction(
  prevState: ReminderState,
  formData: FormData,
): Promise<ReminderState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'No autorizado' }
  if (!profile?.email) return { error: 'Tu perfil no tiene email' }

  const eventId = formData.get('eventId') as string
  if (!eventId) return { error: 'Selecciona un evento' }

  try {
    await sendTestReminder(eventId, profile.email, profile.full_name ?? 'Admin')
    return {
      result: { sent: 1, failed: 0, skipped: 0, eventTitle: 'prueba' },
      testEventId: eventId,
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al enviar prueba' }
  }
}
