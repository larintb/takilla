import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl, resolveAvatarUrl } from '@/utils/supabase/storage'
import { CalendarDays, MapPin, Users, ArrowLeft, Ticket, Store } from 'lucide-react'
import EventPurchasePanel from './_components/event-purchase-panel'
import EventMap from './_components/event-map'
import Avatar from '@/components/avatar'
import { isEventOver } from '@/utils/event-time'

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
    { data: perks },
  ] = await Promise.all([
    supabase.from('events').select('*, venues(name, city, address, capacity), organizer:profiles!organizer_id(id, business_name, avatar_url, public_slug)').eq('id', id).eq('status', 'published').single(),
    supabase.from('ticket_tiers').select('*').eq('event_id', id).order('price'),
    supabase.auth.getUser(),
    supabase.from('perks').select('id, name, price, description, image_url').eq('event_id', id).order('price'),
  ])

  if (!event) notFound()

  const hasExistingTicket = user
    ? ((await supabase.from('tickets').select('id').eq('owner_id', user.id).eq('event_id', id).limit(1).maybeSingle()).data !== null)
    : false

  const venue      = (event.venues ?? null) as VenueInfo | null
  const imageUrl   = resolveEventImageUrl(supabase, event.image_url)
  const organizerRaw = Array.isArray(event.organizer) ? event.organizer[0] : event.organizer
  const organizer  = organizerRaw as { id: string; business_name: string | null; avatar_url: string | null; public_slug: string | null } | null
  const avatarUrl  = resolveAvatarUrl(supabase, organizer?.avatar_url)

  const dateFormatted = new Date(event.event_date).toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
  const timeFormatted = new Date(event.event_date).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  })

  const isPast = isEventOver(event.event_date, event.event_end_date)
  const hasLocation = !!(event.location_lat && event.location_lng)
  const locationLabel = event.location_name
    ?? (venue?.name ? `${venue.name}${venue.city ? `, ${venue.city}` : ''}` : null)

  return (
    <div className="w-full min-h-screen overflow-x-hidden" style={{ background: 'var(--background)' }}>

      {/* ── Banner ─────────────────────────────────────────────── */}
      <div className="relative w-full h-60 sm:h-80 md:h-[420px] overflow-hidden animate-fade-in"
        style={{ background: 'var(--color-deep-purple)' }}>
        {imageUrl ? (
          <>
            <Image src={imageUrl} alt="" fill unoptimized aria-hidden
              className="object-cover blur-2xl opacity-40 scale-110" />
            <Image src={imageUrl} alt={event.title} fill unoptimized priority
              sizes="100vw" className="object-contain" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'var(--hero-gradient)' }}>
            <Ticket size={48} style={{ color: 'rgba(255,255,255,0.15)' }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 px-4 pb-5 sm:px-6 sm:pb-7">
          <h1
            className="font-display text-white font-bold leading-tight break-words"
            style={{ fontSize: 'clamp(1.4rem, 5vw, 3.5rem)' }}
          >
            {event.title}
          </h1>

          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full text-white"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
              <CalendarDays size={11} className="shrink-0" />
              <span className="truncate max-w-[180px] sm:max-w-none">{dateFormatted} · {timeFormatted}</span>
            </span>
            {locationLabel && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full text-white"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                <MapPin size={11} className="shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-none">{locationLabel}</span>
              </span>
            )}
            {venue?.capacity && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full text-white"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                <Users size={11} className="shrink-0" />
                {venue.capacity.toLocaleString('es-MX')} personas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Page content ───────────────────────────────────────── */}
      <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8">

        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-opacity hover:opacity-70 animate-fade-in-up"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <ArrowLeft size={14} />
          Todos los eventos
        </Link>

        <div className="flex flex-col md:grid md:grid-cols-3 md:gap-8 md:items-start gap-6 animate-fade-in-up"
          style={{ animationDelay: '80ms' }}>

          {/* ── Left: description + map ─────────────────────── */}
          <div className="md:col-span-2 min-w-0 space-y-6">

            {event.description && (
              <div className="pt-5 min-w-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Acerca del evento
                </h2>
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                  style={{ color: 'rgba(255,255,255,0.7)', overflowWrap: 'anywhere' }}>
                  {event.description}
                </p>
              </div>
            )}

            {organizer?.public_slug && organizer?.business_name && (
              <div className="pt-5 min-w-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <Link
                  href={`/o/${organizer.public_slug}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-white/5 -mx-4"
                >
                  <Avatar name={organizer.business_name} src={avatarUrl} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Organizado por
                    </p>
                    <p className="text-sm font-semibold text-white truncate">{organizer.business_name}</p>
                  </div>
                  <Store size={15} style={{ color: 'rgba(255,255,255,0.25)' }} className="shrink-0" />
                </Link>
              </div>
            )}

            {hasLocation && (
              <div className="pt-5 min-w-0 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <MapPin size={13} />
                  Ubicación
                </h2>
                <div className="w-full overflow-hidden rounded-xl">
                  <EventMap
                    lat={event.location_lat}
                    lng={event.location_lng}
                    locationName={event.location_name}
                  />
                </div>
              </div>
            )}

            {!hasLocation && venue?.address && (
              <div className="pt-5 min-w-0 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <MapPin size={13} />
                  Ubicación
                </h2>
                <p className="text-sm break-words" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {venue.address}{venue.city ? `, ${venue.city}` : ''}
                </p>
              </div>
            )}
          </div>

          {/* ── Right: tickets ──────────────────────────────── */}
          <div className="min-w-0 md:sticky md:top-6">
            {!tiers?.length ? (
              <div className="rounded-2xl p-5 text-center"
                style={{ background: 'var(--surface-panel)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  No hay boletos disponibles para este evento.
                </p>
              </div>
            ) : (
              <EventPurchasePanel
                eventId={id}
                tiers={tiers.map(t => ({
                  id: t.id,
                  name: t.name,
                  price: Number(t.price),
                  available_tickets: t.available_tickets,
                  total_capacity: t.total_capacity,
                  description: t.description ?? null,
                  effect: t.effect ?? null,
                }))}
                perks={(perks ?? []).map(p => ({
                  id: p.id,
                  name: p.name,
                  price: Number(p.price),
                  description: p.description ?? null,
                  imageUrl: p.image_url ? resolveEventImageUrl(supabase, p.image_url) : null,
                }))}
                isPast={isPast}
                isLoggedIn={!!user}
                loginRedirect={`/login?next=/events/${id}`}
                hasExistingTicket={hasExistingTicket}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}