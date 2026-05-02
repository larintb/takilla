import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import ReviewForm from './_components/review-form'

export default async function NuevaResenaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/o/${slug}/resenas/nueva`)

  const { data: organizer } = await supabase
    .from('profiles')
    .select('id, business_name, public_slug')
    .eq('public_slug', slug)
    .eq('role', 'organizer')
    .single()

  if (!organizer) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  // Get the organizer's published event IDs
  const { data: orgEvents } = await supabase
    .from('events')
    .select('id')
    .eq('organizer_id', organizer.id)
    .eq('status', 'published')

  const orgEventIds = (orgEvents ?? []).map(e => e.id)

  // Find events already reviewed by this user
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('event_id')
    .eq('reviewer_id', user.id)
    .in('event_id', orgEventIds.length ? orgEventIds : ['none'])

  const reviewedEventIds = new Set((existingReviews ?? []).map(r => r.event_id))
  const eligibleEventIds = orgEventIds.filter(id => !reviewedEventIds.has(id))

  // Get eligible tickets: scanned, in eligible events
  const { data: eligibleTickets } = eligibleEventIds.length
    ? await supabase
        .from('tickets')
        .select('id, event_id, ticket_tiers!tier_id(name, effect), events!event_id(id, title, event_date)')
        .eq('owner_id', user.id)
        .eq('is_used', true)
        .in('event_id', eligibleEventIds)
    : { data: null }

  const tickets = (eligibleTickets ?? []).map(t => ({
    id:          t.id,
    event_id:    t.event_id,
    tier_name:   (Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers)?.name ?? null,
    tier_effect: (Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers)?.effect ?? null,
    event:       Array.isArray(t.events) ? t.events[0] : t.events,
  }))

  // Walk-in path: eligible events with no ticket, that have at least one free tier
  const ticketEventIds = new Set(tickets.map(t => t.event_id))
  const noTicketIds = eligibleEventIds.filter(id => !ticketEventIds.has(id))

  const { data: freeTierRows } = noTicketIds.length
    ? await supabase
        .from('ticket_tiers')
        .select('event_id')
        .in('event_id', noTicketIds)
        .eq('price', 0)
    : { data: null }

  const freeEventIdSet = new Set((freeTierRows ?? []).map(r => r.event_id))
  const freeEventIds = noTicketIds.filter(id => freeEventIdSet.has(id))

  const { data: freeEventRows } = freeEventIds.length
    ? await supabase
        .from('events')
        .select('id, title, event_date')
        .in('id', freeEventIds)
    : { data: null }

  const freeEvents = (freeEventRows ?? []).map(e => ({
    event_id:   e.id,
    event_title: e.title,
    event_date: e.event_date,
  }))

  const displayName = profile?.full_name?.trim() || user.email?.split('@')[0] || 'Usuario'
  const hasEligible = tickets.length > 0 || freeEvents.length > 0

  return (
    <div className="w-full min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-lg mx-auto px-4 py-10">
        <h1 className="text-xl font-bold text-white mb-1">Dejar reseña</h1>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {organizer.business_name}
        </p>

        {!hasEligible ? (
          <div className="rounded-2xl p-10 text-center space-y-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="font-semibold text-white">Sin eventos elegibles</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Para dejar una reseña necesitas haber asistido a un evento de este organizador
              o haber escaneado tu boleto en la entrada.
            </p>
          </div>
        ) : (
          <ReviewForm
            organizerId={organizer.id}
            organizerSlug={slug}
            displayName={displayName}
            tickets={tickets}
            freeEvents={freeEvents}
          />
        )}
      </div>
    </div>
  )
}
