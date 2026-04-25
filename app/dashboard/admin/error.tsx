'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw } from 'lucide-react'

const CARD   = 'rgba(255,255,255,0.04)'
const BORDER = '1px solid rgba(239,68,68,0.2)'
const MUTED  = 'rgba(255,255,255,0.45)'

export default function AdminError({ reset }: { reset: () => void }) {
  const router = useRouter()

  return (
    <div className="flex items-start justify-center pt-20">
      <div className="rounded-2xl p-8 max-w-md w-full text-center space-y-4" style={{ background: CARD, border: BORDER }}>
        <AlertTriangle size={36} className="mx-auto" style={{ color: '#f87171' }} />
        <div>
          <h2 className="font-bold text-white text-lg">No pudimos cargar el panel</h2>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Ocurrió un error inesperado. Intenta de nuevo o recarga la página.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { reset(); router.refresh() }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <RefreshCw size={14} />
            Reintentar
          </button>
        </div>
      </div>
    </div>
  )
}
