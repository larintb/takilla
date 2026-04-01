'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronUp, ChevronDown, Loader2, LogIn, Ban } from 'lucide-react'

type Tier = {
  id: string
  name: string
  price: number
  available_tickets: number
  total_capacity: number
}

// ── Availability bar ─────────────────────────────────────────────────────────
function AvailBar({ available, total }: { available: number; total: number }) {
  if (total <= 0) return null
  const pct = Math.max(4, (available / total) * 100)
  const color =
    available === 0    ? 'rgba(239,68,68,0.7)'  :
    pct <= 25          ? 'rgba(234,179,8,0.8)'  :
                         'var(--accent-gradient)'
  return (
    <div className="h-1 w-full rounded-full overflow-hidden mt-2"
      style={{ background: 'rgba(255,255,255,0.07)' }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function TicketPanel({
  eventId,
  tiers,
  isPast,
  isLoggedIn,
  loginRedirect,
}: {
  eventId: string
  tiers: Tier[]
  isPast: boolean
  isLoggedIn: boolean
  loginRedirect: string
}) {
  const router = useRouter()

  // Select first available tier by default
  const firstAvailable = tiers.find(t => t.available_tickets > 0) ?? tiers[0]
  const [selectedId, setSelectedId] = useState<string>(firstAvailable?.id ?? '')
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)

  const selectedTier = tiers.find(t => t.id === selectedId) ?? tiers[0]
  const isSoldOut    = (selectedTier?.available_tickets ?? 0) === 0
  const isFree       = Number(selectedTier?.price ?? 0) === 0
  const max          = Math.min(selectedTier?.available_tickets ?? 0, 10)
  const unitPrice    = Number(selectedTier?.price ?? 0)
  const total        = unitPrice * qty

  // Long-press interval refs
  const incIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const decIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopAll() {
    if (incIntervalRef.current) { clearInterval(incIntervalRef.current); incIntervalRef.current = null }
    if (decIntervalRef.current) { clearInterval(decIntervalRef.current); decIntervalRef.current = null }
  }
  useEffect(() => () => stopAll(), [])

  function startInc() {
    setQty(q => Math.min(max, q + 1))
    incIntervalRef.current = setInterval(() => setQty(q => Math.min(max, q + 1)), 140)
  }
  function startDec() {
    setQty(q => Math.max(1, q - 1))
    decIntervalRef.current = setInterval(() => setQty(q => Math.max(1, q - 1)), 140)
  }

  function handleSelectTier(id: string) {
    setSelectedId(id)
    setQty(1)
  }

  function handleBuy() {
    if (loading || isSoldOut || isPast) return
    setLoading(true)
    setTimeout(() => {
      router.push(`/checkout?eventId=${eventId}&tierId=${selectedId}&quantity=${qty}`)
    }, 500)
  }

  const disabled = loading || isSoldOut || isPast

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-0 rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface-panel)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        <p className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          Boletos
        </p>

        {/* Tier rail */}
        {tiers.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {tiers.map(tier => {
              const active = tier.id === selectedId
              const sold   = tier.available_tickets === 0
              return (
                <button
                  key={tier.id}
                  onClick={() => handleSelectTier(tier.id)}
                  className="shrink-0 px-4 h-10 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95"
                  style={{
                    background: active
                      ? 'var(--accent-gradient)'
                      : 'rgba(255,255,255,0.06)',
                    color: active ? '#fff' : sold ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.55)',
                    border: active ? 'none' : '1px solid rgba(255,255,255,0.09)',
                    boxShadow: active ? '0 0 18px rgba(249,115,22,0.25)' : 'none',
                  }}
                >
                  {tier.name}
                  {sold && <span className="ml-1.5 opacity-60 text-xs">·&nbsp;agotado</span>}
                </button>
              )
            })}
          </div>
        )}

        {tiers.length === 1 && (
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {tiers[0].name}
          </p>
        )}
      </div>

      {/* ── Price block ─────────────────────────────────────────────────── */}
      <div className="px-5 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div key={selectedId} className="drum-pop">
          <p className="font-bold leading-none text-white"
            style={{ fontSize: 'clamp(2.4rem, 9vw, 3.5rem)' }}>
            {isFree ? 'Gratis' : `$${unitPrice.toFixed(2)}`}
          </p>
          {(isPast || isSoldOut) && (
            <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {isPast ? 'Evento finalizado' : 'Sin disponibilidad'}
            </p>
          )}
          {selectedTier && !isPast && (
            <AvailBar
              available={selectedTier.available_tickets}
              total={selectedTier.total_capacity}
            />
          )}
        </div>
      </div>

      {/* ── Quantity drum ────────────────────────────────────────────────── */}
      {!isPast && !isSoldOut && isLoggedIn && (
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between gap-4">

            {/* Decrement */}
            <button
              type="button"
              onPointerDown={startDec}
              onPointerUp={stopAll}
              onPointerLeave={stopAll}
              disabled={qty <= 1 || disabled}
              className="w-14 h-14 flex items-center justify-center transition-opacity duration-150 active:scale-90 disabled:opacity-20 select-none hover:opacity-60"
              style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none' }}
            >
              <ChevronDown size={26} />
            </button>

            {/* Number */}
            <div className="flex-1 flex flex-col items-center select-none">
              <div key={qty} className="drum-pop tabular-nums font-bold text-white leading-none"
                style={{ fontSize: 'clamp(2.8rem, 11vw, 4rem)' }}>
                {qty}
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {qty === 1 ? 'boleto' : 'boletos'}
              </p>
            </div>

            {/* Increment */}
            <button
              type="button"
              onPointerDown={startInc}
              onPointerUp={stopAll}
              onPointerLeave={stopAll}
              disabled={qty >= max || disabled}
              className="w-14 h-14 flex items-center justify-center transition-opacity duration-150 active:scale-90 disabled:opacity-20 select-none hover:opacity-60"
              style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none' }}
            >
              <ChevronUp size={26} />
            </button>
          </div>
        </div>
      )}

      {/* ── Total + CTA ──────────────────────────────────────────────────── */}
      <div className="px-5 py-5 space-y-4">

        {/* Total row */}
        {!isPast && !isSoldOut && isLoggedIn && !isFree && qty > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>Total</p>
            <p key={total} className="price-bump text-xl font-bold text-white tabular-nums">
              ${total.toFixed(2)}
            </p>
          </div>
        )}

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        {isPast ? (
          <div className="w-full h-14 rounded-2xl flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Ban size={16} style={{ color: 'rgba(255,255,255,0.25)' }} />
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Evento finalizado
            </span>
          </div>

        ) : isSoldOut ? (
          <div className="w-full h-14 rounded-2xl flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Ban size={16} style={{ color: 'rgba(255,255,255,0.25)' }} />
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Agotado
            </span>
          </div>

        ) : !isLoggedIn ? (
          <Link
            href={loginRedirect}
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 28px rgba(249,115,22,0.28)' }}
          >
            <LogIn size={19} />
            Inicia sesión
          </Link>

        ) : (
          <button
            type="button"
            onClick={handleBuy}
            disabled={loading}
            className="relative w-full h-14 rounded-2xl overflow-hidden font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed"
            style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 28px rgba(249,115,22,0.28)' }}
          >
            <span className={`flex items-center justify-center gap-2 transition-all duration-250 ${loading ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
              {isFree
                ? `Reservar${qty > 1 ? ` ${qty} boletos` : ''} · Gratis`
                : `Comprar ${qty > 1 ? `${qty} boletos` : 'boleto'}${!isFree ? ` · $${total.toFixed(2)}` : ''}`
              }
            </span>
            <span aria-hidden
              className={`absolute inset-0 flex items-center justify-center transition-all duration-250 ${loading ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <Loader2 size={22} className="animate-spin" />
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
