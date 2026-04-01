'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Ticket, CalendarDays, MapPin, X,
  ChevronLeft, ChevronRight, FileSearch,
} from 'lucide-react'
import TicketQr from './ticket-qr'

type TicketItem = {
  id: string
  qr_hash: string
  is_used: boolean
  tierName: string
  price: number
  index: number
}

type EventGroup = {
  eventData: {
    title: string
    date: string
    venueName: string | null
    venueCity: string | null
    imageUrl: string | null
    totalCount: number
    validCount: number
  }
  tickets: TicketItem[]
  eventDate: string
}

function ticketDisplayNumber(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8)
  return String((parseInt(hex, 16) % 9000) + 1000)
}

export default function TicketsClient({ eventGroups }: { eventGroups: EventGroup[] }) {
  const [selected, setSelected]       = useState<EventGroup | null>(null)
  const [ticketIndex, setTicketIndex] = useState(0)

  const openWallet  = (group: EventGroup) => { setTicketIndex(0); setSelected(group) }
  const closeWallet = () => setSelected(null)

  // ── Empty state ────────────────────────────────────────────────────────────
  if (eventGroups.length === 0) {
    return (
      <div
        className="rounded-2xl p-16 text-center animate-fade-in-up"
        style={{ background: 'var(--surface-panel)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
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

  const ticket = selected?.tickets[ticketIndex]
  const total  = selected?.tickets.length ?? 0

  const isPast = selected ? new Date(selected.eventDate) < new Date() : false
  const isUsed = ticket?.is_used ?? false
  const dimmed = isPast || isUsed

  // ── Event list ─────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-3">
        {eventGroups.map((group, i) => {
          const { eventData } = group
          const past = new Date(group.eventDate) < new Date()

          return (
            <button
              key={group.eventDate + eventData.title}
              onClick={() => openWallet(group)}
              className="w-full text-left flex items-center gap-4 rounded-2xl p-4 transition-all animate-fade-in-up hover:brightness-110 active:scale-[0.99]"
              style={{
                background: 'var(--surface-panel)',
                border: '1px solid rgba(255,255,255,0.07)',
                animationDelay: `${i * 50}ms`,
              }}
            >
              {/* Thumbnail */}
              <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                {eventData.imageUrl ? (
                  <Image src={eventData.imageUrl} alt={eventData.title} fill unoptimized className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: 'var(--accent-gradient)' }}>
                    <Ticket size={22} className="text-white/60" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-bold text-white leading-snug truncate">
                  {eventData.title}
                </p>
                <p className="text-sm flex items-center gap-1.5 capitalize"
                  style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <CalendarDays size={12} className="shrink-0" />
                  {eventData.date}
                </p>
                {eventData.venueName && (
                  <p className="text-sm flex items-center gap-1.5 truncate"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <MapPin size={12} className="shrink-0" />
                    {eventData.venueName}{eventData.venueCity ? `, ${eventData.venueCity}` : ''}
                  </p>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                  {eventData.totalCount} boleto{eventData.totalCount !== 1 ? 's' : ''}
                </span>
                {past ? (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                    Pasado
                  </span>
                ) : eventData.validCount > 0 ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                    {eventData.validCount} válido{eventData.validCount !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                    Usados
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Ticket overlay ──────────────────────────────────────────────────── */}
      {selected && ticket && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ height: '100dvh', background: 'rgba(8,4,20,0.97)', backdropFilter: 'blur(20px)' }}
        >
          {/* Top bar */}
          <div className="shrink-0 flex items-center justify-between px-5 pt-safe-top pt-5 pb-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: 'rgba(255,255,255,0.25)' }}>
                {isPast ? 'Evento terminado' : isUsed ? 'Boleto usado' : 'Tu boleto'}
              </span>
              <span className="text-sm font-bold text-white truncate max-w-[220px]">
                {selected.eventData.title}
              </span>
            </div>
            <button
              onClick={closeWallet}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/10 active:scale-90 shrink-0 ml-3"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable card area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3">
            <div className="flex flex-col items-center min-h-full justify-center">
              <div
                className="w-full"
                style={{
                  maxWidth: '380px',
                  background: dimmed ? 'rgba(255,255,255,0.06)' : 'var(--accent-gradient)',
                  padding: '1.5px',
                  borderRadius: '28px',
                  boxShadow: dimmed
                    ? 'none'
                    : '0 0 80px rgba(249,115,22,0.25), 0 0 120px rgba(250,20,146,0.12)',
                  opacity: dimmed ? 0.65 : 1,
                  transition: 'opacity 0.3s ease',
                }}
              >
                <div
                  className="w-full overflow-hidden"
                  style={{
                    background: 'linear-gradient(160deg, #1e1040 0%, #110726 100%)',
                    borderRadius: '26.5px',
                  }}
                >
                  {/* Status banner */}
                  {(isPast || isUsed) && (
                    <div className="text-center py-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
                      {isPast ? 'Evento finalizado' : 'Boleto ya utilizado'}
                    </div>
                  )}

                  {/* Header strip */}
                  <div
                    className="flex items-center justify-between px-5 py-3.5"
                    style={{ background: dimmed ? 'rgba(255,255,255,0.05)' : 'var(--accent-gradient)' }}
                  >
                    <span className="font-bold text-base tracking-[0.22em] text-white uppercase">
                      ★ Takilla
                    </span>
                    <span className="font-mono text-sm font-bold tracking-widest"
                      style={{ color: 'rgba(255,255,255,0.75)' }}>
                      #{ticketDisplayNumber(ticket.id)}
                    </span>
                  </div>

                  {/* Event info */}
                  <div className="px-5 pt-5 pb-4 space-y-3">
                    <h2 className="font-bold text-white leading-tight break-words"
                      style={{ fontSize: 'clamp(1.35rem, 5.5vw, 1.8rem)' }}>
                      {selected.eventData.title}
                    </h2>

                    <div className="space-y-1.5">
                      <p className="text-sm flex items-center gap-2 capitalize"
                        style={{ color: 'rgba(255,255,255,0.5)' }}>
                        <CalendarDays size={13} className="shrink-0" style={{ color: 'var(--color-orange)' }} />
                        {selected.eventData.date}
                      </p>
                      {selected.eventData.venueName && (
                        <p className="text-sm flex items-center gap-2"
                          style={{ color: 'rgba(255,255,255,0.5)' }}>
                          <MapPin size={13} className="shrink-0" style={{ color: 'var(--color-pink)' }} />
                          <span className="break-words">
                            {selected.eventData.venueName}
                            {selected.eventData.venueCity ? `, ${selected.eventData.venueCity}` : ''}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      <span className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {ticket.tierName}
                      </span>
                      {ticket.price > 0 && (
                        <>
                          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                          <span className="text-xs font-bold text-white">${ticket.price.toFixed(2)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Perforated separator */}
                  <div className="relative flex items-center" style={{ margin: '0 -1.5px' }}>
                    <div className="w-7 h-7 rounded-full shrink-0"
                      style={{ background: 'rgba(8,4,20,0.97)', marginLeft: '-14px' }} />
                    <div className="flex-1 border-t-2 border-dashed mx-1"
                      style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                    <div className="w-7 h-7 rounded-full shrink-0"
                      style={{ background: 'rgba(8,4,20,0.97)', marginRight: '-14px' }} />
                  </div>

                  {/* QR section */}
                  <div className="px-5 pt-5 pb-7 flex flex-col items-center gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] self-start"
                      style={{ color: 'rgba(255,255,255,0.25)' }}>
                      Código de acceso
                    </p>
                    <div className="p-3.5 rounded-2xl"
                      style={{ background: '#fff', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
                      <TicketQr qrHash={ticket.qr_hash} size={200} />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-center"
                      style={dimmed
                        ? { color: 'rgba(255,255,255,0.25)' }
                        : { background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
                      }>
                      {isPast
                        ? 'Evento finalizado'
                        : isUsed
                          ? 'Ya utilizado'
                          : 'Muestra al staff en la entrada'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: navigation + safe area */}
          <div className="shrink-0 pb-safe-bottom">
            {total > 1 && (
              <div className="flex items-center justify-center gap-6 px-4 py-3">
                <button
                  onClick={() => setTicketIndex(i => i - 1)}
                  disabled={ticketIndex === 0}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-20 hover:bg-white/10 active:scale-90"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Dot indicators */}
                <div className="flex items-center gap-2">
                  {selected.tickets.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTicketIndex(i)}
                      className="transition-all"
                      style={{
                        width: i === ticketIndex ? '20px' : '6px',
                        height: '6px',
                        borderRadius: '3px',
                        background: i === ticketIndex ? 'var(--color-orange)' : 'rgba(255,255,255,0.2)',
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setTicketIndex(i => i + 1)}
                  disabled={ticketIndex === total - 1}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-20 hover:bg-white/10 active:scale-90"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
            <div className="h-4" />
          </div>
        </div>
      )}
    </>
  )
}
