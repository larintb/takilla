'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Check } from 'lucide-react'

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
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500 mr-auto">Cantidad</span>
        <button
          type="button"
          onClick={() => setQty(q => Math.max(1, q - 1))}
          disabled={qty <= 1 || confirmed}
          className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center font-semibold text-zinc-900 tabular-nums">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty(q => Math.min(max, q + 1))}
          disabled={qty >= max || confirmed}
          className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      <button
        type="submit"
        disabled={confirmed}
        className={`
          relative w-full py-2.5 rounded-xl text-sm font-semibold
          overflow-hidden transition-all duration-300
          ${confirmed
            ? 'bg-emerald-600 text-white scale-[0.98]'
            : 'bg-zinc-900 text-white hover:bg-zinc-700 active:scale-[0.98]'
          }
        `}
      >
        {/* Label — slides out on confirm */}
        <span
          className={`flex items-center justify-center gap-1.5 transition-all duration-300 ${
            confirmed ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          Comprar {qty > 1 ? `${qty} boletos` : 'boleto'}
        </span>

        {/* Checkmark — slides in on confirm */}
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            confirmed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Check size={18} strokeWidth={2.5} />
        </span>
      </button>
    </form>
  )
}
