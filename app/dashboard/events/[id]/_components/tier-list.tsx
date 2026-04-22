'use client'

import { useState, useTransition } from 'react'
import { deleteTier, updateTierDescription, updateTierItems, updateTierEffect } from '../actions'
import { Trash2, Pencil, Check, X, Package } from 'lucide-react'
import { TierEffectKeyframes, tierEffectBadge } from '@/components/tier-effects'

type Tier = {
  id: string
  name: string
  price: number
  total_capacity: number
  available_tickets: number
  description?: string | null
  items?: string | null
  effect?: string | null // ✅ Campo agregado
}

const textareaClass = "w-full rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y"

type EditMode = 'description' | 'items' | 'effect' | null

// effectBadge imported from @/components/tier-effects as tierEffectBadge
const effectBadge = tierEffectBadge

const effectLabel: Record<string, string> = {
  gold:    '✦ Dorado',
  diamond: '💎 Diamante',
}

export default function TierList({ tiers, eventId }: { tiers: Tier[]; eventId: string }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMode,  setEditMode]  = useState<EditMode>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, startSave] = useTransition()

  function startEdit(tier: Tier, mode: EditMode) {
    setEditingId(tier.id)
    setEditMode(mode)
    if (mode === 'items')       setEditValue(tier.items ?? '')
    else if (mode === 'effect') setEditValue(tier.effect ?? 'none')
    else                        setEditValue(tier.description ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditMode(null)
    setEditValue('')
  }

  function save(tier: Tier) {
    startSave(async () => {
      if (editMode === 'items')       await updateTierItems(tier.id, eventId, editValue)
      else if (editMode === 'effect') await updateTierEffect(tier.id, eventId, editValue)
      else                            await updateTierDescription(tier.id, eventId, editValue)
      setEditingId(null)
      setEditMode(null)
    })
  }

  if (tiers.length === 0) {
    return (
      <p className="text-sm text-purple-400/60 bg-white/5 border border-purple-700/30 rounded-xl px-4 py-6 text-center">
        No hay tiers aún. Agrega al menos uno para poder vender boletos.
      </p>
    )
  }

  return (
    <>
      <TierEffectKeyframes />

      <div className="space-y-2">
        {tiers.map(tier => {
          const sold      = tier.total_capacity - tier.available_tickets
          const pct       = Math.round((sold / tier.total_capacity) * 100)
          const isEditing = editingId === tier.id
          const tierItems = tier.items ? tier.items.split('\n').map(s => s.trim()).filter(Boolean) : []
          const effect    = tier.effect ?? 'none'

          return (
            <div key={tier.id} className="bg-white/5 rounded-xl border border-purple-700/40 px-4 py-3 space-y-2">

              {/* Header row */}
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-white">{tier.name}</p>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* ✅ Badge del efecto visual */}
                      {effect !== 'none' && (
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-bold"
                          style={effectBadge[effect]}
                        >
                          {effectLabel[effect]}
                        </span>
                      )}
                      <p className="font-bold text-orange-400">
                        {Number(tier.price) === 0 ? 'FREE' : `$${Number(tier.price).toFixed(2)}`}
                      </p>
                    </div>
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

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => startEdit(tier, 'description')}
                        className="text-purple-400/60 hover:text-orange-400 transition-colors p-1"
                        title="Editar descripción"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => startEdit(tier, 'items')}
                        className="text-purple-400/60 hover:text-orange-400 transition-colors p-1"
                        title="Editar items incluidos"
                      >
                        <Package size={14} />
                      </button>
                      {/* ✅ Botón para editar efecto — usa el emoji del efecto actual como ícono */}
                      <button
                        onClick={() => startEdit(tier, 'effect')}
                        className="text-purple-400/60 hover:text-orange-400 transition-colors p-1 text-xs"
                        title="Cambiar efecto visual"
                      >
                        {effect === 'gold' ? '✨' : effect === 'diamond' ? '💎' : '✦'}
                      </button>
                    </>
                  )}
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
              </div>

              {/* Description — view or edit */}
              {isEditing && editMode === 'description' ? (
                <InlineEditor
                  value={editValue}
                  onChange={setEditValue}
                  onSave={() => save(tier)}
                  onCancel={cancelEdit}
                  saving={saving}
                  placeholder="Descripción del tier (opcional)..."
                  label="Descripción"
                />
              ) : (
                tier.description && (
                  <p className="text-xs leading-relaxed whitespace-pre-wrap pt-0.5"
                    style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {tier.description}
                  </p>
                )
              )}

              {/* Items — view or edit */}
              {isEditing && editMode === 'items' ? (
                <InlineEditor
                  value={editValue}
                  onChange={setEditValue}
                  onSave={() => save(tier)}
                  onCancel={cancelEdit}
                  saving={saving}
                  placeholder={"2 bebidas\nAcceso backstage\nMerchandise exclusivo"}
                  label="Items incluidos (uno por línea)"
                />
              ) : (
                tierItems.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(249,115,22,0.7)' }}>
                      Incluye
                    </p>
                    <ul className="space-y-0.5">
                      {tierItems.map((item, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          <span className="text-orange-400/70">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}

              {/* ✅ Effect — edit mode con radio buttons */}
              {isEditing && editMode === 'effect' && (
                <EffectEditor
                  value={editValue}
                  onChange={setEditValue}
                  onSave={() => save(tier)}
                  onCancel={cancelEdit}
                  saving={saving}
                />
              )}

            </div>
          )
        })}
      </div>
    </>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function InlineEditor({ value, onChange, onSave, onCancel, saving, placeholder, label }: {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  placeholder: string
  label: string
}) {
  return (
    <div className="space-y-2 pt-1">
      <p className="text-xs font-medium text-purple-300">{label}</p>
      <textarea
        rows={3}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={textareaClass}
        autoFocus
      />
      <SaveCancelButtons onSave={onSave} onCancel={onCancel} saving={saving} />
    </div>
  )
}

function EffectEditor({ value, onChange, onSave, onCancel, saving }: {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-2 pt-1">
      <p className="text-xs font-medium text-purple-300">Efecto visual</p>
      <div className="grid grid-cols-3 gap-2">

        {/* Sin efecto */}
        <label className="relative cursor-pointer">
          <input type="radio" name="effect-edit" value="none" checked={value === 'none'} onChange={() => onChange('none')} className="sr-only" />
          <div className={`rounded-lg border px-3 py-2.5 text-center text-xs font-medium transition-all ${value === 'none' ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-purple-700/40 bg-white/5 text-purple-300'}`}>
            Sin efecto
          </div>
        </label>

        {/* Dorado */}
        <label className="relative cursor-pointer">
          <input type="radio" name="effect-edit" value="gold" checked={value === 'gold'} onChange={() => onChange('gold')} className="sr-only" />
          <div className={`rounded-lg border overflow-hidden transition-all ${value === 'gold' ? 'border-yellow-400 ring-1 ring-yellow-400/50' : 'border-purple-700/40'}`}>
            <div className="px-3 py-2.5 text-center text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, #78350f, #b45309, #d97706, #fbbf24, #d97706, #b45309)',
                backgroundSize: '200% 200%',
                animation: 'goldWave 3s ease infinite',
                color: '#fef3c7',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}>
              ✦ Dorado
            </div>
          </div>
        </label>

        {/* Diamante */}
        <label className="relative cursor-pointer">
          <input type="radio" name="effect-edit" value="diamond" checked={value === 'diamond'} onChange={() => onChange('diamond')} className="sr-only" />
          <div className={`rounded-lg border overflow-hidden transition-all ${value === 'diamond' ? 'border-cyan-400 ring-1 ring-cyan-400/50' : 'border-purple-700/40'}`}>
            <div className="px-3 py-2.5 text-center text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, #0c4a6e, #0369a1, #0ea5e9, #7dd3fc, #0ea5e9, #0369a1)',
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
      <SaveCancelButtons onSave={onSave} onCancel={onCancel} saving={saving} />
    </div>
  )
}

function SaveCancelButtons({ onSave, onCancel, saving }: {
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-60 transition-colors"
        style={{ background: 'var(--accent-gradient)' }}
      >
        <Check size={12} />
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
      <button
        onClick={onCancel}
        disabled={saving}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
      >
        <X size={12} />
        Cancelar
      </button>
    </div>
  )
}