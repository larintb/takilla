'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export default function FormButton({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      style={style}
      className={`relative overflow-hidden transition-all duration-300 disabled:cursor-not-allowed ${pending ? 'scale-[0.97]' : ''} ${className}`}
    >
      <span
        className={`flex items-center justify-center gap-1.5 transition-all duration-300 ${
          pending ? 'opacity-0 -translate-y-3' : 'opacity-100 translate-y-0'
        }`}
      >
        {children}
      </span>

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