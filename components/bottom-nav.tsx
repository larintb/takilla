'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, CalendarDays, Ticket, LayoutDashboard, Plus, User } from 'lucide-react'

type Tab = {
  label: string
  href: string
  icon: React.ReactNode
}

function buildTabs(role: string | null): Tab[] {
  const isDashboardRole = role === 'organizer' || role === 'admin'
  return [
    { label: 'Descubre',  href: '/',          icon: <Compass className="w-6 h-6" /> },
    { label: 'Eventos',   href: '/events',     icon: <CalendarDays className="w-6 h-6" /> },
    { label: 'Boletos',   href: '/tickets',    icon: <Ticket className="w-6 h-6" /> },
    isDashboardRole
      ? { label: 'Dashboard', href: '/dashboard',               icon: <LayoutDashboard className="w-6 h-6" /> }
      : { label: 'Crear',     href: '/convertirse-organizador', icon: <Plus className="w-6 h-6" /> },
    { label: 'Perfil',    href: '/dashboard',  icon: <User className="w-6 h-6" /> },
  ]
}

export default function BottomNav({ role }: { role: string | null }) {
  const pathname = usePathname()
  const tabs = buildTabs(role)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex justify-around items-center px-2 pt-3"
      style={{
        background:           'rgba(10,10,10,0.92)',
        backdropFilter:       'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop:            '1px solid rgba(255,255,255,0.07)',
        paddingBottom:        'calc(0.75rem + env(safe-area-inset-bottom))',
      }}
    >
      {tabs.map((tab) => {
        const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 min-w-12 transition-all duration-150 ${
              active ? 'scale-110' : 'opacity-50 hover:opacity-80'
            }`}
            style={{ color: active ? 'var(--color-pink)' : undefined }}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
