'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Ticket, CalendarDays, MapPin } from 'lucide-react'
import type { EventItem } from '../page'

const CATEGORIES = [
  { value: 'all',      label: 'Todos'         },
  { value: 'musica',   label: 'Música'        },
  { value: 'arte',     label: 'Arte'          },
  { value: 'social',   label: 'Social'        },
  { value: 'nocturna', label: 'Nocturna'      },
  { value: 'otro',     label: 'Otro'          },
]


function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' }).toUpperCase() +
    ' · ' +
    d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }).toUpperCase()
}

function EventCard({ event, index }: { event: EventItem; index: number }) {
  const catLabel = CATEGORIES.find(c => c.value === event.category)?.label

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      {/* Portrait image */}
      <div className="relative aspect-[7/5] rounded-2xl overflow-hidden mb-3">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            unoptimized
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: '#1a1a1a' }}>
            <Ticket size={32} style={{ color: 'rgba(255,255,255,0.15)' }} />
          </div>
        )}
        {/* Bottom overlay for chips legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Category chip */}
        {catLabel && event.category !== 'otro' && (
          <div className="absolute bottom-2.5 left-2.5">
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
              style={{
                background:    'var(--accent-gradient)',
              }}
            >
              {catLabel}
            </span>
          </div>
        )}

        {/* Price chip (bottom-right) */}
        {event.min_price !== null && (
          <div className="absolute bottom-2.5 right-2.5">
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
              style={{ background: 'var(--accent-gradient)' }}
            >
              {event.min_price === 0 ? 'FREE' : `$${event.min_price.toFixed(0)}`}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-0.5 px-0.5">
        <h3
          className="text-sm font-bold leading-snug line-clamp-2 group-hover:opacity-75 transition-opacity"
          style={{ color: '#f4f1ff' }}
        >
          {event.title}
        </h3>
        <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          <CalendarDays size={11} className="shrink-0" style={{ color: 'var(--color-pink)' }} />
          {formatDate(event.event_date)}
        </p>
        {event.venue_name && (
          <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <MapPin size={11} className="shrink-0" style={{ color: 'var(--color-pink)' }} />
            {event.venue_name}
          </p>
        )}
      </div>
    </Link>
  )
}

export default function EventsClient({
  events,
  initialCategory,
}: {
  events: EventItem[]
  initialCategory: string
}) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [query, setQuery] = useState('')

  function handleCategory(value: string) {
    setActiveCategory(value)
    if (value === 'all') router.replace('/events', { scroll: false })
    else router.replace(`/events?category=${value}`, { scroll: false })
  }

  const filtered = useMemo(() => {
    let list = events
    if (activeCategory !== 'all') list = list.filter(e => e.category === activeCategory)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.venue_name ?? '').toLowerCase().includes(q) ||
        (e.venue_city ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [events, activeCategory, query])

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Sticky subheader */}
      <div
        className="sticky top-16 z-30 px-4 pt-4 pb-3 space-y-3"
        style={{
          background:           'rgba(10,10,10,0.92)',
          backdropFilter:       'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom:         '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Search */}
        <div className="relative group max-w-6xl mx-auto">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-pink-500 transition-colors" />
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar eventos, lugares..."
            className="w-full rounded-full py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-pink-500/40"
            style={{ background: '#1a1a1a', color: '#f4f1ff' }}
          />
        </div>

        {/* Category pills — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto max-w-6xl mx-auto">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.value
            return (
              <button
                key={cat.value}
                onClick={() => handleCategory(cat.value)}
                className="flex-none px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 outline-none"
                style={isActive ? {
                  background: 'var(--accent-gradient)',
                  color:      'white',
                  boxShadow:  '0 0 16px rgba(250,20,146,0.3)',
                } : {
                  background: 'rgba(255,255,255,0.06)',
                  color:      'rgba(255,255,255,0.55)',
                  border:     '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* Results count */}
        <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {filtered.length === 0
            ? 'Sin resultados'
            : `${filtered.length} evento${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <Ticket size={40} className="mx-auto mb-3 opacity-20 text-white" />
            <p className="font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {query ? 'Sin resultados para tu búsqueda' : 'No hay eventos en esta categoría'}
            </p>
            {(activeCategory !== 'all' || query) && (
              <button
                onClick={() => { handleCategory('all'); setQuery('') }}
                className="mt-3 text-sm font-medium hover:opacity-70 transition-opacity"
                style={{
                  background:           'var(--accent-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor:  'transparent',
                }}
              >
                Ver todos los eventos →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
