import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import {
  CalendarDays, MapPin, Ticket, Globe,
  TrendingUp, Users, DollarSign, Pencil, Lock, Gift
} from 'lucide-react'
import TierForm from './_components/tier-form'
import TierList from './_components/tier-list'
import PerkForm from './_components/perk-form'
import PerkList from './_components/perk-list'
import StatusActions from './_components/status-actions'
import EventEditForm from './_components/event-edit-form'
import { updateEvent, duplicateEvent } from './actions'
import { isEventOver } from '@/utils/event-time'
import Link from 'next/link'
import { Copy } from 'lucide-react'

type VenueInfo = { name?: string | null; city?: string | null }

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

  const [{ data: event }, { data: profile }, { data: tiers }, { data: perks }] = await Promise.all([
    supabase.from('events').select('*, venues(name, city)').eq('id', id).single(),
    supabase.from('profiles').select('role, stripe_onboarding_complete').eq('id', user.id).single(),
    supabase.from('ticket_tiers').select('*').eq('event_id', id).order('price'),
    supabase.from('perks').select('*').eq('event_id', id).order('price'),
  ])

  if (!event) notFound()

  const isOwner = event.organizer_id === user.id
  const isAdmin = profile?.role === 'admin'
  if (!isOwner && !isAdmin) redirect('/dashboard')

  let canCharge = !!profile?.stripe_onboarding_complete
  if (isAdmin && !isOwner) {
    const { data: orgProfile } = await supabase
      .from('profiles')
      .select('stripe_onboarding_complete')
      .eq('id', event.organizer_id)
      .single()
    canCharge = !!orgProfile?.stripe_onboarding_complete
  }

  const venue = (event.venues ?? null) as VenueInfo | null
  const isFinished = event.status === 'published' && isEventOver(event.event_date, event.event_end_date)
  const isDraft = event.status === 'draft'
  const isPublished = event.status === 'published' && !isFinished

  const totalCapacity = tiers?.reduce((sum, t) => sum + t.total_capacity, 0) ?? 0
  const totalSold     = tiers?.reduce((sum, t) => sum + (t.total_capacity - t.available_tickets), 0) ?? 0
  const totalRevenue  = tiers?.reduce((sum, t) => sum + (t.total_capacity - t.available_tickets) * Number(t.price), 0) ?? 0
  const soldPct       = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0

  // Brand-consistent status styles using the orange→purple palette
  const statusStyle: Record<string, string> = {
    draft:     'bg-purple-900/40 text-purple-300 border border-purple-700/50',
    published: 'bg-gradient-to-r from-orange-500/20 to-purple-600/20 text-orange-300 border border-orange-500/30',
    cancelled: 'bg-red-900/30 text-red-400 border border-red-700/40',
    finished:  'bg-orange-900/30 text-orange-400 border border-orange-700/40',
  }
  const statusLabel: Record<string, string> = {
    draft:     'Borrador',
    published: 'Publicado',
    cancelled: 'Cancelado',
    finished:  'Finalizado',
  }

  const displayStatus = isFinished ? 'finished' : event.status
  const boundUpdateEvent = updateEvent.bind(null, id)

  return (
    <div className="max-w-3xl space-y-8 mx-auto px-4">

      {/* Header */}
      <div className="flex items-start justify-start gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusStyle[displayStatus]}`}>
              {statusLabel[displayStatus]}
            </span>
            {isFinished && (
              <span className="text-xs text-purple-400/70">· Evento terminado</span>
            )}
            {isPublished && (
              <span className="flex items-center gap-1 text-xs text-purple-400/70">
                <Lock size={11} /> Solo lectura — regresa a borrador para editar
              </span>
            )}
            {isDraft && (
              <span className="flex items-center gap-1 text-xs text-orange-400">
                <Pencil size={11} /> Modo edición activo
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-purple-300/70">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-orange-400" />
              {new Date(event.event_date).toLocaleDateString('es-MX', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
            {venue?.name && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-orange-400" />
                {venue.name}, {venue.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* DRAFT: edit form */}
      {isDraft && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Pencil size={15} className="text-orange-400" />
            <h2 className="text-base font-semibold text-white">Editar información</h2>
          </div>
          <EventEditForm
            action={boundUpdateEvent}
            defaultValues={{
              title:         event.title,
              description:   event.description ?? '',
              event_date:    event.event_date,
              status:        event.status,
              image_url:     event.image_url,
              category:      event.category ?? null,
              location_name: event.location_name ?? null,
              location_lat:  event.location_lat ?? null,
              location_lng:  event.location_lng ?? null,
            }}
            submitLabel="Guardar cambios"
          />
        </section>
      )}

      {/* PUBLISHED/FINISHED: readonly info */}
      {!isDraft && (
        <div className="space-y-3">
          {event.description && (
            <p className="text-sm text-purple-200/80 bg-white/5 border border-purple-700/30 rounded-xl px-4 py-3 whitespace-pre-wrap">
              {event.description}
            </p>
          )}
          {event.location_name && (
            <p className="text-sm text-purple-300/70 bg-white/5 border border-purple-700/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <MapPin size={14} className="text-orange-400 shrink-0" />
              {event.location_name}
            </p>
          )}
        </div>
      )}

      {/* Sales summary */}
      {totalCapacity > 0 && (
        <section className="rounded-2xl border border-purple-700/40 bg-white/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-orange-400" />
            <h2 className="text-sm font-semibold text-white">
              {isFinished ? 'Resumen del evento' : 'Ventas en tiempo real'}
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-purple-400/70 text-xs mb-1">
                <Users size={12} /> Vendidos
              </div>
              <p className="text-2xl font-bold text-white">{totalSold}</p>
              <p className="text-xs text-purple-400/60">de {totalCapacity}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-purple-400/70 text-xs mb-1">
                <TrendingUp size={12} /> Ocupación
              </div>
              <p className="text-2xl font-bold text-white">{soldPct}%</p>
              <div className="mt-1 h-1.5 bg-purple-900/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${soldPct}%`, background: 'var(--accent-gradient)' }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-purple-400/70 text-xs mb-1">
                <DollarSign size={12} /> Recaudado
              </div>
              <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </section>
      )}

      {/* Tiers */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Ticket size={16} className="text-orange-400" />
          <h2 className="text-base font-semibold text-white">Tiers de boletos</h2>
          <span className="text-sm text-purple-400/60">({tiers?.length ?? 0})</span>
        </div>

        <TierList tiers={tiers ?? []} eventId={id} />

        {isDraft && (
          <div>
            <h3 className="text-sm font-medium text-purple-300 mb-3">Agregar tier</h3>
            <TierForm eventId={id} canCharge={canCharge} />
          </div>
        )}

        {isPublished && (
          <p className="text-xs text-purple-400/60 flex items-center gap-1.5 bg-white/5 border border-purple-700/30 px-3 py-2 rounded-lg">
            <Lock size={11} /> Regresa el evento a borrador para agregar o eliminar tiers.
          </p>
        )}
      </section>

      {/* Perks (extras) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Gift size={16} className="text-orange-400" />
          <h2 className="text-base font-semibold text-white">Extras del evento</h2>
          <span className="text-sm text-purple-400/60">({perks?.length ?? 0})</span>
        </div>

        <PerkList perks={perks ?? []} eventId={id} />

        {isDraft && (
          <div>
            <h3 className="text-sm font-medium text-purple-300 mb-3">Agregar extra</h3>
            <PerkForm eventId={id} canCharge={canCharge} />
          </div>
        )}

        {isPublished && (
          <p className="text-xs text-purple-400/60 flex items-center gap-1.5 bg-white/5 border border-purple-700/30 px-3 py-2 rounded-lg">
            <Lock size={11} /> Regresa el evento a borrador para agregar o eliminar extras.
          </p>
        )}
      </section>

      {/* Status actions */}
      {!isFinished && <StatusActions eventId={id} currentStatus={event.status} />}

      {/* Duplicate — only for finished events */}
      {isFinished && (
        <section className="rounded-2xl border border-purple-700/40 bg-white/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Copy size={15} className="text-orange-400" />
            <h2 className="text-sm font-semibold text-white">Crear nueva edición</h2>
          </div>
          <p className="text-sm text-purple-300/70">
            Genera un borrador idéntico a este evento con todos sus tiers y extras. Solo tendrás que actualizar la fecha.
          </p>
          <form action={duplicateEvent.bind(null, id)}>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'var(--accent-gradient)' }}
            >
              <Copy size={14} />
              Duplicar evento
            </button>
          </form>
        </section>
      )}
      {event.status === 'published' && (
  <div className="flex items-center gap-2 text-sm text-purple-300/70 bg-white/5 border border-purple-700/30 rounded-lg px-4 py-3">
    <Globe size={14} className="text-orange-400" />
    <span>Evento público en</span>
    <Link
      href={`/events/${id}`}
      className="font-medium bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
    >
      /events/{id}
    </Link>
  </div>
)}
    </div>
  )
}