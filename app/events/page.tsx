'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'

// ─── Categories ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'all',         label: 'Todos',         img: null },
  { value: 'musica',      label: 'Música',        img: '/images/musica.2.png'        },
  { value: 'arte',        label: 'Arte',          img: '/images/arte.2.png'          },
  { value: 'social',      label: 'Evento social', img: '/images/evento social.png'   },
  { value: 'nocturna',    label: 'Vida nocturna', img: '/images/vida nocturna.2.png' },
  { value: 'deporte',     label: 'Deporte',       img: null },
  { value: 'gastronomia', label: 'Gastronomía',   img: null },
  { value: 'otro',        label: 'Otro',          img: null },
]

// ─── Types ────────────────────────────────────────────────────────────────────

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
  const catLabel = CATEGORIES.find(c => c.value === event.category)?.label

  return (
    <Link
      href={`/events/${event.id}`}
      className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-orange-300 hover:shadow-md transition-all duration-200 animate-fade-in-up flex flex-col"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image */}
      <div className="relative h-48 bg-zinc-100 overflow-hidden shrink-0">
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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
            <Ticket size={36} className="text-zinc-300" />
          </div>
        )}
        {/* Category badge over image */}
        {catLabel && event.category !== 'otro' && (
          <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
            {catLabel}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="font-semibold text-zinc-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors text-base">
          {event.title}
        </p>
        <div className="space-y-1 text-sm text-zinc-500 flex-1">
          <p className="flex items-center gap-1.5">
            <CalendarDays size={13} className="shrink-0 text-orange-400" />
            {new Date(event.event_date).toLocaleDateString('es-MX', {
              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
          {venue?.name && (
            <p className="flex items-center gap-1.5">
              <MapPin size={13} className="shrink-0 text-orange-400" />
              {venue.name}, {venue.city}
            </p>
          )}
        </div>
        <div className="pt-3 border-t border-zinc-100 mt-1">
          <p className="text-sm font-bold text-zinc-900">
            {minPrice === null ? 'Sin tiers' : minPrice === 0 ? 'Gratis' : `Desde $${minPrice.toFixed(2)}`}
          </p>
        </div>
      </div>
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
    if (value === 'all') {
      router.replace('/events')
    } else {
      router.replace(`/events?category=${value}`)
    }
  }

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      let query = supabase
        .from('events')
        .select(`
          id, title, description, event_date, image_url, category,
          venues(name, city),
          ticket_tiers(price)
        `)
        .eq('status', 'published')
        .gt('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory)
      }

      const { data } = await query
      setEvents((data ?? []) as unknown as Event[])
      setLoading(false)
    }
    fetchEvents()
  }, [activeCategory])

  const activeCatLabel = CATEGORIES.find(c => c.value === activeCategory)?.label ?? 'Eventos'

  return (
    <>
      {/* Banner — full width */}
      <section className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white w-full mb-10 px-4 py-16 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-2">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">
            Plataforma de boletos regional
          </p>
          <h1 className="font-display text-5xl font-bold leading-tight">
            {activeCategory === 'all' ? 'Todos los eventos' : activeCatLabel}
          </h1>
          <p className="text-white/80 text-base max-w-xl">
            Conciertos, festivales y eventos en vivo cerca de ti.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 space-y-8">

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.value
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white border-transparent shadow-sm'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                {cat.img && (
                  <Image src={cat.img} alt={cat.label} width={16} height={16} className="rounded-sm" />
                )}
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-zinc-400">
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
              <div key={i} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden animate-pulse">
                <div className="h-48 bg-zinc-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-zinc-100 rounded w-3/4" />
                  <div className="h-3 bg-zinc-100 rounded w-1/2" />
                  <div className="h-3 bg-zinc-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>

        ) : !events.length ? (
          <div className="text-center py-24 text-zinc-400">
            <Ticket size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium text-zinc-600">No hay eventos en esta categoría</p>
            {activeCategory !== 'all' && (
              <button
                onClick={() => handleCategoryChange('all')}
                className="mt-3 text-sm text-orange-500 hover:text-orange-600 hover:underline transition-colors"
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
    </>
  )
}