import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { stripe } from '@/utils/stripe/server'
import { calculatePerkFees } from '@/utils/pricing'
import { isEventOver } from '@/utils/event-time'

export const runtime = 'nodejs'

const REUSABLE_STATUSES = ['requires_payment_method', 'requires_confirmation', 'requires_action']

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: { eventId?: string; perkIds?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const eventId = body.eventId?.trim()
  const perkIds = body.perkIds

  if (!eventId || !Array.isArray(perkIds) || perkIds.length === 0)
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  if (perkIds.length > 50)
    return NextResponse.json({ error: 'Demasiados extras' }, { status: 400 })

  // Verify user has a ticket for this event
  const { data: hasTicket } = await supabase
    .from('tickets')
    .select('id')
    .eq('owner_id', user.id)
    .eq('event_id', eventId)
    .limit(1)
    .single()

  if (!hasTicket)
    return NextResponse.json({ error: 'Necesitas un boleto para este evento para comprar extras' }, { status: 403 })

  // Fetch event + organizer
  const supabaseAdmin = createAdminClient()
  const { data: event } = await supabase
    .from('events')
    .select('id, title, status, event_date, event_end_date, organizer_id')
    .eq('id', eventId)
    .eq('status', 'published')
    .single()

  if (!event) return NextResponse.json({ error: 'Evento no disponible' }, { status: 400 })
  if (isEventOver(event.event_date, event.event_end_date))
    return NextResponse.json({ error: 'El evento ya pasó' }, { status: 400 })

  const { data: organizer } = await supabaseAdmin
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', event.organizer_id)
    .single()

  if (!organizer?.stripe_onboarding_complete || !organizer?.stripe_account_id)
    return NextResponse.json({ error: 'El organizador no ha configurado su cuenta de pagos' }, { status: 400 })

  // Fetch perks and validate they all belong to this event
  const { data: perks } = await supabase
    .from('perks')
    .select('id, name, price')
    .in('id', [...new Set(perkIds)])
    .eq('event_id', eventId)

  if (!perks || perks.length === 0)
    return NextResponse.json({ error: 'Extras no encontrados para este evento' }, { status: 400 })

  // Build a price map and compute totals (perkIds may have duplicates = quantity)
  const priceMap = new Map(perks.map(p => [p.id, Number(p.price)]))
  const invalidIds = perkIds.filter(id => !priceMap.has(id))
  if (invalidIds.length > 0)
    return NextResponse.json({ error: 'Algunos extras no pertenecen a este evento' }, { status: 400 })

  // All perks must be paid (free perk cart goes through purchase_perks_free)
  const allFree = perkIds.every(id => priceMap.get(id) === 0)
  if (allFree)
    return NextResponse.json({ error: 'Usa el flujo de extras gratis' }, { status: 400 })

  // Compute total amount with fees
  // Each perk unit gets its own fee calculation
  let totalAmountCentavos = 0
  let totalAppFeeCentavos = 0
  const perkIdCsv = perkIds.join(',')

  for (const perkId of perkIds) {
    const price = priceMap.get(perkId)!
    if (price === 0) continue
    const fees = calculatePerkFees(price, 1)
    totalAmountCentavos += fees.unitAmountCentavos
    totalAppFeeCentavos += fees.applicationFeeAmountCentavos
  }

  if (totalAmountCentavos < 1000)
    return NextResponse.json({ error: 'El monto es menor al mínimo permitido' }, { status: 400 })

  const nowSecs   = Math.floor(Date.now() / 1000)
  const expiresAt = nowSecs + 600

  // Lock
  const lockKey = `pi_perks_lock_${user.id}_${eventId}`
  const { data: lockAcquired, error: lockError } = await supabaseAdmin
    .rpc('acquire_purchase_lock', { p_lock_key: lockKey, p_expires_in: 30 })

  if (!lockAcquired || lockError)
    return NextResponse.json({ error: 'Hay una compra en proceso. Intenta en unos segundos.' }, { status: 409 })

  try {
    // Check for existing reusable PI with same perk set and amount
    const existingResults = await stripe.paymentIntents.search(
      {
        query: `metadata['user_id']:'${user.id}' AND metadata['event_id']:'${eventId}' AND metadata['purchase_kind']:'perks'`,
        limit: 5,
      },
      { stripeAccount: organizer.stripe_account_id }
    )

    let paymentIntent = existingResults.data.find(pi => {
      const notExpired  = Number(pi.metadata?.expires_at ?? 0) > nowSecs
      const rightAmount = pi.amount === totalAmountCentavos
      const reusable    = REUSABLE_STATUSES.includes(pi.status)
      return notExpired && rightAmount && reusable
    }) ?? null

    if (paymentIntent) {
      paymentIntent = await stripe.paymentIntents.update(
        paymentIntent.id,
        { metadata: { ...paymentIntent.metadata, expires_at: String(expiresAt) } },
        { stripeAccount: organizer.stripe_account_id }
      )
    } else {
      // Cancel stale perks PIs for this user+event
      await Promise.allSettled(
        existingResults.data
          .filter(pi => REUSABLE_STATUSES.includes(pi.status))
          .map(pi => stripe.paymentIntents.cancel(pi.id, { stripeAccount: organizer.stripe_account_id }).catch(() => null))
      )

      const idempotencyKey = `pi_perks_${user.id}_${eventId}_${totalAmountCentavos}_${expiresAt}`

      paymentIntent = await stripe.paymentIntents.create(
        {
          amount:                  totalAmountCentavos,
          currency:                'mxn',
          application_fee_amount:  totalAppFeeCentavos,
          transfer_data:           { destination: organizer.stripe_account_id },
          metadata: {
            user_id:       user.id,
            event_id:      eventId,
            perk_ids:      perkIdCsv,
            purchase_kind: 'perks',
            expires_at:    String(expiresAt),
          },
        },
        { idempotencyKey }
      )
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, expiresAt })

  } finally {
    await supabaseAdmin.rpc('release_purchase_lock', { p_lock_key: lockKey })
  }
}
