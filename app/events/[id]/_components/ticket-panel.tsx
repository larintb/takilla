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
  description?: string | null
  effect?: string | null
}

// ── Gold shimmer styles ──────────────────────────────────────────────────────
const goldStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #78350f, #b45309, #d97706, #fbbf24, #d97706, #b45309, #78350f)',
  backgroundSize: '300% 300%',
  animation: 'goldWave 3s ease infinite',
  color: '#fef3c7',
  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
  border: 'none',
  boxShadow: '0 0 16px rgba(251,191,36,0.35)',
}

const goldActiveStyle: React.CSSProperties = {
  ...goldStyle,
  boxShadow: '0 0 28px rgba(251,191,36,0.6)',
  outline: '2px solid rgba(251,191,36,0.5)',
}

// ── Diamond shimmer styles ───────────────────────────────────────────────────
const diamondStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0c4a6e, #0369a1, #0ea5e9, #7dd3fc, #0ea5e9, #0369a1, #0c4a6e)',
  backgroundSize: '300% 300%',
  animation: 'diamondWave 3s ease infinite',
  color: '#e0f2fe',
  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
  border: 'none',
  boxShadow: '0 0 16px rgba(56,189,248,0.35)',
}

const diamondActiveStyle: React.CSSProperties = {
  ...diamondStyle,
  boxShadow: '0 0 28px rgba(56,189,248,0.6)',
  outline: '2px solid rgba(56,189,248,0.5)',
}

// ── Availability bar ─────────────────────────────────────────────────────────
function AvailBar({ available, total }: { available: number; total: number }) {
  if (total <= 0) return null
  const pct = Math.max(4, (available / total) * 100)
  const color =
    available === 0 ? 'rgba(239,68,68,0.7)' :
    pct <= 25       ? 'rgba(234,179,8,0.8)'  :
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

  const firstAvailable = tiers.find(t => t.available_tickets > 0) ?? tiers[0]
  const [selectedId, setSelectedId] = useState<string>(firstAvailable?.id ?? '')
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)

  const selectedTier = tiers.find(t => t.id === selectedId) ?? tiers[0]
  const isSoldOut = (selectedTier?.available_tickets ?? 0) === 0
  const isFree    = Number(selectedTier?.price ?? 0) === 0
  const max       = Math.min(selectedTier?.available_tickets ?? 0, 10)
  const unitPrice = Number(selectedTier?.price ?? 0)
  const total     = unitPrice * qty
  const effect    = selectedTier?.effect ?? 'none'

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

  // ── Tier button style helper ─────────────────────────────────────────────
  function tierButtonStyle(tier: Tier): React.CSSProperties {
    const active = tier.id === selectedId
    const sold   = tier.available_tickets === 0
    const e      = tier.effect ?? 'none'

    if (e === 'gold') return active ? goldActiveStyle : { ...goldStyle, opacity: sold ? 0.4 : 0.75 }
    if (e === 'diamond') return active ? diamondActiveStyle : { ...diamondStyle, opacity: sold ? 0.4 : 0.75 }

    return {
      background: active ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.06)',
      color: active ? '#fff' : sold ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.55)',
      border: active ? 'none' : '1px solid rgba(255,255,255,0.09)',
      boxShadow: active ? '0 0 18px rgba(249,115,22,0.25)' : 'none',
    }
  }

  // ── Price block color based on effect ───────────────────────────────────
  const priceStyle: React.CSSProperties = effect === 'gold'
    ? { background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
    : effect === 'diamond'
    ? { background: 'linear-gradient(90deg, #7dd3fc, #38bdf8, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
    : { color: 'white' }

  return (
    <>
      <style>{`
        @keyframes goldWave {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes diamondWave {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

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
              {tiers.map(tier => (
                <button
                  key={tier.id}
                  onClick={() => handleSelectTier(tier.id)}
                  className="shrink-0 px-4 h-10 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95"
                  style={tierButtonStyle(tier)}
                >
                  {tier.name}
                  {tier.available_tickets === 0 && (
                    <span className="ml-1.5 opacity-60 text-xs">·&nbsp;agotado</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {tiers.length === 1 && (
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {tiers[0].name}
            </p>
          )}

          {/* Tier description */}
          {selectedTier?.description && (
            <p className="text-xs mt-2.5 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.45)' }}>
              {selectedTier.description}
            </p>
          )}
        </div>

        {/* ── Price block ─────────────────────────────────────────────────── */}
        <div className="px-5 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div key={selectedId} className="drum-pop">
            <p className="font-bold leading-none"
              style={{ fontSize: 'clamp(2.4rem, 9vw, 3.5rem)', ...priceStyle }}>
              {isFree ? 'Gratis' : `$${unitPrice.toFixed(2)}`}
            </p>
            {(isPast || isSoldOut) && (
              <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {isPast ? 'Evento finalizado' : 'Sin disponibilidad'}
              </p>
            )}
            {!isFree && !isPast && !isSoldOut && (
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
                + cargos por servicio
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

              <div className="flex-1 flex flex-col items-center select-none">
                <div key={qty} className="drum-pop tabular-nums font-bold text-white leading-none"
                  style={{ fontSize: 'clamp(2.8rem, 11vw, 4rem)' }}>
                  {qty}
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {qty === 1 ? 'boleto' : 'boletos'}
                </p>
              </div>

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
          {!isPast && !isSoldOut && isLoggedIn && !isFree && qty > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>Total</p>
              <p key={total} className="price-bump text-xl font-bold text-white tabular-nums">
                ${total.toFixed(2)}
              </p>
            </div>
          )}

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
              style={
                effect === 'gold'
                  ? { ...goldStyle, height: '3.5rem', width: '100%', borderRadius: '1rem', fontSize: '1rem' }
                  : effect === 'diamond'
                  ? { ...diamondStyle, height: '3.5rem', width: '100%', borderRadius: '1rem', fontSize: '1rem' }
                  : { background: 'var(--accent-gradient)', boxShadow: '0 0 28px rgba(249,115,22,0.28)' }
              }
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
    </>
  )
}