'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// ── REGISTRO CERRADO — debe coincidir con el flag en page.tsx ─────────────────
const ORGANIZER_REGISTRATION_OPEN = true
// ─────────────────────────────────────────────────────────────────────────────

export async function becomeOrganizer(formData: FormData) {
  if (!ORGANIZER_REGISTRATION_OPEN) {
    throw new Error('El registro de organizadores está cerrado temporalmente.')
  }
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/convertirse-organizador')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'organizer' || profile?.role === 'admin') {
    redirect('/dashboard')
  }

  const tipo = formData.get('tipo') as string

  const { error } = await supabase.rpc('self_become_organizer')
  if (error) throw new Error(error.message)

  // ✅ Invalida el layout para que el navbar refleje el nuevo rol de inmediato
  revalidatePath('/', 'layout')

  if (tipo === 'pago') {
    redirect('/dashboard/onboarding')
  } else {
    redirect('/dashboard')
  }
}