import Link from 'next/link'
import { stripe } from '@/utils/stripe/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { sendPurchaseConfirmation } from '@/utils/email/purchase-confirmation'
import RetroTicketWallet from './_components/retro-ticket-wallet'
import ConfettiBurst from './_components/confetti-burst'

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ session_id?: string; payment_intent?: string }>
}

type TicketData = {
  id: string
  qr_hash: string
  eventTitle: string
  eventDate: string | null
  venueName: string | null
  venueCity: string | null
  tierName: string | null
  tierPrice: number | null
}

type PageResult =
  | { status: 'success'; tickets: TicketData[] }
  | { status: 'perks_success' }
  | { status: 'refunded'; amount: number | null; currency: string | null }
  | { status: 'error' }

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params          = await searchParams
  const sessionId       = params.session_id?.trim()
  const paymentIntentId = params.payment_intent?.trim()

  const result = await resolveResult(sessionId, paymentIntentId)

  if (result.status === 'perks_success') {
    return (
      <main className="flex-1 px-4 py-12">
        <ConfettiBurst />
        <div className="max-w-md mx-auto space-y-6 text-center">
          <div className="space-y-2 animate-fade-in">
            <p className="font-bold leading-none"
              style={{
                fontSize: 'clamp(2.4rem, 9vw, 3.5rem)',
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                paddingBottom: '0.15em',
              }}>
              ¡Extras listos!
            </p>
            <p className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Tus extras están en tu billetera digital.
            </p>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <Link
              href="/tickets"
              className="inline-flex items-center justify-center px-8 h-14 rounded-2xl font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 32px rgba(249,115,22,0.3)' }}
            >
              Ver mis extras
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (result.status === 'refunded') {
    const amount = result.amount != null && result.currency
      ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: result.currency.toUpperCase() }).format(result.amount / 100)
      : null

    return (
      <main className="flex-1 px-4 py-12">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2 animate-fade-in">
            <p className="font-bold leading-none" style={{ fontSize: 'clamp(2rem, 8vw, 2.8rem)', color: 'rgba(255,255,255,0.9)' }}>
              Boletos agotados
            </p>
            <p className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Los boletos se agotaron justo cuando procesamos tu pago.
            </p>
          </div>

          <div className="rounded-2xl p-6 space-y-4 animate-fade-in-up"
            style={{ background: 'var(--surface-panel)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>¿Qué pasó?</p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Otro usuario compró los últimos boletos disponibles justo antes que tú.
                Tu pago fue procesado pero no se pudo completar el pedido.
              </p>
            </div>
            <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Reembolso</p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Tu pago{amount ? ` de ${amount}` : ''} ha sido reembolsado automáticamente.
                Los fondos se reflejarán en 3–5 días hábiles.
              </p>
            </div>
          </div>

          <div className="text-center animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <Link
              href="/events"
              className="inline-flex items-center justify-center px-8 h-14 rounded-2xl font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 32px rgba(249,115,22,0.3)' }}
            >
              Ver otros eventos
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (result.status === 'error') {
    return (
      <main className="flex-1 px-4 py-12">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2 animate-fade-in">
            <p className="font-bold leading-none" style={{ fontSize: 'clamp(2rem, 8vw, 2.8rem)', color: 'rgba(255,255,255,0.9)' }}>
              Algo salió mal
            </p>
            <p className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Stripe confirmó tu pago pero no pudimos procesar los boletos.
            </p>
          </div>

          <div className="rounded-2xl p-6 animate-fade-in-up"
            style={{ background: 'var(--surface-panel)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Si tu pago fue cobrado, contáctanos con el ID de esta sesión y te ayudaremos a resolverlo.
            </p>
            {sessionId && (
              <p className="text-xs font-mono break-all mt-3 px-3 py-2 rounded-xl"
                style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' }}>
                {sessionId}
              </p>
            )}
          </div>

          <div className="text-center animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 h-14 rounded-2xl font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 32px rgba(249,115,22,0.3)' }}
            >
              Ir a mis boletos
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // status === 'success'
  const { tickets } = result

  const walletsTickets = tickets.map(t => ({
    ...t,
    displayNumber: ticketDisplayNumber(t.id),
  }))

  return (
    <main className="flex-1 py-10 px-4">
      <ConfettiBurst />

      <div className="max-w-md mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-2 animate-fade-in">
          <p
            className="font-bold leading-none"
            style={{
              fontSize: 'clamp(2.4rem, 9vw, 3.5rem)',
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              paddingBottom: '0.15em',
            }}
          >
            ¡Pago exitoso!
          </p>
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {tickets.length === 0
              ? 'Tus boletos estarán listos en un momento.'
              : tickets.length === 1
                ? 'Aquí está tu boleto'
                : `Aquí están tus ${tickets.length} boletos`}
          </p>
        </div>

        {/* Ticket wallet */}
        {walletsTickets.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <RetroTicketWallet tickets={walletsTickets} />
          </div>
        )}

        {/* CTA */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '240ms' }}>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 h-14 rounded-2xl font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'var(--accent-gradient)',
              boxShadow: '0 0 32px rgba(249,115,22,0.3)',
            }}
          >
            Ir a mis boletos
          </Link>
        </div>

      </div>
    </main>
  )
}

async function resolveResult(sessionId: string | undefined, paymentIntentId?: string): Promise<PageResult> {
  // ── PaymentIntent path (nuevo flujo embebido) ─────────────────────────────
  if (paymentIntentId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
      if (pi.status !== 'succeeded') return { status: 'error' }

      const admin = createAdminClient()
      const userId = pi.metadata?.user_id?.trim()
      if (!userId) return { status: 'error' }

      // ── Perks-only purchase ──────────────────────────────────────────────
      if (pi.metadata?.purchase_kind === 'perks') {
        const eventId    = pi.metadata?.event_id?.trim()
        const perkIdsCsv = pi.metadata?.perk_ids?.trim()
        const perkIds    = perkIdsCsv ? perkIdsCsv.split(',').map(s => s.trim()).filter(Boolean) : []

        if (!eventId || perkIds.length === 0) return { status: 'error' }

        const { data: orderId, error: rpcError } = await admin.rpc('fulfill_perks_order', {
          p_user_id:      userId,
          p_event_id:     eventId,
          p_perk_ids:     perkIds,
          p_session_id:   pi.id,
          p_total_amount: pi.amount_received / 100,
        })

        if (rpcError) {
          console.error('[checkout/success] fulfill_perks_order error:', rpcError.message)
          return { status: 'error' }
        }

        if (orderId) void sendPurchaseConfirmation(userId, orderId)
        return { status: 'perks_success' }
      }

      // ── Ticket purchase ──────────────────────────────────────────────────
      const tierId      = pi.metadata?.tier_id?.trim()
      const quantityRaw = Number(pi.metadata?.quantity)
      const quantity    = Number.isInteger(quantityRaw) ? quantityRaw : NaN

      if (!tierId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        return { status: 'error' }
      }

      const { data: profile } = await admin.from('profiles').select('id').eq('id', userId).single()
      if (!profile) {
        const { data: { user: authUser } } = await admin.auth.admin.getUserById(userId)
        if (!authUser) return { status: 'error' }
        const { error: profileError } = await admin.from('profiles').upsert({
          id: userId, full_name: authUser.user_metadata?.full_name ?? null,
          email: authUser.email ?? null, role: 'customer',
        })
        if (profileError) return { status: 'error' }
      }

      const perkIdsCsv = pi.metadata?.perk_ids?.trim() || null
      const perkIds    = perkIdsCsv ? perkIdsCsv.split(',').map(s => s.trim()).filter(Boolean) : []

      const { data: orderId, error: rpcError } = await admin.rpc('fulfill_checkout_session', {
        p_user_id:           userId,
        p_tier_id:           tierId,
        p_quantity:          quantity,
        p_session_id:        pi.id,
        p_payment_intent_id: pi.id,
      })

      if (rpcError) {
        console.error('[checkout/success] PaymentIntent fulfillment error:', rpcError.message)
        if (rpcError.message.includes('No hay boletos suficientes')) {
          try {
            await stripe.refunds.create({ payment_intent: pi.id, reverse_transfer: true })
          } catch (refundErr: unknown) {
            const msg = refundErr instanceof Error ? refundErr.message : String(refundErr)
            if (!msg.toLowerCase().includes('already')) console.error('[checkout/success] Refund error:', msg)
          }
          return { status: 'refunded', amount: pi.amount_received, currency: pi.currency }
        }
        return { status: 'error' }
      }

      // Fulfill bundled perks if present
      if (orderId && perkIds.length > 0) {
        const eventId = pi.metadata?.event_id?.trim()
        if (eventId) {
          const { error: perkError } = await admin.rpc('fulfill_perk_purchases', {
            p_order_id: orderId,
            p_user_id:  userId,
            p_event_id: eventId,
            p_perk_ids: perkIds,
          })
          if (perkError) console.error('[checkout/success] fulfill_perk_purchases error:', perkError.message)
        }
      }

      if (!orderId) return { status: 'success', tickets: [] }
      void sendPurchaseConfirmation(userId, orderId)
      return resolveTickets(admin, orderId)
    } catch (err) {
      console.error('[checkout/success] PaymentIntent error:', err)
      return { status: 'error' }
    }
  }

  // ── Checkout Session path (flujo legacy con redirect) ─────────────────────
  if (!sessionId) return { status: 'error' }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.mode !== 'payment' || session.payment_status !== 'paid') {
      return { status: 'error' }
    }

    const userId = session.metadata?.user_id?.trim()
    const tierId = session.metadata?.tier_id?.trim()
    const quantityRaw = Number(session.metadata?.quantity)
    const quantity = Number.isInteger(quantityRaw) ? quantityRaw : NaN
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null

    if (!userId || !tierId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return { status: 'error' }
    }

    const admin = createAdminClient()

    // Guarantee the profile row exists before the FK on orders.user_id fires
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!profile) {
      const { data: { user: authUser } } = await admin.auth.admin.getUserById(userId)
      if (!authUser) return { status: 'error' }

      const { error: profileError } = await admin.from('profiles').upsert({
        id: userId,
        full_name: authUser.user_metadata?.full_name ?? null,
        email: authUser.email ?? null,
        role: 'customer',
      })

      if (profileError) {
        console.error('[checkout/success] Error creando perfil:', profileError.message)
        return { status: 'error' }
      }
    }

    const { data: orderId, error: rpcError } = await admin.rpc('fulfill_checkout_session', {
      p_user_id: userId,
      p_tier_id: tierId,
      p_quantity: quantity,
      p_session_id: session.id,
      p_payment_intent_id: paymentIntentId,
    })

    if (rpcError) {
      console.error('[checkout/success] fulfill_checkout_session error:', rpcError.message)

      if (rpcError.message.includes('No hay boletos suficientes') && paymentIntentId) {
        try {
          // reverse_transfer: true returns the funds from the connected account back to
          // the platform. Required for destination charges — without it the platform
          // absorbs the full loss while the organizer keeps the transfer.
          await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reverse_transfer: true,
          })
          console.log('[checkout/success] Reembolso emitido para payment_intent:', paymentIntentId)
        } catch (refundErr: unknown) {
          const msg = refundErr instanceof Error ? refundErr.message : String(refundErr)
          // Already refunded (e.g. webhook beat us to it) — still show refunded UI
          if (!msg.toLowerCase().includes('already')) {
            console.error('[checkout/success] Error al emitir reembolso:', msg)
          }
        }

        const charge = await stripe.paymentIntents.retrieve(paymentIntentId)
        return {
          status: 'refunded',
          amount: charge.amount_received,
          currency: charge.currency,
        }
      }

      return { status: 'error' }
    }

    if (!orderId) return { status: 'success', tickets: [] }
    void sendPurchaseConfirmation(userId, orderId)
    return resolveTickets(admin, orderId)
  } catch (err) {
    console.error('[checkout/success] Error inesperado:', err)
    return { status: 'error' }
  }
}

// ── Shared helper: load tickets for an order ─────────────────────────────────

type AdminClient = ReturnType<typeof createAdminClient>

async function resolveTickets(admin: AdminClient, orderId: string): Promise<PageResult> {
  const { data: rawTickets } = await admin
    .from('tickets')
    .select('id, qr_hash, tier_id, event_id')
    .eq('order_id', orderId)

  if (!rawTickets?.length) return { status: 'success', tickets: [] }

  const tierIds  = [...new Set(rawTickets.map(t => t.tier_id))]
  const eventIds = [...new Set(rawTickets.map(t => t.event_id))]

  const [{ data: tiers }, { data: events }] = await Promise.all([
    admin.from('ticket_tiers').select('id, name, price').in('id', tierIds),
    admin.from('events').select('id, title, event_date, venue_id').in('id', eventIds),
  ])

  const venueIds = [...new Set((events ?? []).map(e => e.venue_id).filter((id): id is string => !!id))]
  const { data: venues } = venueIds.length
    ? await admin.from('venues').select('id, name, city').in('id', venueIds)
    : { data: [] as { id: string; name: string; city: string }[] }

  const tierMap  = new Map((tiers  ?? []).map(t => [t.id, t]))
  const venueMap = new Map((venues ?? []).map(v => [v.id, v]))
  const eventMap = new Map(
    (events ?? []).map(e => [
      e.id,
      { ...e, venue: e.venue_id ? (venueMap.get(e.venue_id) ?? null) : null },
    ])
  )

  const tickets: TicketData[] = rawTickets.map(t => {
    const ev   = eventMap.get(t.event_id) ?? null
    const tier = tierMap.get(t.tier_id)   ?? null
    return {
      id:         t.id,
      qr_hash:    t.qr_hash,
      eventTitle: ev?.title ?? 'Evento',
      eventDate:  ev?.event_date ?? null,
      venueName:  (ev?.venue as { name: string; city: string } | null)?.name ?? null,
      venueCity:  (ev?.venue as { name: string; city: string } | null)?.city ?? null,
      tierName:   tier?.name ?? null,
      tierPrice:  tier ? Number(tier.price) : null,
    }
  })

  return { status: 'success', tickets }
}

function ticketDisplayNumber(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8)
  const num = (parseInt(hex, 16) % 9000) + 1000
  return String(num)
}
