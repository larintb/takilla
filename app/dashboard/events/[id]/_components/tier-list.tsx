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
      <p className="text-sm text-zinc-400 bg-zinc-50 rounded-xl px-4 py-6 text-center">
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
          <div key={tier.id} className="bg-white rounded-xl border border-zinc-200 px-4 py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-zinc-900">{tier.name}</p>
                <p className="font-bold text-zinc-900">${Number(tier.price).toFixed(2)}</p>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>{sold} vendidos / {tier.total_capacity} total</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
            <form action={deleteTier.bind(null, tier.id, eventId)}>
              <button
                type="submit"
                className="text-zinc-300 hover:text-red-500 transition-colors p-1"
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