'use client'

import { useFormStatus } from 'react-dom'
import { ShieldCheck, Check } from 'lucide-react'

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
          ? 'bg-emerald-600 scale-[0.98]'
          : 'bg-zinc-900 hover:bg-zinc-700 active:scale-[0.98]'
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
        <Check size={18} strokeWidth={2.5} />
      </span>
    </button>
  )
}
