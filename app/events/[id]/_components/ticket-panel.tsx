'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ArrowRight, CheckCircle2, Loader2, LogIn, Ban } from 'lucide-react'
import { TierEffectKeyframes, goldStyle, diamondStyle, discountFlagStyle } from '@/components/tier-effects'
import { applyDiscount, type DiscountInput } from '@/utils/pricing'

type TierDiscount = {
  id:      string
  label:   string
  kind:    'percent' | 'fixed' | 'bogo'
  code:    string | null
  min_qty: number
  input:   DiscountInput
}

type Tier = {
  id: string
  name: string
  price: number
  available_tickets: number
  total_capacity: number
  description?: string | null
  effect?: string | null
  discount?: TierDiscount | null
}

// ── Availability bar ─────────────────────────────────────────────────────────
function AvailBar({ available, total }: { available: number; total: number }) {
  if (total <= 0) return null
  const pct = Math.max(4, (available / total) * 100)
  const color =
    available === 0 ? 'rgba(239,68,68,0.7)' :
    pct <= 25       ? 'rgba(234,179,8,0.8)'  :
                      'var(--accent-gradient)'
  const label =
    available === 0         ? 'Agotado' :
    pct <= 25               ? `${available} restantes` :
    available < total * 0.5 ? 'Disponibilidad limitada' :
                              'Disponible'

  return (
    <div className="space-y-1.5">
      <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
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
  onBuy,
}: {
  eventId: string
  tiers: Tier[]
  isPast: boolean
  isLoggedIn: boolean
  loginRedirect: string
  onBuy?: (tierId: string, qty: number) => void
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

  function handleSelectTier(tier: Tier) {
    if (tier.available_tickets === 0) return
    if (selectedId === tier.id) return
    setSelectedId(tier.id)
    setQty(1)
  }

  function handleBuy() {
    if (loading || isSoldOut || isPast) return
    setLoading(true)
    if (onBuy) {
      onBuy(selectedId, qty)
    } else {
      setTimeout(() => {
        router.push(`/checkout?eventId=${eventId}&tierId=${selectedId}&quantity=${qty}`)
      }, 500)
    }
  }

  function cardBorderStyle(tier: Tier): React.CSSProperties {
    const isSelected = tier.id === selectedId
    const soldOut = tier.available_tickets === 0
    if (!isSelected) return {
      border: '1px solid rgba(255,255,255,0.07)',
      opacity: soldOut ? 0.4 : 1,
      boxShadow: 'none',
    }
    const e = tier.effect ?? 'none'
    if (e === 'gold') return { border: '1px solid rgba(251,191,36,0.6)', boxShadow: '0 4px 24px rgba(251,191,36,0.18)', opacity: 1 }
    if (e === 'diamond') return { border: '1px solid rgba(56,189,248,0.6)', boxShadow: '0 4px 24px rgba(56,189,248,0.18)', opacity: 1 }
    return { border: '1px solid rgba(250,20,146,0.5)', boxShadow: '0 4px 24px rgba(250,20,146,0.12)', opacity: 1 }
  }

  function headerPriceStyle(tier: Tier): React.CSSProperties {
    const isSelected = tier.id === selectedId
    if (!isSelected) return { color: 'rgba(255,255,255,0.45)' }
    const e = tier.effect ?? 'none'
    if (e === 'gold') return { background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
    if (e === 'diamond') return { background: 'linear-gradient(90deg,#7dd3fc,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
    return { color: 'var(--color-orange)' }
  }

  function checkColor(tier: Tier): string {
    if (tier.id !== selectedId) return 'rgba(255,255,255,0.15)'
    const e = tier.effect ?? 'none'
    if (e === 'gold')    return '#fbbf24'
    if (e === 'diamond') return '#7dd3fc'
    return 'var(--color-pink)'
  }

  function ctaStyle(): React.CSSProperties {
    if (effect === 'gold') return { ...goldStyle, borderRadius: '1rem', fontSize: '1rem' }
    if (effect === 'diamond') return { ...diamondStyle, borderRadius: '1rem', fontSize: '1rem' }
    return { background: 'var(--accent-gradient)', boxShadow: '0 0 32px rgba(249,115,22,0.25)' }
  }

  const activeDiscount = (!isFree && selectedTier?.discount) ? selectedTier.discount : null
  const applied        = activeDiscount ? applyDiscount(unitPrice, qty, activeDiscount.input) : null
  const saving         = applied && applied.totalDiscount > 0 ? applied.totalDiscount : 0
  const displayTotal   = total - saving
  const disabled       = loading || isSoldOut || isPast

  return (
    <>
      <TierEffectKeyframes />

      <div className="flex flex-col gap-4">

          {/* ── Tier cards ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2.5">
            {tiers.map(tier => {
              const isSelected = tier.id === selectedId
              const soldOut    = tier.available_tickets === 0
              const tierFree   = Number(tier.price) === 0

              return (
                <div
                  key={tier.id}
                  onClick={() => handleSelectTier(tier)}
                  className="relative overflow-hidden rounded-2xl transition-all duration-200"
                  style={{
                    background: 'var(--background)',
                    cursor: soldOut ? 'not-allowed' : 'pointer',
                    ...cardBorderStyle(tier),
                  }}
                >
                  {/* Discount flag */}
                  {tier.discount && (
                    <span
                      className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl rounded-tr-2xl text-[10px] font-bold uppercase tracking-widest z-10 pointer-events-none"
                      style={discountFlagStyle}
                    >
                      {tier.discount.label}
                    </span>
                  )}

                  {/* Card header */}
                  <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 transition-colors duration-200" style={{ color: checkColor(tier) }}>
                        <CheckCircle2 className="w-5 h-5" fill={isSelected ? 'currentColor' : 'none'} />
                      </div>
                      <span
                        className="font-semibold text-sm leading-tight truncate"
                        style={{ color: isSelected ? '#f4f1ff' : 'rgba(255,255,255,0.55)' }}
                      >
                        {tier.name}
                        {soldOut && (
                          <span className="ml-1.5 text-xs font-normal" style={{ color: 'rgba(255,255,255,0.28)' }}>· agotado</span>
                        )}
                      </span>
                    </div>
                    <span className="font-bold text-sm shrink-0" style={headerPriceStyle(tier)}>
                      {tierFree ? 'FREE' : `$${Number(tier.price).toLocaleString('es-MX')}`}
                    </span>
                  </div>

                  {/* Expandable body */}
                  <div className={`grid transition-all duration-300 ease-in-out ${isSelected ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4 pt-0 flex flex-col gap-4" style={{ paddingLeft: '3.25rem' }}>

                        {tier.description && (
                          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {tier.description}
                          </p>
                        )}

                        <AvailBar available={tier.available_tickets} total={tier.total_capacity} />

                        {!isPast && !soldOut && isLoggedIn && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Cantidad</span>
                            <div
                              className="flex items-center gap-3 rounded-full px-1 py-1"
                              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)) }}
                                disabled={qty <= 1 || disabled}
                                className="w-9 h-9 flex items-center justify-center rounded-full transition-all disabled:opacity-30 active:scale-90"
                                style={{ background: 'rgba(255,255,255,0.08)' }}
                              >
                                <Minus className="w-4 h-4 text-white" />
                              </button>
                              <span key={qty} className="w-6 text-center font-bold tabular-nums drum-pop text-white text-sm">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setQty(q => Math.min(max, q + 1)) }}
                                disabled={qty >= max || disabled}
                                className="w-9 h-9 flex items-center justify-center rounded-full transition-all disabled:opacity-30 active:scale-90"
                                style={{ background: 'rgba(255,255,255,0.08)' }}
                              >
                                <Plus className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        )}

                        {tier.discount?.kind === 'bogo' && !soldOut && (
                          <p className="text-xs font-bold" style={{ color: qty >= tier.discount.min_qty ? '#4ade80' : 'var(--color-orange)' }}>
                            {qty >= tier.discount.min_qty
                              ? `¡Descuento ${tier.discount.label} aplicado!`
                              : `Agrega ${tier.discount.min_qty - qty} boleto${tier.discount.min_qty - qty === 1 ? ' más' : 's más'} para el ${tier.discount.label}`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── CTA ──────────────────────────────────────────────────────── */}
          <div className="space-y-2.5">
            {isPast ? (
              <div className="w-full h-13 rounded-2xl flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Ban size={15} style={{ color: 'rgba(255,255,255,0.2)' }} />
                <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.25)' }}>Evento finalizado</span>
              </div>

            ) : isSoldOut ? (
              <div className="w-full h-13 rounded-2xl flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Ban size={15} style={{ color: 'rgba(255,255,255,0.2)' }} />
                <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.25)' }}>Agotado</span>
              </div>

            ) : !isLoggedIn ? (
              <Link
                href={loginRedirect}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 28px rgba(249,115,22,0.28)' }}
              >
                <LogIn size={18} />
                Inicia sesión para comprar
              </Link>

            ) : (
              <button
                type="button"
                onClick={handleBuy}
                disabled={loading}
                className="relative w-full h-14 rounded-2xl overflow-hidden font-semibold text-base text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed px-5 flex items-center justify-between"
                style={ctaStyle()}
              >
                <span className={`transition-all duration-200 ${loading ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                  {isFree ? `Reservar${qty > 1 ? ` ${qty} boletos` : ''} · FREE` : 'Ir al checkout'}
                </span>
                <span className={`flex items-center gap-2 transition-all duration-200 ${loading ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                  {!isFree && saving > 0 && (
                    <span className="text-sm font-medium line-through opacity-50">${total.toFixed(2)}</span>
                  )}
                  {!isFree && <span className="font-bold">${displayTotal.toFixed(2)}</span>}
                  <ArrowRight className="w-5 h-5 opacity-80" />
                </span>
                <span aria-hidden
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${loading ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                  <Loader2 size={22} className="animate-spin" />
                </span>
              </button>
            )}

            {!isPast && !isSoldOut && isLoggedIn && !isFree && (
              <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Los cargos por servicio se calculan en el siguiente paso.
              </p>
            )}
          </div>

        </div>
    </>
  )
}
