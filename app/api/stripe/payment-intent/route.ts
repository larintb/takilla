import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { stripe } from '@/utils/stripe/server'
import { calculateFees } from '@/utils/pricing'

export const runtime = 'nodejs'

const REUSABLE_STATUSES = ['requires_payment_method', 'requires_confirmation', 'requires_action']

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

  if (!eventId || !tierId)
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10)
    return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 })

  const { data: tier } = await supabase
    .from('ticket_tiers')
    .select('id, price, available_tickets, event_id, events(title, status, event_date, organizer_id)')
    .eq('id', tierId)
    .eq('event_id', eventId)
    .single()

  if (!tier)
    return NextResponse.json({ error: 'Tier no encontrado' }, { status: 400 })
  if (tier.available_tickets < quantity)
    return NextResponse.json({ error: 'No hay boletos suficientes' }, { status: 400 })

  const event = (Array.isArray(tier.events) ? tier.events[0] : tier.events) as
    { title: string; status: string; event_date: string; organizer_id: string } | null

  if (!event || event.status !== 'published')
    return NextResponse.json({ error: 'Evento no disponible' }, { status: 400 })
  if (new Date(event.event_date) < new Date())
    return NextResponse.json({ error: 'El evento ya pasó' }, { status: 400 })

  const price = Number(tier.price)
  if (price === 0)
    return NextResponse.json({ error: 'Usa el flujo de boletos gratis' }, { status: 400 })

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

  const totalAmountCentavos = Math.round(fees.totalAmount * 100)
  const nowSecs      = Math.floor(Date.now() / 1000)
  const windowBucket = Math.floor(nowSecs / 600)
  const expiresAt    = nowSecs + 600  // 10 min from now, personal to this user

  // ── LOCK ──────────────────────────────────────────────────────────────────
  const lockKey = `pi_lock_${user.id}_${tierId}_${eventId}`

  const { data: lockAcquired, error: lockError } = await supabaseAdmin
    .rpc('acquire_purchase_lock', { p_lock_key: lockKey, p_expires_in: 30 })

  if (!lockAcquired || lockError) {
    return NextResponse.json(
      { error: 'Hay una compra en proceso. Intenta en unos segundos.' },
      { status: 409 }
    )
  }
  // ──────────────────────────────────────────────────────────────────────────

  try {
    // 1. Buscar PI existente reutilizable
    let paymentIntent = await findExistingPaymentIntent({
      userId: user.id,
      tierId,
      eventId,
      quantity,
      expectedAmount: totalAmountCentavos,
      connectedAccountId: organizer.stripe_account_id,
    })

    if (paymentIntent) {
      // 2. Reusar: solo actualizar expires_at
      paymentIntent = await stripe.paymentIntents.update(
        paymentIntent.id,
        { metadata: { ...paymentIntent.metadata, expires_at: String(expiresAt) } },
        { stripeAccount: organizer.stripe_account_id }
      )
    } else {
      // 3. Cancelar obsoletos y crear nuevo
      await cancelStalePaymentIntents({
        userId: user.id,
        tierId,
        eventId,
        connectedAccountId: organizer.stripe_account_id,
      })

      const idempotencyKey =
        `pi_${user.id}_${tierId}_${quantity}_${totalAmountCentavos}_${windowBucket}`

      try {
        paymentIntent = await stripe.paymentIntents.create(
          {
            amount: totalAmountCentavos,
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
          },
          { idempotencyKey }
        )
      } catch (err: unknown) {
        // Stripe Search has indexing lag — a PI created seconds ago may not appear
        // in search yet. When the idempotency key already exists, retrieve it directly.
        if (
          err instanceof Error &&
          'type' in err &&
          (err as { type: string }).type === 'idempotency_error' &&
          'raw' in err &&
          typeof (err as { raw?: { requestId?: string } }).raw?.requestId === 'string'
        ) {
          const existing = await stripe.paymentIntents.list(
            { limit: 5 },
            { stripeAccount: organizer.stripe_account_id }
          )
          const match = existing.data.find(
            (pi) =>
              pi.metadata?.user_id === user.id &&
              pi.metadata?.tier_id === tierId &&
              pi.metadata?.event_id === eventId &&
              pi.metadata?.quantity === String(quantity) &&
              pi.amount === totalAmountCentavos &&
              REUSABLE_STATUSES.includes(pi.status)
          )
          if (!match) throw err
          paymentIntent = match
        } else {
          throw err
        }
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      expiresAt,
    })

  } finally {
    // Se ejecuta siempre, incluso si hay un throw arriba
    await supabaseAdmin.rpc('release_purchase_lock', { p_lock_key: lockKey })
  }
}

// ─────────────────────────────────────────────────────────────────────────────

async function findExistingPaymentIntent({
  userId, tierId, eventId, quantity, expectedAmount, connectedAccountId,
}: {
  userId: string; tierId: string; eventId: string
  quantity: number; expectedAmount: number; connectedAccountId: string
}) {
  const results = await stripe.paymentIntents.search(
    {
      query: `metadata['user_id']:'${userId}' AND metadata['tier_id']:'${tierId}' AND metadata['event_id']:'${eventId}' AND metadata['quantity']:'${quantity}'`,
      limit: 5,
    },
    { stripeAccount: connectedAccountId }
  )

  const nowSecs = Math.floor(Date.now() / 1000)

  return results.data.find((pi) => {
    const notExpired = Number(pi.metadata?.expires_at ?? 0) > nowSecs
    const rightAmount = pi.amount === expectedAmount
    const reusable = REUSABLE_STATUSES.includes(pi.status)
    return notExpired && rightAmount && reusable
  }) ?? null
}

async function cancelStalePaymentIntents({
  userId, tierId, eventId, connectedAccountId,
}: {
  userId: string; tierId: string; eventId: string; connectedAccountId: string
}) {
  const results = await stripe.paymentIntents.search(
    {
      query: `metadata['user_id']:'${userId}' AND metadata['tier_id']:'${tierId}' AND metadata['event_id']:'${eventId}'`,
      limit: 10,
    },
    { stripeAccount: connectedAccountId }
  )

  await Promise.allSettled(
    results.data
      .filter((pi) => REUSABLE_STATUSES.includes(pi.status))
      .map((pi) =>
        stripe.paymentIntents.cancel(pi.id, { stripeAccount: connectedAccountId })
          .catch(() => null)
      )
  )
}