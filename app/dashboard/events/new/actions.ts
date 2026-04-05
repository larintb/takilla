'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function createEvent(
  prevState: { error: string } | null,
  formData: FormData
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, terms_accepted_at, stripe_onboarding_complete')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer') return { error: 'Solo organizadores pueden crear eventos' }
  if (!profile?.terms_accepted_at || !profile?.stripe_onboarding_complete) {
    redirect('/dashboard/onboarding')
  }

  const title       = formData.get('title') as string
  const description = formData.get('description') as string
  const event_date  = formData.get('event_date') as string
  const venue_id    = formData.get('venue_id') as string
  const image_path  = (formData.get('image_path') as string | null)?.trim() || null
  const status      = formData.get('status') as string

  if (!title?.trim()) return { error: 'El título es requerido' }
  if (!event_date)    return { error: 'La fecha es requerida' }

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      organizer_id: user.id,
      title:        title.trim(),
      description:  description?.trim() || null,
      event_date,
      venue_id:     venue_id || null,
      image_url:    image_path,
      status:       status || 'draft',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/events')
  redirect(`/dashboard/events/${event.id}`)
}