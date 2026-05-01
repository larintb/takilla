'use client'

import Image from 'next/image'
import { CheckCircle2, Minus, Plus } from 'lucide-react'

type Perk = {
  id:           string
  name:         string
  price:        number
  description?: string | null
  imageUrl?:    string | null
}

export default function PerkPanel({
  perks,
  value,
  onChange,
}: {
  perks:    Perk[]
  value:    Map<string, number>
  onChange: (next: Map<string, number>) => void
}) {
  function setQty(perkId: string, qty: number) {
    const next = new Map(value)
    if (qty <= 0) next.delete(perkId)
    else next.set(perkId, qty)
    onChange(next)
  }

  if (perks.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5">
      {perks.map(perk => {
        const qty        = value.get(perk.id) ?? 0
        const isSelected = qty > 0
        const isFree     = Number(perk.price) === 0

        return (
          <div
            key={perk.id}
            className="relative overflow-hidden rounded-2xl transition-all duration-200"
            style={{
              background: 'var(--background)',
              cursor: 'pointer',
              border: isSelected
                ? '1px solid rgba(250,20,146,0.5)'
                : '1px solid rgba(255,255,255,0.07)',
              boxShadow: isSelected ? '0 4px 24px rgba(250,20,146,0.12)' : 'none',
            }}
            onClick={() => setQty(perk.id, qty > 0 ? 0 : 1)}
          >
            {/* Header row */}
            <div className="px-4 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="shrink-0 transition-colors duration-200"
                  style={{ color: isSelected ? 'var(--color-pink)' : 'rgba(255,255,255,0.15)' }}>
                  <CheckCircle2 className="w-5 h-5" fill={isSelected ? 'currentColor' : 'none'} />
                </div>
                <span className="font-semibold text-sm leading-tight truncate"
                  style={{ color: isSelected ? '#f4f1ff' : 'rgba(255,255,255,0.55)' }}>
                  {perk.name}
                </span>
              </div>
              <span className="font-bold text-sm shrink-0 w-20 text-right mr-8"
                style={{ color: isSelected ? 'var(--color-orange)' : 'rgba(255,255,255,0.45)' }}>
                {isFree ? 'FREE' : `$${Number(perk.price).toLocaleString('es-MX')}`}
              </span>
            </div>

            {/* Expandable body */}
            <div className={`grid transition-all duration-300 ease-in-out ${isSelected ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="pb-4 pt-0 flex flex-col gap-4" style={{ paddingLeft: '3.25rem', paddingRight: '1rem' }}>

                  {perk.imageUrl && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden">
                      <Image src={perk.imageUrl} alt={perk.name} fill unoptimized className="object-cover" />
                    </div>
                  )}

                  {perk.description && (
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {perk.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Cantidad</span>
                    <div
                      className="flex items-center gap-3 rounded-full px-1 py-1"
                      style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <button
                        type="button"
                        onClick={() => setQty(perk.id, qty - 1)}
                        disabled={qty <= 0}
                        className="w-9 h-9 flex items-center justify-center rounded-full transition-all disabled:opacity-30 active:scale-90"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                      >
                        <Minus className="w-4 h-4 text-white" />
                      </button>
                      <span key={qty} className="w-6 text-center font-bold tabular-nums drum-pop text-white text-sm">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(perk.id, Math.min(qty + 1, 10))}
                        disabled={qty >= 10}
                        className="w-9 h-9 flex items-center justify-center rounded-full transition-all disabled:opacity-30 active:scale-90"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
