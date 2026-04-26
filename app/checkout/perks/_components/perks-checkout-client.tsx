'use client'

import { useState, useMemo } from 'react'
import PerkPanel from '@/components/perk-panel'
import PerksPaymentForm from './perks-payment-form'
import { startFreePerksCheckout } from '../actions'
import { Gift, ArrowRight, Loader2 } from 'lucide-react'
import { calculatePerkFees } from '@/utils/pricing'

type Perk = {
  id:           string
  name:         string
  price:        number
  description?: string | null
  imageUrl?:    string | null
}

export default function PerksCheckoutClient({
  eventId,
  eventTitle,
  perks,
  initialPerkIds = [],
}: {
  eventId:         string
  eventTitle:      string
  perks:           Perk[]
  initialPerkIds?: string[]
}) {
  const [selection, setSelection] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>()
    for (const id of initialPerkIds) {
      // Only pre-select IDs that actually exist in the loaded perks list
      if (perks.some(p => p.id === id)) {
        map.set(id, (map.get(id) ?? 0) + 1)
      }
    }
    return map
  })
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(false)

  // Build flat array of perk IDs (with repetitions for quantity)
  const perkIds = useMemo(() => {
    const ids: string[] = []
    for (const [id, qty] of selection.entries()) {
      for (let i = 0; i < qty; i++) ids.push(id)
    }
    return ids
  }, [selection])

  // Compute totals
  const { subtotal, serviceCharge, totalAmount, isFree } = useMemo(() => {
    let sub = 0
    let total = 0
    for (const [id, qty] of selection.entries()) {
      const perk = perks.find(p => p.id === id)
      if (!perk) continue
      const price = Number(perk.price)
      if (price === 0) continue
      const fees = calculatePerkFees(price, qty)
      sub   += price * qty
      total += fees.totalAmount
    }
    return { subtotal: sub, serviceCharge: total - sub, totalAmount: total, isFree: total === 0 }
  }, [selection, perks])

  const hasSelection = perkIds.length > 0

  if (showPayment && !isFree) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setShowPayment(false)}
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Cambiar selección
        </button>

        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface-panel)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              Extras seleccionados
            </p>
            <ul className="space-y-1">
              {[...selection.entries()].filter(([,q]) => q > 0).map(([id, qty]) => {
                const perk = perks.find(p => p.id === id)!
                return (
                  <li key={id} className="flex justify-between text-sm text-white">
                    <span>{perk.name} × {qty}</span>
                    <span className="font-semibold">${(Number(perk.price) * qty).toFixed(2)}</span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-4 pt-4 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex justify-between text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span>Cargo por servicio</span>
                <span>${serviceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-base font-semibold text-white">Total</span>
                <span className="font-bold text-white" style={{ fontSize: '1.5rem' }}>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <PerksPaymentForm
              eventId={eventId}
              perkIds={perkIds}
              totalLabel={`$${totalAmount.toFixed(2)} MXN`}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-panel)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gift size={16} style={{ color: 'var(--color-orange)' }} />
            <p className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              {eventTitle}
            </p>
          </div>
          <PerkPanel perks={perks} value={selection} onChange={setSelection} />
        </div>

        {hasSelection && (
          <div className="px-6 pb-6 space-y-3">
            <div className="pt-4 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              {!isFree && (
                <>
                  <div className="flex justify-between text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <span>Subtotal ({perkIds.length} {perkIds.length === 1 ? 'extra' : 'extras'})</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <span>Cargo por servicio</span>
                    <span>${serviceCharge.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center pt-2" style={{ borderTop: isFree ? 'none' : '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-base font-semibold text-white">
                  {isFree ? `${perkIds.length} ${perkIds.length === 1 ? 'extra' : 'extras'}` : 'Total'}
                </span>
                <span className="font-bold text-white" style={{ fontSize: '1.5rem' }}>
                  {isFree ? 'FREE' : `$${totalAmount.toFixed(2)}`}
                </span>
              </div>
            </div>

            {isFree ? (
              <form action={startFreePerksCheckout}>
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="perkIds" value={perkIds.join(',')} />
                <button
                  type="submit"
                  className="relative w-full h-14 rounded-2xl overflow-hidden font-semibold text-base text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed px-5 flex items-center justify-between"
                  style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 28px rgba(249,115,22,0.28)' }}
                >
                  <span>Confirmar extras · FREE</span>
                  <ArrowRight className="w-5 h-5 opacity-80" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => { setLoading(true); setTimeout(() => { setShowPayment(true); setLoading(false) }, 300) }}
                disabled={loading}
                className="relative w-full h-14 rounded-2xl overflow-hidden font-semibold text-base text-white transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-between px-5"
                style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 28px rgba(249,115,22,0.28)' }}
              >
                {loading ? (
                  <span className="w-full flex items-center justify-center">
                    <Loader2 size={22} className="animate-spin" />
                  </span>
                ) : (
                  <>
                    <span>Comprar extras</span>
                    <span className="flex items-center gap-2 font-bold">
                      ${totalAmount.toFixed(2)}
                      <ArrowRight className="w-5 h-5 opacity-80" />
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
