import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { CalendarDays, Ticket, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import PerksCheckoutClient from './_components/perks-checkout-client'

type PerksCheckoutPageProps = {
  searchParams: Promise<{ eventId?: string; perks?: string }>
}

export default async function PerksCheckoutPage({ searchParams }: PerksCheckoutPageProps) {
  const { eventId, perks: perksCsv } = await searchParams
  if (!eventId?.trim()) redirect('/events')
  // Parse pre-selected perk IDs (with repetitions for quantity) from URL
  const initialPerkIds = perksCsv ? perksCsv.split(',').map(s => s.trim()).filter(Boolean) : []

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/checkout/perks?eventId=${eventId}`)

  const [{ data: event }, { data: hasTicket }, { data: perks }] = await Promise.all([
    supabase.from('events').select('id, title, status, event_date, image_url').eq('id', eventId).eq('status', 'published').single(),
    supabase.from('tickets').select('id').eq('owner_id', user.id).eq('event_id', eventId).limit(1).single(),
    supabase.from('perks').select('id, name, price, description, image_url').eq('event_id', eventId).order('price'),
  ])

  if (!event) redirect('/events')
  if (!hasTicket) redirect(`/events/${eventId}`)
  if (!perks || perks.length === 0) redirect(`/events/${eventId}`)

  const imageUrl = resolveEventImageUrl(supabase, event.image_url ?? null)
  const dateFormatted = new Date(event.event_date).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <main className="flex-1 flex items-start justify-center px-4 py-6 pb-24 md:pb-10">
      <div className="w-full max-w-md space-y-4 animate-fade-in-up">

        {/* Back button */}
        <div className="relative mb-2">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <ArrowLeft size={14} />
            Mis boletos
          </Link>
        </div>

        {/* Event summary card */}
        <div className="rounded-2xl overflow-hidden p-4 flex gap-3"
          style={{ background: 'var(--background)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            {imageUrl ? (
              <Image src={imageUrl} alt={event.title} fill unoptimized sizes="64px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Ticket size={24} style={{ color: 'rgba(255,255,255,0.2)' }} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm leading-tight line-clamp-1">{event.title}</p>
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <CalendarDays size={11} />
              {dateFormatted}
            </p>
          </div>
        </div>

        <PerksCheckoutClient
          eventId={eventId}
          eventTitle={event.title}
          initialPerkIds={initialPerkIds}
          perks={perks.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            description: p.description ?? null,
            imageUrl: p.image_url ? resolveEventImageUrl(supabase, p.image_url) : null,
          }))}
        />
      </div>
    </main>
  )
}
