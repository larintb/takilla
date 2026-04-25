import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { Ticket, CalendarDays, MapPin, QrCode, ShieldCheck, Zap } from 'lucide-react'
import Navbar from '@/components/navbar'
import { isEventOver } from '@/utils/event-time'
import DomeGallery from '@/components/dome-gallery'

const DOME_STOCK = [
  { src: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&auto=format&fit=crop', alt: 'Concert' },
  { src: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&auto=format&fit=crop', alt: 'Festival' },
  { src: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&auto=format&fit=crop', alt: 'Event' },
  { src: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop', alt: 'Music' },
  { src: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&auto=format&fit=crop', alt: 'DJ' },
  { src: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop', alt: 'Stage' },
  { src: 'https://images.unsplash.com/photo-1549213783-8284d0336c4f?w=600&auto=format&fit=crop', alt: 'Crowd' },
  { src: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&auto=format&fit=crop', alt: 'Live music' },
]

const CATEGORY_LABELS: Record<string, string> = {
  musica:   'Música',
  arte:     'Arte',
  social:   'Evento social',
  nocturna: 'Vida nocturna',
}

type VenueInfo = {
  name?: string | null
  city?: string | null
}

type TierPrice = {
  price: number | string
}

export default async function Home() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const cutoff = yesterday.toISOString()
  const [{ data: { user } }, { data: events }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('events').select(`
      id, title, event_date, event_end_date, image_url, category,
      venues(name, city),
      ticket_tiers(price)
    `).eq('status', 'published').gt('event_date', cutoff).order('event_date', { ascending: true }).limit(12),
  ])

  const activeEvents = (events ?? []).filter(e => !isEventOver(e.event_date, e.event_end_date)).slice(0, 6)

  const eventDomeImages = activeEvents
    .filter(e => !!e.image_url)
    .slice(0, 2)
    .map(e => ({ src: resolveEventImageUrl(supabase, e.image_url)!, alt: e.title }))
    .filter(e => !!e.src)

  const domeImages = [...eventDomeImages, ...DOME_STOCK.slice(eventDomeImages.length)]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>

      <Navbar />

      {/* Hero */}
      <section
        className="relative text-white animate-fade-in overflow-hidden"
        style={{ background: 'var(--hero-gradient)' }}
      >
        {/* Dome gallery background */}
        <div className="absolute inset-0 z-0" style={{ opacity: 0.45 }}>
          <DomeGallery
            images={domeImages}
            fit={1.2}
            minRadius={750}
            segments={30}
            maxVerticalRotationDeg={0}
            dragDampening={2}
            grayscale={false}
            overlayBlurColor="#140a2a"
            autoRotateSpeed={0.6}
          />
        </div>
        <div className="max-w-6xl mx-auto px-4 py-24 text-center space-y-6 relative z-10">
          <h1
            className="font-display text-6xl md:text-7xl leading-none max-w-3xl mx-auto animate-fade-in-up"
            style={{ animationDelay: '160ms' }}
          >
            Los mejores eventos de tu ciudad en un lugar.
          </h1>
          <p
            className="text-lg max-w-xl mx-auto animate-fade-in-up"
            style={{ color: 'rgba(255,255,255,0.55)', animationDelay: '240ms' }}
          >
            Adquiere boletos para conciertos, festivales y eventos locales.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
            <Link
              href="/events"
              className="px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent-gradient)' }}
            >
              Ver eventos
            </Link>
            {!user && (
              <Link
                href="/signup"
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.2)' }}
              >
                Crear cuenta gratis
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 pt-14 pb-4 w-full animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-3 mb-7">
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full text-white"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Categoría
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Música',        img: '/images/musica.2.png',        value: 'musica'   },
            { label: 'Arte',          img: '/images/arte.2.png',          value: 'arte'     },
            { label: 'Evento social', img: '/images/evento social.png',   value: 'social'   },
            { label: 'Vida nocturna', img: '/images/vida nocturna.2.png', value: 'nocturna' },
          ].map(cat => (
            <Link
              key={cat.label}
              href={`/events?category=${cat.value}`}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-all group"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Image
                src={cat.img}
                alt={cat.label}
                width={56}
                height={56}
                className="group-hover:scale-110 transition-transform duration-200 brightness-0 invert"
              />
              <span
                className="text-sm font-medium text-center transition-colors group-hover:text-white"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming events */}
      {activeEvents.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16 space-y-6 w-full animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Próximos eventos</h2>
            <Link
              href="/events"
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: 'var(--color-orange)' }}
            >
              Ver todos →
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeEvents.map((event, i) => {
              const venue    = (event.venues ?? null) as VenueInfo | null
              const tiers    = (event.ticket_tiers ?? []) as TierPrice[]
              const prices   = tiers?.map(t => Number(t.price)) ?? []
              const minPrice = prices.length ? Math.min(...prices) : null
              const imageUrl = resolveEventImageUrl(supabase, event.image_url)
              const catLabel = event.category && event.category !== 'otro'
                ? CATEGORY_LABELS[event.category]
                : null

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl animate-fade-in-up flex flex-col"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <div
                    className="relative h-44 overflow-hidden shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={event.title}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Ticket size={32} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      </div>
                    )}
                    {/* Category badge */}
                    {catLabel && (
                      <span
                        className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm text-white"
                        style={{ background: 'var(--accent-gradient)' }}
                      >
                        {catLabel}
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <p className="font-semibold text-white leading-snug line-clamp-2 group-hover:opacity-85 transition-opacity">
                      {event.title}
                    </p>
                    <div className="space-y-1 text-sm flex-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      <p className="flex items-center gap-1.5">
                        <CalendarDays size={13} className="shrink-0" style={{ color: 'var(--color-pink)' }} />
                        {new Date(event.event_date).toLocaleDateString('es-MX', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                      {venue?.name && (
                        <p className="flex items-center gap-1.5">
                          <MapPin size={13} className="shrink-0" style={{ color: 'var(--color-pink)' }} />
                          {venue.name}, {venue.city}
                        </p>
                      )}
                    </div>
                    <div className="pt-2 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <p
                        className="text-sm font-bold"
                        style={{
                          background: 'var(--accent-gradient)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {minPrice === null ? 'Sin tiers' : minPrice === 0 ? 'FREE' : `Desde $${minPrice.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Features */}
      <section
        className="mt-auto"
        style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="font-display text-4xl text-white text-center mb-10 animate-fade-in-up">
            Todo lo que necesitas en un solo lugar
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: <Zap size={22} />,        title: 'Adquiere en segundos', desc: 'Selecciona tu tier, paga y recibe tu boleto digital al instante.',      delay: 0   },
              { icon: <QrCode size={22} />,      title: 'Entrada con QR',       desc: 'El staff escanea tu QR desde el teléfono. Sin filas, sin papeles.',     delay: 100 },
              { icon: <ShieldCheck size={22} />, title: 'Validación segura',    desc: 'Cada boleto es único e irrepetible. Imposible usar el mismo dos veces.', delay: 200 },
            ].map(f => (
              <div
                key={f.title}
                className="rounded-2xl p-6 space-y-3 animate-fade-in-up"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  animationDelay: `${f.delay}ms`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  {f.icon}
                </div>
                <p className="font-semibold text-white">{f.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Organizer CTA */}
      <section className="relative overflow-hidden" style={{ background: 'rgba(249,115,22,0.06)', borderTop: '1px solid rgba(249,115,22,0.15)', borderBottom: '1px solid rgba(249,115,22,0.15)' }}>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full text-white inline-block"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Organizadores
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-white leading-tight">
            ¿Tienes un evento?<br />Véndelo en Takilla.
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Publica eventos gratuitos al instante o cobra por tus boletos con Stripe Connect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/convertirse-organizador"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 28px rgba(249,115,22,0.3)' }}
            >
              Aplicar como organizador
              <Zap size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="py-6">
        <div
          className="max-w-6xl mx-auto px-4 flex items-center justify-between text-sm"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <span
            className="font-semibold"
            style={{
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Takilla
          </span>
          <p>Boletos para tu ciudad</p>
        </div>
      </footer>

    </div>
  )
}