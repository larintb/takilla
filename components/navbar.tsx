import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import NavbarUserMenu from './navbar-user-menu'

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getProfileAndTeam(userId: string) {
  const admin = createAdminClient()
  const supabase = createClient(await cookies())

  // Ambas queries en paralelo — sin waterfall
  const [profileResult, teamResult] = await Promise.all([
    admin
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single(),
    supabase
      .from('team_members')
      .select('id')
      .eq('member_user_id', userId)
      .limit(1)
      .maybeSingle(),
  ])

  return {
    profile:   profileResult.data,
    isOnTeam:  !!teamResult.data,
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

const roleLabels: Record<string, string> = {
  customer:  'Cliente',
  organizer: 'Organizador',
  admin:     'Admin',
}

const menuByRole: Record<string, { label: string; href: string }[]> = {
  customer: [
    { label: 'Publicar eventos', href: '/convertirse-organizador'  },
  ],
  customer_staff: [
    { label: 'Staff App',   href: '/staff/team' },
  ],
  organizer: [
    { label: 'Mis eventos', href: '/dashboard'  },
    { label: 'Staff App',   href: '/staff/team' },
  ],
  admin: [
    { label: 'Mis eventos',         href: '/dashboard'       },
    { label: 'Panel administrador', href: '/dashboard/admin' },
    { label: 'Staff App',           href: '/staff/team'      },
  ],
}

// ─── Component ──────────────────────────────────────────────────────────────

export default async function Navbar() {
  const cookieStore = await cookies()
  const supabase    = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  // ── Logged-out header ──────────────────────────────────────────────────
  if (!user) {
    return (
      <header
        className="z-40 sticky top-0"
        style={{
          background:           'rgba(10,10,10,0.85)',
          borderBottom:         '1px solid rgba(255,255,255,0.06)',
          backdropFilter:       'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
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

  // ── Logged-in: fetch profile + team membership in parallel ─────────────
  const { profile, isOnTeam } = await getProfileAndTeam(user.id)

  const role        = profile?.role ?? 'customer'
  const displayName = profile?.full_name || user.email || 'Usuario'

  // Resolve menu key: customers on a team get a different set
  const menuKey  = role === 'customer' && isOnTeam ? 'customer_staff' : role
  const menuItems = menuByRole[menuKey] ?? menuByRole.customer

  return (
    <header
      className="z-40 sticky top-0"
      style={{
        background:           'rgba(10,10,10,0.85)',
        borderBottom:         '1px solid rgba(255,255,255,0.06)',
        backdropFilter:       'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Logo />
        <NavbarUserMenu
          userName={displayName}
          roleLabel={roleLabels[role] ?? 'Cliente'}
          menuItems={menuItems}
        />
      </div>
    </header>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image
        src="/images/logo1.png"
        alt="Takilla"
        width={32}
        height={32}
        className="rounded-lg"
      />
      <span
        className="font-bold text-xl tracking-tight"
        style={{
          background:             'var(--accent-gradient)',
          WebkitBackgroundClip:   'text',
          WebkitTextFillColor:    'transparent',
        }}
      >
        Takilla
      </span>
    </Link>
  )
}