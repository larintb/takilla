'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, MapPin } from 'lucide-react'
import TicketQr from '@/app/tickets/_components/ticket-qr'

type TicketData = {
  id: string
  displayNumber: string
  qr_hash: string
  eventTitle: string
  eventDate: string | null
  venueName: string | null
  venueCity: string | null
  tierName: string | null
  tierPrice: number | null
}

export default function RetroTicketWallet({
  tickets,
  initialIndex = 0,
}: {
  tickets: TicketData[]
  initialIndex?: number
}) {
  const [index, setIndex] = useState(initialIndex)
  const ticket = tickets[index]
  const total  = tickets.length

  const date = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleDateString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return (
    <div className="flex flex-col items-center gap-6 w-full">

      {/* ── Ticket card ──────────────────────────────────────── */}
      {/* Gradient border wrapper */}
      <div
        className="w-full"
        style={{
          background: 'var(--accent-gradient)',
          padding: '1.5px',
          borderRadius: '28px',
          boxShadow: '0 0 60px rgba(249,115,22,0.18), 0 0 120px rgba(250,20,146,0.1)',
        }}
      >
        <div
          className="w-full overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #1e1040 0%, #110726 100%)',
            borderRadius: '26.5px',
          }}
        >

          {/* ── Header strip ──────────────────────────────── */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <span className="font-bold text-xl tracking-[0.22em] text-white uppercase"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              ★ Takilla
            </span>
            <span className="font-mono text-sm font-bold text-white/70 tracking-widest">
              #{ticket.displayNumber}
            </span>
          </div>

          {/* ── Event info ────────────────────────────────── */}
          <div className="px-6 pt-6 pb-5 space-y-3">
            <h2
              className="font-bold text-white leading-tight break-words"
              style={{ fontSize: 'clamp(1.6rem, 7vw, 2.2rem)' }}
            >
              {ticket.eventTitle}
            </h2>

            <div className="space-y-1.5">
              {date && (
                <p className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <CalendarDays size={14} className="shrink-0" style={{ color: 'var(--color-orange)' }} />
                  <span className="capitalize">{date}</span>
                </p>
              )}
              {(ticket.venueName || ticket.venueCity) && (
                <p className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <MapPin size={14} className="shrink-0" style={{ color: 'var(--color-pink)' }} />
                  {[ticket.venueName, ticket.venueCity].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {ticket.tierName && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  {ticket.tierName}
                </span>
                {ticket.tierPrice !== null && ticket.tierPrice > 0 && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
                    <span className="text-xs font-bold text-white">${ticket.tierPrice.toFixed(2)}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Perforated separator ──────────────────────── */}
          <div className="relative flex items-center" style={{ margin: '0 -1.5px' }}>
            {/* Left notch */}
            <div className="w-7 h-7 rounded-full shrink-0"
              style={{ background: 'linear-gradient(160deg, #1e1040 0%, #110726 100%)', marginLeft: '-14px' }} />
            {/* Dashed line */}
            <div className="flex-1 border-t-2 border-dashed mx-2"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }} />
            {/* Right notch */}
            <div className="w-7 h-7 rounded-full shrink-0"
              style={{ background: 'linear-gradient(160deg, #1e1040 0%, #110726 100%)', marginRight: '-14px' }} />
          </div>

          {/* ── QR section ────────────────────────────────── */}
          <div className="px-6 pt-6 pb-7 flex flex-col items-center gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              Código de acceso
            </p>

            {/* QR container */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            >
              <TicketQr qrHash={ticket.qr_hash} size={210} />
            </div>

            <p
              className="text-xs font-semibold uppercase tracking-widest text-center"
              style={{
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Muestra al staff en la entrada
            </p>
          </div>

        </div>
      </div>

      {/* ── Navigation (multi-ticket) ─────────────────────── */}
      {total > 1 && (
        <div className="flex items-center gap-5">
          <button
            onClick={() => setIndex(i => i - 1)}
            disabled={index === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-25 hover:opacity-70 active:scale-90"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronLeft size={18} color="white" />
          </button>

          <div className="flex items-center gap-2">
            {tickets.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className="transition-all"
                style={{
                  width: i === index ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i === index ? 'var(--color-orange)' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setIndex(i => i + 1)}
            disabled={index === total - 1}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-25 hover:opacity-70 active:scale-90"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronRight size={18} color="white" />
          </button>
        </div>
      )}

      {total > 1 && (
        <p className="text-xs font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Boleto {index + 1} de {total}
        </p>
      )}
    </div>
  )
}
