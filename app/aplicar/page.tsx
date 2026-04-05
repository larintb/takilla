'use client'

import { useActionState } from 'react'
import { submitOrganizerApplication } from './actions'

type State = Awaited<ReturnType<typeof submitOrganizerApplication>>
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

const FIELD = {
  base: 'w-full rounded-xl px-4 py-3 text-sm font-medium text-white placeholder-[rgba(255,255,255,0.25)] outline-none focus:ring-2 transition-all',
  bg:   'bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] focus:ring-[rgba(249,115,22,0.5)]',
}

export default function AplicarPage() {
  const [state, action, pending] = useActionState<State, FormData>(submitOrganizerApplication, null)

  if (state && 'success' in state) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">¡Solicitud enviada!</h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Revisaremos tu información y te notificaremos cuando tu cuenta de organizador esté lista.
              Normalmente tomamos menos de 24 horas.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--background)' }}>
      <div className="max-w-lg w-full space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full text-white inline-block"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Organizadores
          </span>
          <h1 className="text-3xl font-bold text-white mt-3">
            Publica tu evento en Takilla
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Llena este formulario y nuestro equipo revisará tu solicitud en menos de 24 horas.
          </p>
        </div>

        {/* Pricing callout */}
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <p className="text-sm font-semibold" style={{ color: '#fb923c' }}>Modelo de comisiones</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-0.5">
              <p className="font-medium text-white">Cargo por servicio</p>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>5% + $5 MXN por boleto</p>
            </div>
            <div className="space-y-0.5">
              <p className="font-medium text-white">Tú recibes</p>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>100% del precio del boleto</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Los cargos los absorbe el comprador, no el organizador. Ejemplo: boleto $100 → comprador paga ~$116.60.
          </p>
        </div>

        {/* Form */}
        <form action={action} className="space-y-4">

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Nombre o razón social *
            </label>
            <input
              name="business_name"
              required
              placeholder="Ej. Eventos del Norte S.A. de C.V."
              className={`${FIELD.base} ${FIELD.bg}`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
              RFC *
            </label>
            <input
              name="tax_id"
              required
              placeholder="Ej. EDNM920814AB3"
              className={`${FIELD.base} ${FIELD.bg}`}
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Teléfono de contacto
            </label>
            <input
              name="phone"
              type="tel"
              placeholder="Ej. +52 800 123 4567"
              className={`${FIELD.base} ${FIELD.bg}`}
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
              ¿Qué tipo de eventos organizas? <span style={{ color: 'rgba(255,255,255,0.2)' }}>(elige los que apliquen)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Música / Conciertos',
                'Vida nocturna',
                'Arte y cultura',
                'Evento social',
                'Deporte',
                'Gastronomía',
                'Corporativo',
                'Otro',
              ].map(tipo => (
                <label
                  key={tipo}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all select-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <input
                    type="checkbox"
                    name="event_types"
                    value={tipo}
                    className="w-4 h-4 rounded accent-orange-500 cursor-pointer shrink-0"
                  />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{tipo}</span>
                </label>
              ))}
            </div>
          </div>

          {state?.error && (
            <p className="text-sm font-medium px-4 py-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full h-12 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {pending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Enviar solicitud
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Al enviar aceptas nuestros{' '}
            <a href="/archivos/terminos.pdf" target="_blank" className="underline hover:opacity-70">términos y condiciones</a>
            {' '}y el{' '}
            <a href="/archivos/aviso.pdf" target="_blank" className="underline hover:opacity-70">aviso de privacidad</a>.
          </p>

        </form>
      </div>
    </main>
  )
}
