import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { stripe } from '@/utils/stripe/server'

export const runtime = 'nodejs'

function getBaseUrl(headerStore: Awaited<ReturnType<typeof headers>>) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http'
  return `${protocol}://${host}`
}

export async function POST() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, terms_accepted_at, stripe_account_id, stripe_onboarding_complete')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer') {
    return NextResponse.json({ error: 'Solo organizadores pueden configurar pagos' }, { status: 403 })
  }

  if (!profile.terms_accepted_at) {
    return NextResponse.json({ error: 'Debes aceptar los términos y condiciones primero' }, { status: 400 })
  }

  if (profile.stripe_onboarding_complete) {
    return NextResponse.json({ error: 'Onboarding de Stripe ya completado' }, { status: 400 })
  }

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

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ stripe_account_id: stripeAccountId })
      .eq('id', user.id)

    if (updateError) {
      console.error('[connect] Error guardando stripe_account_id:', updateError.message)
      return NextResponse.json({ error: 'Error interno al guardar cuenta' }, { status: 500 })
    }
  }

  const baseUrl = getBaseUrl(headerStore)
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    type: 'account_onboarding',
    return_url: `${baseUrl}/dashboard/onboarding/return`,
    refresh_url: `${baseUrl}/api/stripe/connect/refresh`,
  })

  return NextResponse.json({ url: accountLink.url })
}
