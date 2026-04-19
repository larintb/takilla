'use client'

import { useActionState, useTransition, useState, useMemo } from 'react'
import Image from 'next/image'
import type mapboxgl from 'mapbox-gl'
import { useRef, useEffect, useCallback } from 'react'
import { Loader2, MapPin, X, CalendarDays, Eye } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { EVENT_IMAGES_BUCKET } from '@/utils/supabase/storage'
import DateTimePicker from '@/app/dashboard/events/new/_components/date-time-picker'

export const CATEGORIES = [
  { value: 'musica',   label: 'Música'        },
  { value: 'arte',     label: 'Arte'          },
  { value: 'social',   label: 'Evento social' },
  { value: 'nocturna', label: 'Vida nocturna' },
  { value: 'otro',     label: 'Otro'          },
]

// ─── Mapbox location picker ───────────────────────────────────────────────────

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

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  useEffect(() => {
    if (!query.trim() || query === selected?.name) { setSuggestions([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!token) return
      setSearching(true)
      try {
        const proximity = userCoords ? `&proximity=${userCoords.lng},${userCoords.lat}` : ''
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&language=es&limit=5&country=mx,us${proximity}`
        )
        const json = await res.json()
        setSuggestions(json.features ?? [])
      } catch { setSuggestions([]) }
      finally { setSearching(false) }
    }, 350)
  }, [query, userCoords, selected?.name, token])

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
        antialias: false,
        fadeDuration: 100,
        maxTileCacheSize: 20,
      })

      const marker = new mapboxgl.Marker({ color: '#f97316', draggable: true })
        .setLngLat([selected!.lng, selected!.lat])
        .addTo(map)

      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat()
        reverseGeocode(lng, lat)
      })

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
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
    const [lng, lat] = feature.center
    setSelected({ name: feature.place_name, lat, lng })
    setQuery(feature.place_name)
    setSuggestions([])
  }

  const inputClass = "w-full rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-purple-300">
        Ubicación <span className="text-orange-400">*</span>
      </label>
      <input type="hidden" name="location_name" value={selected?.name ?? ''} />
      <input type="hidden" name="location_lat"  value={selected?.lat  ?? ''} />
      <input type="hidden" name="location_lng"  value={selected?.lng  ?? ''} />

      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/50 pointer-events-none" />
        <input
          type="text" value={query}
          onChange={e => { setQuery(e.target.value); if (selected) setSelected(null) }}
          placeholder="Busca una dirección o lugar..."
          className={`${inputClass} pl-8 pr-8`}
          autoComplete="off"
        />
        {(query || selected) && (
          <button type="button" onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/50 hover:text-white transition-colors">
            <X size={13} />
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="border border-purple-700/40 rounded-xl overflow-hidden bg-[#1a1035] shadow-lg z-10 relative">
          {suggestions.map(feature => (
            <button key={feature.id} type="button" onClick={() => handleSelect(feature)}
              className="w-full text-left px-4 py-2.5 text-sm text-purple-200 hover:bg-orange-500/10 hover:text-orange-300 flex items-center gap-2 border-b border-purple-700/30 last:border-0 transition-colors">
              <MapPin size={13} className="shrink-0 text-purple-400/50" />
              <span className="truncate">{feature.place_name}</span>
            </button>
          ))}
        </div>
      )}

      {searching && (
        <p className="text-xs text-purple-400/60 flex items-center gap-1.5">
          <Loader2 size={11} className="animate-spin" /> Buscando...
        </p>
      )}

      {selected && (
        <div className="rounded-xl overflow-hidden border border-purple-700/40">
          <div ref={mapRef} className="w-full h-48" />
          <div className="px-3 py-2 bg-white/5 border-t border-purple-700/30 space-y-0.5">
            <div className="flex items-center gap-2">
              <MapPin size={12} className="text-orange-400 shrink-0" />
              <p className="text-xs text-white truncate font-medium">{selected.name}</p>
            </div>
            <p className="text-xs text-purple-400/50 pl-5">Arrastra el pin o haz clic en el mapa para ajustar</p>
          </div>
        </div>
      )}

      {!token && <p className="text-xs text-red-400">Falta NEXT_PUBLIC_MAPBOX_TOKEN en .env.local</p>}
    </div>
  )
}

// ─── Image Preview ────────────────────────────────────────────────────────────

function ImagePreview({ previewUrl, title, eventDate }: {
  previewUrl: string
  title: string
  eventDate: string
}) {
  const dateStr = eventDate
    ? new Date(eventDate).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : 'Fecha del evento'

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 uppercase tracking-widest">
        <Eye size={12} />
        Vista previa
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <p className="text-xs text-purple-400/60">Página del evento</p>
          <div className="relative w-full h-40 rounded-xl overflow-hidden bg-zinc-900">
            {previewUrl && (
              <>
                <Image src={previewUrl} alt="" aria-hidden
                  fill
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-50"
                  sizes="(max-width: 768px) 100vw, 50vw" />
                <Image src={previewUrl} alt={title}
                  fill
                  className="absolute inset-0 w-full h-full object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw" />
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white font-bold text-sm leading-tight line-clamp-1 drop-shadow">
                {title || 'Título del evento'}
              </p>
              <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1">
                <CalendarDays size={10} />
                {dateStr}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-purple-400/60">Tarjeta en listado</p>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="relative h-28 overflow-hidden">
              {previewUrl && (
                <Image src={previewUrl} alt={title}
                  fill
                  className="w-full h-full object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw" />
              )}
            </div>
            <div className="p-3 space-y-1">
              <p className="font-semibold text-white text-sm leading-snug line-clamp-1">
                {title || 'Título del evento'}
              </p>
              <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <CalendarDays size={11} className="text-orange-400" />
                {dateStr}
              </p>
              <p className="text-xs font-bold pt-1" style={{ color: '#f97316' }}>
                Desde $0.00
              </p>
            </div>
          </div>
        </div>
      </div>
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
    event_end_date?: string
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

export default function EventEditForm({ action, defaultValues }: Props) {
  const [state, formAction]                = useActionState<{ error: string } | null, FormData>(action, null)
  const [isActionPending, startTransition] = useTransition()
  const [uploading, setUploading]          = useState(false)
  const [localError, setLocalError]        = useState<string | null>(null)
  const [liveTitle, setLiveTitle]          = useState(defaultValues?.title ?? '')
  const liveDate                            = defaultValues?.event_date ?? ''

  const isPending = uploading || isActionPending

  const imageUrl = defaultValues?.image_url

  const initialPreviewUrl = useMemo(() => {
    if (imageUrl) {
      const supabase = createClient()
      const { data } = supabase.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(imageUrl)
      return data?.publicUrl || null
    }
    return null
  }, [imageUrl])

  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending) return
    setLocalError(null)

    const form = e.currentTarget
    const skipValidation = form.dataset.skipValidation === 'true'
    delete form.dataset.skipValidation

    const formData = new FormData(form)
    const imageFile = formData.get('image_file') as File | null
    formData.delete('image_file')
    formData.set('status', 'draft')

    if (!skipValidation) {
      const startISO = formData.get('event_date') as string
      const endISO   = formData.get('event_end_date') as string

      if (!startISO) { setLocalError('Selecciona la fecha y hora de inicio'); return }
      if (!endISO)   { setLocalError('Selecciona la fecha y hora de fin'); return }

      if (new Date(endISO) <= new Date(startISO)) {
        setLocalError('La hora de fin debe ser después de la hora de inicio')
        return
      }

      const locationName = formData.get('location_name') as string
      if (!locationName?.trim()) {
        setLocalError('La ubicación es obligatoria')
        return
      }

      const hasExistingImage = !!defaultValues?.image_url
      const hasNewImage = imageFile && imageFile.size > 0
      if (!hasExistingImage && !hasNewImage) {
        setLocalError('La imagen del evento es obligatoria')
        return
      }
    }

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

  const inputClass = "w-full rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"

  return (
    <form
      id="event-edit-form"
      onSubmit={handleSubmit}
      data-has-image={defaultValues?.image_url ? 'true' : ''}
      className="bg-white/5 rounded-2xl border border-purple-700/40 p-6 space-y-5"
    >
      {/* Título */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-purple-300 mb-1">
          Título <span className="text-orange-400">*</span>
        </label>
        <input id="title" name="title" type="text" required
          defaultValue={defaultValues?.title ?? ''}
          placeholder="Concierto de Rock en el Parque"
          onChange={e => setLiveTitle(e.target.value)}
          className={inputClass} />
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-purple-300 mb-1">
          Descripción <span className="text-orange-400">*</span>
        </label>
        <textarea id="description" name="description" rows={6}
          defaultValue={defaultValues?.description ?? ''} placeholder="Describe el evento..."
          className={`${inputClass} resize-y`} />
      </div>

      {/* Fecha inicio + Fecha fin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateTimePicker
          label="Inicio del evento"
          nameDate="event_date"
          required
          minDate={new Date()}
          defaultValue={defaultValues?.event_date}
        />
        <DateTimePicker
          label="Fin del evento"
          nameDate="event_end_date"
          required
          minDate={new Date()}
          defaultValue={defaultValues?.event_end_date}
        />
      </div>

      {/* Categoría */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-purple-300 mb-1">
          Categoría <span className="text-orange-400">*</span>
        </label>
        <select id="category" name="category" required
          defaultValue={defaultValues?.category ?? 'otro'}
          className={`${inputClass} [&>option]:bg-[#1a1035] [&>option]:text-white`}>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Ubicación */}
      <LocationPicker
        defaultLocationName={defaultValues?.location_name}
        defaultLat={defaultValues?.location_lat}
        defaultLng={defaultValues?.location_lng}
      />

      {/* Imagen del evento */}
      <div>
        <label htmlFor="image_file" className="block text-sm font-medium text-purple-300 mb-1">
          Imagen del evento <span className="text-orange-400">*</span>
        </label>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
          <p className="text-xs text-purple-400/50">
            Tamaño recomendado: <span className="text-purple-300/70 font-medium">1200 × 630 px</span>
          </p>
          <p className="text-xs text-purple-400/50">
            Relación de aspecto: <span className="text-purple-300/70 font-medium">16:9</span>
          </p>
          <p className="text-xs text-purple-400/50">
            Peso máximo: <span className="text-purple-300/70 font-medium">5 MB</span>
          </p>
        </div>

        {defaultValues?.image_url && (
          <p className="text-xs text-purple-400/50 mb-2">Ya tienes una imagen. Sube una nueva para reemplazarla.</p>
        )}

        <input
          id="image_file" name="image_file" type="file" accept="image/*"
          onChange={handleImageChange}
          className="w-full rounded-lg border border-purple-700/40 bg-white/5 px-3 py-2 text-sm text-purple-300 file:mr-3 file:rounded-md file:border-0 file:bg-orange-500/20 file:px-3 file:py-1 file:text-xs file:font-medium file:text-orange-300 hover:file:bg-orange-500/30 transition-all cursor-pointer"
        />
        <p className="mt-1 text-xs text-purple-400/50">Formatos: JPG, PNG, WEBP.</p>

        {previewUrl && (
          <ImagePreview
            previewUrl={previewUrl}
            title={liveTitle}
            eventDate={liveDate}
          />
        )}
      </div>

      {(localError || state?.error) && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
          {localError ?? state?.error}
        </p>
      )}

    </form>
  )
}