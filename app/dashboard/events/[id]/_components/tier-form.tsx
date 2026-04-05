'use client'

import { useActionState } from 'react'
import { addTier } from '../actions'
import { Plus } from 'lucide-react'
import FormButton from '@/components/form-button'

export default function TierForm({ eventId }: { eventId: string }) {
  const [state, action] = useActionState(addTier, null)

  return (
    <form action={action} className="bg-white/5 rounded-xl border border-purple-700/40 p-4">
      <input type="hidden" name="event_id" value={eventId} />

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="tier-name" className="block text-xs font-medium text-purple-300 mb-1">
            Nombre
          </label>
          <input
            id="tier-name"
            name="name"
            type="text"
            required
            placeholder="General, VIP..."
            className="w-full rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="tier-price" className="block text-xs font-medium text-purple-300 mb-1">
            Precio ($)
          </label>
          <input
            id="tier-price"
            name="price"
            type="number"
            required
            min="0"
            step="1"
            placeholder="0"
            className="w-full rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="tier-capacity" className="block text-xs font-medium text-purple-300 mb-1">
            Capacidad (máx. 999)
          </label>
          <input
            id="tier-capacity"
            name="total_capacity"
            type="number"
            required
            min="1"
            max="999"
            placeholder="100"
            className="w-full rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-400 mt-2">{state.error}</p>
      )}

      <FormButton className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all" style={{background: 'var(--accent-gradient)'}}>
        <Plus size={14} />
        Agregar tier
      </FormButton>
    </form>
  )
}