'use client'

import { useState } from 'react'
import { updateEventStatus } from '../actions'
import { Globe, FileText, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import FormButton from '@/components/form-button'

export default function StatusActions({
  eventId,
  currentStatus,
}: {
  eventId: string
  currentStatus: string
}) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  async function handlePublish() {
    setPublishError(null)

    const form = document.getElementById('event-edit-form') as HTMLFormElement | null
    if (!form) return

    // 1. Validación nativa del browser
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }

    // 2. Validar campos custom (ubicación e imagen)
    const formData = new FormData(form)

    const locationName = formData.get('location_name') as string
    if (!locationName?.trim()) {
      setPublishError('La ubicación es obligatoria antes de publicar.')
      form.querySelector<HTMLElement>('[name="location_name"]')
        ?.closest('div')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const imageFile = formData.get('image_file') as File | null
    const hasExistingImage = form.dataset.hasImage === 'true'
    if (!hasExistingImage && !(imageFile && imageFile.size > 0)) {
      setPublishError('La imagen del evento es obligatoria antes de publicar.')
      document.getElementById('image_file')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // 3. Publicar directamente — el usuario ya guardó con "Guardar cambios"
    setPublishing(true)
    await updateEventStatus(eventId, 'published')
  }

  return (
    <div className="bg-white/5 rounded-2xl border border-purple-700/40 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-white">Acciones del evento</h2>

      <div className="flex items-center gap-3 flex-wrap">

        {/* Draft → Published */}
        {currentStatus === 'draft' && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            {publishing ? 'Publicando…' : 'Publicar evento'}
          </button>
        )}

        {/* Published → Draft */}
        {currentStatus === 'published' && (
          <form action={updateEventStatus.bind(null, eventId, 'draft')}>
            <FormButton className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-700/50 text-purple-300 text-sm font-semibold hover:bg-purple-900/30 transition-colors">
              <FileText size={14} />
              Volver a borrador
            </FormButton>
          </form>
        )}

        {/* Cancel button */}
        {currentStatus !== 'cancelled' && !confirmCancel && (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-700/40 text-red-400 text-sm font-semibold hover:bg-red-900/20 transition-colors"
          >
            <XCircle size={14} />
            Cancelar evento
          </button>
        )}
      </div>

      {/* Error de publicación */}
      {publishError && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          {publishError}
        </p>
      )}

      {/* Cancel confirmation */}
      {confirmCancel && (
        <div className="flex items-start gap-3 bg-red-900/20 border border-red-700/40 rounded-xl p-4">
          <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-300">¿Cancelar este evento?</p>
            <p className="text-xs text-red-400/80 mt-0.5">
              Esta acción notificará a los compradores. No se puede deshacer fácilmente.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <form action={updateEventStatus.bind(null, eventId, 'cancelled')}>
                <FormButton className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors">
                  <XCircle size={12} />
                  Sí, cancelar
                </FormButton>
              </form>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="px-3 py-1.5 rounded-lg border border-red-700/40 text-red-400 text-xs font-semibold hover:bg-red-900/20 transition-colors"
              >
                No, volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}