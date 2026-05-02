'use client'

import { useActionState } from 'react'
import { setUserRole } from '../actions'
import { Loader2, ShieldCheck } from 'lucide-react'

const ROLES = [
  { value: 'customer',   label: 'Cliente' },
  { value: 'organizer',  label: 'Organizador' },
  { value: 'admin',      label: 'Admin' },
]

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff',
  borderRadius: 12,
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  width: 'auto',
  paddingRight: 32,
  cursor: 'pointer',
}

export default function UserRoleManager() {
  const [state, action, pending] = useActionState(setUserRole, null)

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
        <p className="text-sm font-semibold text-white">Cambiar rol de usuario</p>
      </div>

      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48 space-y-1">
          <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Correo del usuario
          </label>
          <input
            name="email"
            type="email"
            placeholder="usuario@ejemplo.com"
            required
            style={inputStyle}
            className="focus:ring-2 focus:ring-orange-500 transition"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Nuevo rol
          </label>
          <select name="role" defaultValue="organizer" style={selectStyle}
            className="focus:ring-2 focus:ring-orange-500 transition">
            {ROLES.map(r => (
              <option key={r.value} value={r.value} style={{ background: '#1b1233' }}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="h-9 px-4 rounded-xl text-white text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'var(--accent-gradient)' }}
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : null}
          Aplicar
        </button>
      </form>

      {state?.error && (
        <p className="text-sm font-medium" style={{ color: '#f87171' }}>{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm font-medium" style={{ color: '#4ade80' }}>{state.success}</p>
      )}
    </div>
  )
}
