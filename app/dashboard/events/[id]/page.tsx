import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { CalendarDays, MapPin, Ticket, Globe, FileText } from 'lucide-react'
import TierForm from './_components/tier-form'
import TierList from './_components/tier-list'
import StatusActions from './_components/status-actions'

type VenueInfo = {
  name?: string | null
  city?: string | null
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: event }, { data: profile }, { data: tiers }] = await Promise.all([
    supabase.from('events').select('*, venues(name, city)').eq('id', id).single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('ticket_tiers').select('*').eq('event_id', id).order('price'),
  ])

  if (!event) notFound()

  const isOwner = event.organizer_id === user.id
  const isAdmin = profile?.role === 'admin'
  if (!isOwner && !isAdmin) redirect('/dashboard')

  const venue = (event.venues ?? null) as VenueInfo | null
  const imageUrl = resolveEventImageUrl(supabase, event.image_url)
  const statusStyle: Record<string, string> = {
    draft:     'bg-zinc-100 text-zinc-600',
    published: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
  }
  const statusLabel: Record<string, string> = {
    draft:     'Borrador',
    published: 'Publicado',
    cancelled: 'Cancelado',
  }

  return (
    <div className="max-w-3xl space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle[event.status]}`}>
              {statusLabel[event.status]}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} />
              {new Date(event.event_date).toLocaleDateString('es-MX', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
            {venue?.name && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} />
                {venue.name}, {venue.city}
              </span>
            )}
          </div>
          {event.description && (
            <p className="mt-3 text-sm text-zinc-600 flex items-start gap-1.5">
              <FileText size={14} className="mt-0.5 shrink-0" />
              {event.description}
            </p>
          )}
        </div>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={event.title}
            width={96}
            height={96}
            unoptimized
            className="w-24 h-24 rounded-xl object-cover shrink-0"
          />
        )}
      </div>

      {/* Status actions */}
      <StatusActions eventId={id} currentStatus={event.status} />

      {/* Ticket tiers */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Ticket size={16} className="text-zinc-500" />
          <h2 className="text-base font-semibold text-zinc-900">Tiers de boletos</h2>
          <span className="text-sm text-zinc-400">({tiers?.length ?? 0})</span>
        </div>

        <TierList tiers={tiers ?? []} eventId={id} />

        <div>
          <h3 className="text-sm font-medium text-zinc-700 mb-3">Agregar tier</h3>
          <TierForm eventId={id} />
        </div>
      </section>

      {/* Public link */}
      {event.status === 'published' && (
        <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-50 rounded-lg px-4 py-3">
          <Globe size={14} />
          <span>Evento público en</span>
          <a
            href={`/events/${id}`}
            className="font-medium text-zinc-900 hover:underline"
            target="_blank"
          >
            /events/{id}
          </a>
        </div>
      )}
    </div>
  )
}
