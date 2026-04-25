'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, Minus, Plus } from 'lucide-react'

type Perk = {
  id:           string
  name:         string
  price:        number
  description?: string | null
  imageUrl?:    string | null
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PerkPanel({
  perks,
  value,
  onChange,
}: {
  perks:    Perk[]
  value:    Map<string, number>        // perkId → qty (0 = not selected)
  onChange: (next: Map<string, number>) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function setQty(perkId: string, qty: number) {
    const next = new Map(value)
    if (qty <= 0) next.delete(perkId)
    else next.set(perkId, qty)
    onChange(next)
  }

  if (perks.length === 0) return null

  return (
    <div className="flex flex-col gap-4">

      <div className="px-1">
        <p className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          Extras
        </p>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Agrega lo que quieras al evento.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {perks.map(perk => {
          const qty        = value.get(perk.id) ?? 0
          const isSelected = qty > 0
          const isExpanded = expandedId === perk.id
          const isFree     = Number(perk.price) === 0

          return (
            <div
              key={perk.id}
              className="relative overflow-hidden rounded-2xl transition-all duration-300"
              style={{
                background: 'var(--surface-panel)',
                cursor: 'pointer',
                border: isSelected
                  ? '1px solid var(--color-pink)'
                  : '1px solid var(--color-deep-purple)',
                boxShadow: isSelected ? '0 4px 20px rgba(250,20,146,0.15)' : 'none',
                opacity: 1,
              }}
              onClick={() => setExpandedId(isExpanded ? null : perk.id)}
            >
              {/* Header row */}
              <div className="p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 transition-colors duration-300"
                    style={{ color: isSelected ? 'var(--color-pink)' : 'var(--color-deep-purple)' }}>
                    <CheckCircle2 className="w-5 h-5" fill={isSelected ? 'currentColor' : 'none'} />
                  </div>
                  <span className="font-medium text-base leading-tight truncate"
                    style={{ color: isSelected ? 'var(--foreground)' : 'rgba(255,255,255,0.65)' }}>
                    {perk.name}
                  </span>
                </div>
                <span className="font-bold text-sm shrink-0"
                  style={{ color: isSelected ? 'var(--color-orange)' : 'rgba(255,255,255,0.4)' }}>
                  {isFree ? 'FREE' : `$${Number(perk.price).toLocaleString('es-MX')}`}
                </span>
              </div>

              {/* Expandable body */}
              <div className={`grid transition-all duration-300 ease-in-out ${isExpanded || isSelected ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 pt-0 flex flex-col gap-4">
                    {perk.imageUrl && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <Image
                          src={perk.imageUrl}
                          alt={perk.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    )}
                    {perk.description && (
                      <p className="text-sm leading-relaxed pl-8"
                        style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {perk.description}
                      </p>
                    )}

                    <div className="pl-8 flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Cantidad
                      </span>
                      <div
                        className="flex items-center gap-4 rounded-full p-1"
                        style={{ background: 'var(--background)', border: '1px solid var(--color-deep-purple)' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setQty(perk.id, qty - 1)}
                          disabled={qty <= 0}
                          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-40"
                          style={{ background: 'var(--surface-panel)', color: 'var(--foreground)' }}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span key={qty} className="w-6 text-center font-semibold tabular-nums drum-pop"
                          style={{ color: 'var(--foreground)' }}>
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(perk.id, Math.min(qty + 1, 10))}
                          disabled={qty >= 10}
                          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-40"
                          style={{ background: 'var(--surface-panel)', color: 'var(--foreground)' }}
                        >
                          <Plus className="w-4 h-4" />
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
    </div>
  )
}
