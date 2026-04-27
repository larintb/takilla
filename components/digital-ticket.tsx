'use client'

import { CalendarDays, MapPin } from 'lucide-react'
import TicketQr from '@/app/tickets/_components/ticket-qr'

function computeDisplayNumber(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8)
  return String((parseInt(hex, 16) % 9000) + 1000)
}

export type DigitalTicketProps = {
  id: string
  displayNumber?: string
  qr_hash: string
  eventTitle: string
  eventDate: string | null
  locationName?: string | null
  venueName?: string | null
  venueCity?: string | null
  tierName?: string | null
  isUsed?: boolean
  isPast?: boolean
  maxWidth?: string
  featuredTier?: boolean
}

export default function DigitalTicket({
  id,
  displayNumber,
  qr_hash,
  eventTitle,
  eventDate,
  locationName,
  venueName,
  venueCity,
  tierName,
  isUsed = false,
  isPast = false,
  maxWidth = '320px',
  featuredTier = false,
}: DigitalTicketProps) {
  const number = displayNumber ?? computeDisplayNumber(id)
  const dimmed = isPast || isUsed

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl shadow-2xl mx-auto"
      style={{
        aspectRatio: '370 / 760',
        maxWidth,
        backgroundImage: 'url(/boleto_digital.png)',
        backgroundSize: '100% auto',
        backgroundPosition: 'top center',
        backgroundColor: '#ffffff',
        backgroundRepeat: 'no-repeat',
        opacity: dimmed ? 0.65 : 1,
      }}
    >
      {/* Top zone - colorful area */}
      <div
        className="absolute top-0 left-0 right-0 px-5 pt-4 pb-4 flex flex-col overflow-hidden"
        style={{ height: '63%' }}
      >
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-white text-[10px] font-bold tracking-[0.3em] uppercase drop-shadow">
            TAKILLA
          </span>
          <div className="flex items-center gap-2">
            {dimmed && (
              <span className="text-[9px] bg-black/40 text-white/70 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {isPast ? 'Finalizado' : 'Usado'}
              </span>
            )}
            <span className="text-white/50 text-[10px] font-mono drop-shadow">
              #{number}
            </span>
          </div>
        </div>

        <h2
          className="text-white font-black leading-none drop-shadow-md mb-3 shrink-0 line-clamp-2"
          style={{ fontSize: 'clamp(1.7rem, 9vw, 2.4rem)' }}
        >
          {eventTitle}
        </h2>

        {eventDate && (
          <p className="text-white/80 text-xs flex items-center gap-1.5 capitalize drop-shadow mb-1.5 shrink-0">
            <CalendarDays size={11} />
            {eventDate}
          </p>
        )}

        {(locationName || venueName) && (
          <p className="text-white/80 text-xs flex items-center gap-1.5 drop-shadow mb-1.5 shrink-0">
            <MapPin size={11} className="shrink-0" />
            <span className="line-clamp-2">
              {locationName ?? `${venueName}${venueCity ? `, ${venueCity}` : ''}`}
            </span>
          </p>
        )}

        {tierName && (
          <div className={`flex flex-col items-center shrink-0 w-full text-center ${featuredTier ? 'mt-24' : 'mt-12'}`}>
            <span
              className="text-white/40 font-semibold uppercase tracking-widest drop-shadow"
              style={{ fontSize: featuredTier ? '36px' : '24px' }}
            >
              Tier
            </span>
            <span
              className="text-white font-black uppercase leading-none drop-shadow-md"
              style={{ fontSize: featuredTier ? '72px' : '48px' }}
            >
              {tierName}
            </span>
          </div>
        )}
      </div>

      {/* Dashed tear line */}
      <div className="absolute left-0 right-0 flex items-center" style={{ top: '54%' }}>
        <div className="absolute -left-3 w-6 h-6 rounded-full bg-black/50" />
        <div className="flex-1 border-t-2 border-dashed border-black/15 mx-5" />
        <div className="absolute -right-3 w-6 h-6 rounded-full bg-black/50" />
      </div>

      {/* Bottom zone - white area: QR */}
      <div
        className={`absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center gap-1 pb-3 pt-4 ${isUsed ? 'opacity-40' : ''}`}
        style={{ top: '55%' }}
      >
        <div className="bg-white p-2.5 rounded-xl shadow-sm">
          <TicketQr qrHash={qr_hash} size={250} />
        </div>
        <p className="text-[10px] text-zinc-800 text-center">
          {isPast ? 'Evento finalizado' : isUsed ? 'Ya utilizado' : 'Muestra al staff en la entrada'}
        </p>
      </div>
    </div>
  )
}
