import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/utils/stripe/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { sendPurchaseConfirmation } from '@/utils/email/purchase-confirmation'

async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.charges_enabled || !account.payouts_enabled) return

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ stripe_onboarding_complete: true })
    .eq('stripe_account_id', account.id)

  if (error) {
    console.error('[webhook] Error actualizando stripe_onboarding_complete:', error.message)
  } else {
    console.log('[webhook] Onboarding completo para cuenta:', account.id)
  }
}

export const runtime = 'nodejs'

function asRequiredMetadata(metadata: Stripe.Metadata | null) {
  const userId = metadata?.user_id?.trim()
  const tierId = metadata?.tier_id?.trim()
  const quantityRaw = Number(metadata?.quantity)
  const quantity = Number.isInteger(quantityRaw) ? quantityRaw : NaN

  if (!userId || !tierId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    return null
  }

  // perk_ids is optional — present when perks are bundled with ticket purchase
  const perkIdsCsv = metadata?.perk_ids?.trim() || null
  const perkIds: string[] = perkIdsCsv ? perkIdsCsv.split(',').map(s => s.trim()).filter(Boolean) : []

  // discount is optional
  const discountId     = metadata?.discount_id?.trim() || null
  const discountAmount = metadata?.discount_amount ? Number(metadata.discount_amount) : 0

  return { userId, tierId, quantity, perkIds, discountId, discountAmount }
}

function asPerksOnlyMetadata(metadata: Stripe.Metadata | null) {
  if (metadata?.purchase_kind !== 'perks') return null

  const userId = metadata?.user_id?.trim()
  const eventId = metadata?.event_id?.trim()
  const perkIdsCsv = metadata?.perk_ids?.trim() || null
  const perkIds: string[] = perkIdsCsv ? perkIdsCsv.split(',').map(s => s.trim()).filter(Boolean) : []

  if (!userId || !eventId || perkIds.length === 0) return null

  return { userId, eventId, perkIds }
}

async function tryRefund(paymentIntentId: string | null, context: string) {
  if (!paymentIntentId) return
  try {
    // reverse_transfer: true returns the funds from the connected account back to
    // the platform. Required for destination charges — without it the platform
    // absorbs the full loss while the organizer keeps the transfer.
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reverse_transfer: true,
    })
    console.log(`[webhook] Reembolso emitido (${context}):`, paymentIntentId)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    // Already refunded (success page may have beaten us) — not an error
    if (!msg.toLowerCase().includes('already')) {
      console.error(`[webhook] Error al emitir reembolso (${context}):`, msg)
    }
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const body = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  if (event.type === 'account.updated') {
    await handleAccountUpdated(event.data.object as Stripe.Account)
    return NextResponse.json({ received: true })
  }

  // ── PaymentIntent (flujo embebido, sin redirect) ──────────────────────────
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const supabaseAdmin = createAdminClient()

    // ── Perks-only purchase ───────────────────────────────────────────────
    const perksOnly = asPerksOnlyMetadata(pi.metadata)
    if (perksOnly) {
      const totalAmount = pi.amount / 100
      const { data: orderId, error } = await supabaseAdmin.rpc('fulfill_perks_order', {
        p_user_id:     perksOnly.userId,
        p_event_id:    perksOnly.eventId,
        p_perk_ids:    perksOnly.perkIds,
        p_session_id:  pi.id,
        p_total_amount: totalAmount,
      })
      if (error) {
        console.error('[webhook] fulfill_perks_order error:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (orderId) void sendPurchaseConfirmation(perksOnly.userId, orderId)
      return NextResponse.json({ received: true })
    }

    // ── Ticket purchase (+ optional bundled perks) ────────────────────────
    const parsed = asRequiredMetadata(pi.metadata)
    if (parsed) {
      const { data: orderId, error } = await supabaseAdmin.rpc('fulfill_checkout_session', {
        p_user_id:            parsed.userId,
        p_tier_id:            parsed.tierId,
        p_quantity:           parsed.quantity,
        p_session_id:         pi.id,
        p_payment_intent_id:  pi.id,
        p_discount_id:        parsed.discountId,
        p_discount_amount:    parsed.discountAmount,
      })

      if (error) {
        if (error.message.includes('No hay boletos suficientes')) {
          console.warn('[webhook] Inventario insuficiente en PaymentIntent, reembolsando:', pi.id)
          await tryRefund(pi.id, pi.id)
          return NextResponse.json({ received: true })
        }
        if (error.message.includes('discount_exhausted')) {
          console.warn('[webhook] Descuento agotado en PaymentIntent, reembolsando:', pi.id)
          await tryRefund(pi.id, pi.id)
          return NextResponse.json({ received: true })
        }
        if (error.message.includes('orders_stripe_session_id_unique')) {
          console.log('[webhook] PaymentIntent ya procesado (success page ganó la carrera):', pi.id)
          return NextResponse.json({ received: true })
        }
        console.error('[webhook] fulfill error (payment_intent.succeeded):', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Fulfill bundled perks if present
      if (orderId && parsed.perkIds.length > 0) {
        const eventId = pi.metadata?.event_id?.trim()
        if (eventId) {
          const { error: perkError } = await supabaseAdmin.rpc('fulfill_perk_purchases', {
            p_order_id: orderId,
            p_user_id:  parsed.userId,
            p_event_id: eventId,
            p_perk_ids: parsed.perkIds,
          })
          if (perkError) {
            console.error('[webhook] fulfill_perk_purchases error:', perkError.message)
          }
        }
      }

      if (orderId) void sendPurchaseConfirmation(parsed.userId, orderId)
    }

    return NextResponse.json({ received: true })
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.mode === 'payment' && session.payment_status === 'paid') {
      const parsed = asRequiredMetadata(session.metadata)
      if (!parsed) {
        console.error('[webhook] Metadata inválida en sesión:', session.id)
        return NextResponse.json({ error: 'Invalid checkout metadata' }, { status: 400 })
      }

      const paymentIntentId =
        typeof session.payment_intent === 'string' ? session.payment_intent : null

      const supabaseAdmin = createAdminClient()
      const { data: orderId, error } = await supabaseAdmin.rpc('fulfill_checkout_session', {
        p_user_id:           parsed.userId,
        p_tier_id:           parsed.tierId,
        p_quantity:          parsed.quantity,
        p_session_id:        session.id,
        p_payment_intent_id: paymentIntentId,
        p_discount_id:       parsed.discountId,
        p_discount_amount:   parsed.discountAmount,
      })

      if (error) {
        if (error.message.includes('No hay boletos suficientes')) {
          console.warn('[webhook] Inventario insuficiente al fulfillment, emitiendo reembolso. Sesión:', session.id)
          await tryRefund(paymentIntentId, session.id)
          return NextResponse.json({ received: true })
        }
        if (error.message.includes('discount_exhausted')) {
          console.warn('[webhook] Descuento agotado al fulfillment, emitiendo reembolso. Sesión:', session.id)
          await tryRefund(paymentIntentId, session.id)
          return NextResponse.json({ received: true })
        }
        if (error.message.includes('orders_stripe_session_id_unique')) {
          console.log('[webhook] Sesión ya procesada (success page ganó la carrera):', session.id)
          return NextResponse.json({ received: true })
        }
        console.error('[webhook] fulfill_checkout_session error:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (orderId && parsed.perkIds.length > 0) {
        const eventId = session.metadata?.event_id?.trim()
        if (eventId) {
          const { error: perkError } = await supabaseAdmin.rpc('fulfill_perk_purchases', {
            p_order_id: orderId,
            p_user_id:  parsed.userId,
            p_event_id: eventId,
            p_perk_ids: parsed.perkIds,
          })
          if (perkError) {
            console.error('[webhook] fulfill_perk_purchases (checkout.session) error:', perkError.message)
          }
        }
      }

      if (orderId) {
        void sendPurchaseConfirmation(parsed.userId, orderId)
      }
    }
  }

  return NextResponse.json({ received: true })
}
