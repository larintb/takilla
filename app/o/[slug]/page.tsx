import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { resolveEventImageUrl, resolveAvatarUrl, resolveReviewPhotoUrl } from '@/utils/supabase/storage'
import { CalendarDays, ArrowLeft, Star } from 'lucide-react'
import Avatar from '@/components/avatar'
import StarRating from '@/components/star-rating'
import ReviewsClient from './_components/reviews-client'

export default async function OrganizerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [
    { data: organizer },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, business_name, bio, avatar_url, public_slug')
      .eq('public_slug', slug)
      .eq('role', 'organizer')
      .single(),
    supabase.auth.getUser(),
  ])

  if (!organizer) notFound()

  const [{ data: events }, { data: reviews }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, event_date, image_url, status')
      .eq('organizer_id', organizer.id)
      .eq('status', 'published')
      .order('event_date', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, rating, comment, photo_url, show_ticket, created_at, reviewer_id, reviewer_display_name, tier_name, tier_effect, events!event_id(id, title, event_date)')
      .eq('organizer_id', organizer.id)
      .order('created_at', { ascending: false }),
  ])

  const now = new Date()
  const upcoming = (events ?? []).filter(e => new Date(e.event_date) >= now)
  const past     = (events ?? []).filter(e => new Date(e.event_date) < now)

  const avgRating = reviews?.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null

  const avatarUrl = resolveAvatarUrl(supabase, organizer.avatar_url)

  // Resolve review photo URLs
  const reviewsWithPhotos = (reviews ?? []).map(r => ({
    ...r,
    photoUrl: resolveReviewPhotoUrl(supabase, r.photo_url),
    isOwn: r.reviewer_id === user?.id,
    event: Array.isArray(r.events) ? r.events[0] : r.events,
  }))

  return (
    <div className="w-full min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-4xl mx-auto px-4 py-8">

        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <ArrowLeft size={14} />
          Explorar eventos
        </Link>

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-10">
          <Avatar name={organizer.business_name} src={avatarUrl} size={80} />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white break-words">{organizer.business_name}</h1>
            {organizer.bio && (
              <p className="text-sm mt-1 break-words" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {organizer.bio}
              </p>
            )}
            {avgRating !== null && (
              <div className="flex items-center gap-2 mt-2">
                <StarRating value={Math.round(avgRating)} />
                <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {avgRating.toFixed(1)} · {reviews?.length} reseña{reviews?.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Events ─────────────────────────────────────────────────── */}
        {(events?.length ?? 0) > 0 && (
          <section className="mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Eventos
            </h2>
            {upcoming.length > 0 && (
              <div className="space-y-2 mb-4">
                {upcoming.map(ev => <EventCard key={ev.id} event={ev} supabase={supabase} />)}
              </div>
            )}
            {past.length > 0 && (
              <>
                {upcoming.length > 0 && (
                  <p className="text-xs font-semibold uppercase tracking-widest mt-6 mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Pasados
                  </p>
                )}
                <div className="space-y-2 opacity-60">
                  {past.map(ev => <EventCard key={ev.id} event={ev} supabase={supabase} />)}
                </div>
              </>
            )}
          </section>
        )}

        {/* ── Reviews ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Reseñas
            </h2>
            {user && (
              <Link
                href={`/o/${slug}/resenas/nueva`}
                className="text-sm font-semibold px-4 py-1.5 rounded-xl transition-opacity hover:opacity-80"
                style={{ background: 'var(--accent-gradient)', color: '#fff' }}
              >
                + Dejar reseña
              </Link>
            )}
          </div>

          {reviewsWithPhotos.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Star size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.12)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Aún no hay reseñas para este organizador.</p>
              {user && (
                <Link href={`/o/${slug}/resenas/nueva`} className="inline-block mt-3 text-sm font-semibold" style={{ color: 'var(--color-orange)' }}>
                  Sé el primero →
                </Link>
              )}
            </div>
          ) : (
            <ReviewsClient reviews={reviewsWithPhotos} />
          )}
        </section>
      </div>
    </div>
  )
}

function EventCard({ event, supabase }: { event: { id: string; title: string; event_date: string; image_url: string | null }; supabase: ReturnType<typeof createClient> }) {
  const dateStr = new Date(event.event_date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const imageUrl = resolveEventImageUrl(supabase as Parameters<typeof resolveEventImageUrl>[0], event.image_url)

  return (
    <Link
      href={`/events/${event.id}`}
      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-white/5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {imageUrl && (
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
          <Image src={imageUrl} alt="" width={48} height={48} className="object-cover w-full h-full" unoptimized />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{event.title}</p>
        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <CalendarDays size={11} />
          {dateStr}
        </p>
      </div>
    </Link>
  )
}
