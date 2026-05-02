'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type Props = {
  bucket: string
  currentUrl?: string | null
  onUpload: (storagePath: string) => void
  size?: number
}

export default function AvatarUpload({ bucket, currentUrl, onUpload, size = 80 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
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

    const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false })
    if (uploadErr) { setError('Error al subir imagen.'); setUploading(false); return }

    setPreview(URL.createObjectURL(file))
    onUpload(path)
    setUploading(false)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative rounded-full overflow-hidden flex items-center justify-center group"
        style={{ width: size, height: size, background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.12)' }}
      >
        {preview ? (
          <Image src={preview} alt="Avatar" fill className="object-cover" unoptimized />
        ) : (
          <Camera size={size * 0.3} style={{ color: 'rgba(255,255,255,0.35)' }} />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading
            ? <Loader2 size={size * 0.25} className="animate-spin text-white" />
            : <Camera size={size * 0.25} className="text-white" />
          }
        </div>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {error && <p className="text-xs" style={{ color: '#fca5a5' }}>{error}</p>}
    </div>
  )
}
