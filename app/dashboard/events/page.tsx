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
    <div className="space-y-6 px-4 py-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis eventos</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {events?.length ?? 0} eventos en total
          </p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="flex items-center gap-2 px-4 h-10 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] shrink-0"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <Plus size={16} />
          Nuevo
        </Link>
      </div>

      {!events?.length ? (
        <div className="rounded-2xl border p-12 text-center"
          style={{ background: 'var(--background)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CalendarDays size={40} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' }} />
          <p className="font-semibold text-white">No tienes eventos aún</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Crea tu primer evento para empezar a vender boletos
          </p>
          <Link
            href="/dashboard/events/new"
            className="inline-flex items-center gap-2 mt-4 px-4 h-10 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <Plus size={15} />
            Crear evento
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => {
            const displayStatus = getDisplayStatus(event.status, event.event_date)
            const statusColors: Record<string, { bg: string; color: string }> = {
              draft:     { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' },
              published: { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
              cancelled: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
              finished:  { bg: 'rgba(249,115,22,0.15)',  color: '#fb923c' },
            }
            const badgeStyle = statusColors[displayStatus]
            return (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="flex items-center justify-between rounded-2xl border px-5 py-4 transition-all active:scale-[0.98]"
                style={{ background: 'var(--background)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{event.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <span className="flex items-center gap-1">
                      <CalendarDays size={13} />
                      {new Date(event.event_date).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
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
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full ml-4 shrink-0"
                  style={{ background: badgeStyle.bg, color: badgeStyle.color }}
                >
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
