'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Ticket, CalendarDays, MapPin, X,
  ChevronLeft, ChevronRight, FileSearch,
} from 'lucide-react'
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
  const [selected, setSelected] = useState<EventGroup | null>(null)
  const [ticketIndex, setTicketIndex] = useState(0)

  const openWallet = (group: EventGroup) => {
    setTicketIndex(0)
    setSelected(group)
  }

  const closeWallet = () => setSelected(null)

  if (eventGroups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-16 text-center animate-fade-in-up">
        <Ticket size={40} className="mx-auto text-zinc-300 mb-3" />
        <p className="font-semibold text-zinc-700">No tienes boletos aún</p>
        <p className="text-sm text-zinc-400 mt-1">Explora los eventos disponibles y compra tus boletos</p>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <FileSearch size={15} />
          Ver eventos
        </Link>
      </div>
    )
  }

  const ticket = selected?.tickets[ticketIndex]
  const total = selected?.tickets.length ?? 0

  return (
    <>
      {/* ── Event list ── */}
      <div className="space-y-3">
        {eventGroups.map((group, i) => {
          const { eventData } = group
          const isPast = new Date(group.eventDate) < new Date()

          return (
            <button
              key={group.eventDate + eventData.title}
              onClick={() => openWallet(group)}
              className="w-full text-left flex items-center gap-4 bg-white border border-zinc-200 rounded-2xl p-4 hover:border-zinc-400 hover:shadow-sm transition-all animate-fade-in-up group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Thumbnail */}
              <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-100">
                {eventData.imageUrl ? (
                  <Image
                    src={eventData.imageUrl}
                    alt={eventData.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-400 to-red-600 flex items-center justify-center">
                    <Ticket size={22} className="text-white/60" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-bold text-zinc-900 leading-snug truncate group-hover:text-zinc-700 transition-colors">
                  {eventData.title}
                </p>
                <p className="text-sm text-zinc-500 flex items-center gap-1.5 capitalize">
                  <CalendarDays size={12} />
                  {eventData.date}
                </p>
                {eventData.venueName && (
                  <p className="text-sm text-zinc-500 flex items-center gap-1.5 truncate">
                    <MapPin size={12} />
                    {eventData.venueName}{eventData.venueCity ? `, ${eventData.venueCity}` : ''}
                  </p>
                )}
              </div>

              {/* Right badges */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
                  {eventData.totalCount} boleto{eventData.totalCount !== 1 ? 's' : ''}
                </span>
                {isPast ? (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-400">
                    Pasado
                  </span>
                ) : eventData.validCount > 0 ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                    {eventData.validCount} válido{eventData.validCount !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-400">
                    Usados
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Wallet overlay — always fits screen, no scroll ── */}
      {selected && ticket && (() => {
        const isExpired = new Date(selected.eventDate) < new Date()
        return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" style={{ height: '100dvh' }}>

          {/* Top bar: title (left) + close (right) */}
          <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-2">
            <span className={`text-sm text-white/50 tracking-widest uppercase ${vt323.className}`}>
              {isExpired ? 'Evento terminado' : '★ TAKILLA ★'}
            </span>
            <button
              onClick={closeWallet}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Ticket card — fills remaining space, vertically centered */}
          <div className="flex-1 min-h-0 flex items-center justify-center px-4">
            <div className={`w-full max-w-xs border-4 ${isExpired ? 'border-zinc-500' : 'border-black'} bg-amber-50 ${isExpired ? 'shadow-[6px_6px_0_0_#71717a]' : 'shadow-[6px_6px_0_0_#000]'} ${vt323.className}`}>

              {/* Expired banner */}
              {isExpired && (
                <div className="bg-zinc-700 text-zinc-300 px-4 py-1.5 text-center text-sm tracking-[0.3em] uppercase">
                  Este evento ya terminó
                </div>
              )}

              {/* Header — brand gradient or muted if expired */}
              <div className={`${isExpired ? 'bg-zinc-600' : 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-600'} text-white px-4 py-2.5 flex items-center justify-between`}>
                <span
                  className="text-xl tracking-[0.3em] uppercase"
                  style={isExpired ? undefined : { textShadow: '1px 1px 0 #c2410c, 2px 2px 0 #9a3412, 3px 3px 6px rgba(0,0,0,0.35)' }}
                >
                  ★ TAKILLA ★
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg tracking-widest opacity-80">
                    #{ticketDisplayNumber(ticket.id)}
                  </span>
                  {ticket.is_used && (
                    <span className="text-[10px] bg-black/30 px-1.5 py-0.5 uppercase tracking-wider rounded-sm">
                      Usado
                    </span>
                  )}
                </div>
              </div>

              {/* Event info — compact */}
              <div className="px-4 pt-3 pb-2 space-y-1">
                <p className="text-2xl text-zinc-900 uppercase tracking-wide leading-snug line-clamp-2">
                  {selected.eventData.title}
                </p>
                <p className="text-base text-zinc-600 flex items-center gap-1.5 capitalize">
                  <CalendarDays size={12} />
                  {selected.eventData.date}
                </p>
                {selected.eventData.venueName && (
                  <p className="text-base text-zinc-600 flex items-center gap-1.5 truncate">
                    <MapPin size={12} />
                    {selected.eventData.venueName}
                    {selected.eventData.venueCity ? ` — ${selected.eventData.venueCity}` : ''}
                  </p>
                )}
                <p className="text-base uppercase text-zinc-700">
                  {ticket.tierName}
                  {ticket.price > 0 && (
                    <span className="ml-2 text-zinc-400">· ${ticket.price.toFixed(2)}</span>
                  )}
                </p>
              </div>

              {/* Dashed separator */}
              <div className="relative flex items-center my-1.5">
                <div className="absolute -left-[16px] w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 border-4 border-black" />
                <div className="flex-1 border-t-[3px] border-dashed border-orange-400 mx-4" />
                <div className="absolute -right-[16px] w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 border-4 border-black" />
              </div>

              {/* QR */}
              <div className={`px-4 py-3 flex flex-col items-center gap-1.5 ${isExpired || ticket.is_used ? 'opacity-40' : ''}`}>
                <p className="text-[10px] tracking-[0.3em] text-zinc-400 uppercase self-start">
                  Código de acceso
                </p>
                <TicketQr qrHash={ticket.qr_hash} size={170} />
                <p className={`text-sm tracking-widest uppercase ${isExpired || ticket.is_used ? 'text-zinc-400' : 'text-orange-400'}`}>
                  {isExpired ? 'Evento finalizado' : ticket.is_used ? 'Ya utilizado' : 'Muestra al staff en la entrada'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation — arrows + "1 / N" counter */}
          {total > 1 && (
            <div className={`shrink-0 flex items-center justify-center gap-6 px-4 py-4 ${vt323.className}`}>
              <button
                onClick={() => setTicketIndex(i => i - 1)}
                disabled={ticketIndex === 0}
                className="w-12 h-12 border-2 border-white/40 text-white flex items-center justify-center disabled:opacity-30 hover:bg-white/10 active:bg-white/20 transition-colors rounded"
              >
                <ChevronLeft size={24} />
              </button>

              <span className="text-2xl text-white tracking-widest min-w-[4rem] text-center">
                {ticketIndex + 1} / {total}
              </span>

              <button
                onClick={() => setTicketIndex(i => i + 1)}
                disabled={ticketIndex === total - 1}
                className="w-12 h-12 border-2 border-white/40 text-white flex items-center justify-center disabled:opacity-30 hover:bg-white/10 active:bg-white/20 transition-colors rounded"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}

          {/* Safe area bottom */}
          <div className="shrink-0 h-4" />
        </div>
        )
      })()}
    </>
  )
}
