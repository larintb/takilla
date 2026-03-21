import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { CalendarDays, MapPin, Users, ArrowLeft, Ticket } from 'lucide-react'
import CheckoutPanel from './_components/checkout-panel'

type VenueInfo = {
  name?: string | null
  city?: string | null
  address?: string | null
  capacity?: number | null
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [
    { data: event },
    { data: tiers },
    { data: { user } },
  ] = await Promise.all([
    supabase.from('events').select('*, venues(name, city, address, capacity)').eq('id', id).eq('status', 'published').single(),
    supabase.from('ticket_tiers').select('*').eq('event_id', id).order('price'),
    supabase.auth.getUser(),
  ])

  if (!event) notFound()

  const venue = (event.venues ?? null) as VenueInfo | null
  const imageUrl = resolveEventImageUrl(supabase, event.image_url)

  const dateFormatted = new Date(event.event_date).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeFormatted = new Date(event.event_date).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  })

  const isPast = new Date(event.event_date) < new Date()

  const minPrice = tiers?.length
    ? Math.min(...tiers.map(t => Number(t.price)))
    : null

  return (
    <>
      {/* Full-width banner with blur-edges effect */}
      <div className="relative w-full h-64 md:h-[420px] overflow-hidden bg-zinc-900">
        {imageUrl ? (
          <>
            {/* Blurred background layer — same image scaled up, fills gaps */}
            <Image
              src={imageUrl}
              alt=""
              fill
              unoptimized
              aria-hidden
              className="object-cover scale-110 blur-2xl opacity-60"
            />
            {/* Sharp foreground image — contained so nothing is cropped */}
            <Image
              src={imageUrl}
              alt={event.title}
              fill
              unoptimized
              priority
              sizes="100vw"
              className="object-contain"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ticket size={48} className="text-zinc-700" />
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {/* Event title + chips overlaid at bottom */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-6">
          <div className="max-w-5xl mx-auto space-y-2">
            <h1 className="text-white text-2xl md:text-4xl font-bold leading-tight drop-shadow-md">
              {event.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium">
                <CalendarDays size={13} />
                {dateFormatted} · {timeFormatted}
              </span>
              {venue?.name && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium">
                  <MapPin size={13} />
                  {venue.name}{venue.city ? `, ${venue.city}` : ''}
                </span>
              )}
              {venue?.capacity && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium">
                  <Users size={13} />
                  {venue.capacity.toLocaleString('es-MX')} personas
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Back */}
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={14} />
          Todos los eventos
        </Link>

        {/* Two-column layout: info + tickets */}
        <div className="grid md:grid-cols-3 gap-8 items-start">

          {/* Left — event details (2/3) */}
          <div className="md:col-span-2 space-y-6">
            {/* Address */}
            {venue?.address && (
              <p className="text-sm text-zinc-500">
                {venue.address}{venue.city ? `, ${venue.city}` : ''}
              </p>
            )}

            {/* Description */}
            {event.description && (
              <div className="border-t border-zinc-100 pt-5">
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Acerca del evento
                </h2>
                <p className="text-zinc-700 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* Right — tickets card (1/3), sticky on desktop */}
          <div className="md:sticky md:top-6 space-y-3">
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Boletos
                </p>
                {!isPast && minPrice !== null && (
                  <p className="text-2xl font-bold text-zinc-900 mt-0.5">
                    {minPrice === 0 ? 'Gratis' : `Desde $${minPrice.toFixed(2)}`}
                  </p>
                )}
              </div>

              {isPast ? (
                <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-5 text-center space-y-1">
                  <p className="text-sm font-semibold text-zinc-500">Este evento ya terminó</p>
                  <p className="text-xs text-zinc-400">La venta de boletos está cerrada</p>
                </div>
              ) : !tiers?.length ? (
                <p className="text-sm text-zinc-400">
                  No hay boletos disponibles para este evento.
                </p>
              ) : (
                <div className="space-y-3">
                  {tiers.map(tier => {
                    const soldOut = tier.available_tickets === 0
                    const pct = tier.total_capacity > 0
                      ? ((tier.total_capacity - tier.available_tickets) / tier.total_capacity) * 100
                      : 0

                    return (
                      <div
                        key={tier.id}
                        className={`rounded-xl border p-4 space-y-3 transition-opacity ${
                          soldOut ? 'border-zinc-100 opacity-50' : 'border-zinc-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900 truncate">{tier.name}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {tier.available_tickets} de {tier.total_capacity} disponibles
                            </p>
                          </div>
                          <p className="text-xl font-bold text-zinc-900 shrink-0">
                            {Number(tier.price) === 0 ? 'Gratis' : `$${Number(tier.price).toFixed(2)}`}
                          </p>
                        </div>

                        {/* Availability bar */}
                        <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-800 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {soldOut ? (
                          <p className="w-full text-center py-2 text-sm font-medium text-zinc-400 bg-zinc-50 rounded-lg">
                            Agotado
                          </p>
                        ) : user ? (
                          <CheckoutPanel
                            eventId={id}
                            tierId={tier.id}
                            availableTickets={tier.available_tickets}
                          />
                        ) : (
                          <Link
                            href={`/login?next=/events/${id}`}
                            className="block w-full py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-sm font-semibold text-center hover:bg-zinc-50 transition-colors"
                          >
                            Inicia sesión para comprar
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
