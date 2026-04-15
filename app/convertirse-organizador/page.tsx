import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { becomeOrganizer } from './actions'
import { CheckCircle, CreditCard, ArrowRight, Zap, BadgeDollarSign, TrendingUp, Clock, Lock } from 'lucide-react'
import Link from 'next/link'

// ── REGISTRO CERRADO ──────────────────────────────────────────────────────────
// Cambiar a true para abrir el registro de organizadores.
const ORGANIZER_REGISTRATION_OPEN = true
// ─────────────────────────────────────────────────────────────────────────────

export default async function ConvertirseOrganizadorPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/convertirse-organizador')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/dashboard')
  }

  // Organizador free → mandarlo directo al onboarding de Stripe para que pueda subir a pro
  if (profile?.role === 'organizer') {
    redirect('/dashboard/onboarding')
  }

  if (!ORGANIZER_REGISTRATION_OPEN) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4 py-16"
        style={{ background: 'var(--background)' }}
      >
        <div className="max-w-md w-full text-center space-y-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Lock size={28} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Registro de organizadores cerrado</h1>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Por el momento no estamos aceptando nuevos organizadores.
              Estamos trabajando para abrir el registro próximamente.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Ver eventos disponibles
          </Link>
        </div>
      </main>
    )
  }

  const FEATURES_FREE = [
    'Eventos de entrada gratuita',
    'QR de validación incluido',
    'Sin trámites bancarios',
    'Activación inmediata',
  ]

  const FEATURES_PAID = [
    'Todo lo de organizador gratuito',
    'Cobra por tus boletos',
    'Pagos directos a tu cuenta',
    'Verificación segura con Stripe',
  ]

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: 'var(--background)' }}
    >
      <div className="max-w-2xl w-full space-y-10">

        {/* Header */}
        <div className="text-center space-y-3">
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full text-white inline-block"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Organizadores
          </span>
          <h1 className="text-3xl font-bold text-white mt-3">
            Publica tus eventos en Takilla
          </h1>
          <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Elige el tipo de organizador que necesitas. Puedes empezar gratis y activar cobros cuando quieras.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Organizador gratuito */}
          <div
            className="rounded-2xl p-6 space-y-5 flex flex-col"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}
                >
                  <Zap size={16} className="text-green-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-green-400">Gratuito</span>
              </div>
              <h2 className="text-xl font-bold text-white">Organizador</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Para eventos sin costo de entrada. Activación al instante.
              </p>
            </div>

            <ul className="space-y-2 flex-1">
              {FEATURES_FREE.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <CheckCircle size={14} className="text-green-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <form action={becomeOrganizer}>
              <input type="hidden" name="tipo" value="gratuito" />
              <button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }}
              >
                Empezar gratis
                <ArrowRight size={15} />
              </button>
            </form>
          </div>

          {/* Organizador de pago */}
          <div
            className="rounded-2xl p-6 space-y-5 flex flex-col relative overflow-hidden"
            style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.25)' }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}
                >
                  <CreditCard size={16} className="text-orange-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">De pago</span>
              </div>
              <h2 className="text-xl font-bold text-white">Organizador de pago</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Para eventos con boletos de pago. Requiere conectar cuenta bancaria.
              </p>
            </div>

            <ul className="space-y-2">
              {FEATURES_PAID.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <CheckCircle size={14} className="text-orange-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Ejemplo de cobro */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Ejemplo de cobro
              </p>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Precio del boleto (tú decides)', value: '$100.00', muted: false },
                  { label: 'Cargo por servicio (comprador)', value: '+$16.60', muted: true  },
                  { label: 'Total que paga el comprador',    value: '$116.60', muted: true  },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-4">
                    <span style={{ color: row.muted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.65)' }}>
                      {row.label}
                    </span>
                    <span
                      className="font-semibold tabular-nums shrink-0"
                      style={{ color: row.muted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)' }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
                <div
                  className="flex items-center justify-between pt-3 gap-4"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="font-bold text-white text-sm">Tú recibes</span>
                  <span
                    className="font-bold text-lg"
                    style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    $100.00
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { icon: <BadgeDollarSign size={15} />, label: 'Cobro directo' },
                  { icon: <TrendingUp size={15} />,      label: 'Sin costo fijo' },
                  { icon: <Clock size={15} />,           label: 'Activación rápida' },
                ].map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-1 text-center">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.2)' }}
                    >
                      {b.icon}
                    </div>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <form action={becomeOrganizer}>
              <input type="hidden" name="tipo" value="pago" />
              <button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ background: 'var(--accent-gradient)' }}
              >
                Configurar cuenta de pagos
                <ArrowRight size={15} />
              </button>
            </form>
          </div>

        </div>

        {/* Footer note */}
        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Al continuar aceptas nuestros{' '}
          <a href="/terminos" className="underline hover:opacity-70">términos y condiciones</a>
          {' '}y el{' '}
          <a href="/privacidad" className="underline hover:opacity-70">aviso de privacidad</a>.
          {' '}·{' '}
          <Link href="/" className="underline hover:opacity-70">Volver al inicio</Link>
        </p>

      </div>
    </main>
  )
}
