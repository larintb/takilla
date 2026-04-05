'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateEventStatus } from '../actions'
import { Globe, FileText, XCircle, AlertTriangle, Save, Loader2 } from 'lucide-react'
import FormButton from '@/components/form-button'

export default function StatusActions({
  eventId,
  currentStatus,
}: {
  eventId: string
  currentStatus: string
}) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSaveDraft() {
    const form = document.getElementById('event-edit-form') as HTMLFormElement | null
    if (!form) return
    setSaving(true)
    form.requestSubmit()
    // Give the server action time to complete before redirecting
    await new Promise(r => setTimeout(r, 1200))
    router.push('/dashboard')
  }

  return (
    <div className="bg-white/5 rounded-2xl border border-purple-700/40 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-white">Acciones del evento</h2>

      <div className="flex items-center gap-3 flex-wrap">

        {/* Draft → Save draft */}
        {currentStatus === 'draft' && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-700/50 text-purple-300 text-sm font-semibold hover:bg-purple-900/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Guardando…' : 'Guardar borrador'}
          </button>
        )}

        {/* Draft → Published */}
        {currentStatus === 'draft' && (
          <form action={updateEventStatus.bind(null, eventId, 'published')}>
            <FormButton className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-semibold hover:from-orange-600 hover:to-purple-700 transition-all">
              <Globe size={14} />
              Publicar evento
            </FormButton>
          </form>
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