import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'

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
    .order('event_date', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Eventos</h1>
        <p className="text-zinc-500 mt-1">Descubre lo que está pasando en tu ciudad</p>
      </div>

      {!events?.length ? (
        <div className="text-center py-24 text-zinc-400">
          <Ticket size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No hay eventos publicados por el momento</p>
          <p className="text-sm mt-1">Vuelve pronto</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map(event => {
            const venue  = event.venues as any
            const tiers  = event.ticket_tiers as any[]
            const prices = tiers?.map(t => Number(t.price)) ?? []
            const minPrice = prices.length ? Math.min(...prices) : null

            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-zinc-400 hover:shadow-sm transition-all"
              >
                {/* Image */}
                <div className="h-44 bg-zinc-100 overflow-hidden">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
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
    </div>
  )
}
