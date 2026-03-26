'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Event {
  id: string
  title: string
  description: string
  event_date: string
  image_url: string | null
  venues: { name: string; city: string; state?: string } | null
  ticket_tiers: { price: number }[]
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, supabase, index }: {
  event: Event
  supabase: ReturnType<typeof createClient>
  index: number
}) {
  const venue = event.venues
  const tiers = event.ticket_tiers ?? []
  const prices = tiers.map(t => Number(t.price))
  const minPrice = prices.length ? Math.min(...prices) : null
  const imageUrl = resolveEventImageUrl(supabase, event.image_url)

  return (
    <Link
      href={`/events/${event.id}`}
      className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-zinc-400 hover:shadow-sm transition-all animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative h-44 bg-zinc-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ticket size={32} className="text-zinc-300" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <p className="font-semibold text-zinc-900 leading-snug line-clamp-2 group-hover:text-zinc-700">
          {event.title}
        </p>
        <div className="space-y-1 text-sm text-zinc-500">
          <p className="flex items-center gap-1.5">
            <CalendarDays size={13} />
            {new Date(event.event_date).toLocaleDateString('es-MX', {
              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
          {venue?.name && (
            <p className="flex items-center gap-1.5">
              <MapPin size={13} />
              {venue.name}, {venue.city}
              {venue.state ? `, ${venue.state}` : ''}
            </p>
          )}
        </div>
        <div className="pt-2 border-t border-zinc-100">
          <p className="text-sm font-semibold text-zinc-900">
            {minPrice === null ? 'Sin tiers' : minPrice === 0 ? 'Gratis' : `Desde $${minPrice.toFixed(2)}`}
          </p>
        </div>
      </div>
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, title, description, event_date, image_url,
          venues(name, city, state),
          ticket_tiers(price)
        `)
        .gt('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })

      console.log('eventos:', data)
      console.log('error:', error)

      setEvents((data ?? []) as unknown as Event[])
      setLoading(false)
    }
    fetchEvents()
  }, [])

  return (
    <>
      {/* Banner */}
      <section className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white -mx-4 -mt-10 mb-10 px-4 py-16 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-3">
          <p className="text-white/70 text-sm font-medium uppercase tracking-widest animate-fade-in-up" style={{ animationDelay: '60ms' }}>
            Plataforma de boletos regional
          </p>
          <h1 className="font-display text-5xl font-bold leading-none animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            Todos los eventos
          </h1>
          <p className="text-white/80 text-lg max-w-xl animate-fade-in-up" style={{ animationDelay: '180ms' }}>
            Conciertos, festivales y eventos en vivo cerca de ti.
          </p>
        </div>
      </section>

      <div className="space-y-6">
        {/* Skeleton */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden animate-pulse">
                <div className="h-44 bg-zinc-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-zinc-100 rounded w-3/4" />
                  <div className="h-3 bg-zinc-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>

        ) : !events.length ? (
          <div className="text-center py-24 text-zinc-400">
            <Ticket size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No hay eventos próximos por el momento</p>
            <p className="text-sm mt-1">Vuelve pronto</p>
          </div>

        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
              <EventCard key={event.id} event={event} supabase={supabase} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}