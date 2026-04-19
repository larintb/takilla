'use client'

import { Suspense, useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login, resendSignupCode, verifyEmailCode } from '@/app/actions/auth'
import FormButton from '@/components/form-button'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const [state, action] = useActionState(login, null)
  const [resendState, resendAction] = useActionState(resendSignupCode, null)
  const [verifyState, verifyAction] = useActionState(verifyEmailCode, null)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''

  const [view, setView] = useState<'login' | 'unverified' | 'confirm_send' | 'verify'>('login')

  const isUnverified = !!(state && 'unverified' in state && state.unverified)
  const codeSent = !!(resendState && 'sent' in resendState && resendState.sent)
  const unverifiedEmail = state && 'email' in state ? state.email : ''

  const currentView = codeSent ? 'verify' : isUnverified && view === 'login' ? 'unverified' : view

  const panelStyle = {
    background: 'var(--surface-panel)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
  }

  if (currentView === 'unverified') {
    return (
      <div className="rounded-2xl p-8" style={panelStyle}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-white mb-2">Cuenta no verificada</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Tu cuenta aún no ha sido activada. Necesitas verificar tu correo electrónico para poder ingresar.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setView('confirm_send')}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'var(--accent-gradient)',
              boxShadow: '0 0 30px rgba(249,115,22,0.3)',
            }}
          >
            Reenviar código de verificación
          </button>
          <button
            onClick={() => setView('login')}
            className="w-full py-3 rounded-xl text-sm transition-all hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  if (currentView === 'confirm_send') {
    return (
      <div className="rounded-2xl p-8" style={panelStyle}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-2xl font-bold text-white mb-2">¿Reenviar código?</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Te enviaremos un nuevo código de verificación a{' '}
            <span className="font-semibold text-white">{unverifiedEmail}</span>.
          </p>
        </div>

        <div className="space-y-3">
          <form action={resendAction}>
            <input type="hidden" name="email" value={unverifiedEmail} />
            {'error' in (resendState ?? {}) && (
              <div
                className="rounded-xl px-4 py-3 text-sm font-medium mb-3"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
              >
                {(resendState as { error: string }).error}
              </div>
            )}
            <FormButton
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'var(--accent-gradient)',
                boxShadow: '0 0 30px rgba(249,115,22,0.3)',
              }}
            >
              Sí, enviar código
            </FormButton>
          </form>
          <button
            onClick={() => setView('unverified')}
            className="w-full py-3 rounded-xl text-sm transition-all hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  if (currentView === 'verify') {
    return (
      <div className="rounded-2xl p-8" style={panelStyle}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-2xl font-bold text-white mb-2">Revisa tu correo</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Te enviamos un código a{' '}
            <span className="font-semibold text-white">{unverifiedEmail}</span>.
            Escríbelo abajo para activar tu cuenta.
          </p>
        </div>

        <form action={verifyAction} className="space-y-5">
          <input type="hidden" name="email" value={unverifiedEmail} />
          <div>
            <label
              htmlFor="code"
              className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Código de verificación
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              required
              autoComplete="one-time-code"
              autoFocus
              onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
              onInput={(e) => {
                const t = e.currentTarget
                t.value = t.value.replace(/\D/g, '').slice(0, 6)
              }}
              className="w-full rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest text-white focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                letterSpacing: '0.4em',
              }}
              placeholder="000000"
            />
          </div>

          {verifyState && 'error' in verifyState && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              {verifyState.error}
            </div>
          )}

          <FormButton
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'var(--accent-gradient)',
              boxShadow: '0 0 30px rgba(249,115,22,0.3)',
            }}
          >
            Verificar y entrar
          </FormButton>
        </form>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-8" style={panelStyle}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Iniciar sesión</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Bienvenido de nuevo
        </p>
      </div>

      <form action={action} className="space-y-5">
        {next && <input type="hidden" name="next" value={next} />}

        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
            }}
            placeholder="tu@correo.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
            }}
            placeholder="••••••••"
          />
        </div>

        {state && 'error' in state && (
          <div
            className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            {state.error}
          </div>
        )}

        <div className="pt-1">
          <FormButton
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'var(--accent-gradient)',
              boxShadow: '0 0 30px rgba(249,115,22,0.3)',
            }}
          >
            Entrar
          </FormButton>
        </div>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
        ¿No tienes cuenta?{' '}
        <Link href="/signup" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--color-pink)' }}>
          Regístrate
        </Link>
      </p>
    </div>
  )
}

function LoginPageFallback() {
  return (
    <div className="rounded-2xl p-8" style={{ background: 'var(--surface-panel)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="h-6 w-40 rounded-lg mx-auto animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </div>
  )
}
