'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function approveApplication(appId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.rpc('approve_organizer', {
    application_id: appId,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin')
}

export async function rejectApplication(appId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Verificar que sea admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('No autorizado')

  await supabase
    .from('organizer_applications')
    .update({ status: 'rejected' })
    .eq('id', appId)

  revalidatePath('/dashboard/admin')
}
