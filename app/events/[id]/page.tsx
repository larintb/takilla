import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { CalendarDays, MapPin, Users, ArrowLeft, Ticket } from 'lucide-react'
import CheckoutPanel from './_components/checkout-panel'
import EventMap from './_components/event-map'

type VenueInfo = {
  name?: string | null
  city?: string | null
  address?: string | null
  capacity?: number | null
}

function AvailabilityBadge({ available, total }: { available: number; total: number }) {
  if (available === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
        Agotado
      </span>
    )
  }
  const pct = total > 0 ? (available / total) * 100 : 100
  if (pct <= 25) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
        Por agotarse
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
      Disponible
    </span>
  )
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

  const venue    = (event.venues ?? null) as VenueInfo | null
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

  const hasLocation = !!(event.location_lat && event.location_lng)

  const locationLabel = event.location_name
    ?? (venue?.name ? `${venue.name}${venue.city ? `, ${venue.city}` : ''}` : null)

  return (
    <div style={{ background: '#12111a', minHeight: '100vh' }}>
      {/* Full-width banner */}
      <div className="relative w-full h-64 md:h-[420px] overflow-hidden animate-fade-in" style={{ background: '#1a1a2e' }}>
        {imageUrl ? (
          <>
            <Image src={imageUrl} alt="" fill unoptimized aria-hidden
              className="object-cover scale-110 blur-2xl opacity-40" />
            <Image src={imageUrl} alt={event.title} fill unoptimized priority
              sizes="100vw" className="object-contain" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }}>
            <Ticket size={48} style={{ color: 'rgba(255,255,255,0.15)' }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-6">
          <div className="max-w-5xl mx-auto space-y-2">
            <h1 className="font-display text-white text-4xl md:text-6xl leading-none drop-shadow-md">
              {event.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-sm font-medium" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                <CalendarDays size={13} />
                {dateFormatted} · {timeFormatted}
              </span>
              {locationLabel && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-sm font-medium" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <MapPin size={13} />
                  {locationLabel}
                </span>
              )}
              {venue?.capacity && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-sm font-medium" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
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

        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors animate-fade-in-up hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <ArrowLeft size={14} />
          Todos los eventos
        </Link>

        <div className="grid md:grid-cols-3 gap-8 items-start animate-fade-in-up" style={{ animationDelay: '80ms' }}>

          {/* Left — event details */}
          <div className="md:col-span-2 space-y-6">
            {event.description && (
              <div className="pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Acerca del evento
                </h2>
                <p className="leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {event.description}
                </p>
              </div>
            )}

            {hasLocation && (
              <div className="pt-5 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <MapPin size={13} />
                  Ubicación
                </h2>
                <EventMap
                  lat={event.location_lat}
                  lng={event.location_lng}
                  locationName={event.location_name}
                />
              </div>
            )}

            {!hasLocation && venue?.address && (
              <div className="pt-5 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <MapPin size={13} />
                  Ubicación
                </h2>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {venue.address}{venue.city ? `, ${venue.city}` : ''}
                </p>
              </div>
            )}
          </div>

          {/* Right — tickets */}
          <div className="md:sticky md:top-6 space-y-3">
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ background: '#1e1d2a', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Boletos</p>
                {!isPast && minPrice !== null && (
                  <p className="text-2xl font-bold text-white mt-0.5">
                    {minPrice === 0 ? 'Gratis' : `Desde $${minPrice.toFixed(2)}`}
                  </p>
                )}
              </div>

              {isPast ? (
                <div className="rounded-xl px-4 py-5 text-center space-y-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Este evento ya terminó</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>La venta de boletos está cerrada</p>
                </div>
              ) : !tiers?.length ? (
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No hay boletos disponibles para este evento.</p>
              ) : (
                <div className="space-y-3">
                  {tiers.map(tier => {
                    const soldOut = tier.available_tickets === 0

                    return (
                      <div
                        key={tier.id}
                        className={`rounded-xl p-4 space-y-3 transition-opacity ${soldOut ? 'opacity-40' : ''}`}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 space-y-1">
                            <p className="font-semibold text-white truncate">{tier.name}</p>
                            <AvailabilityBadge
                              available={tier.available_tickets}
                              total={tier.total_capacity}
                            />
                          </div>
                          <p className="text-xl font-bold text-white shrink-0">
                            {Number(tier.price) === 0 ? 'Gratis' : `$${Number(tier.price).toFixed(2)}`}
                          </p>
                        </div>

                        {soldOut ? (
                          <p className="w-full text-center py-2 text-sm font-medium rounded-lg" style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' }}>
                            Agotado
                          </p>
                        ) : user ? (
                          <CheckoutPanel eventId={id} tierId={tier.id} availableTickets={tier.available_tickets} />
                        ) : (
                          <Link
                            href={`/login?next=/events/${id}`}
                            className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-all hover:opacity-80"
                            style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
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
    </div>
  )
}