'use client'

import { useActionState } from 'react'
import { addTier } from '../actions'
import { Plus } from 'lucide-react'
import FormButton from '@/components/form-button'
import { TierEffectKeyframes } from '@/components/tier-effects'

const inputClass = "w-full rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"

export default function TierForm({ eventId, canCharge }: { eventId: string; canCharge: boolean }) {
  const [state, action] = useActionState(addTier, null)

  return (
    <form action={action} className="bg-white/5 rounded-xl border border-purple-700/40 p-4 space-y-3">
      <input type="hidden" name="event_id" value={eventId} />

      {/* Row 1: nombre, precio, capacidad */}
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
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="tier-price" className="block text-xs font-medium text-purple-300 mb-1">
            Precio ($) <span className="text-purple-400/50 font-normal">— $0 gratis o mín. $20</span>
          </label>
          <input
            id="tier-price"
            name="price"
            type="number"
            required
            min="0"
            max={canCharge ? undefined : '0'}
            step="1"
            placeholder="0"
            className={inputClass}
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
            className={inputClass}
          />
        </div>
      </div>

      {/* Row 2: descripción */}
      <div>
        <label htmlFor="tier-description" className="block text-xs font-medium text-purple-300 mb-1">
          Descripción <span className="text-purple-400/50 font-normal">(opcional)</span>
        </label>
        <textarea
          id="tier-description"
          name="description"
          rows={3}
          placeholder="Ej: Acceso general, incluye consumación mínima..."
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Row 2b: items incluidos */}
      <div>
        <label htmlFor="tier-items" className="block text-xs font-medium text-purple-300 mb-1">
          Items incluidos <span className="text-purple-400/50 font-normal">(uno por línea — aparece al escanear)</span>
        </label>
        <textarea
          id="tier-items"
          name="items"
          rows={3}
          placeholder={"2 bebidas\nAcceso backstage\nMerchandise exclusivo"}
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Row 3: efecto visual */}
      <div>
        <label className="block text-xs font-medium text-purple-300 mb-2">
          Efecto visual del boleto
        </label>
        <div className="grid grid-cols-3 gap-2">

          {/* Sin efecto */}
          <label className="relative cursor-pointer">
            <input type="radio" name="effect" value="none" defaultChecked className="sr-only peer" />
            <div className="rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2.5 text-center text-xs font-medium text-purple-300 peer-checked:border-orange-500 peer-checked:bg-orange-500/10 peer-checked:text-white transition-all">
              Sin efecto
            </div>
          </label>

          {/* Efecto dorado */}
          <label className="relative cursor-pointer">
            <input type="radio" name="effect" value="gold" className="sr-only peer" />
            <div className="rounded-lg border border-purple-700/40 overflow-hidden peer-checked:border-yellow-400 peer-checked:ring-1 peer-checked:ring-yellow-400/50 transition-all">
              <div className="relative px-3 py-2.5 text-center text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, #78350f, #92400e, #b45309, #d97706, #f59e0b, #fbbf24, #d97706, #b45309)',
                  backgroundSize: '200% 200%',
                  animation: 'goldWave 3s ease infinite',
                  color: '#fef3c7',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}>
                ✦ Dorado
              </div>
            </div>
          </label>

          {/* Efecto diamante */}
          <label className="relative cursor-pointer">
            <input type="radio" name="effect" value="diamond" className="sr-only peer" />
            <div className="rounded-lg border border-purple-700/40 overflow-hidden peer-checked:border-cyan-400 peer-checked:ring-1 peer-checked:ring-cyan-400/50 transition-all">
              <div className="relative px-3 py-2.5 text-center text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, #0c4a6e, #075985, #0369a1, #0ea5e9, #38bdf8, #7dd3fc, #38bdf8, #0ea5e9)',
                  backgroundSize: '200% 200%',
                  animation: 'diamondWave 3s ease infinite',
                  color: '#e0f2fe',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}>
                💎 Diamante
              </div>
            </div>
          </label>

        </div>
      </div>

      <TierEffectKeyframes />

      {!canCharge && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(249,115,22,0.08)', color: 'rgba(251,146,60,0.9)', border: '1px solid rgba(249,115,22,0.2)' }}>
          Eres organizador gratuito — solo puedes crear tiers con precio $0.{' '}
          <a href="/dashboard/onboarding" className="underline font-medium hover:opacity-80">
            Configura tu cuenta de pagos
          </a>{' '}
          para cobrar por boletos.
        </p>
      )}

      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}

      <FormButton className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all" style={{ background: 'var(--accent-gradient)' }}>
        <Plus size={14} />
        Agregar tier
      </FormButton>
    </form>
  )
}