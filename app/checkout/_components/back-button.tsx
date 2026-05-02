'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton({ href, hasPayment }: { href: string; hasPayment: boolean }) {
  const router = useRouter()

  function handleClick(e: React.MouseEvent) {
    if (!hasPayment) return
    e.preventDefault()
    const ok = window.confirm(
      'Si sales del checkout perderás el tiempo de reserva y posiblemente los boletos. ¿Deseas salir?'
    )
    if (ok) router.push(href)
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
      style={{ color: 'rgba(255,255,255,0.4)' }}
    >
      <ArrowLeft size={14} />
      Volver al evento
    </a>
  )
}
