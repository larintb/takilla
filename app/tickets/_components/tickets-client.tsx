'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Ticket, X,
  ChevronLeft, ChevronRight, FileSearch, Gift, CalendarDays, MapPin,
} from 'lucide-react'
import { isEventOver } from '@/utils/event-time'
import TicketQr from './ticket-qr'
import DigitalTicket from '@/components/digital-ticket'

type TicketItem = {
  id: string
  qr_hash: string
  is_used: boolean
  tierName: string
  price: number
  index: number
}

type PerkPurchaseRow = {
  id: string
  qr_hash: string
  is_used: boolean
  perkName: string
}

type EventGroup = {
  eventId: string
  eventData: {
    title: string
    date: string
    venueName: string | null
    venueCity: string | null
    locationName: string | null
    imageUrl: string | null
    totalCount: number
    validCount: number
    hasAvailablePerks: boolean
  }
  tickets: TicketItem[]
  perkPurchases: PerkPurchaseRow[]
  eventDate: string
  eventEndDate: string | null
}

// ── Dot nav ───────────────────────────────────────────────────────────────────

function DotNav({
  total, current, onSelect, accent,
}: { total: number; current: number; onSelect: (i: number) => void; accent: string }) {
  if (total <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className="transition-all"
          style={{
            width: i === current ? '18px' : '6px',
            height: '6px',
            borderRadius: '3px',
            background: i === current ? accent : 'rgba(255,255,255,0.2)',
          }}
        />
      ))}
    </div>
  )
}

// ── Perk card ─────────────────────────────────────────────────────────────────

function PerkCard({
  perk, eventTitle, index, total,
}: {
  perk: PerkPurchaseRow
  eventTitle: string
  index: number
  total: number
}) {
  const isUsed = perk.is_used

  return (
    <div
      className="w-full rounded-3xl overflow-hidden"
      style={{
        background: isUsed
          ? 'rgba(255,255,255,0.06)'
          : 'linear-gradient(135deg, rgba(249,115,22,0.9) 0%, rgba(250,20,146,0.7) 100%)',
        padding: '1.5px',
        boxShadow: isUsed ? 'none' : '0 0 50px rgba(249,115,22,0.18)',
        opacity: isUsed ? 0.65 : 1,
      }}
    >
      <div className="w-full rounded-[22.5px] overflow-hidden"
        style={{ background: 'linear-gradient(170deg, #1c0f38 0%, #0f0720 100%)' }}>

        {isUsed && (
          <div className="text-center py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
            Extra canjeado
          </div>
        )}

        {/* Header strip */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{
            background: isUsed
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(90deg, rgba(249,115,22,0.9) 0%, rgba(250,20,146,0.65) 100%)',
          }}>
          <span className="font-black text-sm tracking-[0.2em] text-white uppercase flex items-center gap-2">
            <Gift size={13} className="opacity-80" /> EXTRA
          </span>
          <span className="font-mono text-xs font-bold tracking-widest"
            style={{ color: 'rgba(255,255,255,0.7)' }}>
            {index + 1}/{total}
          </span>
        </div>

        {/* Perk info */}
        <div className="px-5 pt-4 pb-3 space-y-1.5">
          <h2 className="font-bold text-white leading-tight"
            style={{ fontSize: 'clamp(1.2rem, 5vw, 1.6rem)' }}>
            {perk.perkName}
          </h2>
          <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {eventTitle}
          </p>
        </div>

        {/* Perforated divider */}
        <div className="relative flex items-center mx-0 my-1">
          <div className="w-6 h-6 rounded-full shrink-0"
            style={{ background: '#0a0414', marginLeft: '-12px' }} />
          <div className="flex-1 border-t-2 border-dashed"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }} />
          <div className="w-6 h-6 rounded-full shrink-0"
            style={{ background: '#0a0414', marginRight: '-12px' }} />
        </div>

        {/* QR section */}
        <div className="px-5 pt-3 pb-6 flex flex-col items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] self-start"
            style={{ color: 'rgba(255,255,255,0.2)' }}>
            Código de canje
          </p>
          <div className="p-3 rounded-2xl w-full flex items-center justify-center"
            style={{ background: '#ffffff', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <TicketQr qrHash={perk.qr_hash} size={220} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-center"
            style={isUsed
              ? { color: 'rgba(255,255,255,0.2)' }
              : { color: 'rgba(249,115,22,0.9)' }
            }>
            {isUsed ? 'Ya canjeado' : 'Muestra al staff para canjear'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TicketsClient({ eventGroups }: { eventGroups: EventGroup[] }) {
  const [selected,    setSelected]    = useState<EventGroup | null>(null)
  const [ticketIndex, setTicketIndex] = useState(0)
  const [perkIndex,   setPerkIndex]   = useState(0)
  const [activeTab,   setActiveTab]   = useState<'tickets' | 'perks'>('tickets')

  const ticketScrollRef = useRef<HTMLDivElement>(null)
  const swipeTouchStart = useRef<number | null>(null)


  function onSwipeTouchStart(e: React.TouchEvent) {
    swipeTouchStart.current = e.touches[0].clientX
  }

  function onSwipeTouchEnd(e: React.TouchEvent) {
    if (swipeTouchStart.current === null) return
    const dx = e.changedTouches[0].clientX - swipeTouchStart.current
    swipeTouchStart.current = null
    if (Math.abs(dx) < 40) return
    if (dx < 0) setTicketIndex(i => Math.min(totalTickets - 1, i + 1))
    else         setTicketIndex(i => Math.max(0, i - 1))
  }

  function openWallet(group: EventGroup) {
    setTicketIndex(0)
    setPerkIndex(0)
    setActiveTab('tickets')
    setSelected(group)
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (eventGroups.length === 0) {
    return (
      <div className="rounded-2xl p-16 text-center animate-fade-in-up"
        style={{ background: 'var(--surface-panel)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <Ticket size={40} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
        <p className="font-semibold text-white">No tienes boletos aún</p>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Explora los eventos disponibles y adquiere tus boletos
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 mt-6 px-5 h-11 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <FileSearch size={15} />
          Ver eventos
        </Link>
      </div>
    )
  }

  const perk         = selected?.perkPurchases[perkIndex]
  const totalTickets = selected?.tickets.length ?? 0
  const totalPerks   = selected?.perkPurchases.length ?? 0
  const hasPerks     = totalPerks > 0
  const isPast       = selected ? isEventOver(selected.eventDate, selected.eventEndDate) : false

  // ── Event list ─────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-3">
        {eventGroups.map((group, i) => {
          const { eventData } = group
          const past = isEventOver(group.eventDate, group.eventEndDate)

          return (
            <div key={group.eventId}
              className="rounded-2xl overflow-hidden animate-fade-in-up"
              style={{
                background: 'var(--surface-panel)',
                border: '1px solid rgba(255,255,255,0.07)',
                animationDelay: `${i * 50}ms`,
              }}>
              <button
                onClick={() => openWallet(group)}
                className="w-full text-left flex items-center gap-3 p-4 transition-all hover:brightness-110 active:scale-[0.99]"
              >
                {/* Thumbnail */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  {eventData.imageUrl ? (
                    <Image src={eventData.imageUrl} alt={eventData.title} fill unoptimized className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ background: 'var(--accent-gradient)' }}>
                      <Ticket size={20} className="text-white/60" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white leading-snug truncate text-sm">{eventData.title}</p>
                  <p className="text-xs flex items-center gap-1 mt-0.5 capitalize"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <CalendarDays size={11} className="shrink-0" />
                    {eventData.date}
                  </p>
                  {eventData.venueName && (
                    <p className="text-xs flex items-center gap-1 truncate"
                      style={{ color: 'rgba(255,255,255,0.3)' }}>
                      <MapPin size={11} className="shrink-0" />
                      {eventData.venueName}{eventData.venueCity ? `, ${eventData.venueCity}` : ''}
                    </p>
                  )}
                  {/* Badge row */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                      {eventData.totalCount} boleto{eventData.totalCount !== 1 ? 's' : ''}
                    </span>
                    {group.perkPurchases.length > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background: 'rgba(249,115,22,0.12)', color: 'rgba(249,115,22,0.9)' }}>
                        <Gift size={9} />
                        {group.perkPurchases.length} extra{group.perkPurchases.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {past ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' }}>
                        Pasado
                      </span>
                    ) : eventData.validCount > 0 ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
                        {eventData.validCount} válido{eventData.validCount !== 1 ? 's' : ''}
                      </span>
                    ) : null}
                  </div>
                </div>

                <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
              </button>

              {/* Comprar extras footer */}
              {!past && eventData.hasAvailablePerks && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <Link
                    href={`/checkout/perks?eventId=${group.eventId}`}
                    className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ color: 'rgba(249,115,22,0.8)' }}
                  >
                    <Gift size={12} />
                    Comprar extras
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Wallet overlay ─────────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ height: '100dvh', background: '#0a0414' }}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 pt-safe-top pt-4 pb-2">
            <div className="min-w-0 flex-1 pr-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-0.5"
                style={{ color: 'rgba(255,255,255,0.2)' }}>
                {activeTab === 'perks' ? 'Extras' : 'Boleto'}
              </p>
              <p className="text-sm font-bold text-white truncate">{selected.eventData.title}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors active:scale-90"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              <X size={17} />
            </button>
          </div>

          {/* Tab switcher */}
          {hasPerks && (
            <div className="shrink-0 px-4 pb-2">
              <div className="flex rounded-xl overflow-hidden p-0.5"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => setActiveTab('tickets')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-bold transition-all"
                  style={{
                    background: activeTab === 'tickets' ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: activeTab === 'tickets' ? 'white' : 'rgba(255,255,255,0.35)',
                  }}>
                  <Ticket size={11} />
                  Boletos ({totalTickets})
                </button>
                <button
                  onClick={() => setActiveTab('perks')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-bold transition-all"
                  style={{
                    background: activeTab === 'perks' ? 'rgba(249,115,22,0.2)' : 'transparent',
                    color: activeTab === 'perks' ? 'rgba(249,115,22,1)' : 'rgba(255,255,255,0.35)',
                  }}>
                  <Gift size={11} />
                  Extras ({totalPerks})
                </button>
              </div>
            </div>
          )}

          {/* ── BOLETOS ─────────────────────────────────────────────────────── */}
          {activeTab === 'tickets' && (
            <>
              {/* Slide carousel — one card at a time */}
              <div
                className="flex-1 min-h-0 overflow-hidden relative"
                onTouchStart={onSwipeTouchStart}
                onTouchEnd={onSwipeTouchEnd}
              >
                <div
                  ref={ticketScrollRef}
                  className="flex h-full"
                  style={{
                    transform: `translateX(-${ticketIndex * 100}%)`,
                    transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                >
                  {selected.tickets.map((t) => (
                    <div
                      key={t.id}
                      className="min-w-full h-full overflow-y-auto px-4 py-2"
                    >
                      <DigitalTicket
                        id={t.id}
                        qr_hash={t.qr_hash}
                        eventTitle={selected.eventData.title}
                        eventDate={selected.eventData.date}
                        venueName={selected.eventData.venueName}
                        venueCity={selected.eventData.venueCity}
                        locationName={selected.eventData.locationName}
                        tierName={t.tierName}
                        isUsed={t.is_used}
                        isPast={isPast}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom nav */}
              <div className="shrink-0 pb-safe-bottom">
                {totalTickets > 1 ? (
                  <div className="flex items-center justify-between px-6 py-3">
                    <button
                      onClick={() => setTicketIndex(i => Math.max(0, i - 1))}
                      disabled={ticketIndex === 0}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-20 active:scale-90"
                      style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                      <ChevronLeft size={18} />
                    </button>
                    <DotNav
                      total={totalTickets}
                      current={ticketIndex}
                      onSelect={setTicketIndex}
                      accent="var(--color-orange)"
                    />
                    <button
                      onClick={() => setTicketIndex(i => Math.min(totalTickets - 1, i + 1))}
                      disabled={ticketIndex === totalTickets - 1}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-20 active:scale-90"
                      style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </div>
            </>
          )}

          {/* ── EXTRAS ──────────────────────────────────────────────────────── */}
          {activeTab === 'perks' && perk && (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
                <PerkCard
                  perk={perk}
                  eventTitle={selected.eventData.title}
                  index={perkIndex}
                  total={totalPerks}
                />
              </div>

              <div className="shrink-0 pb-safe-bottom">
                {totalPerks > 1 ? (
                  <div className="flex items-center justify-between px-6 py-3">
                    <button
                      onClick={() => setPerkIndex(i => i - 1)}
                      disabled={perkIndex === 0}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-20 active:scale-90"
                      style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                      <ChevronLeft size={18} />
                    </button>
                    <DotNav
                      total={totalPerks}
                      current={perkIndex}
                      onSelect={setPerkIndex}
                      accent="var(--color-orange)"
                    />
                    <button
                      onClick={() => setPerkIndex(i => i + 1)}
                      disabled={perkIndex === totalPerks - 1}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-20 active:scale-90"
                      style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
