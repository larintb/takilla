'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { CalendarDays, MapPin, Ticket, ChevronDown, Search, X } from 'lucide-react'

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

// ─── Constants ────────────────────────────────────────────────────────────────

const LOCATION_KEY = 'takilla_user_city'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function getEventCity(event: Event) {
  return event.venues?.city ?? ''
}

function getEventState(event: Event) {
  return event.venues?.state ?? ''
}

// Extract unique cities from events, grouped by state
function buildCityList(events: Event[]): { city: string; state: string }[] {
  const seen = new Set<string>()
  const list: { city: string; state: string }[] = []
  for (const e of events) {
    const city = getEventCity(e)
    const state = getEventState(e)
    if (!city) continue
    const key = normalize(city)
    if (!seen.has(key)) {
      seen.add(key)
      list.push({ city, state })
    }
  }
  return list.sort((a, b) => a.city.localeCompare(b.city))
}

// ─── City Selector Modal ──────────────────────────────────────────────────────

function CityModal({
  cities,
  current,
  onSelect,
}: {
  cities: { city: string; state: string }[]
  current: string
  onSelect: (city: string, state: string) => void
}) {
  const [search, setSearch] = useState('')

  const filtered = cities.filter(c =>
    normalize(c.city).includes(normalize(search)) ||
    normalize(c.state).includes(normalize(search))
  )

  // Group by state
  const grouped: Record<string, { city: string; state: string }[]> = {}
  for (const item of filtered) {
    const s = item.state || 'Sin estado'
    if (!grouped[s]) grouped[s] = []
    grouped[s].push(item)
  }
  const states = Object.keys(grouped).sort()

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[5vh] px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-zinc-100">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Takilla</p>
          <h2 className="text-xl font-bold text-zinc-900">¿En qué ciudad estás?</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Te mostramos los eventos más cercanos a ti.</p>

          {/* Search */}
          <div className="relative mt-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              autoFocus
              type="text"
              placeholder="Buscar ciudad o estado..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition bg-zinc-50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* City list */}
        <div className="overflow-y-auto flex-1 px-3 py-3 space-y-4">
          {states.length === 0 ? (
            <p className="text-center text-sm text-zinc-400 py-8">No se encontraron ciudades</p>
          ) : (
            states.map(state => (
              <div key={state}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-2 mb-1.5">
                  {state}
                </p>
                <div className="space-y-0.5">
                  {grouped[state].map(({ city, state: st }) => {
                    const isActive = normalize(city) === normalize(current)
                    return (
                      <button
                        key={city}
                        onClick={() => onSelect(city, st)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between group
                          ${isActive
                            ? 'bg-zinc-900 text-white'
                            : 'text-zinc-700 hover:bg-zinc-100'
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin size={13} className={isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600'} />
                          {city}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 bg-white/20 px-2 py-0.5 rounded-full">
                            Actual
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-100">
          <button
            onClick={() => onSelect('', '')}
            className="w-full text-center text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Ver todos los eventos sin filtrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, supabase }: { event: Event; supabase: ReturnType<typeof createClient> }) {
  const venue = event.venues
  const tiers = event.ticket_tiers ?? []
  const prices = tiers.map(t => Number(t.price))
  const minPrice = prices.length ? Math.min(...prices) : null
  const imageUrl = resolveEventImageUrl(supabase, event.image_url)

  return (
    <Link
      href={`/events/${event.id}`}
      className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-zinc-400 hover:shadow-sm transition-all"
    >
      <div className="h-44 bg-zinc-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

function EventGrid({ events, supabase }: { events: Event[]; supabase: ReturnType<typeof createClient> }) {
  if (!events.length) return null
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map(event => (
        <EventCard key={event.id} event={event} supabase={supabase} />
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedState, setSelectedState] = useState<string>('')
  const supabase = createClient()

  // Load events
  useEffect(() => {
    async function fetchEvents() {
      const { data } = await supabase
        .from('events')
        .select(`
          id, title, description, event_date, image_url,
          venues(name, city, state),
          ticket_tiers(price)
        `)
        .eq('status', 'published')
        .order('event_date', { ascending: true })

      setEvents((data ?? []) as unknown as Event[])
      setLoading(false)
    }
    fetchEvents()
  }, [])

  // Once events are loaded: check localStorage — if no city saved, show modal
  // We wait for loading=false so the city list is populated when the modal opens
  useEffect(() => {
    if (loading) return
    const saved = localStorage.getItem(LOCATION_KEY)
    if (saved) {
      try {
        const { city, state } = JSON.parse(saved)
        setSelectedCity(city ?? '')
        setSelectedState(state ?? '')
      } catch {
        setShowModal(true)
      }
    } else {
      setShowModal(true)
    }
  }, [loading])

  function handleSelectCity(city: string, state: string) {
    setSelectedCity(city)
    setSelectedState(state)
    localStorage.setItem(LOCATION_KEY, JSON.stringify({ city, state }))
    setShowModal(false)
  }

  // Build city list dynamically from real events
  const cityList = buildCityList(events)

  // Split events
  const hasCity = !!selectedCity

  const localEvents = hasCity
    ? events.filter(e => normalize(getEventCity(e)) === normalize(selectedCity))
    : []

  const otherEvents = hasCity
    ? events.filter(e => normalize(getEventCity(e)) !== normalize(selectedCity))
    : events

  return (
    <>
      {showModal && (
        <CityModal
          cities={cityList}
          current={selectedCity}
          onSelect={handleSelectCity}
        />
      )}

      <div className="space-y-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Eventos</h1>
            <p className="text-zinc-500 mt-1">Descubre lo que está pasando en tu ciudad</p>
          </div>

          {/* City chip — always visible, always opens modal */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-all shadow-sm"
          >
            <MapPin size={13} className="text-zinc-500" />
            {selectedCity || 'Seleccionar ciudad'}
            <ChevronDown size={13} className="text-zinc-400" />
          </button>
        </div>

        {/* Skeleton loader */}
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
            <p className="font-medium">No hay eventos publicados por el momento</p>
            <p className="text-sm mt-1">Vuelve pronto</p>
          </div>

        ) : (
          <>
            {/* Eventos en tu ciudad */}
            {hasCity && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-zinc-900" />
                  <h2 className="text-lg font-bold text-zinc-900">
                    Eventos en {selectedCity}
                  </h2>
                </div>
                {localEvents.length ? (
                  <EventGrid events={localEvents} supabase={supabase} />
                ) : (
                  <div className="py-12 text-center border border-dashed border-zinc-200 rounded-2xl text-zinc-400">
                    <MapPin size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">Sin eventos en {selectedCity} por el momento</p>
                    <p className="text-xs mt-1">Mira lo que hay en otras ciudades abajo</p>
                  </div>
                )}
              </section>
            )}

            {/* Eventos en otras ciudades */}
            {otherEvents.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-900">
                  {hasCity ? 'Eventos en otras ciudades' : 'Todos los eventos'}
                </h2>
                <EventGrid events={otherEvents} supabase={supabase} />
              </section>
            )}
          </>
        )}
      </div>
    </>
  )
}