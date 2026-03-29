'use client'

import { useActionState, useTransition, useState, useEffect, useRef, useCallback } from 'react'
import type mapboxgl from 'mapbox-gl'
import { Loader2, MapPin, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { EVENT_IMAGES_BUCKET } from '@/utils/supabase/storage'

export const CATEGORIES = [
  { value: 'musica',      label: 'Música'        },
  { value: 'arte',        label: 'Arte'          },
  { value: 'social',      label: 'Evento social' },
  { value: 'nocturna',    label: 'Vida nocturna' },
  { value: 'deporte',     label: 'Deporte'       },
  { value: 'gastronomia', label: 'Gastronomía'   },
  { value: 'otro',        label: 'Otro'          },
]

// ─── Mapbox location picker with mini map ─────────────────────────────────────

interface MapboxFeature {
  id: string
  place_name: string
  center: [number, number]
}

function LocationPicker({
  defaultLocationName,
  defaultLat,
  defaultLng,
}: {
  defaultLocationName?: string | null
  defaultLat?: number | null
  defaultLng?: number | null
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const [query, setQuery]             = useState(defaultLocationName ?? '')
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([])
  const [selected, setSelected]       = useState<{ name: string; lat: number; lng: number } | null>(
    defaultLocationName && defaultLat && defaultLng
      ? { name: defaultLocationName, lat: defaultLat, lng: defaultLng }
      : null
  )
  const [searching, setSearching]   = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const markerRef      = useRef<mapboxgl.Marker | null>(null)

  // Get user location on mount for proximity bias
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silently ignore if denied
    )
  }, [])

  // Search suggestions
  useEffect(() => {
    if (!query.trim() || query === selected?.name) { setSuggestions([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!token) return
      setSearching(true)
      try {
        const proximity = userCoords
          ? `&proximity=${userCoords.lng},${userCoords.lat}`
          : ''
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&language=es&limit=5&country=mx,us${proximity}`
        )
        const json = await res.json()
        setSuggestions(json.features ?? [])
      } catch { setSuggestions([]) }
      finally { setSearching(false) }
    }, 350)
  }, [query, userCoords, selected?.name, token])

  // Reverse geocode when user moves pin
  const reverseGeocode = useCallback(async (lng: number, lat: number) => {
    if (!token) return
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=es&limit=1`
      )
      const json = await res.json()
      const name = json.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setSelected({ name, lat, lng })
      setQuery(name)
    } catch {
      setSelected(prev => prev ? { ...prev, lat, lng } : { name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng })
    }
  }, [token])

  // Init map when selected changes
  useEffect(() => {
    if (!selected || !mapRef.current || !token) return

    async function initMap() {
      const mapboxgl = (await import('mapbox-gl')).default as typeof import('mapbox-gl').default
      await import('mapbox-gl/dist/mapbox-gl.css')
      ;mapboxgl.accessToken = token

      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo({ center: [selected!.lng, selected!.lat], zoom: 15 })
        if (markerRef.current) markerRef.current.setLngLat([selected!.lng, selected!.lat])
        return
      }

      const map = new mapboxgl.Map({
        container: mapRef.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [selected!.lng, selected!.lat],
        zoom: 15,
        interactive: true,
      })

      // Draggable marker
      const marker = new mapboxgl.Marker({ color: '#f97316', draggable: true })
        .setLngLat([selected!.lng, selected!.lat])
        .addTo(map)

      // Update on drag end
      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat()
        reverseGeocode(lng, lat)
      })

      // Click on map to move marker
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat
        marker.setLngLat([lng, lat])
        reverseGeocode(lng, lat)
      })

      mapInstanceRef.current = map
      markerRef.current = marker
    }

    initMap()
  }, [selected, token, reverseGeocode])

  // Cleanup on unmount
  useEffect(() => {
    return () => { mapInstanceRef.current?.remove() }
  }, [])

  function handleClear() {
    setSelected(null)
    setQuery('')
    setSuggestions([])
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }
    markerRef.current = null
  }

  function handleSelect(feature: MapboxFeature) {
    const [lng, lat] = feature.center
    // Destroy old map so useEffect reinitializes it at new coords
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
    setSelected({ name: feature.place_name, lat, lng })
    setQuery(feature.place_name)
    setSuggestions([])
  }

  const inputClass = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700">Ubicación</label>

      {/* Hidden fields */}
      <input type="hidden" name="location_name" value={selected?.name ?? ''} />
      <input type="hidden" name="location_lat"  value={selected?.lat  ?? ''} />
      <input type="hidden" name="location_lng"  value={selected?.lng  ?? ''} />

      {/* Search input */}
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); if (selected) setSelected(null) }}
          placeholder="Busca una dirección o lugar..."
          className={`${inputClass} pl-8 pr-8`}
          autoComplete="off"
        />
        {(query || selected) && (
          <button type="button" onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-md z-10 relative">
          {suggestions.map(feature => (
            <button
              key={feature.id}
              type="button"
              onClick={() => handleSelect(feature)}
              className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 border-b border-zinc-100 last:border-0 transition-colors"
            >
              <MapPin size={13} className="shrink-0 text-zinc-400" />
              <span className="truncate">{feature.place_name}</span>
            </button>
          ))}
        </div>
      )}

      {searching && (
        <p className="text-xs text-zinc-400 flex items-center gap-1.5">
          <Loader2 size={11} className="animate-spin" /> Buscando...
        </p>
      )}

      {/* Mini map */}
      {selected && (
        <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
          <div ref={mapRef} className="w-full h-48" />
          <div className="px-3 py-2 bg-white border-t border-zinc-100 space-y-0.5">
            <div className="flex items-center gap-2">
              <MapPin size={12} className="text-orange-500 shrink-0" />
              <p className="text-xs text-zinc-700 truncate font-medium">{selected.name}</p>
            </div>
            <p className="text-xs text-zinc-400 pl-5">Arrastra el pin o haz clic en el mapa para ajustar la ubicación</p>
          </div>
        </div>
      )}

      {!token && (
        <p className="text-xs text-red-500">Falta NEXT_PUBLIC_MAPBOX_TOKEN en .env.local</p>
      )}
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

type Props = {
  action: (prevState: { error: string } | null, formData: FormData) => Promise<{ error: string } | null>
  defaultValues?: {
    title?: string
    description?: string
    event_date?: string
    status?: string
    image_url?: string | null
    category?: string | null
    location_name?: string | null
    location_lat?: number | null
    location_lng?: number | null
  }
  submitLabel?: string
  onCancel?: () => void
}

export default function EventForm({ action, defaultValues, submitLabel = 'Guardar', onCancel }: Props) {
  const [state, formAction]                = useActionState(action, null)
  const [isActionPending, startTransition] = useTransition()
  const [uploading, setUploading]          = useState(false)
  const [localError, setLocalError]        = useState<string | null>(null)

  const isPending = uploading || isActionPending

  const defaultDate = defaultValues?.event_date
    ? new Date(defaultValues.event_date).toISOString().slice(0, 16)
    : ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending) return
    setLocalError(null)

    const formData = new FormData(e.currentTarget)
    const imageFile = formData.get('image_file') as File | null
    formData.delete('image_file')

    if (imageFile && imageFile.size > 0) {
      if (!imageFile.type.startsWith('image/')) { setLocalError('El archivo debe ser una imagen válida'); return }
      setUploading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUploading(false); setLocalError('No autorizado'); return }

      const ext = imageFile.name.includes('.') ? (imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg') : 'jpg'
      const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${safeExt}`

      const { error: uploadError } = await supabase.storage
        .from(EVENT_IMAGES_BUCKET)
        .upload(path, imageFile, { contentType: imageFile.type, upsert: false })

      setUploading(false)
      if (uploadError) { setLocalError(`No se pudo subir la imagen: ${uploadError.message}`); return }
      formData.set('image_path', path)
    }

    startTransition(() => formAction(formData))
  }

  const inputClass = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1">
          Título <span className="text-red-500">*</span>
        </label>
        <input id="title" name="title" type="text" required
          defaultValue={defaultValues?.title ?? ''} placeholder="Concierto de Rock en el Parque"
          className={inputClass} />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1">Descripción</label>
        <textarea id="description" name="description" rows={3}
          defaultValue={defaultValues?.description ?? ''} placeholder="Describe el evento..."
          className={`${inputClass} resize-none`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-zinc-700 mb-1">
            Fecha y hora <span className="text-red-500">*</span>
          </label>
          <input id="event_date" name="event_date" type="datetime-local" required
            defaultValue={defaultDate} className={inputClass} />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-zinc-700 mb-1">Estado</label>
          <select id="status" name="status" defaultValue={defaultValues?.status ?? 'draft'} className={inputClass}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-zinc-700 mb-1">Categoría</label>
        <select id="category" name="category" defaultValue={defaultValues?.category ?? 'otro'} className={inputClass}>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <LocationPicker
        defaultLocationName={defaultValues?.location_name}
        defaultLat={defaultValues?.location_lat}
        defaultLng={defaultValues?.location_lng}
      />

      <div>
        <label htmlFor="image_file" className="block text-sm font-medium text-zinc-700 mb-1">Imagen del evento</label>
        {defaultValues?.image_url && (
          <p className="text-xs text-zinc-400 mb-2">Ya tienes una imagen. Sube una nueva para reemplazarla.</p>
        )}
        <input id="image_file" name="image_file" type="file" accept="image/*" className={inputClass} />
        <p className="mt-1 text-xs text-zinc-400">Opcional. Formatos: JPG, PNG, WEBP.</p>
      </div>

      {(localError || state?.error) && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{localError ?? state?.error}</p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={isPending}
          className={`relative overflow-hidden px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white text-sm font-semibold hover:from-amber-500 hover:via-orange-600 hover:to-red-700 transition-all duration-300 disabled:cursor-not-allowed ${isPending ? 'scale-[0.97]' : ''}`}>
          <span className={`flex items-center gap-1.5 transition-all duration-300 ${isPending ? 'opacity-0 -translate-y-3' : 'opacity-100 translate-y-0'}`}>
            {uploading ? 'Subiendo imagen…' : submitLabel}
          </span>
          <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isPending ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <Loader2 size={15} className="animate-spin" />
          </span>
        </button>
      </div>
    </form>
  )
}