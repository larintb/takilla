'use client'

import { useActionState, useTransition, useState } from 'react'
import Image from 'next/image'
import { addPerk } from '../actions'
import { Plus, Loader2, ImageIcon } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { EVENT_IMAGES_BUCKET } from '@/utils/supabase/storage'

const inputClass = "w-full rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"

export default function PerkForm({ eventId, canCharge }: { eventId: string; canCharge: boolean }) {
  const [state, formAction] = useActionState(addPerk, null)
  const [, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [key, setKey] = useState(0) // reset form after success

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (uploading) return
    setLocalError(null)

    const formData = new FormData(e.currentTarget)
    formData.delete('image_file')

    if (imageFile) {
      if (!imageFile.type.startsWith('image/')) {
        setLocalError('El archivo debe ser una imagen válida')
        return
      }
      setUploading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUploading(false); setLocalError('No autorizado'); return }

      const ext = imageFile.name.includes('.') ? (imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg') : 'jpg'
      const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'jpg'
      const path = `perks/${user.id}/${crypto.randomUUID()}.${safeExt}`

      const { error: uploadError } = await supabase.storage
        .from(EVENT_IMAGES_BUCKET)
        .upload(path, imageFile, { contentType: imageFile.type, upsert: false })

      setUploading(false)
      if (uploadError) { setLocalError(`No se pudo subir la imagen: ${uploadError.message}`); return }
      formData.set('image_path', path)
    }

    startTransition(() => {
      formAction(formData)
      // Reset image state after submission
      setImageFile(null)
      setPreviewUrl(null)
      setKey(k => k + 1)
    })
  }

  return (
    <form key={key} onSubmit={handleSubmit} className="bg-white/5 rounded-xl border border-purple-700/40 p-4 space-y-3">
      <input type="hidden" name="event_id" value={eventId} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="perk-name" className="block text-xs font-medium text-purple-300 mb-1">
            Nombre del extra
          </label>
          <input
            id="perk-name"
            name="name"
            type="text"
            required
            placeholder="Hotdog, Cerveza, Merch..."
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="perk-price" className="block text-xs font-medium text-purple-300 mb-1">
            Precio ($) <span className="text-purple-400/50 font-normal">— $0 gratis o mín. $20</span>
          </label>
          <input
            id="perk-price"
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
      </div>

      <div>
        <label htmlFor="perk-description" className="block text-xs font-medium text-purple-300 mb-1">
          Descripción <span className="text-purple-400/50 font-normal">(opcional)</span>
        </label>
        <textarea
          id="perk-description"
          name="description"
          rows={2}
          placeholder="Ej: Hotdog con papas, incluye refresco..."
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Image upload */}
      <div>
        <label htmlFor="perk-image" className="block text-xs font-medium text-purple-300 mb-1">
          Imagen <span className="text-purple-400/50 font-normal">(opcional)</span>
        </label>
        <div className="flex items-start gap-3">
          {previewUrl ? (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-purple-700/40">
              <Image src={previewUrl} alt="Vista previa" fill className="object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)' }}>
              <ImageIcon size={20} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
          )}
          <input
            id="perk-image"
            name="image_file"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="flex-1 rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2 text-sm text-purple-300 file:mr-3 file:rounded-md file:border-0 file:bg-orange-500/20 file:px-3 file:py-1 file:text-xs file:font-medium file:text-orange-300 hover:file:bg-orange-500/30 transition-all cursor-pointer"
          />
        </div>
      </div>

      {!canCharge && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(249,115,22,0.08)', color: 'rgba(251,146,60,0.9)', border: '1px solid rgba(249,115,22,0.2)' }}>
          Eres organizador gratuito — solo puedes crear extras con precio $0.{' '}
          <a href="/dashboard/onboarding" className="underline font-medium hover:opacity-80">
            Configura tu cuenta de pagos
          </a>{' '}
          para cobrar por extras.
        </p>
      )}

      {(localError || state?.error) && (
        <p className="text-sm text-red-400">{localError ?? state?.error}</p>
      )}

      <button
        type="submit"
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'var(--accent-gradient)' }}
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        {uploading ? 'Subiendo imagen...' : 'Agregar extra'}
      </button>
    </form>
  )
}
