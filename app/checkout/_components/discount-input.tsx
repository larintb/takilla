'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, X, ChevronDown, Loader2 } from 'lucide-react'

export default function DiscountInput({
  eventId,
  tierId,
  quantity,
  perksCsv,
  currentCode,
  codeError,
  locked = false,
}: {
  eventId:     string
  tierId:      string
  quantity:    number
  perksCsv:    string
  currentCode: string | null
  codeError:   string | null
  locked?:     boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(!!currentCode)
  const [inputVal, setInputVal] = useState(currentCode ?? '')
  const [isPending, startTransition] = useTransition()

  const baseUrl =
    `/checkout?eventId=${eventId}&tierId=${tierId}&quantity=${quantity}` +
    (perksCsv ? `&perks=${perksCsv}` : '')

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    const code = inputVal.trim().toUpperCase()
    if (!code) return
    startTransition(() => {
      router.push(`${baseUrl}&code=${encodeURIComponent(code)}`)
    })
  }

  function handleRemove() {
    setInputVal('')
    startTransition(() => {
      router.push(baseUrl)
    })
  }

  return (
    <div className="space-y-2">
      {/* Toggle */}
      {!currentCode && !locked && (
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          <Tag size={13} />
          ¿Tienes un código de descuento?
          <ChevronDown
            size={13}
            className="transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
      )}

      {/* Applied chip */}
      {currentCode && (
        <div className="flex items-center justify-between rounded-xl px-4 py-2.5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="flex items-center gap-2">
            <Tag size={13} style={{ color: 'var(--color-orange)' }} />
            <span className="text-sm font-semibold text-white">{currentCode}</span>
            {codeError ? (
              <span className="text-xs" style={{ color: '#f87171' }}>{codeError}</span>
            ) : (
              <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                Aplicado
              </span>
            )}
          </div>
          {!locked && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              className="p-1 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            </button>
          )}
        </div>
      )}

      {/* Input */}
      {open && !currentCode && (
        <form onSubmit={handleApply} className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value.toUpperCase())}
            placeholder="Ej: PROMO25"
            maxLength={32}
            className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-purple-400/40 focus:outline-none focus:ring-2 focus:ring-orange-500"
            style={{ background: 'var(--background)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isPending}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : 'Aplicar'}
          </button>
        </form>
      )}

      {/* Inline error when input is open */}
      {open && !currentCode && codeError && (
        <p className="text-xs" style={{ color: '#f87171' }}>{codeError}</p>
      )}
    </div>
  )
}
