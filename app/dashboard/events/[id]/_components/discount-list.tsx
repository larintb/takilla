'use client'

import { useState, useTransition } from 'react'
import { toggleDiscountActive, deleteDiscount } from '../actions'
import { Trash2, Lock, Tag } from 'lucide-react'

type Discount = {
  id: string
  name: string
  code: string | null
  kind: string
  percent_off: number | null
  amount_off: number | null
  buy_quantity: number | null
  get_quantity: number | null
  tier_id: string | null
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
}

type Tier = { id: string; name: string }

function discountValueLabel(d: Discount): string {
  if (d.kind === 'percent') return `${d.percent_off}% OFF`
  if (d.kind === 'fixed')   return `$${Number(d.amount_off).toFixed(0)} OFF`
  if (d.kind === 'bogo')    return `${d.buy_quantity}+${d.get_quantity} BOGO`
  return ''
}

export default function DiscountList({
  discounts,
  tiers,
  eventId,
}: {
  discounts: Discount[]
  tiers: Tier[]
  eventId: string
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [toggling, startToggle] = useTransition()
  const [deleting, startDelete] = useTransition()

  const tierMap = new Map(tiers.map(t => [t.id, t.name]))

  if (discounts.length === 0) {
    return (
      <p className="text-sm text-purple-400/60 bg-white/5 border border-purple-700/30 rounded-xl px-4 py-6 text-center">
        No hay descuentos aún.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {discounts.map(d => {
          const valueLabel = discountValueLabel(d)
          const tierLabel  = d.tier_id ? (tierMap.get(d.tier_id) ?? 'Tier') : 'Todos los tiers'
          const usesLabel  = d.max_uses != null ? `${d.used_count} / ${d.max_uses}` : `${d.used_count} / ∞`
          const canDelete  = d.used_count === 0

          return (
            <div
              key={d.id}
              className="bg-white/5 rounded-xl border border-purple-700/40 px-4 py-3 space-y-1.5"
              style={{ opacity: d.is_active ? 1 : 0.5 }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Tag size={13} className="text-orange-400 shrink-0" />
                  <span className="font-medium text-white text-sm truncate">{d.name}</span>
                  <span
                    className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide"
                    style={{ background: 'var(--accent-gradient)', color: '#fff' }}
                  >
                    {valueLabel}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle active */}
                  <button
                    type="button"
                    disabled={toggling}
                    onClick={() => startToggle(() => toggleDiscountActive(d.id, eventId, !d.is_active))}
                    className="text-xs px-2 py-1 rounded-lg transition-colors"
                    style={{
                      background: d.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
                      color: d.is_active ? '#4ade80' : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${d.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    {d.is_active ? 'Activo' : 'Inactivo'}
                  </button>

                  {/* Delete */}
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(d.id)}
                      className="text-purple-600/60 hover:text-red-400 transition-colors p-1"
                      title="Eliminar descuento"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <button
                      disabled
                      className="text-purple-800/50 p-1 cursor-not-allowed"
                      title={`No se puede eliminar: ${d.used_count} canje(s) registrado(s)`}
                    >
                      <Lock size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span>{tierLabel}</span>
                <span>·</span>
                {d.code ? (
                  <span className="font-mono bg-white/8 border border-purple-700/30 px-1.5 py-0.5 rounded text-purple-300">
                    {d.code}
                  </span>
                ) : (
                  <span className="text-orange-400/70">Público</span>
                )}
                <span>·</span>
                <span>Canjes: {usesLabel}</span>
                {d.expires_at && (
                  <>
                    <span>·</span>
                    <span>Expira: {new Date(d.expires_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl border border-purple-700/40 p-6 space-y-4" style={{ background: 'var(--surface-panel)' }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/15">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">¿Eliminar descuento?</p>
                <p className="text-xs text-purple-400/70 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  startDelete(async () => {
                    await deleteDiscount(confirmDeleteId, eventId)
                    setConfirmDeleteId(null)
                  })
                }
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{ background: 'linear-gradient(90deg, #dc2626, #b91c1c)' }}
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
