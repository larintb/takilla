import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Ticket, CalendarDays, MapPin, FileSearch } from 'lucide-react'

export default async function TicketsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
      id, qr_hash, is_used, used_at,
      ticket_tiers(name, price),
      events(title, event_date, venues(name, city))
    `)
    .eq('owner_id', user.id)
    .order('id', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Mis boletos</h1>
        <p className="text-zinc-500 mt-1">{tickets?.length ?? 0} boletos comprados</p>
      </div>

      {!tickets?.length ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-16 text-center">
          <Ticket size={40} className="mx-auto text-zinc-300 mb-3" />
          <p className="font-semibold text-zinc-700">No tienes boletos aún</p>
          <p className="text-sm text-zinc-400 mt-1">Explora los eventos disponibles y compra tus boletos</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors"
          >
            <FileSearch size={15} />
            Ver eventos
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map(ticket => {
            const event = ticket.events as any
            const tier  = ticket.ticket_tiers as any
            const venue = event?.venues

            return (
              <div
                key={ticket.id}
                className={`bg-white rounded-2xl border p-5 space-y-3 ${
                  ticket.is_used ? 'border-zinc-200 opacity-60' : 'border-zinc-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-zinc-900 leading-tight">{event?.title}</p>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    ticket.is_used
                      ? 'bg-zinc-100 text-zinc-400'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {ticket.is_used ? 'Usado' : 'Válido'}
                  </span>
                </div>

                <div className="text-sm text-zinc-500 space-y-1">
                  {event?.event_date && (
                    <p className="flex items-center gap-1.5">
                      <CalendarDays size={13} />
                      {new Date(event.event_date).toLocaleDateString('es-MX', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  )}
                  {venue?.name && (
                    <p className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      {venue.name}, {venue.city}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700">{tier?.name}</span>
                  <span className="text-sm font-bold text-zinc-900">
                    ${Number(tier?.price ?? 0).toFixed(2)}
                  </span>
                </div>

                {/* QR placeholder — se expandirá en la Staff App */}
                <div className="bg-zinc-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-400 font-mono truncate">{ticket.qr_hash}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
