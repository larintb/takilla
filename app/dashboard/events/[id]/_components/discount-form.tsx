'use client'

import { useActionState, useState } from 'react'
import { addDiscount } from '../actions'
import { Plus } from 'lucide-react'
import FormButton from '@/components/form-button'

const inputClass = "w-full rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"

type Tier = { id: string; name: string; price: number }

export default function DiscountForm({ eventId, tiers }: { eventId: string; tiers: Tier[] }) {
  const [state, action] = useActionState(addDiscount, null)
  const [kind, setKind] = useState<'percent' | 'fixed' | 'bogo'>('percent')

  return (
    <form action={action} className="bg-white/5 rounded-xl border border-purple-700/40 p-4 space-y-3">
      <input type="hidden" name="event_id" value={eventId} />

      {/* Row 1: nombre + código */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-purple-300 mb-1">
            Nombre interno
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="Promo lanzamiento..."
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-purple-300 mb-1">
            Código <span className="text-purple-400/50 font-normal">(vacío = público / auto-aplicado)</span>
          </label>
          <input
            name="code"
            type="text"
            placeholder="EARLY20 — dejar vacío si es público"
            className={inputClass}
            onChange={e => {
              const el = e.target as HTMLInputElement
              el.value = el.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '')
            }}
          />
        </div>
      </div>

      {/* Tier scope */}
      <div>
        <label className="block text-xs font-medium text-purple-300 mb-1">
          Aplica a
        </label>
        <select name="tier_id" className={inputClass}>
          <option value="">Todos los tiers</option>
          {tiers.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} (${Number(t.price).toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      {/* Kind */}
      <div>
        <label className="block text-xs font-medium text-purple-300 mb-2">Tipo de descuento</label>
        <input type="hidden" name="kind" value={kind} />
        <div className="grid grid-cols-3 gap-2">
          {(['percent', 'fixed', 'bogo'] as const).map(k => (
            <label key={k} className="relative cursor-pointer">
              <div
                onClick={() => setKind(k)}
                className={`rounded-lg border px-3 py-2.5 text-center text-xs font-medium transition-all cursor-pointer ${
                  kind === k
                    ? 'border-orange-500 bg-orange-500/10 text-white'
                    : 'border-purple-700/40 bg-white/5 text-purple-300 hover:border-purple-500/60'
                }`}
              >
                {k === 'percent' ? '% Porcentaje' : k === 'fixed' ? '$ Monto fijo' : '2x1 BOGO'}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Conditional value fields */}
      {kind === 'percent' && (
        <div>
          <label className="block text-xs font-medium text-purple-300 mb-1">
            Porcentaje de descuento (1–100)
          </label>
          <input
            name="percent_off"
            type="number"
            required
            min="1"
            max="100"
            step="1"
            placeholder="20"
            className={inputClass}
          />
        </div>
      )}

      {kind === 'fixed' && (
        <div>
          <label className="block text-xs font-medium text-purple-300 mb-1">
            Monto a descontar por boleto ($MXN)
          </label>
          <input
            name="amount_off"
            type="number"
            required
            min="1"
            step="1"
            placeholder="50"
            className={inputClass}
          />
        </div>
      )}

      {kind === 'bogo' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-purple-300 mb-1">
              Comprar N boletos
            </label>
            <input
              name="buy_quantity"
              type="number"
              required
              min="1"
              step="1"
              placeholder="1"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-purple-300 mb-1">
              Obtener M gratis
            </label>
            <input
              name="get_quantity"
              type="number"
              required
              min="1"
              step="1"
              placeholder="1"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* max_uses + expires_at */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-purple-300 mb-1">
            Canjes máximos <span className="text-purple-400/50 font-normal">(vacío = ilimitado)</span>
          </label>
          <input
            name="max_uses"
            type="number"
            min="1"
            step="1"
            placeholder="100"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-purple-300 mb-1">
            Expira el <span className="text-purple-400/50 font-normal">(opcional)</span>
          </label>
          <input
            name="expires_at"
            type="datetime-local"
            className={inputClass}
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}

      <FormButton
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all"
        style={{ background: 'var(--accent-gradient)' }}
      >
        <Plus size={14} />
        Agregar descuento
      </FormButton>
    </form>
  )
}
