import { Clock, CheckCircle, XCircle } from 'lucide-react'
import FormButton from '@/components/form-button'
import { approveApplication, rejectApplication } from '../actions'
import type { ApplicationRow } from '../data'

const CARD   = 'rgba(255,255,255,0.04)'
const BORDER = '1px solid rgba(255,255,255,0.08)'
const MUTED  = 'rgba(255,255,255,0.45)'
const DIM    = 'rgba(255,255,255,0.2)'

type Props = {
  applications: ApplicationRow[]
  error?: string | null
}

export function ApplicationsSection({ applications, error }: Props) {
  if (error) {
    return (
      <div className="rounded-2xl p-5 text-sm" style={{ background: CARD, border: '1px dashed rgba(239,68,68,0.3)', color: 'rgba(248,113,113,0.7)' }}>
        No se pudieron cargar las solicitudes: {error}
      </div>
    )
  }

  const pending   = applications.filter((a) => a.status === 'pending')
  const approved  = applications.filter((a) => a.status === 'approved').length
  const rejected  = applications.filter((a) => a.status === 'rejected').length
  const processed = applications.filter((a) => a.status !== 'pending')

  return (
    <div className="space-y-5">
      {/* Section stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pendientes',  value: pending.length, color: '#fbbf24' },
          { label: 'Aprobadas',   value: approved,       color: '#4ade80' },
          { label: 'Rechazadas',  value: rejected,       color: '#f87171' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: CARD, border: BORDER }}>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: MUTED }}>{s.label}</p>
            <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
          Pendientes ({pending.length})
        </p>

        {pending.length === 0 ? (
          <div className="rounded-xl p-8 flex flex-col items-center gap-2" style={{ background: CARD, border: '1px dashed rgba(255,255,255,0.08)' }}>
            <Clock size={28} style={{ color: DIM }} />
            <p className="text-sm" style={{ color: MUTED }}>No hay solicitudes pendientes</p>
          </div>
        ) : (
          pending.map((app) => (
            <div key={app.id} className="rounded-xl px-5 py-4 flex items-center justify-between gap-4" style={{ background: CARD, border: BORDER }}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{app.business_name}</p>
                <p className="text-sm mt-0.5" style={{ color: MUTED }}>
                  {app.profiles?.full_name} · {app.profiles?.email}
                </p>
                <p className="text-xs mt-0.5" style={{ color: DIM }}>RFC: {app.tax_id}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <form action={approveApplication.bind(null, app.id)}>
                  <FormButton className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <CheckCircle size={14} />
                    Aprobar
                  </FormButton>
                </form>
                <form action={rejectApplication.bind(null, app.id)}>
                  <FormButton className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <XCircle size={14} />
                    Rechazar
                  </FormButton>
                </form>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Processed */}
      {processed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
            Procesadas ({processed.length})
          </p>
          {processed.map((app) => (
            <div key={app.id} className="rounded-xl px-5 py-3 flex items-center justify-between" style={{ background: CARD, border: BORDER }}>
              <div>
                <p className="font-medium text-white">{app.business_name}</p>
                <p className="text-sm" style={{ color: DIM }}>{app.profiles?.email}</p>
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={
                  app.status === 'approved'
                    ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80' }
                    : { background: 'rgba(239,68,68,0.15)', color: '#f87171' }
                }
              >
                {app.status === 'approved' ? 'Aprobada' : 'Rechazada'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
