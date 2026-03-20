'use client'

import { logout } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <LogOut size={15} />
        Salir
      </button>
    </form>
  )
}
