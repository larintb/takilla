'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

type ApplicationState = { error: string; success?: never } | { success: true; error?: never } | null

export async function submitOrganizerApplication(
  prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/aplicar')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'organizer') redirect('/dashboard')
  if (profile?.role === 'admin')     redirect('/dashboard')

  // Verificar si ya tiene una aplicación pendiente/aprobada
  const { data: existing } = await supabase
    .from('organizer_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing?.status === 'approved') redirect('/dashboard')
  if (existing?.status === 'pending') {
    return { error: 'Ya tienes una solicitud pendiente de revisión.' }
  }

  const business_name = (formData.get('business_name') as string | null)?.trim()
  const tax_id        = (formData.get('tax_id') as string | null)?.trim()
  const event_types   = formData.getAll('event_types').map(v => String(v)).filter(Boolean)

  if (!business_name) return { error: 'El nombre o razón social es requerido.' }
  if (!tax_id)        return { error: 'El RFC es requerido.' }

  // event_types se guarda como JSON en el campo description (sin migración extra)
  const description = event_types.length ? event_types.join(', ') : null

  const { error } = await supabase.from('organizer_applications').insert({
    user_id: user.id,
    business_name,
    tax_id,
    ...(description ? { description } : {}),
  })

  if (error) return { error: 'No se pudo enviar la solicitud. Intenta de nuevo.' }

  return { success: true }
}
