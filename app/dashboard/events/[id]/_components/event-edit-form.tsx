'use client'

import { useActionState, useTransition, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { EVENT_IMAGES_BUCKET } from '@/utils/supabase/storage'

type Venue = { id: string; name: string; city: string }

export const CATEGORIES = [
  { value: 'musica',        label: 'Música'        },
  { value: 'arte',          label: 'Arte'          },
  { value: 'social',        label: 'Evento social' },
  { value: 'nocturna',      label: 'Vida nocturna' },
  { value: 'deporte',       label: 'Deporte'       },
  { value: 'gastronomia',   label: 'Gastronomía'   },
  { value: 'otro',          label: 'Otro'          },
]

type Props = {
  venues: Venue[]
  action: (prevState: { error: string } | null, formData: FormData) => Promise<{ error: string } | null>
  defaultValues?: {
    title?: string
    description?: string
    event_date?: string
    venue_id?: string
    status?: string
    image_url?: string | null
    category?: string | null
  }
  submitLabel?: string
  onCancel?: () => void
}

export default function EventForm({ venues, action, defaultValues, submitLabel = 'Guardar', onCancel }: Props) {
  const [state, formAction] = useActionState(action, null)
  const [isActionPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const isPending = uploading || isActionPending

  const defaultDate = defaultValues?.event_date
    ? new Date(defaultValues.event_date).toISOString().slice(0, 16)
    : ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending) return
    setLocalError(null)

    const formData = new FormData(e.currentTarget)
    const imageFile = formData.get('image_file') as File | null
    formData.delete('image_file')

    if (imageFile && imageFile.size > 0) {
      if (!imageFile.type.startsWith('image/')) {
        setLocalError('El archivo debe ser una imagen válida')
        return
      }

      setUploading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setUploading(false)
        setLocalError('No autorizado')
        return
      }

      const ext = imageFile.name.includes('.')
        ? (imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg')
        : 'jpg'
      const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${safeExt}`

      const { error: uploadError } = await supabase.storage
        .from(EVENT_IMAGES_BUCKET)
        .upload(path, imageFile, { contentType: imageFile.type, upsert: false })

      setUploading(false)

      if (uploadError) {
        setLocalError(`No se pudo subir la imagen: ${uploadError.message}`)
        return
      }

      formData.set('image_path', path)
    }

    startTransition(() => formAction(formData))
  }

  const inputClass = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          id="title" name="title" type="text" required
          defaultValue={defaultValues?.title ?? ''}
          placeholder="Concierto de Rock en el Parque"
          className={inputClass}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1">
          Descripción
        </label>
        <textarea
          id="description" name="description" rows={3}
          defaultValue={defaultValues?.description ?? ''}
          placeholder="Describe el evento..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Date + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-zinc-700 mb-1">
            Fecha y hora <span className="text-red-500">*</span>
          </label>
          <input
            id="event_date" name="event_date" type="datetime-local" required
            defaultValue={defaultDate}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-zinc-700 mb-1">
            Estado
          </label>
          <select
            id="status" name="status"
            defaultValue={defaultValues?.status ?? 'draft'}
            className={inputClass}
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-zinc-700 mb-1">
          Categoría
        </label>
        <select
          id="category" name="category"
          defaultValue={defaultValues?.category ?? 'otro'}
          className={inputClass}
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Venue */}
      <div>
        <label htmlFor="venue_id" className="block text-sm font-medium text-zinc-700 mb-1">
          Venue
        </label>
        <select
          id="venue_id" name="venue_id"
          defaultValue={defaultValues?.venue_id ?? ''}
          className={inputClass}
        >
          <option value="">Sin venue asignado</option>
          {venues.map(v => (
            <option key={v.id} value={v.id}>{v.name} — {v.city}</option>
          ))}
        </select>
        {venues.length === 0 && (
          <p className="text-xs text-zinc-400 mt-1">No hay venues registrados aún (el admin los crea).</p>
        )}
      </div>

      {/* Image */}
      <div>
        <label htmlFor="image_file" className="block text-sm font-medium text-zinc-700 mb-1">
          Imagen del evento
        </label>
        {defaultValues?.image_url && (
          <p className="text-xs text-zinc-400 mb-2">Ya tienes una imagen. Sube una nueva para reemplazarla.</p>
        )}
        <input
          id="image_file" name="image_file" type="file" accept="image/*"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-400">Opcional. Formatos: JPG, PNG, WEBP.</p>
      </div>

      {/* Error */}
      {(localError || state?.error) && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {localError ?? state?.error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className={`relative overflow-hidden px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white text-sm font-semibold hover:from-amber-500 hover:via-orange-600 hover:to-red-700 transition-all duration-300 disabled:cursor-not-allowed ${isPending ? 'scale-[0.97]' : ''}`}
        >
          <span className={`flex items-center gap-1.5 transition-all duration-300 ${isPending ? 'opacity-0 -translate-y-3' : 'opacity-100 translate-y-0'}`}>
            {uploading ? 'Subiendo imagen…' : submitLabel}
          </span>
          <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isPending ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <Loader2 size={15} className="animate-spin" />
          </span>
        </button>
      </div>
    </form>
  )
}