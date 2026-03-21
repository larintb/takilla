'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, MapPin } from 'lucide-react'
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
  const [index, setIndex] = useState(0)
  const ticket = tickets[index]
  const total = tickets.length

  const date = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleDateString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }).toUpperCase()
    : null

  return (
    <div className="flex flex-col items-center gap-5">

      {/* Ticket */}
      <div className={`w-full max-w-sm border-4 border-black bg-amber-50 shadow-[8px_8px_0_0_#000] ${vt323.className}`}>

        {/* Header */}
        <div className="bg-black text-amber-50 px-5 py-2.5 flex items-center justify-between">
          <span className="text-2xl tracking-[0.3em] uppercase">★ TAKILLA ★</span>
          <span className="text-xl tracking-widest opacity-70">#{ticket.displayNumber}</span>
        </div>

        {/* Event info */}
        <div className="px-5 pt-4 pb-3 space-y-1.5">
          <p className="text-3xl text-zinc-900 uppercase tracking-wide leading-snug">
            {ticket.eventTitle}
          </p>
          {date && (
            <p className="text-lg text-zinc-600 flex items-center gap-1.5">
              <CalendarDays size={14} />
              {date}
            </p>
          )}
          {(ticket.venueName || ticket.venueCity) && (
            <p className="text-lg text-zinc-600 flex items-center gap-1.5">
              <MapPin size={14} />
              {[ticket.venueName, ticket.venueCity].filter(Boolean).join(' — ')}
            </p>
          )}
          {ticket.tierName && (
            <p className="text-lg uppercase text-zinc-700">
              {ticket.tierName}
              {ticket.tierPrice !== null && ticket.tierPrice > 0 && (
                <span className="ml-2 text-zinc-400">· ${ticket.tierPrice.toFixed(2)}</span>
              )}
            </p>
          )}
        </div>

        {/* Dashed separator */}
        <div className="relative flex items-center my-2">
          <div className="absolute -left-[18px] w-9 h-9 rounded-full bg-zinc-50 border-4 border-black" />
          <div className="flex-1 border-t-[3px] border-dashed border-black mx-5" />
          <div className="absolute -right-[18px] w-9 h-9 rounded-full bg-zinc-50 border-4 border-black" />
        </div>

        {/* QR — always visible, no tap needed */}
        <div className="px-5 py-5 flex flex-col items-center gap-3">
          <p className="text-xs tracking-[0.3em] text-zinc-400 uppercase self-start">
            Código de acceso
          </p>
          <TicketQr qrHash={ticket.qr_hash} size={200} />
          <p className="text-base text-zinc-400 tracking-widest uppercase">
            Muestra al staff en la entrada
          </p>
        </div>
      </div>

      {/* Navigation — only shown with multiple tickets */}
      {total > 1 && (
        <div className={`flex items-center gap-4 ${vt323.className}`}>
          <button
            onClick={() => setIndex(i => i - 1)}
            disabled={index === 0}
            className="w-10 h-10 border-2 border-black flex items-center justify-center disabled:opacity-30 hover:bg-black hover:text-amber-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            {tickets.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-2.5 h-2.5 rounded-full border-2 border-black transition-colors ${
                  i === index ? 'bg-black' : 'bg-transparent'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setIndex(i => i + 1)}
            disabled={index === total - 1}
            className="w-10 h-10 border-2 border-black flex items-center justify-center disabled:opacity-30 hover:bg-black hover:text-amber-50 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {total > 1 && (
        <p className={`text-sm text-zinc-400 tracking-widest uppercase ${vt323.className}`}>
          Boleto {index + 1} de {total}
        </p>
      )}
    </div>
  )
}
