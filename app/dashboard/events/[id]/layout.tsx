import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ArrowLeft } from 'lucide-react'

export default async function EventDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Header */}
      <header className="border-b" style={{ background: 'rgba(20,10,42,0.9)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo1.png"
              alt="Takilla"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span
              className="font-bold text-lg tracking-tight"
              style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Takilla
            </span>
          </Link>

          {/* Back button */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <ArrowLeft size={14} />
            Mis eventos
          </Link>

        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {children}
      </div>

    </div>
  )
}