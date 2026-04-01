'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import FormButton from '@/components/form-button'

export default function SignupPage() {
  const [state, action] = useActionState(signup, null)
  const errorMessage = state && 'error' in state ? state.error : null

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

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
            }}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

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
