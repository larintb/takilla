import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl } from '@/utils/supabase/storage'
import { Ticket, CalendarDays, MapPin, QrCode, ShieldCheck, Zap } from 'lucide-react'
import Navbar from '@/components/navbar'
import LinkButton from '@/components/link-button'

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

  const [{ data: { user } }, { data: events }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('events').select(`
      id, title, event_date, image_url,
      venues(name, city),
      ticket_tiers(price)
    `).eq('status', 'published').gt('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(6),
  ])

  return (
    <div className="min-h-screen bg-white flex flex-col">

      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white animate-fade-in">
        <div className="max-w-6xl mx-auto px-4 py-24 text-center space-y-6">
          <p className="text-white/70 text-sm font-medium uppercase tracking-widest animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            Plataforma de boletos regional
          </p>
          <h1 className="font-display text-6xl md:text-7xl leading-none max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            Boletos para lo que pasa en tu ciudad
          </h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            Compra boletos para conciertos, festivales y eventos locales. Validación instantánea con QR.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
            <LinkButton
              href="/events"
              className="px-6 py-3 rounded-xl bg-white text-orange-600 font-semibold hover:bg-orange-50"
            >
              Ver eventos
            </LinkButton>
            {!user && (
              <LinkButton
                href="/signup"
                className="px-6 py-3 rounded-xl border border-white/40 text-white font-semibold hover:bg-white/10"
              >
                Crear cuenta gratis
              </LinkButton>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-4 w-full animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <h2 className="text-lg font-bold text-zinc-900 mb-5">Explora por categoría</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Música',        img: '/images/musica.2.png',        value: 'musica'   },
            { label: 'Arte',          img: '/images/arte.2.png',          value: 'arte'     },
            { label: 'Evento social', img: '/images/evento social.png',   value: 'social'   },
            { label: 'Vida nocturna', img: '/images/vida nocturna.2.png', value: 'nocturna' },
          ].map(cat => (
            <Link
              key={cat.label}
              href={`/events?category=${cat.value}`}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-zinc-100 hover:border-orange-200 hover:bg-orange-50/40 transition-all group"
            >
              <Image src={cat.img} alt={cat.label} width={64} height={64} className="group-hover:scale-105 transition-transform duration-200" />
              <span className="text-sm font-medium text-zinc-700 group-hover:text-orange-600 transition-colors">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming events */}
      {events && events.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16 space-y-8 w-full animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900">Próximos eventos</h2>
            <Link href="/events" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
              Ver todos →
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => {
              const venue  = (event.venues ?? null) as VenueInfo | null
              const tiers  = (event.ticket_tiers ?? []) as TierPrice[]
              const prices = tiers?.map(t => Number(t.price)) ?? []
              const minPrice = prices.length ? Math.min(...prices) : null
              const imageUrl = resolveEventImageUrl(supabase, event.image_url)

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group rounded-2xl border border-zinc-200 overflow-hidden hover:border-zinc-400 hover:shadow-sm transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="relative h-44 bg-zinc-100 overflow-hidden">
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
                        <Ticket size={32} className="text-zinc-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2 bg-white">
                    <p className="font-semibold text-zinc-900 leading-snug line-clamp-2 group-hover:text-zinc-600">
                      {event.title}
                    </p>
                    <div className="space-y-1 text-sm text-zinc-500">
                      <p className="flex items-center gap-1.5">
                        <CalendarDays size={13} />
                        {new Date(event.event_date).toLocaleDateString('es-MX', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                      {venue?.name && (
                        <p className="flex items-center gap-1.5">
                          <MapPin size={13} />
                          {venue.name}, {venue.city}
                        </p>
                      )}
                    </div>
                    <div className="pt-2 border-t border-zinc-100">
                      <p className="text-sm font-semibold text-zinc-900">
                        {minPrice === null ? 'Sin tiers' : minPrice === 0 ? 'Gratis' : `Desde $${minPrice.toFixed(2)}`}
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
      <section className="bg-zinc-50 border-t border-zinc-100 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="font-display text-4xl text-zinc-900 text-center mb-10 animate-fade-in-up">
            Todo lo que necesitas en un solo lugar
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <Zap size={22} />,
                title: 'Compra en segundos',
                desc: 'Selecciona tu tier, paga y recibe tu boleto digital al instante.',
                delay: 0,
              },
              {
                icon: <QrCode size={22} />,
                title: 'Entrada con QR',
                desc: 'El staff escanea tu QR desde el teléfono. Sin filas, sin papeles.',
                delay: 100,
              },
              {
                icon: <ShieldCheck size={22} />,
                title: 'Validación segura',
                desc: 'Cada boleto es único e irrepetible. Imposible usar el mismo dos veces.',
                delay: 200,
              },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-3 animate-fade-in-up" style={{ animationDelay: `${f.delay}ms` }}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-red-600 flex items-center justify-center text-white">
                  {f.icon}
                </div>
                <p className="font-semibold text-zinc-900">{f.title}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-sm text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent font-semibold">
              Takilla
            </span>
          </div>
          <p>Boletos para tu ciudad</p>
        </div>
      </footer>

    </div>
  )
}