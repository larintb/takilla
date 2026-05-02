'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { stripe } from '@/utils/stripe/server'

function getBaseUrl(headerStore: Awaited<ReturnType<typeof headers>>) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http'
  return `${protocol}://${host}`
}

export async function acceptTerms() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, terms_accepted_at')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer') redirect('/dashboard')
  if (profile?.terms_accepted_at) redirect('/dashboard/onboarding')

  const { error } = await supabase
    .from('profiles')
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw new Error('No se pudo guardar la aceptación. Intenta de nuevo.')

  redirect('/dashboard/onboarding')
}

export async function startStripeOnboarding() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, terms_accepted_at, stripe_account_id, stripe_onboarding_complete')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer') redirect('/dashboard')
  if (!profile?.terms_accepted_at) redirect('/dashboard/onboarding')
  if (profile?.stripe_onboarding_complete) redirect('/dashboard')

  const supabaseAdmin = createAdminClient()
  let stripeAccountId = profile.stripe_account_id

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      country: 'MX',
      email: user.email ?? undefined,
      controller: {
        losses: { payments: 'application' },
        fees: { payer: 'application' },
        stripe_dashboard: { type: 'express' },
        requirement_collection: 'stripe',
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    stripeAccountId = account.id

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ stripe_account_id: stripeAccountId })
      .eq('id', user.id)

    if (error) {
      console.error('[onboarding] Error guardando stripe_account_id:', error.message)
      throw new Error('Error al crear cuenta de pagos')
    }
  }

  const baseUrl = getBaseUrl(headerStore)
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    type: 'account_onboarding',
    return_url: `${baseUrl}/dashboard/onboarding/return`,
    refresh_url: `${baseUrl}/api/stripe/connect/refresh`,
  })

  redirect(accountLink.url)
}
