'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { AVATARS_BUCKET } from '@/utils/supabase/storage'

type Props = {
  currentUrl?: string | null
  onUpload: (storagePath: string | null) => void
}

export default function BannerUpload({ currentUrl, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(() => {
    if (!currentUrl) return null
    if (currentUrl.startsWith('http')) return currentUrl
    const supabase = createClient()
    const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(currentUrl)
    return data.publicUrl
  })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Solo se aceptan imágenes.'); return }
    setError('')
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No autenticado.'); setUploading(false); return }

    const ext = /^[a-z0-9]+$/.test(file.name.split('.').pop() ?? '') ? file.name.split('.').pop() : 'jpg'
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadErr) { setError('Error al subir imagen.'); setUploading(false); return }

    const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)
    setPreview(data.publicUrl)
    onUpload(path)
    setUploading(false)
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    setPreview(null)
    onUpload(null)
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative w-full overflow-hidden rounded-2xl flex items-center justify-center group transition-all"
        style={{
          height: 160,
          background: preview ? 'transparent' : 'rgba(255,255,255,0.04)',
          border: preview ? 'none' : '2px dashed rgba(255,255,255,0.12)',
        }}
      >
        {preview ? (
          <>
            <Image src={preview} alt="Banner" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {uploading
                ? <Loader2 size={22} className="animate-spin text-white" />
                : <><ImagePlus size={20} className="text-white" /><span className="text-white text-sm font-semibold">Cambiar banner</span></>
              }
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {uploading
              ? <Loader2 size={24} className="animate-spin" />
              : <>
                  <ImagePlus size={24} />
                  <span className="text-sm font-medium">Subir banner</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Recomendado: 1500×500px</span>
                </>
            }
          </div>
        )}
      </button>

      {preview && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <X size={12} /> Quitar banner
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="text-xs" style={{ color: '#fca5a5' }}>{error}</p>}
    </div>
  )
}
