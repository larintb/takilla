'use client'

import { useEffect, useRef, useState } from 'react'
import type mapboxgl from 'mapbox-gl'
import { MapPin, Navigation, X } from 'lucide-react'

export default function EventMap({
  lat,
  lng,
  locationName,
}: {
  lat: number
  lng: number
  locationName?: string | null
}) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const animFrameRef   = useRef<number | null>(null)
  const timeout3Ref    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token || !mapRef.current) return

    async function initMap() {
      const mapboxgl = (await import('mapbox-gl')).default as typeof import('mapbox-gl').default
      await import('mapbox-gl/dist/mapbox-gl.css')
      ;mapboxgl.accessToken = token

      if (mapInstanceRef.current) return

      const map = new mapboxgl.Map({
        container: mapRef.current!,
        style: 'mapbox://styles/mapbox/standard',
        center: [lng, lat],
        zoom: 12,          // start close — avoids loading world tiles
        pitch: 0,
        bearing: 0,
        interactive: false,
        antialias: false,  // disable MSAA — big GPU win on mobile
        fadeDuration: 100,
        maxTileCacheSize: 30,
      })

      mapInstanceRef.current = map

      map.on('load', () => {
        map.setConfigProperty('basemap', 'lightPreset', 'dusk')

        new mapboxgl.Marker({ color: '#ff6e01' })
          .setLngLat([lng, lat])
          .addTo(map)

        // ── Fase 1: acercamiento cinematográfico ──────────────────────
        map.flyTo({
          center: [lng, lat],
          zoom: 16.6,
          pitch: 50,
          bearing: -20,
          duration: 4000,
          easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        })

        // // ── Fase 2: vista de dron ─────────────────────────────────────
        // timeout2Ref.current = setTimeout(() => {
        //   if (!mapInstanceRef.current) return
        //   map.easeTo({
        //     zoom: 17,
        //     pitch: 55,   // reduced from 65 — fewer tiles in perspective
        //     bearing: 0,
        //     duration: 2000,
        //   })
        // }, 4200)

        // ── Fase 3: órbita 360 ────────────────────────────────────────
        timeout3Ref.current = setTimeout(() => {
          if (!mapInstanceRef.current) return
          let startTime: number | null = null
          const startBearing = map.getBearing()

          function rotate(timestamp: number) {
            if (!mapInstanceRef.current) return
            if (!startTime) startTime = timestamp
            const elapsed = timestamp - startTime
            const bearing = startBearing + (elapsed / 15000) * 360
            map.jumpTo({ bearing: bearing % 360 })
            animFrameRef.current = requestAnimationFrame(rotate)
          }

          animFrameRef.current = requestAnimationFrame(rotate)
        }, 4400)
      })
    }

    // Defer init until the map container is scrolled into view
    const el = mapRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          initMap()
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)

    return () => {
      const t3 = timeout3Ref.current
      const frame = animFrameRef.current
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
      if (t3) clearTimeout(t3)
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [lat, lng])

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  const appleMapsUrl  = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Map clickable area */}
      <div
        className="relative cursor-pointer group"
        onClick={() => setShowPrompt(true)}
      >
        <div ref={mapRef} className="w-full h-72" />

        {/* Hover hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
            <Navigation size={11} />
            Abrir en mapas
          </span>
        </div>
      </div>

      {/* Address bar */}
      {locationName && (
        <button
          type="button"
          onClick={() => setShowPrompt(true)}
          className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-white/5 transition-colors group"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <MapPin size={13} className="shrink-0" style={{ color: 'var(--color-pink)' }} />
          <p className="text-sm truncate text-left transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {locationName}
          </p>
          <Navigation size={12} className="shrink-0 ml-auto transition-colors" style={{ color: 'rgba(255,255,255,0.2)' }} />
        </button>
      )}

      {/* Prompt modal */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPrompt(false)}
          />
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            style={{ background: 'var(--surface-panel)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">Abrir ubicación</p>
                  {locationName && (
                    <p className="text-sm mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{locationName}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="p-1 rounded-lg transition-colors hover:bg-white/10"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="px-4 pb-5 space-y-2">
              {/* Google Maps */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPrompt(false)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
                  <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Google Maps</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Abrir con Google Maps</p>
                </div>
              </a>

              {/* Apple Maps */}
              <a
                href={appleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPrompt(false)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="5" fill="url(#appleGrad)"/>
                  <path d="M12 4C8.69 4 6 6.69 6 10c0 4.5 6 10 6 10s6-5.5 6-10c0-3.31-2.69-6-6-6z" fill="white"/>
                  <circle cx="12" cy="10" r="2" fill="url(#appleGrad)"/>
                  <defs>
                    <linearGradient id="appleGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4facfe"/>
                      <stop offset="1" stopColor="#00f2fe"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Apple Maps</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Abrir con Apple Maps</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
