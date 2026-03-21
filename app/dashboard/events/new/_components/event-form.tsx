'use client'

import { useActionState, useTransition, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createEvent } from '../actions'
import { createClient } from '@/utils/supabase/client'
import { EVENT_IMAGES_BUCKET } from '@/utils/supabase/storage'

type Venue = { id: string; name: string; city: string }

export default function EventForm({ venues }: { venues: Venue[] }) {
  const [state, action] = useActionState(createEvent, null)
  const [isActionPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const isPending = uploading || isActionPending

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

    startTransition(() => action(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="Concierto de Rock en el Parque"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Describe el evento..."
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
        />
      </div>

      {/* Date + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-zinc-700 mb-1">
            Fecha y hora <span className="text-red-500">*</span>
          </label>
          <input
            id="event_date"
            name="event_date"
            type="datetime-local"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-zinc-700 mb-1">
            Estado inicial
          </label>
          <select
            id="status"
            name="status"
            defaultValue="draft"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
        </div>
      </div>

      {/* Venue */}
      <div>
        <label htmlFor="venue_id" className="block text-sm font-medium text-zinc-700 mb-1">
          Venue
        </label>
        <select
          id="venue_id"
          name="venue_id"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
        >
          <option value="">Sin venue asignado</option>
          {venues.map(v => (
            <option key={v.id} value={v.id}>
              {v.name} — {v.city}
            </option>
          ))}
        </select>
        {venues.length === 0 && (
          <p className="text-xs text-zinc-400 mt-1">No hay venues registrados aún (el admin los crea).</p>
        )}
      </div>

      {/* Event image */}
      <div>
        <label htmlFor="image_file" className="block text-sm font-medium text-zinc-700 mb-1">
          Imagen del evento
        </label>
        <input
          id="image_file"
          name="image_file"
          type="file"
          accept="image/*"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-zinc-400">Opcional. Formatos: JPG, PNG, WEBP. Sin límite de tamaño.</p>
      </div>

      {/* Error */}
      {(localError || state?.error) && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {localError ?? state?.error}
        </p>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/dashboard/events"
          className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className={`relative overflow-hidden px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white text-sm font-semibold hover:from-amber-500 hover:via-orange-600 hover:to-red-700 transition-all duration-300 disabled:cursor-not-allowed ${isPending ? 'scale-[0.97]' : ''}`}
        >
          <span className={`flex items-center gap-1.5 transition-all duration-300 ${isPending ? 'opacity-0 -translate-y-3' : 'opacity-100 translate-y-0'}`}>
            {uploading ? 'Subiendo imagen…' : 'Crear evento'}
          </span>
          <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isPending ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <Loader2 size={15} className="animate-spin" />
          </span>
        </button>
      </div>

    </form>
  )
}
