import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { Ticket } from 'lucide-react'

export default async function EventsLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/events" className="flex items-center gap-2 font-bold text-zinc-900">
            <Ticket size={18} />
            Takilla
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-700 transition-colors"
              >
                Mi cuenta
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                  Iniciar sesión
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-700 transition-colors"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-10">
        {children}
      </main>
    </div>
  )
}
