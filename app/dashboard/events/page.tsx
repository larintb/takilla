import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Plus, CalendarDays, MapPin } from 'lucide-react'

const statusLabel: Record<string, string> = {
  draft:     'Borrador',
  published: 'Publicado',
  cancelled: 'Cancelado',
  finished:  'Finalizado',
}

const statusStyle: Record<string, string> = {
  draft:     'bg-zinc-100 text-zinc-600',
  published: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  finished:  'bg-orange-100 text-orange-700',
}

type VenueInfo = {
  name?: string | null
  city?: string | null
}

function getDisplayStatus(status: string, eventDate: string) {
  if (status === 'published' && new Date(eventDate) < new Date()) return 'finished'
  return status
}

export default async function EventsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer' && profile?.role !== 'admin') redirect('/dashboard')

  const query = supabase
    .from('events')
    .select('id, title, event_date, status, venues(name, city)')
    .order('event_date', { ascending: false })

  if (profile?.role === 'organizer') {
    query.eq('organizer_id', user.id)
  }

  const { data: events } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Mis eventos</h1>
          <p className="text-zinc-500 mt-1">{events?.length ?? 0} eventos en total</p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white text-sm font-semibold hover:from-amber-500 hover:via-orange-600 hover:to-red-700 transition-all"
        >
          <Plus size={16} />
          Nuevo evento
        </Link>
      </div>

      {!events?.length ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-16 text-center">
          <CalendarDays size={40} className="mx-auto text-zinc-300 mb-3" />
          <p className="font-semibold text-zinc-700">No tienes eventos aún</p>
          <p className="text-sm text-zinc-400 mt-1">Crea tu primer evento para empezar a vender boletos</p>
          <Link
            href="/dashboard/events/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white text-sm font-semibold hover:from-amber-500 hover:via-orange-600 hover:to-red-700 transition-all"
          >
            <Plus size={15} />
            Crear evento
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => {
            const displayStatus = getDisplayStatus(event.status, event.event_date)
            return (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-zinc-200 px-5 py-4 hover:border-orange-300 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 group-hover:text-orange-600 truncate transition-colors">{event.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={13} />
                      {new Date(event.event_date).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                    {((event.venues as VenueInfo | null)?.name) && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} />
                        {(event.venues as VenueInfo).name}, {(event.venues as VenueInfo).city}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-4 ${statusStyle[displayStatus]}`}>
                  {statusLabel[displayStatus]}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}