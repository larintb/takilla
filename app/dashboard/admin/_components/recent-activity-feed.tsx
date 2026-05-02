import type { ActivityItem } from '../data'

const CARD   = 'rgba(255,255,255,0.04)'
const BORDER = '1px solid rgba(255,255,255,0.08)'
const MUTED  = 'rgba(255,255,255,0.45)'
const DIM    = 'rgba(255,255,255,0.2)'

const effectDot: Record<string, string> = {
  gold:    'linear-gradient(135deg, #f59e0b, #fbbf24)',
  diamond: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
  none:    'var(--accent-gradient)',
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)   return 'ahora'
  if (min < 60)  return `hace ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24)   return `hace ${hr} h`
  return `hace ${Math.floor(hr / 24)} d`
}

function initials(name: string | null, email: string | null): string {
  const src = name ?? email ?? '?'
  const parts = src.split(/[\s@]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return src.slice(0, 2).toUpperCase()
}

function mxn(amount: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount)
}

type Props = {
  items: ActivityItem[]
  error?: string | null
}

export function RecentActivityFeed({ items, error }: Props) {
  if (error) {
    return (
      <div className="rounded-2xl p-5 text-sm" style={{ background: CARD, border: '1px dashed rgba(239,68,68,0.3)', color: 'rgba(248,113,113,0.7)' }}>
        No se pudo cargar la actividad reciente: {error}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center text-sm" style={{ background: CARD, border: '1px dashed rgba(255,255,255,0.08)', color: MUTED }}>
        Sin actividad reciente.
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: BORDER }}>
      {items.map((item, i) => {
        const dot = effectDot[item.tierEffect ?? 'none'] ?? effectDot.none
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 px-5 py-3"
            style={{ borderBottom: i < items.length - 1 ? BORDER : 'none' }}
          >
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              {initials(item.buyerName, item.buyerEmail)}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white leading-snug truncate">
                <span className="font-medium">{item.buyerName ?? item.buyerEmail ?? 'Usuario'}</span>
                {' compró '}
                <span style={{ color: MUTED }}>{item.tierName ?? 'boleto'}</span>
                {item.eventTitle && (
                  <span style={{ color: DIM }}> · {item.eventTitle}</span>
                )}
              </p>
              <p className="text-xs mt-0.5" style={{ color: DIM }}>{relativeTime(item.created_at)}</p>
            </div>

            {/* Quantity + price + tier dot */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-md tabular-nums"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
              >
                ×{item.quantity}
              </span>
              <span className="text-sm font-semibold tabular-nums text-white">{mxn(item.tierPrice)}</span>
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: dot }}
                title={item.tierEffect ?? 'none'}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
