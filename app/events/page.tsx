import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'

type VenueInfo = {
  name?: string | null
  city?: string | null
}

type TierPrice = {
  price: number | string
}

export default async function EventsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: events } = await supabase
    .from('events')
    .select(`
      id, title, description, event_date, image_url,
      venues(name, city),
      ticket_tiers(price)
    `)
    .eq('status', 'published')
    .gt('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })

  return (
    <>
      {/* Banner */}
      <section className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white animate-fade-in">
        <div className="max-w-6xl mx-auto px-4 py-16 space-y-3">
          <p className="text-white/70 text-sm font-medium uppercase tracking-widest animate-fade-in-up" style={{ animationDelay: '60ms' }}>
            Plataforma de boletos regional
          </p>
          <h1 className="font-display text-6xl leading-none animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            Todos los eventos
          </h1>
          <p className="text-white/80 text-lg max-w-xl animate-fade-in-up" style={{ animationDelay: '180ms' }}>
            Conciertos, festivales y eventos en vivo cerca de ti.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {!events?.length ? (
        <div className="text-center py-24 text-zinc-400">
          <Ticket size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No hay eventos publicados por el momento</p>
          <p className="text-sm mt-1">Vuelve pronto</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => {
            const venue  = (event.venues ?? null) as VenueInfo | null
            const tiers  = (event.ticket_tiers ?? []) as TierPrice[]
            const prices = tiers?.map(t => Number(t.price)) ?? []
            const minPrice = prices.length ? Math.min(...prices) : null
            const imageUrl = resolveEventImageUrl(supabase, event.image_url)

            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-zinc-400 hover:shadow-sm transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Image */}
                <div className="relative h-44 bg-zinc-100 overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={event.title}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Ticket size={32} className="text-zinc-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
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
                      </p>
                    )}
                  </div>
                  <div className="pt-2 border-t border-zinc-100">
                    <p className="text-sm font-semibold text-zinc-900">
                      {minPrice === null
                        ? 'Sin tiers'
                        : minPrice === 0
                        ? 'Gratis'
                        : `Desde $${minPrice.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
      </main>
    </>
  )
}
