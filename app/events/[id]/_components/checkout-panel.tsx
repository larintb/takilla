'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Loader2 } from 'lucide-react'

type CheckoutPanelProps = {
  eventId: string
  tierId: string
  availableTickets: number
}

export default function CheckoutPanel({
  eventId,
  tierId,
  availableTickets,
}: CheckoutPanelProps) {
  const max = Math.min(availableTickets, 10)
  const [qty, setQty] = useState(1)
  const [confirmed, setConfirmed] = useState(false)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (confirmed) return
    setConfirmed(true)
    setTimeout(() => {
      router.push(`/checkout?eventId=${eventId}&tierId=${tierId}&quantity=${qty}`)
    }, 650)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Quantity stepper */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-2.5"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Cantidad
        </span>

        <div className="flex items-center gap-3">
          {/* Minus */}
          <button
            type="button"
            onClick={() => setQty(q => Math.max(1, q - 1))}
            disabled={qty <= 1 || confirmed}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-90"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
          >
            <Minus size={13} />
          </button>

          {/* Number */}
          <span className="w-6 text-center font-bold text-white tabular-nums text-lg leading-none">
            {qty}
          </span>

          {/* Plus */}
          <button
            type="button"
            onClick={() => setQty(q => Math.min(max, q + 1))}
            disabled={qty >= max || confirmed}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-90"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Buy button */}
      <button
        type="submit"
        disabled={confirmed}
        className="relative w-full py-3 rounded-xl text-sm font-bold overflow-hidden transition-all duration-300 active:scale-[0.98]"
        style={{
          background: confirmed
            ? 'linear-gradient(90deg, #f97316, #dc2626)'
            : 'linear-gradient(90deg, #fbbf24, #f97316, #dc2626)',
          color: '#fff',
          opacity: confirmed ? 0.9 : 1,
        }}
      >
        <span className={`flex items-center justify-center gap-1.5 transition-all duration-300 ${confirmed ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
          Comprar {qty > 1 ? `${qty} boletos` : 'boleto'}
        </span>
        <span aria-hidden className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-300 ${confirmed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Loader2 size={18} className="animate-spin" />
        </span>
      </button>

    </form>
  )
}