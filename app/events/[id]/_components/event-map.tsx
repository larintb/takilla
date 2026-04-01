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
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 15,
        interactive: false, // desactivado para que el click llegue al wrapper
      })

      new mapboxgl.Marker({ color: '#f97316' })
        .setLngLat([lng, lat])
        .addTo(map)

      mapInstanceRef.current = map
    }

    initMap()

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [lat, lng])

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  const appleMapsUrl  = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm">

      {/* Map clickable area */}
      <div
        className="relative cursor-pointer group"
        onClick={() => setShowPrompt(true)}
      >
        <div ref={mapRef} className="w-full h-56" />

        {/* Hover hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm text-zinc-700 text-xs font-medium px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
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
          className="w-full px-3 py-2.5 bg-white border-t border-zinc-100 flex items-center gap-2 hover:bg-orange-50 transition-colors group"
        >
          <MapPin size={13} className="text-orange-500 shrink-0" />
          <p className="text-sm text-zinc-700 truncate text-left group-hover:text-orange-600 transition-colors">
            {locationName}
          </p>
          <Navigation size={12} className="text-zinc-300 group-hover:text-orange-400 shrink-0 ml-auto transition-colors" />
        </button>
      )}

      {/* Prompt modal */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPrompt(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">

            <div className="px-5 pt-5 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-900">Abrir ubicación</p>
                  {locationName && (
                    <p className="text-sm text-zinc-500 mt-0.5 line-clamp-2">{locationName}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors shrink-0"
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
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-zinc-200 hover:border-orange-300 hover:bg-orange-50 transition-all group"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
                  <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
                <div className="text-left">
                  <p className="text-sm font-semibold text-zinc-900 group-hover:text-orange-700">Google Maps</p>
                  <p className="text-xs text-zinc-400">Abrir con Google Maps</p>
                </div>
              </a>

              {/* Apple Maps */}
              <a
                href={appleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPrompt(false)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-zinc-200 hover:border-orange-300 hover:bg-orange-50 transition-all group"
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
                  <p className="text-sm font-semibold text-zinc-900 group-hover:text-orange-700">Apple Maps</p>
                  <p className="text-xs text-zinc-400">Abrir con Apple Maps</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}