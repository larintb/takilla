import { Ticket, User } from 'lucide-react'
import type { TicketBuyerRow } from '../data'



export function TicketBuyers({ buyers, error }: { buyers: TicketBuyerRow[]; error?: string | null }) {
  if (error) {
    return (
      <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
        Error al cargar clientes: {error}
      </p>
    )
  }

  if (buyers.length === 0) {
    return (
      <p className="text-sm text-purple-400/60 bg-white/5 border border-purple-700/30 rounded-xl px-4 py-6 text-center">
        Aún no hay boletos vendidos.
      </p>
    )
  }

  return (
    <div className="rounded-xl border border-purple-700/30 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2.5 border-b border-purple-700/20"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Cliente
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Boletos
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-purple-700/20">
        {buyers.map((buyer) => (
          <div key={buyer.owner_id} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 items-center hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                <User size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {buyer.full_name ?? 'Sin nombre'}
                </p>
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {buyer.email ?? '—'}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {buyer.purchases.map((p) => (
                    <span
                      key={`${p.event_title}__${p.tier_name}`}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs"
                      style={{ background: 'rgba(249,115,22,0.12)', color: 'rgba(249,115,22,0.85)' }}
                    >
                      {p.event_title} · <span className="font-semibold">{p.tier_name}</span>
                      {p.count > 1 && (
                        <span className="ml-0.5 font-bold" style={{ color: 'rgba(249,115,22,1)' }}>
                          ×{p.count}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Ticket size={13} style={{ color: 'rgba(249,115,22,0.7)' }} />
              <span className="text-sm font-bold text-white">{buyer.ticket_count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-purple-700/20 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {buyers.length} cliente{buyers.length !== 1 ? 's' : ''} con boletos
        </span>
        <span className="text-xs font-semibold" style={{ color: 'rgba(249,115,22,0.8)' }}>
          {buyers.reduce((s, b) => s + b.ticket_count, 0)} boletos totales
        </span>
      </div>
    </div>
  )
}
