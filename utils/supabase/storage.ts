import type { SupabaseClient } from '@supabase/supabase-js'

const EVENT_IMAGES_BUCKET = 'event-images'

function normalizeEventImagePath(rawValue: string) {
  let value = rawValue.trim()
  if (!value) return null

  // Keep external images as-is.
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value)
      const marker = `/storage/v1/object/public/${EVENT_IMAGES_BUCKET}/`
      const index = url.pathname.indexOf(marker)

      if (index === -1) return value

      return decodeURIComponent(url.pathname.slice(index + marker.length))
    } catch {
      return value
    }
  }

  if (value.startsWith('/')) {
    value = value.slice(1)
  }

  const publicPrefix = `storage/v1/object/public/${EVENT_IMAGES_BUCKET}/`
  if (value.startsWith(publicPrefix)) {
    return decodeURIComponent(value.slice(publicPrefix.length))
  }

  const bucketPrefix = `${EVENT_IMAGES_BUCKET}/`
  if (value.startsWith(bucketPrefix)) {
    return decodeURIComponent(value.slice(bucketPrefix.length))
  }

  return decodeURIComponent(value)
}

export function resolveEventImageUrl(
  supabase: SupabaseClient,
  imageValue?: string | null
) {
  const value = imageValue?.trim()
  if (!value) return null

  const normalizedPath = normalizeEventImagePath(value)
  if (!normalizedPath) return null

  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath
  }

  const { data } = supabase.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(normalizedPath)
  return data.publicUrl
}

export { EVENT_IMAGES_BUCKET }
