'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function ResetPasswordPage() {
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // PKCE flow: session is already set in cookies after /auth/callback exchange
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
        setChecking(false)
      }
    })

    // Implicit/hash flow: Supabase fires PASSWORD_RECOVERY when it detects #access_token in URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
        setChecking(false)
      }
    })

    // If neither fires within 2s, show an error
    const timeout = setTimeout(() => setChecking(false), 2000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirm = (form.elements.namedItem('confirm') as HTMLInputElement).value

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const panelStyle = {
    background: 'var(--surface-panel)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
  }

  if (success) {
    return (
      <div className="rounded-2xl p-8" style={panelStyle}>
        <div className="text-center space-y-4">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white">Contraseña actualizada</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Tu contraseña ha sido cambiada exitosamente.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] mt-4"
            style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 30px rgba(249,115,22,0.3)' }}
          >
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  if (checking) {
    return (
      <div className="rounded-2xl p-8" style={panelStyle}>
        <div className="h-6 w-40 rounded-lg mx-auto animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="rounded-2xl p-8" style={panelStyle}>
        <div className="text-center space-y-4">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white">Enlace inválido o expirado</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Este enlace ya no es válido. Solicita uno nuevo desde el inicio de sesión.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 30px rgba(249,115,22,0.3)' }}
          >
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-8" style={panelStyle}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Nueva contraseña</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Elige una contraseña segura
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all pr-12"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm"
            className="block text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Confirmar contraseña
          </label>
          <input
            id="confirm"
            name="confirm"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 30px rgba(249,115,22,0.3)' }}
          >
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </div>
      </form>
    </div>
  )
}
