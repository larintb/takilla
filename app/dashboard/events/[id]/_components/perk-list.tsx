'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { deletePerk, updatePerkDescription, updatePerkPrice, updatePerkImage } from '../actions'
import { Trash2, Pencil, Check, X, DollarSign, ImageIcon, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { EVENT_IMAGES_BUCKET } from '@/utils/supabase/storage'

type Perk = {
  id: string
  name: string
  price: number
  description?: string | null
  image_url?: string | null
}

const textareaClass = "w-full rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y"
const inputClass    = "w-full rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"

type EditMode = 'description' | 'price' | null

export default function PerkList({ perks, eventId }: { perks: Perk[]; eventId: string }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMode,  setEditMode]  = useState<EditMode>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, startSave] = useTransition()
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  // Local image preview overrides (perkId → objectURL)
  const [localImages, setLocalImages] = useState<Map<string, string>>(new Map())

  function startEdit(perk: Perk, mode: EditMode) {
    setEditingId(perk.id)
    setEditMode(mode)
    setEditValue(mode === 'price' ? String(Number(perk.price)) : (perk.description ?? ''))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditMode(null)
    setEditValue('')
  }

  function save(perk: Perk) {
    startSave(async () => {
      if (editMode === 'price') await updatePerkPrice(perk.id, eventId, Number(editValue))
      else                      await updatePerkDescription(perk.id, eventId, editValue)
      setEditingId(null)
      setEditMode(null)
    })
  }

  async function handleImageUpload(perk: Perk, file: File) {
    if (!file.type.startsWith('image/')) {
      setUploadError('El archivo debe ser una imagen válida')
      return
    }
    setUploadError(null)
    setUploadingId(perk.id)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploadingId(null); setUploadError('No autorizado'); return }

    const ext = file.name.includes('.') ? (file.name.split('.').pop()?.toLowerCase() ?? 'jpg') : 'jpg'
    const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'jpg'
    const path = `perks/${user.id}/${crypto.randomUUID()}.${safeExt}`

    const { error } = await supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (error) {
      setUploadingId(null)
      setUploadError(`No se pudo subir la imagen: ${error.message}`)
      return
    }

    await updatePerkImage(perk.id, eventId, path)
    setLocalImages(prev => new Map(prev).set(perk.id, URL.createObjectURL(file)))
    setUploadingId(null)
  }

  function getImageSrc(perk: Perk): string | null {
    const local = localImages.get(perk.id)
    if (local) return local
    if (!perk.image_url) return null
    const supabase = createClient()
    const { data } = supabase.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(perk.image_url)
    return data?.publicUrl ?? null
  }

  if (perks.length === 0) {
    return (
      <p className="text-sm text-purple-400/60 bg-white/5 border border-purple-700/30 rounded-xl px-4 py-6 text-center">
        No hay extras aún. Agrégalos para que los compradores puedan añadirlos a su compra.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {uploadError && (
        <p className="text-sm text-red-400 px-3 py-2 rounded-lg bg-red-900/20 border border-red-700/40">
          {uploadError}
        </p>
      )}
      {perks.map(perk => {
        const isEditing  = editingId === perk.id
        const isUploading = uploadingId === perk.id
        const imgSrc     = getImageSrc(perk)

        return (
          <div key={perk.id} className="bg-white/5 rounded-xl border border-purple-700/40 px-4 py-3 space-y-2">

            <div className="flex items-start gap-3">
              {/* Thumbnail / upload zone */}
              <label
                className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 cursor-pointer group"
                title="Cambiar imagen"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.12)' }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(perk, file)
                    e.target.value = ''
                  }}
                />
                {isUploading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                ) : imgSrc ? (
                  <>
                    <Image src={imgSrc} alt={perk.name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <ImageIcon size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center group-hover:opacity-70 transition-opacity">
                    <ImageIcon size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  </div>
                )}
              </label>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-white">{perk.name}</p>
                  <p className="font-bold text-orange-400 shrink-0">
                    {Number(perk.price) === 0 ? 'FREE' : `$${Number(perk.price).toFixed(2)}`}
                  </p>
                </div>

                <div className="flex items-center gap-1 mt-1">
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => startEdit(perk, 'description')}
                        className="text-purple-400/60 hover:text-orange-400 transition-colors p-1"
                        title="Editar descripción"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => startEdit(perk, 'price')}
                        className="text-purple-400/60 hover:text-orange-400 transition-colors p-1"
                        title="Editar precio"
                      >
                        <DollarSign size={13} />
                      </button>
                    </>
                  )}
                  <form action={deletePerk.bind(null, perk.id, eventId)}>
                    <button
                      type="submit"
                      className="text-purple-600/60 hover:text-red-400 transition-colors p-1"
                      title="Eliminar extra"
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {isEditing && editMode === 'price' ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-purple-300">Precio ($)</p>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
                <SaveCancelButtons onSave={() => save(perk)} onCancel={cancelEdit} saving={saving} />
              </div>
            ) : isEditing && editMode === 'description' ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-purple-300">Descripción</p>
                <textarea
                  rows={2}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  placeholder="Descripción del extra (opcional)..."
                  className={textareaClass}
                  autoFocus
                />
                <SaveCancelButtons onSave={() => save(perk)} onCancel={cancelEdit} saving={saving} />
              </div>
            ) : (
              perk.description && (
                <p className="text-xs leading-relaxed whitespace-pre-wrap pt-0.5"
                  style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {perk.description}
                </p>
              )
            )}

          </div>
        )
      })}
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
