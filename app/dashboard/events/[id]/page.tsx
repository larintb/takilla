import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import {
  CalendarDays, MapPin, Ticket, Globe, ArrowLeft,
  TrendingUp, Users, DollarSign, Pencil, Lock
} from 'lucide-react'
import TierForm from './_components/tier-form'
import TierList from './_components/tier-list'
import StatusActions from './_components/status-actions'
import EventEditForm from './_components/event-edit-form'
import { updateEvent } from './actions'

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
  const isFinished = event.status === 'published' && new Date(event.event_date) < new Date()
  const isDraft = event.status === 'draft'
  const isPublished = event.status === 'published' && !isFinished

  const totalCapacity = tiers?.reduce((sum, t) => sum + t.total_capacity, 0) ?? 0
  const totalSold     = tiers?.reduce((sum, t) => sum + (t.total_capacity - t.available_tickets), 0) ?? 0
  const totalRevenue  = tiers?.reduce((sum, t) => sum + (t.total_capacity - t.available_tickets) * Number(t.price), 0) ?? 0
  const soldPct       = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0

  const statusStyle: Record<string, string> = {
    draft:     'bg-zinc-100 text-zinc-600',
    published: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
    finished:  'bg-orange-100 text-orange-700',
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
    <div className="max-w-3xl space-y-8">

      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-orange-600 transition-colors">
        <ArrowLeft size={14} />
        Mis eventos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle[displayStatus]}`}>
              {statusLabel[displayStatus]}
            </span>
            {isFinished && <span className="text-xs text-zinc-400">· Evento terminado</span>}
            {isPublished && (
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Lock size={11} /> Solo lectura — regresa a borrador para editar
              </span>
            )}
            {isDraft && (
              <span className="flex items-center gap-1 text-xs text-orange-500">
                <Pencil size={11} /> Modo edición activo
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
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
        </div>
        {imageUrl && (
          <Image
            src={imageUrl} alt={event.title}
            width={96} height={96} unoptimized
            className="w-24 h-24 rounded-xl object-cover shrink-0"
          />
        )}
      </div>

      {/* DRAFT: edit form */}
      {isDraft && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Pencil size={15} className="text-orange-500" />
            <h2 className="text-base font-semibold text-zinc-900">Editar información</h2>
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

      {/* PUBLISHED/FINISHED: show description + location readonly */}
      {!isDraft && (
        <div className="space-y-3">
          {event.description && (
            <p className="text-sm text-zinc-600 bg-white border border-zinc-200 rounded-xl px-4 py-3">
              {event.description}
            </p>
          )}
          {event.location_name && (
            <p className="text-sm text-zinc-500 bg-white border border-zinc-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <MapPin size={14} className="text-orange-400 shrink-0" />
              {event.location_name}
            </p>
          )}
        </div>
      )}

      {/* Sales summary */}
      {totalCapacity > 0 && (
        <section className={`rounded-2xl border p-5 space-y-4 ${isFinished ? 'bg-orange-50 border-orange-200' : 'bg-white border-zinc-200'}`}>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className={isFinished ? 'text-orange-500' : 'text-zinc-400'} />
            <h2 className="text-sm font-semibold text-zinc-900">
              {isFinished ? 'Resumen del evento' : 'Ventas en tiempo real'}
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-zinc-400 text-xs mb-1">
                <Users size={12} /> Vendidos
              </div>
              <p className="text-2xl font-bold text-zinc-900">{totalSold}</p>
              <p className="text-xs text-zinc-400">de {totalCapacity}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-zinc-400 text-xs mb-1">
                <TrendingUp size={12} /> Ocupación
              </div>
              <p className="text-2xl font-bold text-zinc-900">{soldPct}%</p>
              <div className="mt-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full" style={{ width: `${soldPct}%` }} />
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-zinc-400 text-xs mb-1">
                <DollarSign size={12} /> Recaudado
              </div>
              <p className="text-2xl font-bold text-zinc-900">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </section>
      )}

      {/* Status actions */}
      {!isFinished && <StatusActions eventId={id} currentStatus={event.status} />}

      {/* Tiers */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Ticket size={16} className="text-zinc-500" />
          <h2 className="text-base font-semibold text-zinc-900">Tiers de boletos</h2>
          <span className="text-sm text-zinc-400">({tiers?.length ?? 0})</span>
        </div>

        <TierList tiers={tiers ?? []} eventId={id} />

        {isDraft && (
          <div>
            <h3 className="text-sm font-medium text-zinc-700 mb-3">Agregar tier</h3>
            <TierForm eventId={id} />
          </div>
        )}

        {isPublished && (
          <p className="text-xs text-zinc-400 flex items-center gap-1.5 bg-zinc-50 px-3 py-2 rounded-lg">
            <Lock size={11} /> Regresa el evento a borrador para agregar o eliminar tiers.
          </p>
        )}
      </section>

      {/* Public link */}
      {event.status === 'published' && (
        <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-50 rounded-lg px-4 py-3">
          <Globe size={14} />
          <span>Evento público en</span>
          <a href={`/events/${id}`} className="font-medium text-orange-600 hover:underline" target="_blank">
            /events/{id}
          </a>
        </div>
      )}
    </div>
  )
}