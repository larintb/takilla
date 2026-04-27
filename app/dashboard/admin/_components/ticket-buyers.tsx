import { Ticket, Gift, User } from 'lucide-react'
import type { TicketBuyerRow } from '../data'

const TICKET_STYLE = { background: 'rgba(249,115,22,0.12)', color: 'rgba(249,115,22,0.9)' }
const PERK_STYLE   = { background: 'rgba(96,165,250,0.12)', color: 'rgba(96,165,250,0.9)' }

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
        Aún no hay compras registradas.
      </p>
    )
  }

  const totalTickets = buyers.reduce((s, b) => s + b.ticket_count, 0)
  const totalPerks   = buyers.reduce((s, b) => s + b.perk_count, 0)

  return (
    <div className="rounded-xl border border-purple-700/30 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2.5 border-b border-purple-700/20"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Cliente
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(249,115,22,0.6)' }}>
            Boletos
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(96,165,250,0.6)' }}>
            Extras
          </span>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-purple-700/20 overflow-y-auto" style={{ maxHeight: 320 }}>
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
                  {buyer.purchases.map((p, i) => {
                    const style = p.kind === 'ticket' ? TICKET_STYLE : PERK_STYLE
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs"
                        style={style}
                      >
                        {p.kind === 'ticket'
                          ? <Ticket size={10} />
                          : <Gift size={10} />
                        }
                        {p.event_title} · <span className="font-semibold">{p.item_name}</span>
                        {p.count > 1 && <span className="font-bold">×{p.count}</span>}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1">
                <Ticket size={12} style={{ color: 'rgba(249,115,22,0.7)' }} />
                <span className="text-sm font-bold text-white">{buyer.ticket_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Gift size={12} style={{ color: 'rgba(96,165,250,0.7)' }} />
                <span className="text-sm font-bold text-white">{buyer.perk_count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-purple-700/20 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {buyers.length} cliente{buyers.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'rgba(249,115,22,0.8)' }}>
            <Ticket size={11} /> {totalTickets}
          </span>
          <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'rgba(96,165,250,0.8)' }}>
            <Gift size={11} /> {totalPerks}
          </span>
        </div>
      </div>
    </div>
  )
}
