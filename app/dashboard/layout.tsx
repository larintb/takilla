import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from './_components/logout-button'
import { Ticket } from 'lucide-react'

const roleBadge: Record<string, string> = {
  admin:     'bg-red-100 text-red-700',
  organizer: 'bg-blue-100 text-blue-700',
  customer:  'bg-zinc-100 text-zinc-600',
}

const roleLabel: Record<string, string> = {
  admin:     'Admin',
  organizer: 'Organizador',
  customer:  'Cliente',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'customer'

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-zinc-900">
              <Ticket size={18} />
              Takilla
            </Link>

            <nav className="flex items-center gap-4 text-sm">
              {role === 'customer' && (
                <Link href="/dashboard/tickets" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                  Mis boletos
                </Link>
              )}
              {role === 'organizer' && (
                <Link href="/dashboard/events" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                  Mis eventos
                </Link>
              )}
              {role === 'admin' && (
                <>
                  <Link href="/dashboard/admin" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                    Solicitudes
                  </Link>
                  <Link href="/dashboard/events" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                    Eventos
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[role]}`}>
              {roleLabel[role]}
            </span>
            <span className="text-sm text-zinc-700">{profile?.full_name ?? user.email}</span>
            <LogoutButton />
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
