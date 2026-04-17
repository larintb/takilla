'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import { Turnstile } from '@marsidev/react-turnstile'
import { signup } from '@/app/actions/auth'
import FormButton from '@/components/form-button'

export default function SignupPage() {
  const [state, action] = useActionState(signup, null)
  const [showPassword, setShowPassword] = useState(false)

  const errorMessage = state && 'error' in state ? state.error : null
  const success = state && 'success' in state && state.success

  if (success) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: 'var(--surface-panel)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
        }}
      >
        <div className="text-5xl mb-4">📬</div>
        <h2 className="text-2xl font-bold text-white mb-2">¡Casi listo!</h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Te enviamos un correo de confirmación. Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
        </p>
        <Link
          href="/login"
          className="inline-block mt-6 py-2 px-6 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'var(--accent-gradient)' }}
        >
          Ir a iniciar sesión
        </Link>
      </div>
    )
  }

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
        <h2 className="text-2xl font-bold text-white">Crear cuenta</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Únete a Takilla
        </p>
      </div>

      <form action={action} className="space-y-5">
        {/* Nombre */}
        <div>
          <label
            htmlFor="full_name"
            className="block text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            nombre
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
            }}
            placeholder="Luis G. Lara"
          />
        </div>

        {/* Correo */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
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

        {/* Contraseña con ojito */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              minLength={6}
              className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all pr-12"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
              }}
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {showPassword ? (
                // Ojo normal — contraseña visible
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                // Ojo tachado — contraseña oculta
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-1">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="terms"
              required
              className="mt-0.5 shrink-0 w-4 h-4 rounded cursor-pointer appearance-none checked:appearance-auto"
              style={{
                accentColor: 'var(--color-pink)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
            <span className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Acepto los{' '}
              <a href="/terminos" target="_blank" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--color-pink)' }}>
                Términos y Condiciones
              </a>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="privacy"
              required
              className="mt-0.5 shrink-0 w-4 h-4 rounded cursor-pointer appearance-none checked:appearance-auto"
              style={{
                accentColor: 'var(--color-pink)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
            <span className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              He leído y acepto el{' '}
              <a href="/privacidad" target="_blank" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--color-pink)' }}>
                Aviso de Privacidad
              </a>
            </span>
          </label>
        </div>

        {/* Turnstile */}
        <div className="flex justify-center pt-1">
          <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} />
        </div>

        {/* Error */}
        {errorMessage && (
          <div
            className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Botón submit */}
        <div className="pt-1">
          <FormButton
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'var(--accent-gradient)',
              boxShadow: '0 0 30px rgba(249,115,22,0.3)',
            }}
          >
            Crear cuenta
          </FormButton>
        </div>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="font-semibold hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-pink)' }}
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}