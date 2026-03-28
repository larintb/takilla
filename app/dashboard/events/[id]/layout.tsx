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
    <div className="min-h-screen bg-zinc-50">

      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/Artboard 1.png"
              alt="Takilla"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent font-bold text-lg tracking-tight">
              Takilla
            </span>
          </Link>

          {/* Back button */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all"
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