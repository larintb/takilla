'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Ticket, CalendarDays, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react'
import DigitalTicket from '@/components/digital-ticket'

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

export default function EventTicketCard({ event, tickets }: Props) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const ticket = tickets[index]
  const total = tickets.length

  return (
    <>
      {/* Event card - one tap to open wallet */}
      <button
        onClick={() => { setIndex(0); setOpen(true) }}
        className="w-full text-left group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-400 hover:shadow-md transition-all"
      >
        {/* Image banner */}
        <div className="relative h-36 bg-zinc-100 overflow-hidden">
          {event.imageUrl ? (
            <>
              <Image src={event.imageUrl} alt="" fill unoptimized aria-hidden className="object-cover scale-110 blur-xl opacity-50" />
              <Image src={event.imageUrl} alt={event.title} fill unoptimized className="object-contain" />
            </>
          ) : (
            <div className="w-full h-full bg-linear-to-r from-orange-500 via-pink-500 to-purple-700 flex items-center justify-center">
              <Ticket size={28} className="text-white/40" />
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
              {total} boleto{total !== 1 ? 's' : ''}
            </span>
            {event.validCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-green-500/80 backdrop-blur-sm text-white text-xs font-semibold">
                {event.validCount} valido{event.validCount !== 1 ? 's' : ''}
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
          <p className="text-xs text-zinc-400 pt-1">Toca para ver tus boletos &rarr;</p>
        </div>
      </button>

      {/* Fullscreen ticket wallet */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4 gap-5">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X size={20} />
          </button>

          <div className="w-full max-w-xs">
            <DigitalTicket
              id={ticket.id}
              qr_hash={ticket.qr_hash}
              eventTitle={event.title}
              eventDate={event.date}
              venueName={event.venueName}
              venueCity={event.venueCity}
              tierName={ticket.tierName}
              isUsed={ticket.is_used}
              maxWidth="100%"
            />
          </div>

          {total > 1 && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIndex(i => i - 1)}
                disabled={index === 0}
                className="w-10 h-10 border-2 border-white/40 text-white flex items-center justify-center disabled:opacity-30 hover:bg-white/10 transition-colors rounded-full"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                {tickets.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full border-2 border-white transition-colors ${i === index ? 'bg-white' : 'bg-transparent'}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setIndex(i => i + 1)}
                disabled={index === total - 1}
                className="w-10 h-10 border-2 border-white/40 text-white flex items-center justify-center disabled:opacity-30 hover:bg-white/10 transition-colors rounded-full"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {total > 1 && (
            <p className="text-sm text-white/50 tracking-widest uppercase">
              Boleto {index + 1} de {total}
            </p>
          )}
        </div>
      )}
    </>
  )
}
