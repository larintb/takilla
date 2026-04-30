import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

export default function EventsNavbar() {
  return (
    <header
      className="z-40 sticky top-0"
      style={{
        background:           'black',
        borderBottom:         '1px solid rgba(255,255,255,0.06)',
        backdropFilter:       'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
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
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <ArrowLeft size={14} />
          Mis eventos
        </Link>
      </div>
    </header>
  )
}