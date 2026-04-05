'use client'

import { findProfileByEmail } from './find-profile-action'
import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import {
  Ticket, Settings, CalendarDays, MapPin,
  FileSearch, LogOut, Check, Loader2, Menu, X, Plus, Trash2, Users, ScanLine
} from 'lucide-react'
import { VT323 } from 'next/font/google'
import RetroTicketWallet from '@/app/checkout/success/_components/retro-ticket-wallet'

const vt323 = VT323({ weight: '400', subsets: ['latin'] })

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG         = 'var(--background)'
const CARD       = 'rgba(255,255,255,0.04)'
const BORDER     = '1px solid rgba(255,255,255,0.08)'
const TEXT       = '#ffffff'
const TEXT_MUTED = 'rgba(255,255,255,0.45)'
const TEXT_DIM   = 'rgba(255,255,255,0.25)'
const ACCENT     = 'var(--accent-gradient)'
const SIDEBAR_BG = 'rgba(255,255,255,0.03)'

// ─── Types ───────────────────────────────────────────────────────────────────

type Section = 'tickets' | 'settings' | 'events' | 'team'
interface Profile { full_name: string; role: string; terms_accepted_at?: string | null; stripe_onboarding_complete?: boolean }
interface TicketRow {
  id: string; qr_hash: string; is_used: boolean; used_at: string | null
  ticket_tiers: { name: string; price: number } | null
  events: { title: string; event_date: string; venues: { name: string; city: string } | null } | null
}
interface EventRow {
  id: string; title: string; event_date: string; status: string
  venues: { name: string; city: string } | null
}
interface TeamMember {
  id: string; userId: string; eventId: string
  eventTitle: string; eventStatus: string; fullName: string; email: string
}
interface PublishedEvent { id: string; title: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusLabel: Record<string, string> = {
  draft: 'Borrador', published: 'Publicado', cancelled: 'Cancelado', finished: 'Finalizado',
}

// ─── Components ──────────────────────────────────────────────────────────────

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl p-5 space-y-4" style={{ background: CARD, border: BORDER }}>{children}</div>
)
const statusColors: Record<string, { bg: string; color: string }> = {
  draft:     { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' },
  published: { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  cancelled: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  finished:  { bg: 'rgba(249,115,22,0.15)',  color: '#fb923c' },
}

function getDisplayStatus(status: string, eventDate: string) {
  if (status === 'published' && new Date(eventDate) < new Date()) return 'finished'
  return status
}
function ticketDisplayNumber(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8)
  return String((parseInt(hex, 16) % 9000) + 1000)
}

// ─── Fade ─────────────────────────────────────────────────────────────────────

function Fade({ children, id }: { children: React.ReactNode; id: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t) }, [id])
  return <div style={{ transition: 'opacity 200ms ease', opacity: visible ? 1 : 0 }}>{children}</div>
}

// ─── Ticket Modal ─────────────────────────────────────────────────────────────

function TicketModal({ tickets, initialIndex, onClose }: { tickets: TicketRow[]; initialIndex: number; onClose: () => void }) {
  const walletTickets = tickets.map(t => ({
    id: t.id, displayNumber: ticketDisplayNumber(t.id), qr_hash: t.qr_hash,
    eventTitle: t.events?.title ?? 'Evento', eventDate: t.events?.event_date ?? null,
    venueName: t.events?.venues?.name ?? null, venueCity: t.events?.venues?.city ?? null,
    tierName: t.ticket_tiers?.name ?? null, tierPrice: t.ticket_tiers ? Number(t.ticket_tiers.price) : null,
  }))
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className={`text-white text-xl tracking-widest uppercase ${vt323.className}`}>Mis boletos</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors"><X size={18} /></button>
        </div>
        <RetroTicketWallet tickets={walletTickets} initialIndex={initialIndex} />
        <button onClick={onClose} className={`w-full py-2 border-2 border-white/30 text-white text-xl tracking-widest uppercase hover:bg-white/10 transition-colors ${vt323.className}`}>
          ← Regresar a mis boletos
        </button>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function SidebarContent({ profile, section, onSelect, isTeamMember }: {
  profile: Profile | null; section: Section; onSelect: (s: Section) => void; isTeamMember?: boolean
}) {
  const baseItems: { id: Section; label: string; icon: React.ReactNode; roles?: string[] }[] = [
    { id: 'tickets',  label: 'Mis tickets',   icon: <Ticket size={15} /> },
    { id: 'events',   label: 'Mis eventos',   icon: <CalendarDays size={15} />, roles: ['organizer', 'admin'] },
    { id: 'team',     label: 'Mi equipo',     icon: <Users size={15} />,        roles: ['organizer', 'admin'] },
    { id: 'settings', label: 'Configuración', icon: <Settings size={15} /> },
  ]
  const navItems = baseItems.filter(i => !i.roles || (profile && i.roles.includes(profile.role)))
  const showStaffLink = isTeamMember || profile?.role === 'organizer' || profile?.role === 'admin'

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(item => {
        const isActive = section === item.id
        return (
          <button key={item.id} onClick={() => onSelect(item.id)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left"
            style={{
              background: isActive ? ACCENT : 'transparent',
              color: isActive ? '#fff' : TEXT_MUTED,
            }}
          >
            <span style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.3)' }}>{item.icon}</span>
            {item.label}
          </button>
        )
      })}
      {showStaffLink && (
        <>
          <div style={{ borderTop: BORDER, margin: '8px 0' }} />
          <Link href="/staff"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ color: TEXT_MUTED }}
          >
            <span style={{ color: 'rgba(255,255,255,0.3)' }}><ScanLine size={15} /></span>
            Staff App
          </Link>
        </>
      )}
    </nav>
  )
}

// ─── Tickets Section ──────────────────────────────────────────────────────────

function TicketsSection({ tickets }: { tickets: TicketRow[] }) {
  const [modalIndex, setModalIndex] = useState<number | null>(null)
  return (
    <Fade id="tickets">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TEXT }}>Mis tickets</h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>
            {tickets.length} boleto{tickets.length !== 1 ? 's' : ''} comprado{tickets.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!tickets.length ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: CARD, border: BORDER }}>
            <Ticket size={40} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="font-semibold" style={{ color: TEXT }}>No tienes boletos aún</p>
            <p className="text-sm mt-1" style={{ color: TEXT_MUTED }}>Explora los eventos y adquiere tus boletos</p>
            <Link href="/events" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: ACCENT }}>
              <FileSearch size={15} /> Ver eventos
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tickets.map((ticket, i) => {
                const event = ticket.events; const tier = ticket.ticket_tiers; const venue = event?.venues
                return (
                  <button key={ticket.id} onClick={() => setModalIndex(i)}
                    className="rounded-2xl p-5 space-y-3 text-left transition-all cursor-pointer"
                    style={{
                      background: CARD, border: BORDER,
                      opacity: ticket.is_used ? 0.5 : 1,
                    }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-tight" style={{ color: TEXT }}>{event?.title}</p>
                      <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={ticket.is_used
                          ? { background: 'rgba(255,255,255,0.06)', color: TEXT_DIM }
                          : { background: 'rgba(249,115,22,0.15)', color: '#fb923c' }}>
                        {ticket.is_used ? 'Usado' : 'Válido'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1" style={{ color: TEXT_MUTED }}>
                      {event?.event_date && (
                        <p className="flex items-center gap-1.5"><CalendarDays size={13} />
                          {new Date(event.event_date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      {venue?.name && <p className="flex items-center gap-1.5"><MapPin size={13} />{venue.name}, {venue.city}</p>}
                    </div>
                    <div className="pt-2 flex items-center justify-between" style={{ borderTop: BORDER }}>
                      <span className="text-sm font-medium" style={{ color: TEXT_MUTED }}>{tier?.name}</span>
                      <span className="text-sm font-bold" style={{ color: TEXT }}>${Number(tier?.price ?? 0).toFixed(2)}</span>
                    </div>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-orange)' }}>Toca para ver QR →</p>
                  </button>
                )
              })}
            </div>
            {modalIndex !== null && <TicketModal tickets={tickets} initialIndex={modalIndex} onClose={() => setModalIndex(null)} />}
          </>
        )}
      </div>
    </Fade>
  )
}

// ─── Event Row ────────────────────────────────────────────────────────────────

function EventRowItem({ event, confirmingId, onConfirm, onCancel, onDelete }: {
  event: EventRow
  confirmingId: string | null
  onConfirm: (id: string) => void
  onCancel: () => void
  onDelete: (id: string) => Promise<void>
}) {
  const [deleting, startDelete] = useTransition()
  const displayStatus = getDisplayStatus(event.status, event.event_date)
  const venue = event.venues
  const sc = statusColors[displayStatus] ?? statusColors.draft
  const isConfirming = confirmingId === event.id

  if (isConfirming) {
    return (
      <div className="flex items-center justify-between rounded-xl px-5 py-4 gap-4"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <p className="text-sm font-medium min-w-0 truncate" style={{ color: '#fca5a5' }}>
          ¿Borrar <span className="font-semibold">&quot;{event.title}&quot;</span>?
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); startDelete(async () => { await onDelete(event.id) }) }}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-60 transition-colors"
            style={{ background: '#dc2626' }}>
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Sí, borrar
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancel() }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', color: TEXT }}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-xl px-5 py-4 transition-all group"
      style={{ background: CARD, border: BORDER }}>
      <Link href={`/dashboard/events/${event.id}`} className="flex-1 min-w-0 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate transition-colors" style={{ color: TEXT }}>{event.title}</p>
          <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: TEXT_MUTED }}>
            <span className="flex items-center gap-1"><CalendarDays size={13} />
              {new Date(event.event_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {venue?.name && <span className="flex items-center gap-1"><MapPin size={13} />{venue.name}, {venue.city}</span>}
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: sc.bg, color: sc.color }}>
          {statusLabel[displayStatus]}
        </span>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onConfirm(event.id) }}
        className="ml-3 shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        style={{ color: TEXT_DIM }}
        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
        onMouseLeave={e => (e.currentTarget.style.color = TEXT_DIM)}>
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ─── Events Section ───────────────────────────────────────────────────────────

function EventsSection({ events, loading, onDeleteEvent, profile }: { events: EventRow[]; loading: boolean; onDeleteEvent: (id: string) => Promise<void>; profile: Profile | null }) {
  // Solo un confirm activo a la vez
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  if (loading) return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl px-5 py-4 animate-pulse" style={{ background: CARD, border: BORDER }}>
          <div className="h-4 rounded w-1/2 mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-3 rounded w-1/3" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      ))}
    </div>
  )

  const onboardingIncomplete = profile?.role === 'organizer' && (!profile?.terms_accepted_at || !profile?.stripe_onboarding_complete)

  return (
    <Fade id="events">
      <div className="space-y-6">
        {onboardingIncomplete && (
          <div className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#fb923c' }}>Configura tu cuenta de organizador</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Acepta los términos y conecta tu cuenta de pagos para publicar eventos.
              </p>
            </div>
            <Link href="/dashboard/onboarding"
              className="shrink-0 px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
              style={{ background: 'var(--accent-gradient)' }}>
              Configurar
            </Link>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: TEXT }}>Mis eventos</h1>
            <p className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>{events.length} eventos en total</p>
          </div>
          <Link href="/dashboard/events/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: ACCENT }}>
            <Plus size={16} /> Nuevo evento
          </Link>
        </div>
        {!events.length ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: CARD, border: BORDER }}>
            <CalendarDays size={40} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="font-semibold" style={{ color: TEXT }}>No tienes eventos aún</p>
            <p className="text-sm mt-1" style={{ color: TEXT_MUTED }}>Crea tu primer evento para empezar a vender boletos</p>
            <Link href="/dashboard/events/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: ACCENT }}>
              <Plus size={15} /> Crear evento
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <EventRowItem
                key={event.id}
                event={event}
                confirmingId={confirmingId}
                onConfirm={(id) => setConfirmingId(id)}
                onCancel={() => setConfirmingId(null)}
                onDelete={async (id) => { await onDeleteEvent(id); setConfirmingId(null) }}
              />
            ))}
          </div>
        )}
      </div>
    </Fade>
  )
}

// ─── Team Section ─────────────────────────────────────────────────────────────

function TeamSection({ userId }: { userId: string }) {
  const supabase = createClient()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [publishedEvents, setPublishedEvents] = useState<PublishedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [eventId, setEventId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: evs }, { data: mems }] = await Promise.all([
        supabase.from('events').select('id, title').eq('organizer_id', userId).eq('status', 'published').order('event_date'),
        supabase.from('team_members').select('id, member_user_id, event_id, events(title, status)').eq('organizer_id', userId).order('created_at', { ascending: false }),
      ])
      setPublishedEvents(evs ?? [])
      if (evs?.length) setEventId(evs[0].id)
      if (mems?.length) {
        const memberIds = mems.map(m => m.member_user_id)
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', memberIds)
        const pMap = new Map((profiles ?? []).map(p => [p.id, p]))
        setMembers(mems.map(m => ({
          id: m.id, userId: m.member_user_id, eventId: m.event_id,
          eventTitle: (m.events as { title?: string } | null)?.title ?? '—',
          eventStatus: (m.events as { status?: string } | null)?.status ?? '—',
          fullName: pMap.get(m.member_user_id)?.full_name ?? 'Sin nombre',
          email: pMap.get(m.member_user_id)?.email ?? '—',
        })))
      }
      setLoading(false)
    }
    load()
  }, [userId, supabase])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(t)
  }, [success])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!email.trim()) { setError('Ingresa un correo'); return }
    if (!eventId)      { setError('Selecciona un evento'); return }
    startTransition(async () => {
      const result = await findProfileByEmail(email.trim())
      if ('error' in result) { setError(result.error ?? ''); return }
      if (result.id === userId) { setError('No puedes agregarte a ti mismo'); return }
      const { error: err } = await supabase.from('team_members').upsert(
        { organizer_id: userId, member_user_id: result.id, event_id: eventId },
        { onConflict: 'organizer_id,member_user_id,event_id' }
      )
      if (err) { setError(err.message); return }
      const ev = publishedEvents.find(ev => ev.id === eventId)
      setMembers(prev => {
        if (prev.find(m => m.userId === result.id && m.eventId === eventId)) return prev
        return [{ id: crypto.randomUUID(), userId: result.id, eventId, eventTitle: ev?.title ?? '—', eventStatus: 'published', fullName: result.full_name ?? 'Sin nombre', email: result.email }, ...prev]
      })
      setEmail('')
      setSuccess(`${result.full_name || email} agregado al equipo`)
    })
  }

  async function handleRemove(id: string) {
    setRemovingId(id)
    await supabase.from('team_members').delete().eq('id', id).eq('organizer_id', userId)
    setMembers(prev => prev.filter(m => m.id !== id))
    setRemovingId(null)
  }

  const inputClass = "w-full px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
  const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: TEXT }

  if (loading) return (
    <div className="space-y-3">
      {[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: CARD, border: BORDER }} />)}
    </div>
  )

  return (
    <Fade id="team">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TEXT }}>Mi equipo</h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>Personas que pueden escanear boletos en la Staff App.</p>
        </div>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: CARD, border: BORDER }}>
          <h2 className="text-sm font-semibold" style={{ color: TEXT }}>Agregar miembro</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: TEXT_MUTED }}>Correo electrónico</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="staff@ejemplo.com" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: TEXT_MUTED }}>Evento con acceso</label>
              {publishedEvents.length === 0 ? (
                <p className="text-sm px-3 py-2 rounded-xl" style={{ color: TEXT_MUTED, background: 'rgba(255,255,255,0.03)' }}>
                  No tienes eventos publicados. Publica un evento primero.
                </p>
              ) : (
                <select value={eventId} onChange={e => setEventId(e.target.value)} className={inputClass} style={inputStyle}>
                  {publishedEvents.map(ev => <option key={ev.id} value={ev.id} style={{ background: '#1e1d2a' }}>{ev.title}</option>)}
                </select>
              )}
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Check size={14} /> {success}
              </div>
            )}
            <button type="submit" disabled={isPending || publishedEvents.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: ACCENT }}>
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Agregar al equipo
            </button>
          </form>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: TEXT }}>Miembros activos ({members.length})</h2>
          {members.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: CARD, border: BORDER }}>
              <Users size={36} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
              <p className="font-medium" style={{ color: TEXT }}>No hay miembros en tu equipo</p>
              <p className="text-sm mt-1" style={{ color: TEXT_MUTED }}>Agrega a alguien para que pueda escanear boletos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between rounded-xl px-4 py-3 gap-4"
                  style={{ background: CARD, border: BORDER }}>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate" style={{ color: TEXT }}>{member.fullName}</p>
                    <p className="text-xs truncate" style={{ color: TEXT_MUTED }}>{member.email}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: TEXT_DIM }}>
                      <CalendarDays size={11} />
                      <span className="truncate">{member.eventTitle}</span>
                      {member.eventStatus !== 'published' && (
                        <span className="ml-1" style={{ color: '#fbbf24' }}>(sin acceso — evento no publicado)</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleRemove(member.id)} disabled={removingId === member.id}
                    className="shrink-0 p-1.5 rounded-lg transition-all"
                    style={{ color: TEXT_DIM }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = TEXT_DIM)}>
                    {removingId === member.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Fade>
  )
}

// ─── Settings Section ─────────────────────────────────────────────────────────

function SettingsSection({ profile, email, onProfileUpdate, onLogout }: {
  profile: Profile; email: string; onProfileUpdate: (p: Profile) => void; onLogout: () => void
}) {
  const supabase = createClient()
  const [name, setName] = useState(profile.full_name)
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState('')
  const [savingName, startNameSave] = useTransition()
  const [newEmail, setNewEmail] = useState(email)
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [savingEmail, startEmailSave] = useTransition()
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')
  const [savingPw, startPwSave] = useTransition()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const inputClass = "w-full px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
  const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: TEXT }
  const btnPrimary = "flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"

  async function handleSaveName() {
    setNameError(''); setNameSaved(false)
    if (!name.trim()) { setNameError('El nombre no puede estar vacío.'); return }
    startNameSave(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', user.id)
      if (error) { setNameError('No se pudo guardar. Intenta de nuevo.'); return }
      onProfileUpdate({ ...profile, full_name: name.trim() })
      setNameSaved(true); setTimeout(() => setNameSaved(false), 2500)
    })
  }
  async function handleSaveEmail() {
    setEmailError(''); setEmailSaved(false)
    if (!newEmail.trim() || !newEmail.includes('@')) { setEmailError('Ingresa un correo válido.'); return }
    startEmailSave(async () => {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
      if (error) { setEmailError('No se pudo actualizar. Intenta de nuevo.'); return }
      setEmailSaved(true); setTimeout(() => setEmailSaved(false), 3000)
    })
  }
  async function handleSavePassword() {
    setPwError(''); setPwSaved(false)
    if (!newPw) { setPwError('Ingresa la nueva contraseña.'); return }
    if (newPw.length < 6) { setPwError('Mínimo 6 caracteres.'); return }
    if (newPw !== confirmPw) { setPwError('Las contraseñas no coinciden.'); return }
    startPwSave(async () => {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) { setPwError('No se pudo actualizar. Intenta de nuevo.'); return }
      setPwSaved(true); setNewPw(''); setConfirmPw(''); setTimeout(() => setPwSaved(false), 2500)
    })
  }

  return (
    <Fade id="settings">
      <div className="space-y-6 max-w-lg">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TEXT }}>Configuración</h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>Administra tu cuenta</p>
        </div>

        <Card>
          <h2 className="text-sm font-semibold" style={{ color: TEXT }}>Nombre</h2>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} style={inputStyle} />
          {nameError && <p className="text-xs" style={{ color: '#fca5a5' }}>{nameError}</p>}
          <button onClick={handleSaveName} disabled={savingName} className={btnPrimary} style={{ background: ACCENT }}>
            {savingName ? <Loader2 size={14} className="animate-spin" /> : nameSaved ? <Check size={14} /> : null}
            {nameSaved ? 'Guardado' : 'Guardar nombre'}
          </button>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold" style={{ color: TEXT }}>Correo electrónico</h2>
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className={inputClass} style={inputStyle} />
          {emailError && <p className="text-xs" style={{ color: '#fca5a5' }}>{emailError}</p>}
          {emailSaved && <p className="text-xs" style={{ color: '#86efac' }}>Te enviamos un correo de confirmación.</p>}
          <button onClick={handleSaveEmail} disabled={savingEmail} className={btnPrimary} style={{ background: ACCENT }}>
            {savingEmail ? <Loader2 size={14} className="animate-spin" /> : emailSaved ? <Check size={14} /> : null}
            {emailSaved ? 'Correo enviado' : 'Actualizar correo'}
          </button>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold" style={{ color: TEXT }}>Contraseña</h2>
          <div className="space-y-2">
            <input type="password" placeholder="Nueva contraseña" value={newPw} onChange={e => setNewPw(e.target.value)} className={inputClass} style={{ ...inputStyle, '--tw-placeholder-color': 'rgba(255,255,255,0.3)' } as React.CSSProperties} />
            <input type="password" placeholder="Confirmar nueva contraseña" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          {pwError && <p className="text-xs" style={{ color: '#fca5a5' }}>{pwError}</p>}
          {pwSaved && <p className="text-xs" style={{ color: '#86efac' }}>Contraseña actualizada correctamente.</p>}
          <button onClick={handleSavePassword} disabled={savingPw} className={btnPrimary} style={{ background: ACCENT }}>
            {savingPw ? <Loader2 size={14} className="animate-spin" /> : pwSaved ? <Check size={14} /> : null}
            {pwSaved ? 'Guardado' : 'Cambiar contraseña'}
          </button>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold" style={{ color: TEXT }}>Sesión</h2>
          <p className="text-sm" style={{ color: TEXT_MUTED }}>Cerrar sesión en este dispositivo.</p>
          {!confirmLogout ? (
            <button onClick={() => setConfirmLogout(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              <LogOut size={14} /> Cerrar sesión
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: TEXT }}>¿Estás seguro que quieres cerrar sesión?</p>
              <div className="flex gap-2">
                <button onClick={onLogout} className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ background: '#dc2626' }}>Sí, cerrar sesión</button>
                <button onClick={() => setConfirmLogout(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  style={{ border: BORDER, color: TEXT_MUTED }}>Cancelar</button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Fade>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const supabase = createClient()
  const [section, setSection]       = useState<Section>('tickets')
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [email, setEmail]           = useState('')
  const [userId, setUserId]         = useState('')
  const [tickets, setTickets]       = useState<TicketRow[]>([])
  const [events, setEvents]         = useState<EventRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isTeamMember, setIsTeamMember] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setEmail(user.email ?? '')
      setUserId(user.id)
      const [{ data: prof }, { data: tix }] = await Promise.all([
        supabase.from('profiles').select('full_name, role, terms_accepted_at, stripe_onboarding_complete').eq('id', user.id).single(),
        supabase.from('tickets').select('id, qr_hash, is_used, used_at, ticket_tiers(name, price), events(title, event_date, venues(name, city))').eq('owner_id', user.id).order('id', { ascending: false }),
      ])
      setProfile(prof ?? { full_name: '', role: 'customer' })
      setTickets((tix ?? []) as unknown as TicketRow[])
      if (prof?.role === 'organizer' || prof?.role === 'admin') {
        setSection('events')
        setEventsLoading(true)
        const query = supabase.from('events').select('id, title, event_date, status, venues(name, city)').order('event_date', { ascending: false })
        if (prof.role === 'organizer') query.eq('organizer_id', user.id)
        const { data: evs } = await query
        setEvents((evs ?? []) as unknown as EventRow[])
        setEventsLoading(false)
      }
      if (prof?.role === 'customer') {
        const { data: teamEntry } = await supabase.from('team_members').select('id').eq('member_user_id', user.id).limit(1).single()
        setIsTeamMember(!!teamEntry)
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  useEffect(() => {
    if (section !== 'events' || !profile) return
    if (profile.role !== 'organizer' && profile.role !== 'admin') return
    if (events.length > 0) return
    async function loadEvents() {
      setEventsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const query = supabase.from('events').select('id, title, event_date, status, venues(name, city)').order('event_date', { ascending: false })
      if (profile?.role === 'organizer') query.eq('organizer_id', user.id)
      const { data: evs } = await query
      setEvents((evs ?? []) as unknown as EventRow[])
      setEventsLoading(false)
    }
    loadEvents()
  }, [section, profile, events.length, supabase])

  async function handleDeleteEvent(id: string) {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (!error) setEvents(prev => prev.filter(e => e.id !== id))
  }
  async function handleLogout() { await supabase.auth.signOut(); window.location.href = '/' }
  function handleSelectSection(s: Section) { setSection(s); setDrawerOpen(false) }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen" style={{ background: BG }}>
      <header className="h-14 flex items-center px-4" style={{ borderBottom: BORDER, background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-6xl mx-auto w-full flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo1.png" alt="Takilla" width={28} height={28} className="rounded-md" />
            <span className="font-bold text-lg tracking-tight" style={{
              background: ACCENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Takilla</span>
          </Link>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        <aside className="hidden md:block w-52 shrink-0 space-y-2">
          <div className="h-4 rounded-lg animate-pulse w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-3 rounded-lg animate-pulse w-1/2 mb-4" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-9 rounded-xl animate-pulse" style={{ background: 'rgba(249,115,22,0.15)' }} />
          <div className="h-9 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </aside>
        <main className="flex-1 min-w-0 space-y-4">
          <div className="h-7 rounded-lg animate-pulse w-40" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-4 rounded-lg animate-pulse w-24" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl p-5 animate-pulse space-y-3" style={{ background: CARD, border: BORDER }}>
                <div className="h-4 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="h-3 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <div className="h-3 rounded w-1/4" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: BG }}>

      {/* Header */}
      <header className="h-14 flex items-center sticky top-0 z-30" style={{ borderBottom: BORDER, background: 'rgba(20,10,42,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 w-full flex items-center justify-between">
          <button className="md:hidden p-1 transition-colors" onClick={() => setDrawerOpen(true)}
            style={{ color: TEXT_MUTED }}>
            <Menu size={22} />
          </button>
          <Link href="/" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <Image src="/images/logo1.png" alt="Takilla" width={28} height={28} className="rounded-md" />
            <span className="font-bold text-lg tracking-tight" style={{
              background: ACCENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Takilla</span>
          </Link>
          <div className="md:hidden w-7" />
        </div>
      </header>

      {/* Mobile overlay */}
      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setDrawerOpen(false)} />}

      {/* Mobile drawer */}
      <div className={`fixed top-0 left-0 h-full w-64 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#1a1929' }}>
        <div className="px-4 h-16 flex items-center justify-between" style={{ background: ACCENT }}>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{profile?.full_name || email}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>{email}</p>
          </div>
          <button type="button" onClick={() => setDrawerOpen(false)} className="ml-3 shrink-0 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <SidebarContent profile={profile} section={section} onSelect={handleSelectSection} isTeamMember={isTeamMember} />
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">

        {/* Desktop sidebar */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="mb-6 px-1">
            <p className="text-sm font-semibold truncate" style={{ color: TEXT }}>{profile?.full_name || email}</p>
            <p className="text-xs mt-0.5 truncate font-medium" style={{
              background: ACCENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {profile?.role === 'admin' ? 'Admin' : profile?.role === 'organizer' ? 'Organizador' : 'Cliente'}
            </p>
          </div>
          <div className="rounded-2xl p-3" style={{ background: SIDEBAR_BG, border: BORDER }}>
            <SidebarContent profile={profile} section={section} onSelect={handleSelectSection} isTeamMember={isTeamMember} />
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {section === 'tickets'  && <TicketsSection tickets={tickets} />}
          {section === 'events'   && <EventsSection events={events} loading={eventsLoading} onDeleteEvent={handleDeleteEvent} profile={profile} />}
          {section === 'team'     && userId && <TeamSection userId={userId} />}
          {section === 'settings' && profile && (
            <SettingsSection profile={profile} email={email} onProfileUpdate={p => setProfile(p)} onLogout={handleLogout} />
          )}
        </main>
      </div>
    </div>
  )
}