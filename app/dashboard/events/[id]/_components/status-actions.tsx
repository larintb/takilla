'use client'

import { updateEventStatus } from '../actions'
import { Globe, FileText, XCircle } from 'lucide-react'
import FormButton from '@/components/form-button'

export default function StatusActions({
  eventId,
  currentStatus,
}: {
  eventId: string
  currentStatus: string
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {currentStatus === 'draft' && (
        <form action={updateEventStatus.bind(null, eventId, 'published')}>
          <FormButton className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white text-sm font-medium hover:from-amber-500 hover:via-orange-600 hover:to-red-700 transition-all">
            <Globe size={14} />
            Publicar evento
          </FormButton>
        </form>
      )}

      {currentStatus === 'published' && (
        <form action={updateEventStatus.bind(null, eventId, 'draft')}>
          <FormButton className="px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-700 text-sm font-medium hover:bg-zinc-50">
            <FileText size={14} />
            Volver a borrador
          </FormButton>
        </form>
      )}

      {currentStatus !== 'cancelled' && (
        <form action={updateEventStatus.bind(null, eventId, 'cancelled')}>
          <FormButton className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50">
            <XCircle size={14} />
            Cancelar evento
          </FormButton>
        </form>
      )}
    </div>
  )
}