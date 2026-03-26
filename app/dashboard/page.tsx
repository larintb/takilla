'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  Ticket, Settings, CalendarDays, MapPin,
  FileSearch, LogOut, Check, Loader2, Menu, X
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

type Section = 'tickets' | 'settings'

interface Profile {
  full_name: string
  role: string
}

interface TicketRow {
  id: string
  qr_hash: string
  is_used: boolean
  used_at: string | null
  ticket_tiers: { name: string; price: number } | null
  events: {
    title: string
    event_date: string
    venues: { name: string; city: string } | null
  } | null
}

// ─── Fade wrapper ────────────────────────────────────────────────────────────

function Fade({ children, id }: { children: React.ReactNode; id: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [id])
  return (
    <div style={{ transition: 'opacity 200ms ease', opacity: visible ? 1 : 0 }}>
      {children}
    </div>
  )
}

// ─── Sidebar content (shared between desktop + mobile drawer) ────────────────

function SidebarContent({
  profile,
  email,
  section,
  onSelect,
}: {
  profile: Profile | null
  email: string
  section: Section
  onSelect: (s: Section) => void
}) {
  const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'tickets',  label: 'Mis tickets',   icon: <Ticket size={16} /> },
    { id: 'settings', label: 'Configuración', icon: <Settings size={16} /> },
  ]

  return (
    <>
      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {navItems.map(item => {
          const isActive = section === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left
                ${isActive
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
            >
              <span className={isActive ? 'text-white' : 'text-zinc-400'}>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>
    </>
  )
}

// ─── Tickets section ─────────────────────────────────────────────────────────

function TicketsSection({ tickets }: { tickets: TicketRow[] }) {
  return (
    <Fade id="tickets">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Mis tickets</h1>
          <p className="text-zinc-500 mt-1">
            {tickets.length} boleto{tickets.length !== 1 ? 's' : ''} comprado{tickets.length !== 1 ? 's' : ''}
          </p>
        </div>

        {!tickets.length ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-16 text-center">
            <Ticket size={40} className="mx-auto text-zinc-300 mb-3" />
            <p className="font-semibold text-zinc-700">No tienes boletos aún</p>
            <p className="text-sm text-zinc-400 mt-1">Explora los eventos y compra tus boletos</p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors"
            >
              <FileSearch size={15} />
              Ver eventos
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tickets.map(ticket => {
              const event = ticket.events
              const tier  = ticket.ticket_tiers
              const venue = event?.venues
              return (
                <div
                  key={ticket.id}
                  className={`bg-white rounded-2xl border p-5 space-y-3 ${
                    ticket.is_used ? 'border-zinc-200 opacity-60' : 'border-zinc-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-zinc-900 leading-tight">{event?.title}</p>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      ticket.is_used ? 'bg-zinc-100 text-zinc-400' : 'bg-green-100 text-green-700'
                    }`}>
                      {ticket.is_used ? 'Usado' : 'Válido'}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-500 space-y-1">
                    {event?.event_date && (
                      <p className="flex items-center gap-1.5">
                        <CalendarDays size={13} />
                        {new Date(event.event_date).toLocaleDateString('es-MX', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    )}
                    {venue?.name && (
                      <p className="flex items-center gap-1.5">
                        <MapPin size={13} />
                        {venue.name}, {venue.city}
                      </p>
                    )}
                  </div>
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-700">{tier?.name}</span>
                    <span className="text-sm font-bold text-zinc-900">
                      ${Number(tier?.price ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-zinc-400 font-mono truncate">{ticket.qr_hash}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Fade>
  )
}

// ─── Settings section ────────────────────────────────────────────────────────

function SettingsSection({
  profile,
  email,
  onProfileUpdate,
  onLogout,
}: {
  profile: Profile
  email: string
  onProfileUpdate: (p: Profile) => void
  onLogout: () => void
}) {
  const supabase = createClient()

  // Name
  const [name, setName]             = useState(profile.full_name)
  const [nameSaved, setNameSaved]   = useState(false)
  const [nameError, setNameError]   = useState('')
  const [savingName, startNameSave] = useTransition()

  // Email
  const [newEmail, setNewEmail]         = useState(email)
  const [emailSaved, setEmailSaved]     = useState(false)
  const [emailError, setEmailError]     = useState('')
  const [savingEmail, startEmailSave]   = useTransition()

  // Password
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [pwSaved, setPwSaved]       = useState(false)
  const [pwError, setPwError]       = useState('')
  const [savingPw, startPwSave]     = useTransition()

  // Logout confirm
  const [confirmLogout, setConfirmLogout] = useState(false)

  async function handleSaveName() {
    setNameError(''); setNameSaved(false)
    if (!name.trim()) { setNameError('El nombre no puede estar vacío.'); return }
    startNameSave(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', user.id)
      if (error) { setNameError('No se pudo guardar. Intenta de nuevo.'); return }
      onProfileUpdate({ ...profile, full_name: name.trim() })
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2500)
    })
  }

  async function handleSaveEmail() {
    setEmailError(''); setEmailSaved(false)
    if (!newEmail.trim() || !newEmail.includes('@')) { setEmailError('Ingresa un correo válido.'); return }
    startEmailSave(async () => {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
      if (error) { setEmailError('No se pudo actualizar. Intenta de nuevo.'); return }
      setEmailSaved(true)
      setTimeout(() => setEmailSaved(false), 3000)
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
      setPwSaved(true)
      setNewPw(''); setConfirmPw('')
      setTimeout(() => setPwSaved(false), 2500)
    })
  }

  return (
    <Fade id="settings">
      <div className="space-y-6 max-w-lg">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Configuración</h1>
          <p className="text-zinc-500 mt-1">Administra tu cuenta</p>
        </div>

        {/* Name */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Nombre</h2>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm text-zinc-900 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
          <button
            onClick={handleSaveName}
            disabled={savingName}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {savingName ? <Loader2 size={14} className="animate-spin" /> : nameSaved ? <Check size={14} /> : null}
            {nameSaved ? 'Guardado' : 'Guardar nombre'}
          </button>
        </div>

        {/* Email */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Correo electrónico</h2>
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm text-zinc-900 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
          />
          {emailError && <p className="text-xs text-red-500">{emailError}</p>}
          {emailSaved && <p className="text-xs text-green-600">Te enviamos un correo de confirmación.</p>}
          <button
            onClick={handleSaveEmail}
            disabled={savingEmail}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {savingEmail ? <Loader2 size={14} className="animate-spin" /> : emailSaved ? <Check size={14} /> : null}
            {emailSaved ? 'Correo enviado' : 'Actualizar correo'}
          </button>
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Contraseña</h2>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              className="w-full px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
            />
            <input
              type="password"
              placeholder="Confirmar nueva contraseña"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              className="w-full px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
            />
          </div>
          {pwError && <p className="text-xs text-red-500">{pwError}</p>}
          {pwSaved && <p className="text-xs text-green-600">Contraseña actualizada correctamente.</p>}
          <button
            onClick={handleSavePassword}
            disabled={savingPw}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {savingPw ? <Loader2 size={14} className="animate-spin" /> : pwSaved ? <Check size={14} /> : null}
            {pwSaved ? 'Guardado' : 'Cambiar contraseña'}
          </button>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Sesión</h2>
          <p className="text-sm text-zinc-500">Cerrar sesión en este dispositivo.</p>

          {!confirmLogout ? (
            <button
              onClick={() => setConfirmLogout(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-800">¿Estás seguro que quieres cerrar sesión?</p>
              <div className="flex gap-2">
                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Sí, cerrar sesión
                </button>
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </Fade>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const supabase = createClient()

  const [section, setSection] = useState<Section>('tickets')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail]     = useState('')
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      
      setEmail(user.email ?? '')
      
      const [{ data: prof }, { data: tix }] = await Promise.all([
        supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
        supabase
          .from('tickets')
          .select(`id, qr_hash, is_used, used_at, ticket_tiers(name, price), events(title, event_date, venues(name, city))`)
          .eq('owner_id', user.id)
          .order('id', { ascending: false }),
      ])
      
      // Redirección basada en rol (de master)
      if (prof?.role === 'admin') {
        redirect('/dashboard/admin')
        return
      }
      if (prof?.role === 'organizer') {
        redirect('/dashboard/events')
        return
      }
      
      setProfile(prof ?? { full_name: '', role: 'customer' })
      setTickets((tix ?? []) as unknown as TicketRow[])
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  function handleSelectSection(s: Section) {
    setSection(s)
    setDrawerOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <header className="bg-white border-b border-zinc-200">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center">
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              <Ticket size={18} />
              Takilla
            </div>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
          {/* Sidebar skeleton */}
          <aside className="hidden md:block w-52 shrink-0 space-y-3">
            <div className="h-4 bg-zinc-200 rounded-lg animate-pulse w-3/4" />
            <div className="h-3 bg-zinc-100 rounded-lg animate-pulse w-1/2 mb-4" />
            <div className="h-9 bg-zinc-200 rounded-xl animate-pulse" />
            <div className="h-9 bg-zinc-100 rounded-xl animate-pulse" />
          </aside>
          {/* Content skeleton */}
          <main className="flex-1 min-w-0 space-y-4">
            <div className="h-7 bg-zinc-200 rounded-lg animate-pulse w-40" />
            <div className="h-4 bg-zinc-100 rounded-lg animate-pulse w-24" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3 animate-pulse">
                  <div className="h-4 bg-zinc-100 rounded w-3/4" />
                  <div className="h-3 bg-zinc-100 rounded w-1/2" />
                  <div className="h-3 bg-zinc-100 rounded w-1/4" />
                  <div className="pt-2 border-t border-zinc-50">
                    <div className="h-3 bg-zinc-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Mobile only: hamburger — left */}
          <button
            className="md:hidden p-1 text-zinc-600 hover:text-zinc-900 transition-colors"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-zinc-900 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <Ticket size={18} />
            Takilla
          </Link>

          {/* Spacer */}
          <div className="md:hidden w-7" />

        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out md:hidden
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Drawer header: user info + close button */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-zinc-100">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">
              {profile?.full_name || email}
            </p>
            <p className="text-xs text-zinc-400 truncate">{email}</p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="ml-3 shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <SidebarContent
            profile={profile}
            email={email}
            section={section}
            onSelect={handleSelectSection}
          />
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">

        {/* Desktop sidebar */}
        <aside className="hidden md:block w-52 shrink-0">
          {/* User info */}
          <div className="mb-6 px-1">
            <p className="text-sm font-semibold text-zinc-900 truncate">
              {profile?.full_name || email}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">{email}</p>
          </div>
          <SidebarContent
            profile={profile}
            email={email}
            section={section}
            onSelect={handleSelectSection}
          />
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {section === 'tickets' && (
            <TicketsSection tickets={tickets} />
          )}
          {section === 'settings' && profile && (
            <SettingsSection
              profile={profile}
              email={email}
              onProfileUpdate={p => setProfile(p)}
              onLogout={handleLogout}
            />
          )}
        </main>

      </div>
    </div>
  )
}