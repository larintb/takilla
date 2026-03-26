'use client'

import { useActionState } from 'react'
import { addTier } from '../actions'
import { Plus } from 'lucide-react'
import FormButton from '@/components/form-button'

export default function TierForm({ eventId }: { eventId: string }) {
  const [state, action] = useActionState(addTier, null)

  return (
    <form action={action} className="bg-white rounded-xl border border-zinc-200 p-4">
      <input type="hidden" name="event_id" value={eventId} />

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="tier-name" className="block text-xs font-medium text-zinc-600 mb-1">
            Nombre
          </label>
          <input
            id="tier-name"
            name="name"
            type="text"
            required
            placeholder="General, VIP..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="tier-price" className="block text-xs font-medium text-zinc-600 mb-1">
            Precio ($)
          </label>
          <input
            id="tier-price"
            name="price"
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="tier-capacity" className="block text-xs font-medium text-zinc-600 mb-1">
            Capacidad
          </label>
          <input
            id="tier-capacity"
            name="total_capacity"
            type="number"
            required
            min="1"
            placeholder="100"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 mt-2">{state.error}</p>
      )}

      <FormButton className="mt-3 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700">
        <Plus size={14} />
        Agregar tier
      </FormButton>
    </form>
  )
}
