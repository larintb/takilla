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
        relative w-full py-3 rounded-xl text-white font-semibold
        overflow-hidden transition-all duration-300
        ${pending
          ? 'bg-gradient-to-r from-orange-500 to-red-600 scale-[0.98]'
          : 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 hover:from-amber-500 hover:via-orange-600 hover:to-red-700 active:scale-[0.98]'
        }
      `}
    >
      {/* Label — slides out when pending */}
      <span
        className={`flex items-center justify-center gap-2 transition-all duration-300 ${
          pending ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <ShieldCheck size={16} className="opacity-70" />
        {label}
      </span>

      {/* Checkmark — slides in when pending */}
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
