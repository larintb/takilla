import Image from 'next/image'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'
import { startStripeCheckout } from './actions'
import SubmitButton from './_components/submit-button'
import PaymentForm from './_components/payment-form'
import BackButton from './_components/back-button'
import { calculateFees, calculatePerkFees } from '@/utils/pricing'
import { isEventOver } from '@/utils/event-time'

type CheckoutPageProps = {
  searchParams: Promise<{
    eventId?: string
    tierId?: string
    quantity?: string
    perks?: string    // CSV of perk IDs (with repetitions for qty)
  }>
}

type VenueInfo = { name?: string | null; city?: string | null }
type EventInfo = {
  title: string
  status: string
  event_date: string
  event_end_date?: string | null
  image_url?: string | null
  venues?: VenueInfo | VenueInfo[] | null
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params         = await searchParams
  const eventId        = params.eventId?.trim()
  const tierId         = params.tierId?.trim()
  const quantityParsed = Number(params.quantity)
  const quantity       = Number.isInteger(quantityParsed) ? quantityParsed : 1
  const perksCsv       = params.perks?.trim() || ''
  const perkIds        = perksCsv ? perksCsv.split(',').map(s => s.trim()).filter(Boolean) : []

  if (!eventId || !tierId) redirect('/events')

  const cookieStore = await cookies()
  const supabase    = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/checkout?eventId=${eventId}&tierId=${tierId}&quantity=${quantity}`)

  const { data: tier } = await supabase
    .from('ticket_tiers')
    .select('id, name, price, available_tickets, event_id, events(title, status, event_date, event_end_date, image_url, venues(name, city))')
    .eq('id', tierId)
    .eq('event_id', eventId)
    .single()

  if (!tier) redirect(`/events/${eventId}`)

  const event = (Array.isArray(tier.events) ? tier.events[0] : tier.events) as EventInfo | null
  if (!event || event.status !== 'published') redirect(`/events/${eventId}`)
  if (isEventOver(event.event_date, event.event_end_date)) redirect(`/events/${eventId}`)

  const cappedQuantity = Math.min(Math.max(quantity, 1), 10)
  const finalQuantity  = Math.min(cappedQuantity, tier.available_tickets)
  if (finalQuantity < 1) redirect(`/events/${eventId}`)

  const price  = Number(tier.price)

  // Fetch and validate perks if present
  type PerkRow = { id: string; name: string; price: number }
  let perkRows: PerkRow[] = []
  if (perkIds.length > 0) {
    const uniqueIds = [...new Set(perkIds)]
    const { data: fetchedPerks } = await supabase
      .from('perks')
      .select('id, name, price')
      .in('id', uniqueIds)
      .eq('event_id', eventId)
    if (fetchedPerks) perkRows = fetchedPerks.map(p => ({ ...p, price: Number(p.price) }))
    // Drop any perk IDs not found (safety)
    const validIds = new Set(perkRows.map(p => p.id))
    perkIds.splice(0, perkIds.length, ...perkIds.filter(id => validIds.has(id)))
  }

  // Compute perk total: solo 5% de plataforma, sin gross-up de Stripe
  const perkFees = perkRows.length > 0
    ? perkIds.reduce((sum, id) => {
        const perk = perkRows.find(p => p.id === id)
        if (!perk || perk.price === 0) return sum
        return sum + calculatePerkFees(perk.price, 1).unitAmountCentavos / 100
      }, 0)
    : 0

  const ticketIsFree = price === 0
  const perkIsFree   = perkFees === 0
  const isFree       = ticketIsFree && perkIsFree
  const fees         = ticketIsFree ? null : calculateFees(price, finalQuantity)
  const total        = (fees ? fees.totalAmount : 0) + perkFees

  const venue        = (Array.isArray(event.venues) ? event.venues[0] : event.venues) as VenueInfo | null
  const imageUrl     = resolveEventImageUrl(supabase, event.image_url ?? null)
  const dateFormatted = new Date(event.event_date).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <main className="flex-1 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">

        {/* Back */}
        <BackButton href={`/events/${eventId}`} hasPayment={!isFree} />

        {/* Card */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface-panel)', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Event header */}
          <div className="flex gap-4 p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              {imageUrl ? (
                <Image src={imageUrl} alt={event.title} fill unoptimized sizes="80px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Ticket size={28} style={{ color: 'rgba(255,255,255,0.2)' }} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-lg leading-snug line-clamp-2">
                {event.title}
              </p>
              <p className="text-sm mt-1.5 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <CalendarDays size={13} />
                {dateFormatted}
              </p>
              {venue?.name && (
                <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <MapPin size={13} />
                  {venue.name}{venue.city ? `, ${venue.city}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Order summary */}
          <div className="p-6 space-y-5">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Resumen
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>Tier</span>
                <span className="text-base font-semibold text-white">{tier.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>Precio del boleto</span>
                <span className="text-base font-semibold text-white">
                  {ticketIsFree ? 'FREE' : `$${price.toFixed(2)}`}
                </span>
              </div>
              {fees && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Cargo por servicio</span>
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    +${fees.serviceChargePerTicket.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>Cantidad</span>
                <span className="text-base font-semibold text-white">
                  {finalQuantity} {finalQuantity === 1 ? 'boleto' : 'boletos'}
                </span>
              </div>

              {/* Perks line items */}
              {perkIds.length > 0 && (
                <div className="pt-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-xs font-bold uppercase tracking-widest block"
                    style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Extras
                  </span>
                  {(() => {
                    const counts = new Map<string, number>()
                    for (const id of perkIds) counts.set(id, (counts.get(id) ?? 0) + 1)
                    return [...counts.entries()].map(([id, qty]) => {
                      const perk = perkRows.find(p => p.id === id)
                      if (!perk) return null
                      const unitWithFee = perk.price === 0 ? 0 : calculatePerkFees(perk.price, 1).unitTotal
                      return (
                        <div key={id} className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {perk.name} × {qty}
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            {perk.price === 0 ? 'FREE' : `$${(unitWithFee * qty).toFixed(2)}`}
                          </span>
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-lg font-semibold text-white">Total</span>
              <span className="font-bold text-white" style={{ fontSize: '2rem' }}>
                {isFree ? 'FREE' : `$${total.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="px-6 pb-6 space-y-3">
            {isFree ? (
              <>
                <form action={startStripeCheckout}>
                  <input type="hidden" name="eventId"  value={eventId} />
                  <input type="hidden" name="tierId"   value={tierId} />
                  <input type="hidden" name="quantity" value={String(finalQuantity)} />
                  {perkIds.length > 0 && (
                    <input type="hidden" name="perks" value={perkIds.join(',')} />
                  )}
                  <SubmitButton label="Confirmar boletos · FREE" />
                </form>
                <p className="text-sm text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Tus boletos se generarán al confirmar.
                </p>
              </>
            ) : (
              <PaymentForm
                eventId={eventId}
                tierId={tierId}
                quantity={finalQuantity}
                perkIds={perkIds}
                totalLabel={`$${total.toFixed(2)} MXN`}
              />
            )}
          </div>

        </div>
      </div>
    </main>
  )
}
