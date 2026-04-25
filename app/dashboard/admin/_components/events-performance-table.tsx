import Image from 'next/image'
import type { EventPerformanceRow } from '../data'

const CARD      = 'rgba(255,255,255,0.04)'
const BORDER    = '1px solid rgba(255,255,255,0.08)'
const MUTED     = 'rgba(255,255,255,0.45)'
const DIM       = 'rgba(255,255,255,0.2)'

const statusColors: Record<string, { bg: string; color: string }> = {
  draft:     { bg: 'rgba(255,255,255,0.08)',  color: 'rgba(255,255,255,0.5)' },
  published: { bg: 'rgba(34,197,94,0.15)',    color: '#4ade80' },
  cancelled: { bg: 'rgba(239,68,68,0.15)',    color: '#f87171' },
  finished:  { bg: 'rgba(249,115,22,0.15)',   color: '#fb923c' },
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador', published: 'Publicado', cancelled: 'Cancelado', finished: 'Finalizado',
}

function getDisplayStatus(status: string, eventDate: string) {
  if (status === 'published' && new Date(eventDate) < new Date()) return 'finished'
  return status
}

function mxn(amount: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount)
}

type Props = {
  events: EventPerformanceRow[]
  error?: string | null
}

export function EventsPerformanceTable({ events, error }: Props) {
  if (error) {
    return (
      <div className="rounded-2xl p-6 text-sm" style={{ background: CARD, border: '1px dashed rgba(239,68,68,0.3)', color: 'rgba(248,113,113,0.7)' }}>
        No se pudo cargar la tabla de eventos: {error}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center text-sm" style={{ background: CARD, border: '1px dashed rgba(255,255,255,0.08)', color: MUTED }}>
        No hay eventos registrados aún.
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: BORDER }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: BORDER }}>
              {['Evento', 'Organizador', 'Fecha', 'Boletos', 'Aforo', 'Ingresos', 'Estado'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase whitespace-nowrap"
                  style={{ color: MUTED }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((ev, i) => {
              const ds = getDisplayStatus(ev.status, ev.event_date)
              const sc = statusColors[ds] ?? statusColors.draft
              const dateStr = new Date(ev.event_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

              return (
                <tr
                  key={ev.id}
                  className="transition-colors duration-150 hover:bg-[rgba(255,255,255,0.025)]"
                  style={{ borderBottom: i < events.length - 1 ? BORDER : 'none' }}
                >
                  {/* Evento */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {ev.image_url ? (
                          <Image src={ev.image_url} alt="" width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" style={{ background: 'var(--accent-gradient)' }} />
                        )}
                      </div>
                      <span className="font-medium text-white truncate max-w-[160px]">{ev.title}</span>
                    </div>
                  </td>

                  {/* Organizador */}
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: MUTED }}>
                    {ev.organizer?.full_name ?? ev.organizer?.email ?? '—'}
                  </td>

                  {/* Fecha */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: MUTED }}>{dateStr}</td>

                  {/* Boletos */}
                  <td className="px-4 py-3 whitespace-nowrap font-semibold tabular-nums text-white">
                    {ev.sold.toLocaleString('es-MX')}
                  </td>

                  {/* Aforo */}
                  <td className="px-4 py-3 min-w-[120px]">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs tabular-nums" style={{ color: DIM }}>
                        {ev.sold} / {ev.capacity}
                      </span>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(100, ev.progress * 100).toFixed(1)}%`, background: 'var(--accent-gradient)' }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Ingresos */}
                  <td className="px-4 py-3 whitespace-nowrap font-semibold tabular-nums text-white">
                    {mxn(ev.revenue)}
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                      style={{ background: sc.bg, color: sc.color }}
                    >
                      {statusLabels[ds] ?? ds}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
