'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown, LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import FormButton from '@/components/form-button'

type MenuItem = { label: string; href: string }

type Props = {
  userName: string
  roleLabel: string
  menuItems: MenuItem[]
}

export default function NavbarUserMenu({ userName, roleLabel, menuItems }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const id = setTimeout(() => {
      document.addEventListener('click', handler)
      document.addEventListener('touchend', handler)
    }, 10)
    return () => {
      clearTimeout(id)
      document.removeEventListener('click', handler)
      document.removeEventListener('touchend', handler)
    }
  }, [open])

  // Truncar el nombre si es muy largo para que el botón no se desborde
  const shortName = userName.split(' ')[0] ?? userName

  return (
    <div ref={ref} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white text-sm font-medium hover:from-amber-500 hover:via-orange-600 hover:to-red-700 transition-all max-w-[180px]"
      >
        <span className="truncate">{shortName}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-zinc-200 shadow-lg py-1.5">
          <div className="px-3 py-2 border-b border-zinc-100 mb-1">
            <p className="text-sm font-semibold text-zinc-900 truncate">{userName}</p>
            <p className="text-xs text-zinc-400">{roleLabel}</p>
          </div>

          {menuItems.map(item => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              {item.label}
            </Link>
          ))}

          <div className="border-t border-zinc-100 mt-1 pt-1">
            <form action={logout}>
              <FormButton className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 justify-start">
                <LogOut size={13} />
                Cerrar sesión
              </FormButton>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}