import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { isEventOver } from '@/utils/event-time'
import EventsClient from './_components/events-client'

export type EventItem = {
  id: string
  title: string
  event_date: string
  event_end_date: string | null
  image_url: string | null
  imageUrl: string | null
  category: string | null
  venue_name: string | null
  venue_city: string | null
  min_price: number | null
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category: initialCategory } = await searchParams
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { data } = await supabase
    .from('events')
    .select(`id, title, event_date, event_end_date, image_url, category, venues(name, city), ticket_tiers(price)`)
    .eq('status', 'published')
    .gt('event_date', yesterday.toISOString())
    .order('event_date', { ascending: true })

  const events: EventItem[] = (data ?? [])
    .filter(e => !isEventOver(e.event_date, e.event_end_date))
    .map(e => {
      const venues = (e.venues ?? []) as { name: string; city: string }[]
      const venue = venues.length > 0 ? venues[0] : null
      const tiers = (e.ticket_tiers ?? []) as { price: number }[]
      const prices = tiers.map(t => Number(t.price))
      return {
        id: e.id,
        title: e.title,
        event_date: e.event_date,
        event_end_date: e.event_end_date ?? null,
        image_url: e.image_url ?? null,
        imageUrl: resolveEventImageUrl(supabase, e.image_url) ?? null,
        category: e.category ?? null,
        venue_name: venue?.name ?? null,
        venue_city: venue?.city ?? null,
        min_price: prices.length ? Math.min(...prices) : null,
      }
    })

  return <EventsClient events={events} initialCategory={initialCategory ?? 'all'} />
}
