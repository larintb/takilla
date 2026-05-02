'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function approveApplication(appId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.rpc('approve_organizer', {
    application_id: appId,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin')
}

export async function setUserRole(
  prevState: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (me?.role !== 'admin') return { error: 'No autorizado' }

  const email = (formData.get('email') as string | null)?.trim().toLowerCase()
  const role  = formData.get('role') as string | null

  if (!email) return { error: 'Ingresa un correo' }
  if (!['customer', 'organizer', 'admin'].includes(role ?? '')) return { error: 'Rol inválido' }

  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('email', email)
    .select('email, role')
    .single()

  if (error || !data) return { error: 'Usuario no encontrado o error al actualizar' }

  revalidatePath('/dashboard/admin')
  return { success: `${data.email} ahora es ${data.role}` }
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
