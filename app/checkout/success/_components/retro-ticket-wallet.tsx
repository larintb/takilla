'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import DigitalTicket from '@/components/digital-ticket'

type TicketData = {
  id: string
  displayNumber: string
  qr_hash: string
  eventTitle: string
  eventDate: string | null
  locationName: string | null
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

      <DigitalTicket
        id={ticket.id}
        displayNumber={ticket.displayNumber}
        qr_hash={ticket.qr_hash}
        eventTitle={ticket.eventTitle}
        eventDate={date}
        locationName={ticket.locationName}
        venueName={ticket.venueName}
        venueCity={ticket.venueCity}
        tierName={ticket.tierName}
        featuredTier
        maxWidth="100%"
      />

      {/* Navigation (multi-ticket) */}
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
