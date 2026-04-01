'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(
  prevState: { error: string } | null,
  formData: FormData
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.' }
    }
    return { error: error.message }
  }

  const next = formData.get('next') as string | null
  revalidatePath('/', 'layout')
  redirect(next && next.startsWith('/') ? next : '/dashboard')
}

export async function signup(
  prevState: { error: string } | { success: true } | null,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const token = formData.get('cf-turnstile-response') as string | null
  if (!token) return { error: 'Completa la verificación de seguridad.' }

  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  })
  const verifyData = await verifyRes.json()
  if (!verifyData.success) return { error: 'Verificación de seguridad fallida. Intenta de nuevo.' }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
      },
    },
  })

  if (error) return { error: error.message }

  if (data.user?.identities?.length === 0) {
    return { error: 'Ya existe una cuenta con ese correo electrónico.' }
  }

  return { success: true }
}

export async function logout() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
