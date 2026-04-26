import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { stripe } from '@/utils/stripe/server'
import { calculateFees, calculatePerkFees, applyDiscount } from '@/utils/pricing'
import { isEventOver } from '@/utils/event-time'
import {
  validateDiscountCode,
  getPublicDiscountForTier,
  discountToInput,
  type DiscountRow,
} from '@/utils/discounts'

export const runtime = 'nodejs'

const REUSABLE_STATUSES = ['requires_payment_method', 'requires_confirmation', 'requires_action']

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: {
    eventId?: string; tierId?: string; quantity?: number; perkIds?: string[]
    discountCode?: string; autoDiscountId?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const eventId       = body.eventId?.trim()
  const tierId        = body.tierId?.trim()
  const quantity      = Number(body.quantity)
  const perkIds: string[] = Array.isArray(body.perkIds) ? body.perkIds.filter(Boolean) : []
  const discountCode  = body.discountCode?.trim().toUpperCase() || null
  const autoDiscountId = body.autoDiscountId?.trim() || null

  if (!eventId || !tierId)
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10)
    return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 })

  const { data: tier } = await supabase
    .from('ticket_tiers')
    .select('id, price, available_tickets, event_id, events(title, status, event_date, event_end_date, organizer_id)')
    .eq('id', tierId)
    .eq('event_id', eventId)
    .single()

  if (!tier)
    return NextResponse.json({ error: 'Tier no encontrado' }, { status: 400 })
  if (tier.available_tickets < quantity)
    return NextResponse.json({ error: 'No hay boletos suficientes' }, { status: 400 })

  const event = (Array.isArray(tier.events) ? tier.events[0] : tier.events) as
    { title: string; status: string; event_date: string; event_end_date?: string | null; organizer_id: string } | null

  if (!event || event.status !== 'published')
    return NextResponse.json({ error: 'Evento no disponible' }, { status: 400 })
  if (isEventOver(event.event_date, event.event_end_date))
    return NextResponse.json({ error: 'El evento ya pasó' }, { status: 400 })

  const price = Number(tier.price)
  if (price === 0)
    return NextResponse.json({ error: 'Usa el flujo de boletos gratis' }, { status: 400 })

  // ── Resolve discount ──────────────────────────────────────────────────────────
  let activeDiscount: DiscountRow | null = null

  if (discountCode) {
    const result = await validateDiscountCode(supabase, eventId, tierId, discountCode)
    if (result.ok) activeDiscount = result.discount
  } else if (autoDiscountId) {
    const supabaseAdmin = createAdminClient()
    const { data: d } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .eq('id', autoDiscountId)
      .eq('event_id', eventId)
      .eq('is_active', true)
      .single()
    if (d && (d.tier_id === null || d.tier_id === tierId)) {
      activeDiscount = d as DiscountRow
    }
  } else {
    // No code provided: apply public discount if one exists
    activeDiscount = await getPublicDiscountForTier(supabase, eventId, tierId)
  }

  const applied      = activeDiscount ? applyDiscount(price, quantity, discountToInput(activeDiscount)) : null
  const effectPrice  = applied?.effectivePrice ?? price

  if (effectPrice === 0)
    return NextResponse.json({ error: 'Usa el flujo de boletos gratis' }, { status: 400 })

  const supabaseAdmin = createAdminClient()
  const { data: organizer } = await supabaseAdmin
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', event.organizer_id)
    .single()

  if (!organizer?.stripe_onboarding_complete || !organizer?.stripe_account_id)
    return NextResponse.json({ error: 'El organizador aún no ha configurado su cuenta de pagos' }, { status: 400 })

  const fees = calculateFees(effectPrice, quantity)
  if (fees.unitAmountCentavos < 1000)
    return NextResponse.json({ error: 'El precio es menor al mínimo permitido' }, { status: 400 })

  // Add perks (if any) to the total
  let perkAmountCentavos = 0
  let perkAppFeeCentavos = 0
  let perkIdCsv = ''
  if (perkIds.length > 0) {
    const uniquePerkIds = [...new Set(perkIds)]
    const { data: perksData } = await supabase
      .from('perks')
      .select('id, price')
      .in('id', uniquePerkIds)
      .eq('event_id', eventId)
    if (perksData) {
      const priceMap = new Map(perksData.map(p => [p.id, Number(p.price)]))
      for (const perkId of perkIds) {
        const perkPrice = priceMap.get(perkId) ?? 0
        if (perkPrice === 0) continue
        const pFees = calculatePerkFees(perkPrice, 1)
        perkAmountCentavos += pFees.unitAmountCentavos
        perkAppFeeCentavos += pFees.applicationFeeAmountCentavos
      }
      perkIdCsv = perkIds.join(',')
    }
  }

  const totalAmountCentavos = Math.round(fees.totalAmount * 100) + perkAmountCentavos
  const totalAppFeeCentavos = fees.applicationFeeAmountCentavos + perkAppFeeCentavos
  const nowSecs   = Math.floor(Date.now() / 1000)
  const expiresAt = nowSecs + 600

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
      // 2. Reusar: actualizar expires_at, perk_ids y discount info
      const updatedMeta: Record<string, string> = {
        ...paymentIntent.metadata,
        expires_at: String(expiresAt),
      }
      if (perkIdCsv) updatedMeta.perk_ids = perkIdCsv
      else delete updatedMeta.perk_ids

      if (activeDiscount) {
        updatedMeta.discount_id     = activeDiscount.id
        updatedMeta.discount_amount = (applied?.totalDiscount ?? 0).toFixed(2)
      } else {
        delete updatedMeta.discount_id
        delete updatedMeta.discount_amount
      }

      paymentIntent = await stripe.paymentIntents.update(
        paymentIntent.id,
        { metadata: updatedMeta },
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

      const discountSuffix = activeDiscount ? `_d${activeDiscount.id.slice(0, 8)}` : ''
      const idempotencyKey =
        `pi_${user.id}_${tierId}_${quantity}_${totalAmountCentavos}_${expiresAt}${discountSuffix}`

      try {
        const metadata: Record<string, string> = {
          user_id:    user.id,
          event_id:   eventId,
          tier_id:    tierId,
          quantity:   String(quantity),
          expires_at: String(expiresAt),
        }
        if (perkIdCsv) metadata.perk_ids = perkIdCsv
        if (activeDiscount) {
          metadata.discount_id     = activeDiscount.id
          metadata.discount_amount = (applied?.totalDiscount ?? 0).toFixed(2)
        }

        paymentIntent = await stripe.paymentIntents.create(
          {
            amount: totalAmountCentavos,
            currency: 'mxn',
            application_fee_amount: totalAppFeeCentavos,
            transfer_data: { destination: organizer.stripe_account_id },
            metadata,
          },
          { idempotencyKey }
        )
      } catch (err: unknown) {
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
    const notExpired  = Number(pi.metadata?.expires_at ?? 0) > nowSecs
    const rightAmount = pi.amount === expectedAmount
    const reusable    = REUSABLE_STATUSES.includes(pi.status)
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
