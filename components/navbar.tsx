import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import NavbarUserMenu from './navbar-user-menu'

const getProfile = unstable_cache(
  async (userId: string) => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()
    return data
  },
  ['navbar-profile'],
  { revalidate: 300 }
)

const menuByRole: Record<string, { label: string; href: string }[]> = {
  customer: [
    { label: 'Mi cuenta',   href: '/dashboard' },
    { label: 'Ver eventos', href: '/events'    },
  ],
  organizer: [
    { label: 'Mi cuenta',   href: '/dashboard' },
    { label: 'Mis eventos', href: '/dashboard' },
    { label: 'Staff App',   href: '/staff'     },
    { label: 'Ver eventos', href: '/events'    },
  ],
  admin: [
    { label: 'Mi cuenta',           href: '/dashboard'       },
    { label: 'Mis eventos',         href: '/dashboard'       },
    { label: 'Panel administrador', href: '/dashboard/admin' },
    { label: 'Staff App',           href: '/staff'           },
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
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/Artboard 1.png" alt="Takilla" width={28} height={28} className="rounded-md" />
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent font-bold text-lg tracking-tight">
              Takilla
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white font-medium hover:from-amber-500 hover:via-orange-600 hover:to-red-700 transition-all"
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
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/Artboard 1.png" alt="Takilla" width={28} height={28} className="rounded-md" />
          <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent font-bold text-lg tracking-tight">
            Takilla
          </span>
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