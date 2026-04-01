'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  x: number; y: number
  vx: number; vy: number
  size: number; color: string
  rotation: number; rotationSpeed: number
  opacity: number; shape: 'rect' | 'circle'
}

const COLORS = ['#ff6e01', '#fa1492', '#720d98', '#f97316', '#ec4899', '#a855f7', '#fff']

export default function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Two burst origins — left and right thirds of screen
    const origins = [
      { x: canvas.width * 0.3, y: canvas.height * 0.45 },
      { x: canvas.width * 0.7, y: canvas.height * 0.45 },
    ]

    const particles: Particle[] = Array.from({ length: 160 }, (_, i) => {
      const origin = origins[i % 2]
      const angle  = Math.random() * Math.PI * 2
      const speed  = Math.random() * 9 + 3
      return {
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: Math.random() * 9 + 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.25,
        opacity: 1,
        shape: Math.random() > 0.45 ? 'rect' : 'circle',
      }
    })

    const DURATION = 3200
    let startTime: number | null = null
    let animId: number

    function draw(ts: number) {
      if (!startTime) startTime = ts
      const elapsed  = ts - startTime
      const progress = Math.min(elapsed / DURATION, 1)

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      for (const p of particles) {
        p.x  += p.vx
        p.y  += p.vy
        p.vy += 0.18          // gravity
        p.vx *= 0.99          // slight drag
        p.rotation += p.rotationSpeed
        p.opacity = Math.max(0, 1 - progress * progress * 1.6)

        ctx!.save()
        ctx!.globalAlpha = p.opacity
        ctx!.translate(p.x, p.y)
        ctx!.rotate(p.rotation)
        ctx!.fillStyle = p.color

        if (p.shape === 'rect') {
          ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx!.beginPath()
          ctx!.ellipse(0, 0, p.size / 2, p.size / 4, 0, 0, Math.PI * 2)
          ctx!.fill()
        }

        ctx!.restore()
      }

      if (progress < 1) animId = requestAnimationFrame(draw)
      else ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />
}
