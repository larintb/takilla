'use client'

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export default function Toggle({ checked, onChange, label, disabled }: Props) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <span className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(e.target.checked)}
        />
        <div
          className="w-10 h-6 rounded-full transition-all duration-200 peer-checked:opacity-100"
          style={{
            background: checked ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        />
        <div
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </span>
      {label && (
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      )}
    </label>
  )
}
