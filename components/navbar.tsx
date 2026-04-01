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
      <header style={{ background: 'rgba(20,10,42,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} className="relative z-40 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/images/logo1.png" alt="Takilla" width={32} height={32} className="rounded-lg" />
            <span
              className="font-bold text-xl tracking-tight"
              style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Takilla
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl font-medium transition-all hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2 rounded-xl font-semibold text-white transition-all hover:opacity-90 shadow-lg"
              style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 20px rgba(249,115,22,0.3)' }}
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

  const baseMenuByRole: Record<string, { label: string; href: string }[]> = {
    customer: [
      { label: 'Mi cuenta',   href: '/dashboard' },
      { label: 'Ver eventos', href: '/events'    },
    ],
    organizer: [
      { label: 'Mi cuenta',   href: '/dashboard'  },
      { label: 'Mis eventos', href: '/dashboard'  },
      { label: 'Staff App',   href: '/staff/team' },
      { label: 'Ver eventos', href: '/events'     },
    ],
    admin: [
      { label: 'Mi cuenta',           href: '/dashboard'       },
      { label: 'Mis eventos',         href: '/dashboard'       },
      { label: 'Panel administrador', href: '/dashboard/admin' },
      { label: 'Staff App',           href: '/staff/team'      },
    ],
  }

  let menuItems = baseMenuByRole[role] ?? baseMenuByRole.customer

  if (role === 'customer') {
    const { data: teamEntry } = await supabase
      .from('team_members')
      .select('id')
      .eq('member_user_id', user.id)
      .limit(1)
      .single()

    if (teamEntry) {
      menuItems = [
        { label: 'Mi cuenta',   href: '/dashboard'  },
        { label: 'Staff App',   href: '/staff/team' },
        { label: 'Ver eventos', href: '/events'     },
      ]
    }
  }

  return (
    <header style={{ background: 'rgba(20,10,42,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} className="relative z-40 sticky top-0">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo1.png" alt="Takilla" width={32} height={32} className="rounded-lg" />
          <span
            className="font-bold text-xl tracking-tight"
            style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
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