import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { Search, Ticket, QrCode, ShieldCheck, Zap } from 'lucide-react'
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


type VenueInfo  = { name?: string | null; city?: string | null }
type TierPrice  = { price: number | string }

export default async function Home() {
  const cookieStore = await cookies()
  const supabase    = createClient(cookieStore)

  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const cutoff    = yesterday.toISOString()

  const [, { data: events }] = await Promise.all([
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
    <div className="min-h-screen flex flex-col">

      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* DomeGallery — fondo sutil */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ opacity: 0.25 }}>
          <DomeGallery
            images={domeImages}
            fit={1.2}
            minRadius={750}
            segments={30}
            maxVerticalRotationDeg={0}
            dragDampening={8}
            grayscale={false}
            overlayBlurColor="#0a0a0a"
            autoRotateSpeed={0.4}
          />
        </div>
        {/* Overlay: funde el dome hacia el fondo */}
        <div className="absolute inset-0 z-1 pointer-events-none bg-linear-to-b from-transparent via-black/20 to-black" />

        {/* Contenido del hero */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-8 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold uppercase leading-tight tracking-tight">
            ¿Qué hay<br className="md:hidden" /> en tu ciudad?
          </h1>
          <p className="mt-2 text-lg" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Descubre eventos cerca de ti.
          </p>

          {/* Search bar */}
          <div className="mt-6 relative group max-w-xl">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-pink-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar eventos, artistas, lugares..."
              className="w-full rounded-full py-4 pl-12 pr-6 outline-none transition-all focus:ring-2 focus:ring-pink-500/50"
              style={{ background: '#1a1a1a', color: '#f4f1ff' }}
            />
          </div>
        </div>
      </section>

      {/* ── Eventos destacados (carrusel) ─────────────────────────────────── */}
      {activeEvents.length > 0 && (
        <section className="mt-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="max-w-6xl mx-auto px-6 flex items-end justify-between mb-5">
            <h2 className="text-xl font-bold text-white">Eventos destacados</h2>
            <Link
              href="/events"
              className="text-sm font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-pink)' }}
            >
              Ver todo
            </Link>
          </div>

          {/* Carrusel horizontal — scroll full-bleed en mobile */}
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 px-6 max-w-6xl mx-auto md:px-6">
            {activeEvents.map((event) => {
              const venue    = (event.venues ?? null) as VenueInfo | null
              const tiers    = (event.ticket_tiers ?? []) as TierPrice[]
              const prices   = tiers.map(t => Number(t.price))
              const minPrice = prices.length ? Math.min(...prices) : null
              const imageUrl = resolveEventImageUrl(supabase, event.image_url)
              const catLabel = event.category && event.category !== 'otro'
                ? CATEGORY_LABELS[event.category]
                : null
              const dateStr = new Date(event.event_date).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'short', timeZone: 'UTC',
              }).toUpperCase() + ', ' + new Date(event.event_date).toLocaleTimeString('es-MX', {
                hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC',
              }).toUpperCase()

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex-none w-56 snap-center group cursor-pointer"
                >
                  {/* Card imagen */}
                  <div className="relative aspect-[7/5] rounded-3xl overflow-hidden shadow-xl">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={event.title}
                        fill
                        unoptimized
                        sizes="224px"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: '#1a1a1a' }}>
                        <Ticket size={32} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      </div>
                    )}
                    {/* Bottom overlay for chip legibility */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                    {/* Categoría chip */}
                    {catLabel && (
                      <div className="absolute inset-0 p-3 flex flex-col justify-end">
                        <span
                          className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit text-white"
                          style={{ background: 'var(--accent-gradient)' }}
                        >
                          {catLabel}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Info debajo */}
                  <div className="mt-3 space-y-0.5">
                    <h3
                      className="text-sm font-bold leading-snug line-clamp-2 group-hover:opacity-80 transition-opacity"
                      style={{ color: '#f4f1ff' }}
                    >
                      {event.title}
                    </h3>
                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {dateStr}
                    </p>
                    {venue?.name && (
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {venue.name}
                      </p>
                    )}
                    {minPrice !== null && (
                      <p
                        className="text-xs font-bold pt-1"
                        style={{
                          background: 'var(--accent-gradient)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {minPrice === 0 ? 'FREE' : `Desde $${minPrice.toFixed(2)}`}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Pagination dots decorativos */}
          <div className="flex justify-center gap-2 mt-1">
            <div className="h-1.5 w-4 rounded-full" style={{ background: 'var(--color-pink)' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
            <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
          </div>
        </section>
      )}

      {/* ── Categorías ──────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-4 w-full animate-fade-in-up" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center gap-3 mb-5">
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
                border:     '1px solid rgba(255,255,255,0.08)',
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

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section
        className="mt-auto"
        style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16">
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
                  border:     '1px solid rgba(255,255,255,0.08)',
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
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Organizer CTA ───────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:   'rgba(249,115,22,0.06)',
          borderTop:    '1px solid rgba(249,115,22,0.15)',
          borderBottom: '1px solid rgba(249,115,22,0.15)',
        }}
      >
        <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-6">
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

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="py-6">
        <div
          className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <span
            className="font-semibold"
            style={{
              background:           'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor:  'transparent',
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
