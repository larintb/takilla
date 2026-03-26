'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export default function FormButton({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`relative overflow-hidden transition-all duration-300 disabled:cursor-not-allowed ${pending ? 'scale-[0.97]' : ''} ${className}`}
    >
      {/* Label — slides up on pending */}
      <span
        className={`flex items-center gap-1.5 transition-all duration-300 ${
          pending ? 'opacity-0 -translate-y-3' : 'opacity-100 translate-y-0'
        }`}
      >
        {children}
      </span>

      {/* Spinner — slides up into view on pending */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          pending ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <Loader2 size={15} className="animate-spin" />
      </span>
    </button>
  )
}
