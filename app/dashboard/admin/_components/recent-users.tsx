import type { RecentUser } from '../data'

const CARD   = 'rgba(255,255,255,0.04)'
const BORDER = '1px solid rgba(255,255,255,0.08)'
const MUTED  = 'rgba(255,255,255,0.45)'
const DIM    = 'rgba(255,255,255,0.2)'

const roleStyle: Record<string, { bg: string; color: string; label: string }> = {
  admin:     { bg: 'rgba(250,20,146,0.15)', color: '#fa1492', label: 'Admin' },
  organizer: { bg: 'rgba(249,115,22,0.15)', color: '#fb923c', label: 'Organizador' },
  customer:  { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', label: 'Usuario' },
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)   return 'ahora'
  if (min < 60)  return `hace ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24)   return `hace ${hr} h`
  const days = Math.floor(hr / 24)
  if (days < 30) return `hace ${days} d`
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function initials(name: string | null, email: string | null): string {
  const src = name ?? email ?? '?'
  const parts = src.split(/[\s@]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return src.slice(0, 2).toUpperCase()
}

type Props = {
  users: RecentUser[]
  error?: string | null
}

export function RecentUsers({ users, error }: Props) {
  if (error) {
    return (
      <div className="rounded-2xl p-5 text-sm" style={{ background: CARD, border: '1px dashed rgba(239,68,68,0.3)', color: 'rgba(248,113,113,0.7)' }}>
        No se pudieron cargar los usuarios: {error}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center text-sm" style={{ background: CARD, border: '1px dashed rgba(255,255,255,0.08)', color: MUTED }}>
        Sin usuarios registrados aún.
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: BORDER }}>
      {users.map((user, i) => {
        const rs = roleStyle[user.role] ?? roleStyle.customer
        return (
          <div
            key={user.id}
            className="flex items-center gap-3 px-5 py-3"
            style={{ borderBottom: i < users.length - 1 ? BORDER : 'none' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              {initials(user.full_name, user.email)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.full_name ?? <span style={{ color: MUTED }}>Sin nombre</span>}
              </p>
              <p className="text-xs truncate" style={{ color: DIM }}>{user.email}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: rs.bg, color: rs.color }}
              >
                {rs.label}
              </span>
              <span className="text-xs" style={{ color: DIM }}>{relativeTime(user.created_at)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
