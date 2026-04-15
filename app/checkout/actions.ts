'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { stripe } from '@/utils/stripe/server'
import { calculateFees } from '@/utils/pricing'

function getBaseUrl(headerStore: Awaited<ReturnType<typeof headers>>) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http'
  return `${protocol}://${host}`
}

export async function startStripeCheckout(formData: FormData) {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tierId = (formData.get('tierId') as string | null)?.trim()
  const eventId = (formData.get('eventId') as string | null)?.trim()
  const quantityRaw = Number(formData.get('quantity'))
  const quantity = Number.isInteger(quantityRaw) ? quantityRaw : 1

  if (!tierId || !eventId) throw new Error('Faltan datos del checkout')
  if (quantity < 1 || quantity > 10) throw new Error('Cantidad inválida')

  const { data: tier } = await supabase
    .from('ticket_tiers')
    .select('id, name, price, available_tickets, event_id, events(title, status, event_date, organizer_id)')
    .eq('id', tierId)
    .eq('event_id', eventId)
    .single()

  if (!tier) throw new Error('Tier no encontrado')
  if (tier.available_tickets < quantity) throw new Error('No hay boletos suficientes')

  const event = Array.isArray(tier.events)
    ? (tier.events[0] as { title: string; status: string; event_date: string; organizer_id: string } | undefined)
    : (tier.events as { title: string; status: string; event_date: string; organizer_id: string } | null)
  if (!event || event.status !== 'published') throw new Error('El evento no está disponible')
  if (new Date(event.event_date) < new Date()) throw new Error('El evento ya pasó')

  const priceNumber = Number(tier.price)

  if (priceNumber === 0) {
    for (let i = 0; i < quantity; i++) {
      const { error } = await supabase.rpc('purchase_ticket', {
        tier_id_input: tierId,
      })
      if (error) throw new Error(error.message)
    }
    redirect('/tickets')
  }

  // Obtener cuenta de Stripe del organizador — usa admin client para saltar RLS,
  // ya que un customer no puede leer el perfil de otro usuario.
  const supabaseAdmin = createAdminClient()
  const { data: organizer } = await supabaseAdmin
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', event.organizer_id)
    .single()

  if (!organizer?.stripe_onboarding_complete || !organizer?.stripe_account_id) {
    throw new Error('El organizador aún no ha configurado su cuenta de pagos')
  }

  const fees = calculateFees(priceNumber, quantity)

  // Stripe MXN: mínimo 10 MXN (1000 centavos) por transacción
  if (fees.unitAmountCentavos < 1000) {
    throw new Error('El precio del boleto es menor al mínimo permitido por Stripe para pagos en MXN')
  }

  const baseUrl = getBaseUrl(headerStore)
  const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${baseUrl}/checkout?eventId=${eventId}&tierId=${tierId}&quantity=${quantity}`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: user.email ?? undefined,
    line_items: [
      {
        quantity,
        price_data: {
          currency: 'mxn',
          unit_amount: fees.unitAmountCentavos,
          product_data: {
            name: `${event.title} - ${tier.name}`,
            description: `Incluye cargo por servicio de $${fees.serviceChargePerTicket.toFixed(2)} MXN por boleto`,
          },
        },
      },
    ],
    payment_intent_data: {
      // Stripe transfiere (totalCobrado - stripeFee) al organizador, luego
      // application_fee_amount regresa a la plataforma.
      // Neto organizador = totalCobrado - stripeFee - applicationFee = ticketPrice × qty ✓
      // transfer_data.amount es mutuamente exclusivo con application_fee_amount en API 2026.
      application_fee_amount: fees.applicationFeeAmountCentavos,
      transfer_data: {
        destination: organizer.stripe_account_id,
      },
    },
    metadata: {
      user_id: user.id,
      event_id: eventId,
      tier_id: tierId,
      quantity: String(quantity),
    },
  })

  if (!session.url) {
    throw new Error('No se pudo iniciar Stripe Checkout')
  }

  redirect(session.url)
}
