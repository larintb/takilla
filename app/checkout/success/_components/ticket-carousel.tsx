'use client'

import { useRef, useState } from 'react'

export default function TicketCarousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  function onMouseDown(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    setIsDragging(true)
    startX.current = e.pageX - el.offsetLeft
    scrollLeft.current = el.scrollLeft
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging) return
    const el = ref.current
    if (!el) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = x - startX.current
    el.scrollLeft = scrollLeft.current - walk
  }

  function stopDrag() {
    const el = ref.current
    if (!el) return
    setIsDragging(false)
    el.style.cursor = 'grab'
    el.style.userSelect = ''
  }

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-4 pb-4 scroll-smooth cursor-grab select-none"
    >
      {children}
    </div>
  )
}
