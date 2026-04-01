'use client'

import { Suspense, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
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
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''

  return (
    <div
      className="rounded-2xl p-8"
      style={{
        background: 'var(--surface-panel)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
      }}
    >
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

        {state?.error && (
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