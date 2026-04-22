'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

type Props =
  | { interactive: true; value: number; onChange: (n: number) => void; size?: number }
  | { interactive?: false; value: number; onChange?: never; size?: number }

export default function StarRating({ interactive, value, onChange, size = 20 }: Props) {
  const [hovered, setHovered] = useState(0)

  if (!interactive) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
          <Star
            key={n}
            size={size}
            fill={n <= value ? '#fbbf24' : 'none'}
            color={n <= value ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map(n => {
        const lit = n <= (hovered || value)
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n)}
            onMouseEnter={() => setHovered(n)}
            className="transition-transform hover:scale-110 active:scale-95"
            aria-label={`${n} estrella${n !== 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              fill={lit ? '#fbbf24' : 'none'}
              color={lit ? '#fbbf24' : 'rgba(255,255,255,0.3)'}
            />
          </button>
        )
      })}
    </div>
  )
}
