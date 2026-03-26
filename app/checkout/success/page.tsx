import Link from 'next/link'
import { VT323 } from 'next/font/google'
import { stripe } from '@/utils/stripe/server'
import { createAdminClient } from '@/utils/supabase/admin'
import RetroTicketWallet from './_components/retro-ticket-wallet'

const vt323 = VT323({ weight: '400', subsets: ['latin'] })

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>
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
  | { status: 'refunded'; amount: number | null; currency: string | null }
  | { status: 'error' }

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params = await searchParams
  const sessionId = params.session_id?.trim()

  const result = await resolveResult(sessionId)

  if (result.status === 'refunded') {
    const amount = result.amount != null && result.currency
      ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: result.currency.toUpperCase() }).format(result.amount / 100)
      : null

    return (
      <main className="flex-1 px-4">
      <div className={`max-w-md mx-auto py-8 space-y-6 ${vt323.className}`}>
        <div className="text-center space-y-2">
          <p className="text-5xl tracking-widest text-red-700 uppercase">Boletos agotados</p>
          <p className="text-zinc-500 text-xl mt-1 tracking-wide">
            Los boletos se agotaron justo cuando procesamos tu pago.
          </p>
        </div>

        <div className="border-4 border-black bg-amber-50 shadow-[8px_8px_0_0_#000] px-6 py-5 space-y-3">
          <p className="text-2xl text-zinc-900 uppercase tracking-wide">¿Qué pasó?</p>
          <p className="text-lg text-zinc-700 leading-snug">
            Otro usuario compró los últimos boletos disponibles justo antes que tú.
            Tu pago fue procesado pero no se pudo completar el pedido.
          </p>

          <div className="border-t-2 border-dashed border-zinc-300 pt-3">
            <p className="text-2xl text-zinc-900 uppercase tracking-wide">Reembolso</p>
            <p className="text-lg text-zinc-700">
              Tu pago{amount ? ` de ${amount}` : ''} ha sido reembolsado automáticamente.
              Los fondos se reflejarán en 3–5 días hábiles.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/events"
            className="inline-block px-6 py-2 border-2 border-black bg-black text-amber-50 text-2xl tracking-widest uppercase hover:bg-zinc-800 transition-colors"
          >
            {'>'} Ver otros eventos
          </Link>
        </div>
      </div>
      </main>
    )
  }

  if (result.status === 'error') {
    return (
      <main className="flex-1 px-4">
      <div className={`max-w-md mx-auto py-8 space-y-6 ${vt323.className}`}>
        <div className="text-center">
          <p className="text-5xl tracking-widest text-zinc-700 uppercase">Algo salió mal</p>
          <p className="text-zinc-500 text-xl mt-1 tracking-wide">
            Stripe confirmó tu pago pero no pudimos procesar los boletos.
          </p>
        </div>
        <div className="border-4 border-black bg-amber-50 shadow-[8px_8px_0_0_#000] px-6 py-5">
          <p className="text-lg text-zinc-700">
            Si tu pago fue cobrado, contáctanos con el ID de esta sesión y te ayudaremos a resolverlo.
          </p>
          {sessionId && (
            <p className="text-sm text-zinc-400 mt-2 font-mono break-all">{sessionId}</p>
          )}
        </div>
        <div className="text-center">
          <Link
            href="/tickets"
            className="inline-block px-6 py-2 border-2 border-black bg-black text-amber-50 text-2xl tracking-widest uppercase hover:bg-zinc-800 transition-colors"
          >
            {'>'} Ir a mis boletos
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
    <main className="flex-1 py-8 px-4 space-y-8">
      <div className={`text-center ${vt323.className}`}>
        <p className="text-6xl tracking-widest text-green-700 uppercase">¡Pago exitoso!</p>
        <p className="text-zinc-500 text-xl mt-1 tracking-wide">
          {tickets.length > 0
            ? `${tickets.length === 1 ? 'Aquí está tu boleto' : `Aquí están tus ${tickets.length} boletos`}`
            : 'Tus boletos estarán listos en un momento.'}
        </p>
      </div>

      {walletsTickets.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <RetroTicketWallet tickets={walletsTickets} />
        </div>
      )}

      <div className={`text-center ${vt323.className}`}>
        <Link
          href="/tickets"
          className="inline-block px-6 py-2 border-2 border-black bg-black text-amber-50 text-2xl tracking-widest uppercase hover:bg-zinc-800 transition-colors"
        >
          {'>'} Ir a mis boletos
        </Link>
      </div>
    </main>
  )
}

async function resolveResult(sessionId: string | undefined): Promise<PageResult> {
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
          await stripe.refunds.create({ payment_intent: paymentIntentId })
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

    const { data: rawTickets } = await admin
      .from('tickets')
      .select('id, qr_hash, tier_id, event_id')
      .eq('order_id', orderId)

    if (!rawTickets?.length) return { status: 'success', tickets: [] }

    const tierIds = [...new Set(rawTickets.map(t => t.tier_id))]
    const eventIds = [...new Set(rawTickets.map(t => t.event_id))]

    const [{ data: tiers }, { data: events }] = await Promise.all([
      admin.from('ticket_tiers').select('id, name, price').in('id', tierIds),
      admin.from('events').select('id, title, event_date, venue_id').in('id', eventIds),
    ])

    const venueIds = [...new Set((events ?? []).map(e => e.venue_id).filter((id): id is string => !!id))]
    const { data: venues } = venueIds.length
      ? await admin.from('venues').select('id, name, city').in('id', venueIds)
      : { data: [] as { id: string; name: string; city: string }[] }

    const tierMap = new Map((tiers ?? []).map(t => [t.id, t]))
    const venueMap = new Map((venues ?? []).map(v => [v.id, v]))
    const eventMap = new Map(
      (events ?? []).map(e => [
        e.id,
        { ...e, venue: e.venue_id ? (venueMap.get(e.venue_id) ?? null) : null },
      ])
    )

    const tickets: TicketData[] = rawTickets.map(t => {
      const ev = eventMap.get(t.event_id) ?? null
      const tier = tierMap.get(t.tier_id) ?? null
      return {
        id: t.id,
        qr_hash: t.qr_hash,
        eventTitle: ev?.title ?? 'Evento',
        eventDate: ev?.event_date ?? null,
        venueName: (ev?.venue as { name: string; city: string } | null)?.name ?? null,
        venueCity: (ev?.venue as { name: string; city: string } | null)?.city ?? null,
        tierName: tier?.name ?? null,
        tierPrice: tier ? Number(tier.price) : null,
      }
    })

    return { status: 'success', tickets }
  } catch (err) {
    console.error('[checkout/success] Error inesperado:', err)
    return { status: 'error' }
  }
}

function ticketDisplayNumber(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8)
  const num = (parseInt(hex, 16) % 9000) + 1000
  return String(num)
}
