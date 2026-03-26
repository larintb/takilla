'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LinkButton({
  href,
  children,
  className = '',
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`relative overflow-hidden transition-all duration-300 disabled:cursor-not-allowed ${isPending ? 'scale-[0.97]' : ''} ${className}`}
    >
      <span
        className={`flex items-center gap-1.5 justify-center transition-all duration-300 ${
          isPending ? 'opacity-0 -translate-y-3' : 'opacity-100 translate-y-0'
        }`}
      >
        {children}
      </span>
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          isPending ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <Loader2 size={16} className="animate-spin" />
      </span>
    </button>
  )
}
