'use client'

import { useState } from 'react'
import { X, CalendarDays, MapPin } from 'lucide-react'
import { VT323 } from 'next/font/google'
import TicketQr from '@/app/tickets/_components/ticket-qr'

const vt323 = VT323({ weight: '400', subsets: ['latin'] })

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

export default function RetroTicketWallet({ tickets }: { tickets: TicketData[] }) {
  const [active, setActive] = useState<TicketData | null>(null)

  return (
    <>
      {/* Ticket grid — wallet style */}
      <div className={`grid gap-4 ${tickets.length > 1 ? 'sm:grid-cols-2' : 'max-w-sm mx-auto'} ${vt323.className}`}>
        {tickets.map(ticket => (
          <button
            key={ticket.id}
            onClick={() => setActive(ticket)}
            className="border-4 border-black bg-amber-50 shadow-[6px_6px_0_0_#000] text-left transition-all duration-200 hover:shadow-[8px_8px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:scale-95 active:shadow-none"
          >
            {/* Header bar */}
            <div className="bg-black text-amber-50 px-4 py-2 flex items-center justify-between">
              <span className="text-xl tracking-[0.3em] uppercase">★ TAKILLA ★</span>
              <span className="text-lg tracking-widest opacity-80">#{ticket.displayNumber}</span>
            </div>

            {/* Body */}
            <div className="px-4 pt-3 pb-2 space-y-2">
              <p className="text-2xl text-zinc-900 leading-snug uppercase tracking-wide line-clamp-2">
                {ticket.eventTitle}
              </p>
              {ticket.eventDate && (
                <p className="text-base text-zinc-600 flex items-center gap-1.5">
                  <CalendarDays size={13} />
                  {ticket.eventDate}
                </p>
              )}
              {(ticket.venueName || ticket.venueCity) && (
                <p className="text-base text-zinc-600 flex items-center gap-1.5">
                  <MapPin size={13} />
                  {[ticket.venueName, ticket.venueCity].filter(Boolean).join(' — ')}
                </p>
              )}
              {ticket.tierName && (
                <p className="text-base uppercase text-zinc-700">
                  {ticket.tierName}
                  {ticket.tierPrice !== null && ticket.tierPrice > 0 && (
                    <span className="ml-2 text-zinc-400">· ${ticket.tierPrice.toFixed(2)}</span>
                  )}
                </p>
              )}
            </div>

            {/* Dashed separator */}
            <div className="relative flex items-center mx-0 my-1">
              <div className="absolute -left-[16px] w-8 h-8 rounded-full bg-white border-4 border-black" />
              <div className="flex-1 border-t-[3px] border-dashed border-black mx-4" />
              <div className="absolute -right-[16px] w-8 h-8 rounded-full bg-white border-4 border-black" />
            </div>

            {/* QR preview */}
            <div className="px-4 py-3 flex flex-col items-center gap-1">
              <TicketQr qrHash={ticket.qr_hash} size={96} />
              <p className="text-sm text-zinc-400 tracking-widest uppercase mt-1">
                Toca para escanear
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Fullscreen QR overlay */}
      {active && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <div
            className={`w-full max-w-sm border-4 border-black bg-amber-50 shadow-[10px_10px_0_0_#000] ${vt323.className}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-black text-amber-50 px-5 py-2 flex items-center justify-between">
              <span className="text-2xl tracking-[0.3em] uppercase">★ TAKILLA ★</span>
              <div className="flex items-center gap-3">
                <span className="text-xl tracking-widest opacity-80">#{active.displayNumber}</span>
                <button onClick={() => setActive(null)} className="p-1 rounded-full hover:bg-zinc-800 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Event info */}
            <div className="px-5 pt-4 pb-2 space-y-2">
              <p className="text-3xl text-zinc-900 uppercase tracking-wide leading-snug">
                {active.eventTitle}
              </p>
              {active.eventDate && (
                <p className="text-lg text-zinc-600">{active.eventDate}</p>
              )}
              {(active.venueName || active.venueCity) && (
                <p className="text-lg text-zinc-600">
                  {[active.venueName, active.venueCity].filter(Boolean).join(' — ')}
                </p>
              )}
              {active.tierName && (
                <p className="text-lg uppercase text-zinc-700">{active.tierName}</p>
              )}
            </div>

            {/* Dashed separator */}
            <div className="relative flex items-center mx-0 my-1">
              <div className="absolute -left-[18px] w-9 h-9 rounded-full bg-zinc-800 border-4 border-black" />
              <div className="flex-1 border-t-[3px] border-dashed border-black mx-5" />
              <div className="absolute -right-[18px] w-9 h-9 rounded-full bg-zinc-800 border-4 border-black" />
            </div>

            {/* Large QR */}
            <div className="px-5 py-4 flex flex-col items-center gap-2">
              <p className="text-xs tracking-[0.3em] text-zinc-400 uppercase self-start">Código de acceso</p>
              <TicketQr qrHash={active.qr_hash} size={220} />
              <p className="text-sm text-zinc-400 tracking-widest uppercase mt-1">
                Muestra al staff en la entrada
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
