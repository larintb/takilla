import Link from 'next/link'
import { cookies } from 'next/headers'
import { Ticket } from 'lucide-react'
import { cacheLife } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import NavbarUserMenu from './navbar-user-menu'

async function getProfile(userId: string) {
  'use cache'
  cacheLife('minutes')
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('full_name, role')
    .eq('id', userId)
    .single()
  return data
}

const menuByRole: Record<string, { label: string; href: string }[]> = {
  customer: [
    { label: 'Mis boletos',  href: '/tickets' },
    { label: 'Ver eventos',  href: '/events'  },
  ],
  organizer: [
    { label: 'Mis eventos',  href: '/dashboard/events' },
    { label: 'Staff App',    href: '/staff'            },
    { label: 'Mis boletos',  href: '/tickets'          },
    { label: 'Ver eventos',  href: '/events'           },
  ],
  admin: [
    { label: 'Panel administrador', href: '/dashboard/admin'   },
    { label: 'Eventos',             href: '/dashboard/events'  },
    { label: 'Staff App',           href: '/staff'             },
    { label: 'Mis boletos',         href: '/tickets'           },
  ],
}

const roleLabels: Record<string, string> = {
  customer:  'Cliente',
  organizer: 'Organizador',
  admin:     'Admin',
}

export default async function Navbar() {
  const cookieStore = await cookies()
  const supabase   = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <header className="bg-white border-b border-zinc-200 relative z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-zinc-900">
            <Ticket size={18} />
            Takilla
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-700 transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>
    )
  }

  const profile = await getProfile(user.id)

  const role        = profile?.role ?? 'customer'
  const displayName = profile?.full_name || user.email || 'Usuario'
  const menuItems   = menuByRole[role] ?? menuByRole.customer

  return (
    <header className="bg-white border-b border-zinc-200 relative z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-zinc-900">
          <Ticket size={18} />
          Takilla
        </Link>
        <NavbarUserMenu
          userName={displayName}
          roleLabel={roleLabels[role] ?? 'Cliente'}
          menuItems={menuItems}
        />
      </div>
    </header>
  )
}
