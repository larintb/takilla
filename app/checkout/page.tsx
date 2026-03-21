import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { ArrowLeft, CalendarDays, MapPin, Ticket } from 'lucide-react'
import Navbar from '@/components/navbar'
import { startStripeCheckout } from './actions'
import SubmitButton from './_components/submit-button'

type CheckoutPageProps = {
  searchParams: Promise<{
    eventId?: string
    tierId?: string
    quantity?: string
  }>
}

type VenueInfo = { name?: string | null; city?: string | null }
type EventInfo = {
  title: string
  status: string
  event_date: string
  image_url?: string | null
  venues?: VenueInfo | VenueInfo[] | null
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams
  const eventId = params.eventId?.trim()
  const tierId = params.tierId?.trim()
  const quantityParsed = Number(params.quantity)
  const quantity = Number.isInteger(quantityParsed) ? quantityParsed : 1

  if (!eventId || !tierId) redirect('/events')

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/checkout?eventId=${eventId}&tierId=${tierId}&quantity=${quantity}`)

  const { data: tier } = await supabase
    .from('ticket_tiers')
    .select('id, name, price, available_tickets, event_id, events(title, status, event_date, image_url, venues(name, city))')
    .eq('id', tierId)
    .eq('event_id', eventId)
    .single()

  if (!tier) redirect(`/events/${eventId}`)

  const event = (Array.isArray(tier.events) ? tier.events[0] : tier.events) as EventInfo | null
  if (!event || event.status !== 'published') redirect(`/events/${eventId}`)

  const cappedQuantity = Math.min(Math.max(quantity, 1), 10)
  const finalQuantity = Math.min(cappedQuantity, tier.available_tickets)
  if (finalQuantity < 1) redirect(`/events/${eventId}`)

  const price = Number(tier.price)
  const total = price * finalQuantity
  const isFree = price === 0

  const venue = (Array.isArray(event.venues) ? event.venues[0] : event.venues) as VenueInfo | null
  const imageUrl = resolveEventImageUrl(supabase, event.image_url ?? null)
  const dateFormatted = new Date(event.event_date).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-4">

          {/* Back */}
          <Link
            href={`/events/${eventId}`}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={14} />
            Volver al evento
          </Link>

          {/* Main card */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">

            {/* Event header */}
            <div className="flex gap-4 p-5 border-b border-zinc-100">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={event.title}
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Ticket size={20} className="text-zinc-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 leading-snug line-clamp-2">
                  {event.title}
                </p>
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <CalendarDays size={11} />
                  {dateFormatted}
                </p>
                {venue?.name && (
                  <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                    <MapPin size={11} />
                    {venue.name}{venue.city ? `, ${venue.city}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Order summary */}
            <div className="p-5 space-y-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Resumen
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600">Tier</span>
                  <span className="font-medium text-zinc-900">{tier.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600">Precio unitario</span>
                  <span className="font-medium text-zinc-900">
                    {isFree ? 'Gratis' : `$${price.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600">Cantidad</span>
                  <span className="font-medium text-zinc-900">
                    {finalQuantity} {finalQuantity === 1 ? 'boleto' : 'boletos'}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <span className="font-semibold text-zinc-900">Total</span>
                <span className="text-2xl font-bold text-zinc-900">
                  {isFree ? 'Gratis' : `$${total.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 pb-5 space-y-3">
              <form action={startStripeCheckout}>
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="tierId" value={tierId} />
                <input type="hidden" name="quantity" value={String(finalQuantity)} />

                <SubmitButton
                  label={isFree ? 'Confirmar boletos gratis' : `Pagar $${total.toFixed(2)}`}
                />
              </form>

              <p className="text-xs text-zinc-400 text-center leading-relaxed">
                {isFree
                  ? 'Tus boletos se generarán al confirmar.'
                  : 'Pago seguro procesado por Stripe. Serás redirigido para completar tu compra.'}
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
