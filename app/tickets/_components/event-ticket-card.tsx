'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Ticket, CalendarDays, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { VT323 } from 'next/font/google'
import TicketQr from './ticket-qr'

const vt323 = VT323({ weight: '400', subsets: ['latin'] })

type TicketItem = {
  id: string
  qr_hash: string
  is_used: boolean
  tierName: string
  price: number
  index: number
}

type Props = {
  event: {
    title: string
    date: string
    venueName: string | null
    venueCity: string | null
    imageUrl: string | null
    totalCount: number
    validCount: number
  }
  tickets: TicketItem[]
}

function ticketDisplayNumber(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8)
  const num = (parseInt(hex, 16) % 9000) + 1000
  return String(num)
}

export default function EventTicketCard({ event, tickets }: Props) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const ticket = tickets[index]
  const total = tickets.length

  return (
    <>
      {/* Event card — one tap to open wallet */}
      <button
        onClick={() => { setIndex(0); setOpen(true) }}
        className="w-full text-left group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-400 hover:shadow-md transition-all"
      >
        {/* Image banner */}
        <div className="relative h-36 bg-zinc-100 overflow-hidden">
          {event.imageUrl ? (
            <>
              <Image
                src={event.imageUrl}
                alt=""
                fill
                unoptimized
                aria-hidden
                className="object-cover scale-110 blur-xl opacity-50"
              />
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                unoptimized
                className="object-contain"
              />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 flex items-center justify-center">
              <Ticket size={28} className="text-white/40" />
            </div>
          )}

          {/* Ticket count badge */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
              {total} boleto{total !== 1 ? 's' : ''}
            </span>
            {event.validCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-green-500/80 backdrop-blur-sm text-white text-xs font-semibold">
                {event.validCount} válido{event.validCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-1.5">
          <p className="font-bold text-zinc-900 text-base leading-snug group-hover:text-zinc-700 transition-colors">
            {event.title}
          </p>
          <div className="space-y-1 text-sm text-zinc-500">
            <p className="flex items-center gap-1.5 capitalize">
              <CalendarDays size={13} />
              {event.date}
            </p>
            {event.venueName && (
              <p className="flex items-center gap-1.5">
                <MapPin size={13} />
                {event.venueName}{event.venueCity ? `, ${event.venueCity}` : ''}
              </p>
            )}
          </div>
          <p className="text-xs text-zinc-400 pt-1">Toca para ver tus boletos →</p>
        </div>
      </button>

      {/* Fullscreen retro wallet */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4 gap-5">

          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X size={20} />
          </button>

          {/* Retro ticket */}
          <div className={`w-full max-w-sm border-4 border-black bg-amber-50 shadow-[8px_8px_0_0_#000] ${vt323.className}`}>

            {/* Header */}
            <div className="bg-black text-amber-50 px-5 py-2.5 flex items-center justify-between">
              <span className="text-2xl tracking-[0.3em] uppercase">★ TAKILLA ★</span>
              <div className="flex items-center gap-3">
                <span className="text-xl tracking-widest opacity-70">#{ticketDisplayNumber(ticket.id)}</span>
                {ticket.is_used && (
                  <span className="text-xs bg-zinc-600 text-zinc-300 px-2 py-0.5 uppercase tracking-wider">
                    Usado
                  </span>
                )}
              </div>
            </div>

            {/* Event info */}
            <div className="px-5 pt-4 pb-3 space-y-1.5">
              <p className="text-3xl text-zinc-900 uppercase tracking-wide leading-snug">
                {event.title}
              </p>
              <p className="text-lg text-zinc-600 flex items-center gap-1.5 capitalize">
                <CalendarDays size={14} />
                {event.date}
              </p>
              {event.venueName && (
                <p className="text-lg text-zinc-600 flex items-center gap-1.5">
                  <MapPin size={14} />
                  {event.venueName}{event.venueCity ? ` — ${event.venueCity}` : ''}
                </p>
              )}
              <p className="text-lg uppercase text-zinc-700">
                {ticket.tierName}
                {ticket.price > 0 && (
                  <span className="ml-2 text-zinc-400">· ${ticket.price.toFixed(2)}</span>
                )}
              </p>
            </div>

            {/* Dashed separator */}
            <div className="relative flex items-center my-2">
              <div className="absolute -left-[18px] w-9 h-9 rounded-full bg-zinc-800 border-4 border-black" />
              <div className="flex-1 border-t-[3px] border-dashed border-black mx-5" />
              <div className="absolute -right-[18px] w-9 h-9 rounded-full bg-zinc-800 border-4 border-black" />
            </div>

            {/* QR — always visible */}
            <div className={`px-5 py-5 flex flex-col items-center gap-2 ${ticket.is_used ? 'opacity-40' : ''}`}>
              <p className="text-xs tracking-[0.3em] text-zinc-400 uppercase self-start">
                Código de acceso
              </p>
              <TicketQr qrHash={ticket.qr_hash} size={200} />
              <p className="text-base text-zinc-400 tracking-widest uppercase">
                {ticket.is_used ? 'Este boleto ya fue usado' : 'Muestra al staff en la entrada'}
              </p>
            </div>
          </div>

          {/* Navigation — only when multiple tickets */}
          {total > 1 && (
            <div className={`flex items-center gap-4 ${vt323.className}`}>
              <button
                onClick={() => setIndex(i => i - 1)}
                disabled={index === 0}
                className="w-10 h-10 border-2 border-white/40 text-white flex items-center justify-center disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                {tickets.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full border-2 border-white transition-colors ${
                      i === index ? 'bg-white' : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setIndex(i => i + 1)}
                disabled={index === total - 1}
                className="w-10 h-10 border-2 border-white/40 text-white flex items-center justify-center disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {total > 1 && (
            <p className={`text-sm text-white/50 tracking-widest uppercase ${vt323.className}`}>
              Boleto {index + 1} de {total}
            </p>
          )}
        </div>
      )}
    </>
  )
}
