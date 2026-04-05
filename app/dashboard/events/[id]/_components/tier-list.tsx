'use client'

import { deleteTier } from '../actions'
import { Trash2 } from 'lucide-react'

type Tier = {
  id: string
  name: string
  price: number
  total_capacity: number
  available_tickets: number
}

export default function TierList({ tiers, eventId }: { tiers: Tier[]; eventId: string }) {
  if (tiers.length === 0) {
    return (
      <p className="text-sm text-purple-400/60 bg-white/5 border border-purple-700/30 rounded-xl px-4 py-6 text-center">
        No hay tiers aún. Agrega al menos uno para poder vender boletos.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {tiers.map(tier => {
        const sold = tier.total_capacity - tier.available_tickets
        const pct  = Math.round((sold / tier.total_capacity) * 100)

        return (
          <div key={tier.id} className="bg-white/5 rounded-xl border border-purple-700/40 px-4 py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">{tier.name}</p>
                <p className="font-bold text-orange-400">${Number(tier.price).toFixed(2)}</p>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-purple-400/60 mb-1">
                  <span>{sold} vendidos / {tier.total_capacity} total</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 bg-purple-900/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: 'var(--accent-gradient)' }}
                  />
                </div>
              </div>
            </div>
            <form action={deleteTier.bind(null, tier.id, eventId)}>
              <button
                type="submit"
                className="text-purple-600/60 hover:text-red-400 transition-colors p-1"
                title="Eliminar tier"
              >
                <Trash2 size={15} />
              </button>
            </form>
          </div>
        )
      })}
    </div>
  )
}