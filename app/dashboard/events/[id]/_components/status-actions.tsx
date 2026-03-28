'use client'

import { useState } from 'react'
import { updateEventStatus } from '../actions'
import { Globe, FileText, XCircle, AlertTriangle } from 'lucide-react'
import FormButton from '@/components/form-button'

export default function StatusActions({
  eventId,
  currentStatus,
}: {
  eventId: string
  currentStatus: string
}) {
  const [confirmCancel, setConfirmCancel] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-zinc-900">Acciones del evento</h2>

      <div className="flex items-center gap-3 flex-wrap">

        {/* Draft → Published */}
        {currentStatus === 'draft' && (
          <form action={updateEventStatus.bind(null, eventId, 'published')}>
            <FormButton className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white text-sm font-semibold hover:from-amber-500 hover:via-orange-600 hover:to-red-700 transition-all">
              <Globe size={14} />
              Publicar evento
            </FormButton>
          </form>
        )}

        {/* Published → Draft */}
        {currentStatus === 'published' && (
          <form action={updateEventStatus.bind(null, eventId, 'draft')}>
            <FormButton className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 text-sm font-semibold hover:bg-zinc-50 transition-colors">
              <FileText size={14} />
              Volver a borrador
            </FormButton>
          </form>
        )}

        {/* Cancel button — shows confirmation inline */}
        {currentStatus !== 'cancelled' && !confirmCancel && (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            <XCircle size={14} />
            Cancelar evento
          </button>
        )}
      </div>

      {/* Cancel confirmation */}
      {confirmCancel && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">¿Cancelar este evento?</p>
            <p className="text-xs text-red-600 mt-0.5">
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
                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
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