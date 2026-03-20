import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { CalendarDays, MapPin, Users, ArrowLeft } from 'lucide-react'
import { buyTicket } from './actions'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: event } = await supabase
    .from('events')
    .select('*, venues(name, city, address, capacity)')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (!event) notFound()

  const { data: tiers } = await supabase
    .from('ticket_tiers')
    .select('*')
    .eq('event_id', id)
    .order('price')

  const { data: { user } } = await supabase.auth.getUser()

  const venue = event.venues as any

  return (
    <div className="max-w-4xl space-y-8">

      {/* Back */}
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
        <ArrowLeft size={14} />
        Todos los eventos
      </Link>

      {/* Hero */}
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900 leading-tight">{event.title}</h1>

          <div className="space-y-2 text-zinc-600">
            <p className="flex items-center gap-2">
              <CalendarDays size={16} className="text-zinc-400 shrink-0" />
              {new Date(event.event_date).toLocaleDateString('es-MX', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
            {venue?.name && (
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-zinc-400 shrink-0" />
                {venue.name} — {venue.address}, {venue.city}
              </p>
            )}
            {venue?.capacity && (
              <p className="flex items-center gap-2">
                <Users size={16} className="text-zinc-400 shrink-0" />
                Capacidad: {venue.capacity.toLocaleString('es-MX')} personas
              </p>
            )}
          </div>

          {event.description && (
            <p className="text-zinc-600 leading-relaxed">{event.description}</p>
          )}
        </div>

        {event.image_url && (
          <div className="md:col-span-2">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full aspect-square rounded-2xl object-cover"
            />
          </div>
        )}
      </div>

      {/* Tiers */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900">Boletos</h2>

        {!tiers?.length ? (
          <p className="text-zinc-400 text-sm">No hay tiers disponibles para este evento.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {tiers.map(tier => {
              const soldOut = tier.available_tickets === 0

              return (
                <div
                  key={tier.id}
                  className={`bg-white rounded-2xl border p-5 space-y-3 ${soldOut ? 'border-zinc-200 opacity-60' : 'border-zinc-200'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-zinc-900">{tier.name}</p>
                      <p className="text-sm text-zinc-400 mt-0.5">
                        {tier.available_tickets} disponibles de {tier.total_capacity}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-zinc-900 shrink-0">
                      {Number(tier.price) === 0 ? 'Gratis' : `$${Number(tier.price).toFixed(2)}`}
                    </p>
                  </div>

                  {/* Availability bar */}
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 rounded-full"
                      style={{ width: `${((tier.total_capacity - tier.available_tickets) / tier.total_capacity) * 100}%` }}
                    />
                  </div>

                  {soldOut ? (
                    <p className="w-full text-center py-2 text-sm font-medium text-zinc-400">
                      Agotado
                    </p>
                  ) : user ? (
                    <form action={buyTicket.bind(null, tier.id, id)}>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors"
                      >
                        Comprar boleto
                      </button>
                    </form>
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
      </section>
    </div>
  )
}
