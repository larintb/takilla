import type { FeedItem, FeedEventType } from '../data'
import { Ticket, UserPlus, CalendarDays, Star, Building2 } from 'lucide-react'

const CARD   = 'rgba(255,255,255,0.04)'
const BORDER = '1px solid rgba(255,255,255,0.08)'
const DIM    = 'rgba(255,255,255,0.25)'

type TypeConfig = {
  icon: React.ReactNode
  label: string
  iconBg: string
  iconColor: string
  badgeBg: string
  badgeColor: string
}

const TYPE_CONFIG: Record<FeedEventType, TypeConfig> = {
  purchase: {
    icon: <Ticket size={14} />,
    label: 'Compra',
    iconBg: 'rgba(255,110,1,0.15)',
    iconColor: '#ff6e01',
    badgeBg: 'rgba(255,110,1,0.12)',
    badgeColor: '#ff6e01',
  },
  signup: {
    icon: <UserPlus size={14} />,
    label: 'Registro',
    iconBg: 'rgba(74,222,128,0.15)',
    iconColor: '#4ade80',
    badgeBg: 'rgba(74,222,128,0.12)',
    badgeColor: '#4ade80',
  },
  event_created: {
    icon: <CalendarDays size={14} />,
    label: 'Evento creado',
    iconBg: 'rgba(96,165,250,0.15)',
    iconColor: '#60a5fa',
    badgeBg: 'rgba(96,165,250,0.12)',
    badgeColor: '#60a5fa',
  },
  event_published: {
    icon: <CalendarDays size={14} />,
    label: 'Evento publicado',
    iconBg: 'rgba(167,139,250,0.15)',
    iconColor: '#a78bfa',
    badgeBg: 'rgba(167,139,250,0.12)',
    badgeColor: '#a78bfa',
  },
  org_applied: {
    icon: <Building2 size={14} />,
    label: 'Solicitud organiz.',
    iconBg: 'rgba(251,191,36,0.15)',
    iconColor: '#fbbf24',
    badgeBg: 'rgba(251,191,36,0.12)',
    badgeColor: '#fbbf24',
  },
  org_approved: {
    icon: <Star size={14} />,
    label: 'Nuevo organizador',
    iconBg: 'rgba(250,20,146,0.15)',
    iconColor: '#fa1492',
    badgeBg: 'rgba(250,20,146,0.12)',
    badgeColor: '#fa1492',
  },
}

function mxn(amount: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount)
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)   return 'ahora'
  if (min < 60)  return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24)   return `${hr}h`
  const days = Math.floor(hr / 24)
  if (days < 30) return `${days}d`
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function buildDescription(item: FeedItem): { main: string; sub: string | null } {
  const actor = item.actorName ?? item.actorEmail ?? 'Alguien'
  switch (item.type) {
    case 'purchase':
      return { main: `${actor} compró ${item.quantity && item.quantity > 1 ? `×${item.quantity} boletos` : 'un boleto'}`, sub: item.subtitle }
    case 'signup':
      return { main: `${actor} se registró en la plataforma`, sub: item.actorEmail !== item.actorName ? item.actorEmail : null }
    case 'event_created':
      return { main: `${actor} creó un evento`, sub: item.subtitle }
    case 'event_published':
      return { main: `${actor} publicó un evento`, sub: item.subtitle }
    case 'org_applied':
      return { main: `${actor} solicitó ser organizador`, sub: item.subtitle }
    case 'org_approved':
      return { main: `${actor} fue aprobado como organizador`, sub: item.subtitle }
  }
}

type Props = {
  items: FeedItem[]
  error?: string | null
}

export function ActivityFeed({ items, error }: Props) {
  if (error) {
    return (
      <div className="rounded-2xl p-5 text-sm" style={{ background: CARD, border: '1px dashed rgba(239,68,68,0.3)', color: 'rgba(248,113,113,0.7)' }}>
        No se pudo cargar la actividad: {error}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center text-sm" style={{ background: CARD, border: '1px dashed rgba(255,255,255,0.08)', color: DIM }}>
        Sin actividad registrada aún.
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: BORDER }}>
      {items.map((item, i) => {
        const cfg = TYPE_CONFIG[item.type]
        const { main, sub } = buildDescription(item)
        const isLast = i === items.length - 1

        return (
          <div
            key={item.id}
            className="flex items-start gap-4 px-5 py-3.5"
            style={{ borderBottom: isLast ? 'none' : BORDER }}
          >
            {/* Icon */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: cfg.iconBg, color: cfg.iconColor }}
            >
              {cfg.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                  style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
                >
                  {cfg.label}
                </span>
                {item.type === 'purchase' && item.amount != null && (
                  <span className="text-xs font-semibold text-white tabular-nums">
                    {mxn(item.amount)}
                  </span>
                )}
              </div>
              <p className="text-sm text-white mt-1 leading-snug">{main}</p>
              {sub && (
                <p className="text-xs mt-0.5 truncate" style={{ color: DIM }}>{sub}</p>
              )}
            </div>

            {/* Time */}
            <span className="text-xs flex-shrink-0 mt-1 tabular-nums" style={{ color: DIM }}>
              {relativeTime(item.created_at)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
