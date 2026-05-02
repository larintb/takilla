import { Users, Ticket, TrendingUp, UserPlus } from 'lucide-react'
import type { UserMetrics, EventPerformanceSummary } from '../data'

const CARD   = 'rgba(255,255,255,0.04)'
const BORDER = '1px solid rgba(255,255,255,0.08)'
const MUTED  = 'rgba(255,255,255,0.45)'
const DIM    = 'rgba(255,255,255,0.25)'

function mxn(amount: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount)
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 60)  return `hace ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24)   return `hace ${hr} h`
  return `hace ${Math.floor(hr / 24)} d`
}

type Props = {
  users: UserMetrics
  performance: EventPerformanceSummary
}

type TileProps = {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent?: boolean
}

function Tile({ icon, label, value, sub, accent }: TileProps) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: CARD,
        border: BORDER,
        ...(accent ? { borderTop: '2px solid transparent', backgroundImage: `linear-gradient(${CARD}, ${CARD}), var(--accent-gradient)`, backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' } : {}),
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide uppercase" style={{ color: MUTED }}>{label}</span>
        <span style={{ color: MUTED }}>{icon}</span>
      </div>
      <p className="text-4xl font-bold tabular-nums tracking-tight text-white leading-none">{value}</p>
      <p className="text-xs" style={{ color: DIM }}>{sub}</p>
    </div>
  )
}

export function MetricsCards({ users, performance }: Props) {
  const latestSub = users.latest
    ? `Último: ${users.latest.full_name ?? users.latest.email ?? '—'} · ${relativeTime(users.latest.created_at)}`
    : 'Sin registros aún'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Tile
        icon={<Users size={16} />}
        label="Usuarios totales"
        value={users.total.toLocaleString('es-MX')}
        sub={latestSub}
      />
      <Tile
        icon={<UserPlus size={16} />}
        label="Nuevos (30 días)"
        value={users.newLast30d.toLocaleString('es-MX')}
        sub={`${users.total > 0 ? Math.round((users.newLast30d / users.total) * 100) : 0}% del total`}
      />
      <Tile
        icon={<Ticket size={16} />}
        label="Boletos vendidos"
        value={performance.totalTicketsSold.toLocaleString('es-MX')}
        sub="Todos los eventos"
      />
      <Tile
        icon={<TrendingUp size={16} />}
        label="Ingresos brutos"
        value={mxn(performance.totalRevenue)}
        sub="Total cobrado (descuentos incluidos)"
        accent
      />
    </div>
  )
}

export function MetricsCardsError({ error }: { error: string }) {
  return (
    <div
      className="rounded-2xl p-5 text-sm"
      style={{ background: CARD, border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(248,113,113,0.8)' }}
    >
      No se pudieron cargar las métricas: {error}
    </div>
  )
}
