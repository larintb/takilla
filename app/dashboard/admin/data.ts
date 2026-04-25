import { createAdminClient } from '@/utils/supabase/admin'
import { resolveEventImageUrl } from '@/utils/supabase/storage'

export type RecentUser = {
  id: string
  full_name: string | null
  email: string | null
  role: string
  created_at: string
}

export type ApplicationRow = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  business_name: string
  tax_id: string | null
  profiles: { full_name: string | null; email: string | null } | null
}

export type UserMetrics = {
  total: number
  newLast30d: number
  latest: { created_at: string; full_name: string | null; email: string | null } | null
}

export type EventPerformanceRow = {
  id: string
  title: string
  event_date: string
  status: string
  image_url: string | null
  organizer: { full_name: string | null; email: string | null } | null
  sold: number
  capacity: number
  revenue: number
  progress: number
}

export type EventPerformanceSummary = {
  events: EventPerformanceRow[]
  totalTicketsSold: number
  totalRevenue: number
}

export type FeedEventType =
  | 'purchase'
  | 'signup'
  | 'event_created'
  | 'event_published'
  | 'org_applied'
  | 'org_approved'

export type FeedItem = {
  id: string
  created_at: string
  type: FeedEventType
  actorName: string | null
  actorEmail: string | null
  subtitle: string | null
  amount: number | null
  quantity: number | null
  appStatus: string | null
  tierEffect: string | null
  buyerName: string | null
  buyerEmail: string | null
  tierName: string | null
  eventTitle: string | null
  tierPrice: number
}

export type ActivityItem = FeedItem

type Result<T> = { data: T; error: null } | { data: null; error: string }

export async function loadUserMetrics(): Promise<Result<UserMetrics>> {
  try {
    const supabase = createAdminClient()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const [totalRes, newRes, latestRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      supabase.from('profiles').select('created_at, full_name, email').order('created_at', { ascending: false }).limit(1),
    ])
    if (totalRes.error) throw new Error(totalRes.error.message)
    return {
      data: {
        total: totalRes.count ?? 0,
        newLast30d: newRes.count ?? 0,
        latest: latestRes.data?.[0] ?? null,
      },
      error: null,
    }
  } catch (e) {
    return { data: null, error: (e as Error).message }
  }
}

export async function loadEventPerformance(): Promise<Result<EventPerformanceSummary>> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('events')
      .select(`
        id, title, event_date, status, image_url,
        organizer:profiles!organizer_id(full_name, email),
        ticket_tiers(id, price, total_capacity, available_tickets)
      `)
      .order('event_date', { ascending: false })
    if (error) throw new Error(error.message)

    const events: EventPerformanceRow[] = (data ?? []).map((ev) => {
      const tiers = (ev.ticket_tiers as { price: number; total_capacity: number; available_tickets: number }[]) ?? []
      const capacity = tiers.reduce((s, t) => s + (t.total_capacity ?? 0), 0)
      const sold = tiers.reduce((s, t) => s + Math.max(0, (t.total_capacity ?? 0) - (t.available_tickets ?? 0)), 0)
      const revenue = tiers.reduce((s, t) => s + (t.price ?? 0) * Math.max(0, (t.total_capacity ?? 0) - (t.available_tickets ?? 0)), 0)
      const organizer = ev.organizer && !Array.isArray(ev.organizer)
        ? (ev.organizer as { full_name: string | null; email: string | null })
        : null
      return {
        id: ev.id,
        title: ev.title,
        event_date: ev.event_date,
        status: ev.status,
        image_url: resolveEventImageUrl(supabase, ev.image_url),
        organizer,
        sold,
        capacity,
        revenue,
        progress: capacity > 0 ? sold / capacity : 0,
      }
    })

    return {
      data: {
        events,
        totalTicketsSold: events.reduce((s, e) => s + e.sold, 0),
        totalRevenue: events.reduce((s, e) => s + e.revenue, 0),
      },
      error: null,
    }
  } catch (e) {
    return { data: null, error: (e as Error).message }
  }
}

export async function loadActivityFeed(): Promise<Result<FeedItem[]>> {
  try {
    const supabase = createAdminClient()

    const [ordersRes, profilesRes, eventsRes, appsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id, created_at, total_amount, buyer:profiles!user_id(full_name, email), events(title), tickets(id)')
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('events')
        .select('id, title, status, created_at, organizer:profiles!organizer_id(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('organizer_applications')
        .select('id, business_name, status, created_at, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(25),
    ])

    const items: FeedItem[] = []

    // Purchases
    for (const o of ordersRes.data ?? []) {
      const buyer = o.buyer && !Array.isArray(o.buyer)
        ? (o.buyer as { full_name: string | null; email: string | null }) : null
      const ev = o.events && !Array.isArray(o.events)
        ? (o.events as { title: string }) : null
      items.push({
        id: `order-${o.id}`,
        created_at: o.created_at,
        type: 'purchase',
        actorName: buyer?.full_name ?? null,
        actorEmail: buyer?.email ?? null,
        subtitle: ev?.title ?? null,
        amount: o.total_amount,
        quantity: Array.isArray(o.tickets) ? o.tickets.length : 1,
        appStatus: null,
        tierEffect: null,
        buyerName: buyer?.full_name ?? null,
        buyerEmail: buyer?.email ?? null,
        tierName: null,
        eventTitle: ev?.title ?? null,
        tierPrice: o.total_amount ?? 0,
      })
    }

    // Signups
    for (const p of profilesRes.data ?? []) {
      items.push({
        id: `signup-${p.id}`,
        created_at: p.created_at,
        type: 'signup',
        actorName: p.full_name,
        actorEmail: p.email,
        subtitle: null,
        amount: null,
        quantity: null,
        appStatus: null,
        tierEffect: null,
        buyerName: null,
        buyerEmail: null,
        tierName: null,
        eventTitle: null,
        tierPrice: 0,
      })
    }

    // Events
    for (const e of eventsRes.data ?? []) {
      const org = e.organizer && !Array.isArray(e.organizer)
        ? (e.organizer as { full_name: string | null; email: string | null }) : null
      items.push({
        id: `event-${e.id}`,
        created_at: e.created_at,
        type: e.status === 'published' ? 'event_published' : 'event_created',
        actorName: org?.full_name ?? null,
        actorEmail: org?.email ?? null,
        subtitle: e.title,
        amount: null,
        quantity: null,
        appStatus: null,
        tierEffect: null,
        buyerName: null,
        buyerEmail: null,
        tierName: null,
        eventTitle: e.title,
        tierPrice: 0,
      })
    }

    // Organizer applications
    for (const a of appsRes.data ?? []) {
      const prof = a.profiles && !Array.isArray(a.profiles)
        ? (a.profiles as { full_name: string | null; email: string | null }) : null
      items.push({
        id: `app-${a.id}`,
        created_at: a.created_at,
        type: a.status === 'approved' ? 'org_approved' : 'org_applied',
        actorName: prof?.full_name ?? null,
        actorEmail: prof?.email ?? null,
        subtitle: a.business_name,
        amount: null,
        quantity: null,
        appStatus: a.status,
        tierEffect: null,
        buyerName: null,
        buyerEmail: null,
        tierName: null,
        eventTitle: null,
        tierPrice: 0,
      })
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return { data: items.slice(0, 40), error: null }
  } catch (e) {
    return { data: null, error: (e as Error).message }
  }
}
