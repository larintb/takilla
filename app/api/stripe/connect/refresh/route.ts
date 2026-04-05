import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { stripe } from '@/utils/stripe/server'

export const runtime = 'nodejs'

function getBaseUrl(headerStore: Awaited<ReturnType<typeof headers>>) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http'
  return `${protocol}://${host}`
}

export async function GET() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_account_id || profile.stripe_onboarding_complete) {
    return NextResponse.redirect(
      new URL('/dashboard/onboarding', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
    )
  }

  const baseUrl = getBaseUrl(headerStore)
  const accountLink = await stripe.accountLinks.create({
    account: profile.stripe_account_id,
    type: 'account_onboarding',
    return_url: `${baseUrl}/dashboard/onboarding/return`,
    refresh_url: `${baseUrl}/api/stripe/connect/refresh`,
  })

  return NextResponse.redirect(accountLink.url)
}
