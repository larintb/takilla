import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { ChevronLeft } from 'lucide-react'
import { isEventOver } from '@/utils/event-time'
import TicketsClient from './_components/tickets-client'

type TicketRow = {
  id: string; qr_hash: string; is_used: boolean
  tierName: string; price: number; index: number
}

type PerkPurchaseRow = {
  id: string; qr_hash: string; is_used: boolean; perkName: string
}

type EventGroup = {
  eventId: string
  eventData: {
    title: string; date: string
    venueName: string | null; venueCity: string | null
    locationName: string | null
    imageUrl: string | null
    totalCount: number; validCount: number
    hasAvailablePerks: boolean
  }
  tickets: TicketRow[]
  perkPurchases: PerkPurchaseRow[]
  eventDate: string
  eventEndDate: string | null
}

type RawTicketDetailRow = {
  id: string
  qr_hash: string
  is_used: boolean
  event_id: string
  tier_name: string | null
  tier_price: number | null
  event_title: string
  event_date: string
  image_url: string | null
  venue_name: string | null
  venue_city: string | null
  location_name: string | null
}

export default async function TicketsPage() {
  const cookieStore = await cookies()
  const supabase    = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rows, error }, { data: perkPurchaseRows }] = await Promise.all([
    supabase
      .from('ticket_details')
      .select('id, qr_hash, is_used, event_id, tier_name, tier_price, event_title, event_date, image_url, venue_name, venue_city, location_name')
      .eq('owner_id', user.id)
      .order('event_date', { ascending: true }),
    supabase
      .from('perk_purchases')
      .select('id, qr_hash, is_used, event_id, perks(name)')
      .eq('owner_id', user.id),
  ])

  if (error) throw new Error(error.message)
  const ticketRows = (rows ?? []) as RawTicketDetailRow[]

  // Build a set of event_ids that have perks available for purchase
  const userEventIds = [...new Set(ticketRows.map(r => r.event_id))]
  const eventIdsWithPerks = new Set<string>()
  const eventEndDateMap = new Map<string, string | null>()
  if (userEventIds.length > 0) {
    const [{ data: availPerks }, { data: eventDates }] = await Promise.all([
      supabase.from('perks').select('event_id').in('event_id', userEventIds),
      supabase.from('events').select('id, event_end_date').in('id', userEventIds),
    ])
    for (const p of availPerks ?? []) eventIdsWithPerks.add(p.event_id)
    for (const e of eventDates ?? []) eventEndDateMap.set(e.id, e.event_end_date ?? null)
  }

  // Group perk purchases by event_id
  type RawPerkPurchase = { id: string; qr_hash: string; is_used: boolean; event_id: string; perks: { name?: string | null } | { name?: string | null }[] | null }
  const perksByEvent = new Map<string, PerkPurchaseRow[]>()
  for (const pp of (perkPurchaseRows ?? []) as RawPerkPurchase[]) {
    if (!perksByEvent.has(pp.event_id)) perksByEvent.set(pp.event_id, [])
    const perkInfo = Array.isArray(pp.perks) ? pp.perks[0] : pp.perks
    perksByEvent.get(pp.event_id)!.push({
      id:       pp.id,
      qr_hash:  pp.qr_hash,
      is_used:  pp.is_used,
      perkName: perkInfo?.name ?? 'Extra',
    })
  }

  const groupMap = new Map<string, EventGroup>()

  for (const row of ticketRows) {
    if (!groupMap.has(row.event_id)) {
      groupMap.set(row.event_id, {
        eventId: row.event_id,
        eventData: {
          title:      row.event_title,
          date:       new Date(row.event_date).toLocaleDateString('es-MX', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          }),
          venueName:    row.venue_name ?? null,
          venueCity:    row.venue_city ?? null,
          locationName: row.location_name ?? null,
          imageUrl:   resolveEventImageUrl(supabase, row.image_url),
          totalCount: 0,
          validCount: 0,
          hasAvailablePerks: eventIdsWithPerks.has(row.event_id) && !isEventOver(row.event_date, eventEndDateMap.get(row.event_id)),
        },
        tickets:       [],
        perkPurchases: perksByEvent.get(row.event_id) ?? [],
        eventDate:     row.event_date,
        eventEndDate:  eventEndDateMap.get(row.event_id) ?? null,
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
  const totalTickets = ticketRows.length
  const totalEvents  = eventGroups.length

  return (
    <>
      <section style={{ background: 'var(--hero-gradient)' }} className="animate-fade-in">
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <Link href="/dashboard"
            className="inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <ChevronLeft size={16} />
            Dashboard
          </Link>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-1">
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
