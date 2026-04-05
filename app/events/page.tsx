'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'

const CATEGORIES = [
  { value: 'all',         label: 'Todos',         img: null },
  { value: 'musica',      label: 'Música',        img: '/images/musica.2.png'        },
  { value: 'arte',        label: 'Arte',          img: '/images/arte.2.png'          },
  { value: 'social',      label: 'Evento social', img: '/images/evento social.png'   },
  { value: 'nocturna',    label: 'Vida nocturna', img: '/images/vida nocturna.2.png' },
  { value: 'otro',        label: 'Otro',          img: null },
]

interface Event {
  id: string
  title: string
  description: string
  event_date: string
  image_url: string | null
  category: string | null
  venues: { name: string; city: string } | null
  ticket_tiers: { price: number }[]
}

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
  const catLabel = CATEGORIES.find(c => c.value === event.category)?.label

  return (
    <Link
      href={`/events/${event.id}`}
      className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl animate-fade-in-up flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div className="relative h-48 overflow-hidden shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
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
            <Ticket size={36} style={{ color: 'rgba(255,255,255,0.15)' }} />
          </div>
        )}
        {catLabel && event.category !== 'otro' && (
          <span
            className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm text-white"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {catLabel}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="font-semibold text-white leading-snug line-clamp-2 transition-opacity group-hover:opacity-85 text-base">
          {event.title}
        </p>
        <div className="space-y-1 text-sm flex-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          <p className="flex items-center gap-1.5">
            <CalendarDays size={13} className="shrink-0" style={{ color: 'var(--color-pink)' }} />
            {new Date(event.event_date).toLocaleDateString('es-MX', {
              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
          {venue?.name && (
            <p className="flex items-center gap-1.5">
              <MapPin size={13} className="shrink-0" style={{ color: 'var(--color-pink)' }} />
              {venue.name}, {venue.city}
            </p>
          )}
        </div>
        <div className="pt-3 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p
            className="text-sm font-bold"
            style={{
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {minPrice === null ? 'Sin tiers' : minPrice === 0 ? 'Gratis' : `Desde $${minPrice.toFixed(2)}`}
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function EventsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialCategory = searchParams.get('category') ?? 'all'

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const supabase = createClient()

  function handleCategoryChange(value: string) {
    setActiveCategory(value)
    if (value === 'all') router.replace('/events')
    else router.replace(`/events?category=${value}`)
  }

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      let query = supabase
        .from('events')
        .select(`id, title, description, event_date, image_url, category, venues(name, city), ticket_tiers(price)`)
        .eq('status', 'published')
        .gt('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })

      if (activeCategory !== 'all') query = query.eq('category', activeCategory)

      const { data } = await query
      setEvents((data ?? []) as unknown as Event[])
      setLoading(false)
    }
    fetchEvents()
  }, [activeCategory, supabase])

  const activeCatLabel = CATEGORIES.find(c => c.value === activeCategory)?.label ?? 'Eventos'

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      {/* Banner */}
      <section
        className="text-white w-full px-4 py-16 animate-fade-in"
        style={{ background: 'var(--hero-gradient)' }}
      >
        <div className="max-w-6xl mx-auto space-y-2">
          <h1 className="font-display text-5xl leading-tight">
            {activeCategory === 'all' ? 'Todos los eventos' : activeCatLabel}
          </h1>
          <p className="text-base max-w-xl" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Conciertos, festivales y eventos en vivo cerca de ti.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.value
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold outline-none"
                style={isActive ? {
                  background: 'var(--accent-gradient)',
                  backgroundClip: 'padding-box',
                  color: 'white',
                  boxShadow: '0 0 20px rgba(114,13,152,0.35)',
                  border: '1px solid transparent',
                } : {
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'background 150ms, color 150ms',
                }}
              >
                {cat.img && (
                  <Image src={cat.img} alt={cat.label} width={16} height={16} className="rounded-sm brightness-0 invert" />
                )}
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {events.length === 0
              ? 'Sin resultados'
              : `${events.length} evento${events.length !== 1 ? 's' : ''} encontrado${events.length !== 1 ? 's' : ''}`
            }
          </p>
        )}

        {/* Skeleton */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="h-48" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="p-4 space-y-3">
                  <div className="h-4 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-3 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-3 rounded w-1/3" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
              </div>
            ))}
          </div>

        ) : !events.length ? (
          <div className="text-center py-24">
            <Ticket size={40} className="mx-auto mb-3 opacity-20 text-white" />
            <p className="font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>No hay eventos en esta categoría</p>
            {activeCategory !== 'all' && (
              <button
                onClick={() => handleCategoryChange('all')}
                className="mt-3 text-sm font-medium hover:opacity-70 transition-opacity"
                style={{
                  background: 'var(--accent-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Ver todos los eventos →
              </button>
            )}
          </div>

        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
              <EventCard key={event.id} event={event} supabase={supabase} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}