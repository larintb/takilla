'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Gift } from 'lucide-react'
import TicketPanel from './ticket-panel'
import PerkPanel from '@/components/perk-panel'

import type { DiscountInput } from '@/utils/pricing'

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

type Perk = {
  id: string
  name: string
  price: number
  description?: string | null
  imageUrl?: string | null
}

export default function EventPurchasePanel({
  eventId,
  tiers,
  perks,
  isPast,
  isLoggedIn,
  loginRedirect,
  hasExistingTicket,
}: {
  eventId: string
  tiers: Tier[]
  perks: Perk[]
  isPast: boolean
  isLoggedIn: boolean
  loginRedirect: string
  hasExistingTicket: boolean
}) {
  const router = useRouter()
  const [perksMap, setPerksMap] = useState<Map<string, number>>(new Map())

  const perkIds = useMemo(() => {
    const ids: string[] = []
    for (const [id, qty] of perksMap.entries()) {
      for (let i = 0; i < qty; i++) ids.push(id)
    }
    return ids
  }, [perksMap])

  function handleTicketBuy(tierId: string, qty: number) {
    const perksParam = perkIds.length > 0 ? `&perks=${perkIds.join(',')}` : ''
    setTimeout(() => {
      router.push(`/checkout?eventId=${eventId}&tierId=${tierId}&quantity=${qty}${perksParam}`)
    }, 500)
  }

  const showPerks = perks.length > 0 && !isPast

  return (
    <div className="flex flex-col gap-6">
      <TicketPanel
        eventId={eventId}
        tiers={tiers}
        isPast={isPast}
        isLoggedIn={isLoggedIn}
        loginRedirect={loginRedirect}
        onBuy={handleTicketBuy}
      />

      {showPerks && isLoggedIn && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.5rem' }}
          className="flex flex-col gap-4">
          <PerkPanel perks={perks} value={perksMap} onChange={setPerksMap} />

          {/* When perks selected: show action based on whether user already has a ticket */}
          {perkIds.length > 0 && (
            hasExistingTicket ? (
              // Has ticket → buy perks standalone, no need to pick a tier
              <button
                onClick={() => router.push(`/checkout/perks?eventId=${eventId}&perks=${perkIds.join(',')}`)}
                className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-between px-5 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 28px rgba(249,115,22,0.28)' }}
              >
                <span className="flex items-center gap-2">
                  <Gift size={18} className="opacity-80" />
                  Comprar {perkIds.length} extra{perkIds.length !== 1 ? 's' : ''}
                </span>
                <ArrowRight size={18} className="opacity-70" />
              </button>
            ) : (
              // No ticket yet → perks are bundled with ticket in TicketPanel CTA
              <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Los extras se agregarán a tu compra junto con el boleto.
              </p>
            )
          )}

          {/* No perks selected + has ticket → subtle hint */}
          {perkIds.length === 0 && hasExistingTicket && (
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Ya tienes boleto — selecciona extras para agregarlos a tu pedido.
            </p>
          )}
        </div>
      )}

      {showPerks && !isLoggedIn && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.5rem' }}>
          <PerkPanel perks={perks} value={perksMap} onChange={setPerksMap} />
        </div>
      )}
    </div>
  )
}
