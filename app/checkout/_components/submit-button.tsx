'use client'

import { useFormStatus } from 'react-dom'
import { ShieldCheck, Loader2 } from 'lucide-react'

export default function SubmitButton({
  label,
}: {
  label: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`
        relative w-full h-14 rounded-2xl text-white font-bold text-base
        overflow-hidden transition-all duration-300
        ${pending
          ? 'bg-gradient-to-r from-orange-500 to-purple-700 scale-[0.98]'
          : 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-700 hover:from-orange-600 hover:via-pink-600 hover:to-purple-800 active:scale-[0.98]'
        }
      `}
    >
      {/* Label â€” slides out when pending */}
      <span
        className={`flex items-center justify-center gap-2 transition-all duration-300 ${
          pending ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <ShieldCheck size={16} className="opacity-70" />
        {label}
      </span>

      {/* Checkmark â€” slides in when pending */}
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          pending ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <Loader2 size={18} className="animate-spin" />
      </span>
    </button>
  )
}

