import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import TicketsClient from './_components/tickets-client'

type TicketRow = {
  id: string; qr_hash: string; is_used: boolean
  tierName: string; price: number; index: number
}

type EventGroup = {
  eventData: {
    title: string; date: string
    venueName: string | null; venueCity: string | null
    imageUrl: string | null
    totalCount: number; validCount: number
  }
  tickets: TicketRow[]
  eventDate: string
}

export default async function TicketsPage() {
  const cookieStore = await cookies()
  const supabase    = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows, error } = await supabase
    .from('ticket_details')
    .select('id, qr_hash, is_used, event_id, tier_name, tier_price, event_title, event_date, image_url, venue_name, venue_city')
    .eq('owner_id', user.id)
    .order('event_date', { ascending: true })

  if (error) throw new Error(error.message)

  const groupMap = new Map<string, EventGroup>()

  for (const row of rows ?? []) {
    if (!groupMap.has(row.event_id)) {
      groupMap.set(row.event_id, {
        eventData: {
          title:      row.event_title,
          date:       new Date(row.event_date).toLocaleDateString('es-MX', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          }),
          venueName:  row.venue_name ?? null,
          venueCity:  row.venue_city ?? null,
          imageUrl:   resolveEventImageUrl(supabase, row.image_url),
          totalCount: 0,
          validCount: 0,
        },
        tickets:   [],
        eventDate: row.event_date,
      })
    }

    const group = groupMap.get(row.event_id)!
    group.tickets.push({
      id:       row.id,
      qr_hash:  row.qr_hash,
      is_used:  row.is_used,
      tierName: row.tier_name ?? 'Boleto',
      price:    Number(row.tier_price ?? 0),
      index:    group.tickets.length + 1,
    })
    group.eventData.totalCount++
    if (!row.is_used) group.eventData.validCount++
  }

  const eventGroups  = [...groupMap.values()]
  const totalTickets = (rows ?? []).length
  const totalEvents  = eventGroups.length

  return (
    <>
      <section style={{ background: 'var(--hero-gradient)' }} className="animate-fade-in">
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-1">
          <p className="text-sm font-medium uppercase tracking-widest animate-fade-in-up"
            style={{ color: 'rgba(255,255,255,0.5)', animationDelay: '60ms' }}>
            Tu billetera digital
          </p>
          <h1 className="font-display text-5xl text-white leading-none animate-fade-in-up"
            style={{ animationDelay: '120ms' }}>
            Mis boletos
          </h1>
          {totalTickets > 0 && (
            <p className="text-base animate-fade-in-up"
              style={{ color: 'rgba(255,255,255,0.6)', animationDelay: '180ms' }}>
              {totalTickets} boleto{totalTickets !== 1 ? 's' : ''} · {totalEvents} evento{totalEvents !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </section>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <TicketsClient eventGroups={eventGroups} />
      </main>
    </>
  )
}
