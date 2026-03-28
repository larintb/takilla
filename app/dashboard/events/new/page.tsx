import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export default async function NewEventPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer' && profile?.role !== 'admin') redirect('/dashboard')

  // Crear evento vacío en borrador y redirigir al [id]
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