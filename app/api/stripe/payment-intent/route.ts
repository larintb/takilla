import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { stripe } from '@/utils/stripe/server'
import { calculateFees } from '@/utils/pricing'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: { eventId?: string; tierId?: string; quantity?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const eventId  = body.eventId?.trim()
  const tierId   = body.tierId?.trim()
  const quantity = Number(body.quantity)

  if (!eventId || !tierId)                          return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10)
                                                    return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 })

  const { data: tier } = await supabase
    .from('ticket_tiers')
    .select('id, price, available_tickets, event_id, events(title, status, event_date, organizer_id)')
    .eq('id', tierId)
    .eq('event_id', eventId)
    .single()

  if (!tier)                                        return NextResponse.json({ error: 'Tier no encontrado' }, { status: 400 })
  if (tier.available_tickets < quantity)            return NextResponse.json({ error: 'No hay boletos suficientes' }, { status: 400 })

  const event = (Array.isArray(tier.events) ? tier.events[0] : tier.events) as
    { title: string; status: string; event_date: string; organizer_id: string } | null

  if (!event || event.status !== 'published')       return NextResponse.json({ error: 'Evento no disponible' }, { status: 400 })
  if (new Date(event.event_date) < new Date())      return NextResponse.json({ error: 'El evento ya pasó' }, { status: 400 })

  const price = Number(tier.price)
  if (price === 0)                                  return NextResponse.json({ error: 'Usa el flujo de boletos gratis' }, { status: 400 })

  const supabaseAdmin = createAdminClient()
  const { data: organizer } = await supabaseAdmin
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', event.organizer_id)
    .single()

  if (!organizer?.stripe_onboarding_complete || !organizer?.stripe_account_id)
    return NextResponse.json({ error: 'El organizador aún no ha configurado su cuenta de pagos' }, { status: 400 })

  const fees = calculateFees(price, quantity)
  if (fees.unitAmountCentavos < 1000)
    return NextResponse.json({ error: 'El precio es menor al mínimo permitido' }, { status: 400 })

  const nowSecs   = Math.floor(Date.now() / 1000)
  const expiresAt = nowSecs + 600
  // Same params within the 10-min window return the same PaymentIntent —
  // guards against React StrictMode double-renders and form resubmits.
  const idempotencyKey = `${user.id}_${tierId}_${eventId}_${quantity}_${Math.floor(nowSecs / 600)}`

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(fees.totalAmount * 100),
    currency: 'mxn',
    application_fee_amount: fees.applicationFeeAmountCentavos,
    transfer_data: { destination: organizer.stripe_account_id },
    metadata: {
      user_id:    user.id,
      event_id:   eventId,
      tier_id:    tierId,
      quantity:   String(quantity),
      expires_at: String(expiresAt),
    },
  }, { idempotencyKey })

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    expiresAt,
  })
}
