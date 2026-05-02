import Image from 'next/image'

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

type Props = {
  name?: string | null
  src?: string | null
  size?: number
  className?: string
}

export default function Avatar({ name, src, size = 36, className = '' }: Props) {
  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center shrink-0 font-bold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.35, background: 'rgba(255,255,255,0.09)', minWidth: size }}
    >
      {src ? (
        <Image src={src} alt={name ?? ''} width={size} height={size} className="object-cover w-full h-full" unoptimized />
      ) : (
        initials(name)
      )}
    </div>
  )
}
