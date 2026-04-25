import type { SupabaseClient } from '@supabase/supabase-js'

export const EVENT_IMAGES_BUCKET  = 'event-images'
export const AVATARS_BUCKET        = 'profile-avatars'
export const BANNERS_BUCKET        = 'profile-banners'
export const REVIEW_PHOTOS_BUCKET  = 'review-photos'

function normalizeStoragePath(rawValue: string, bucket: string): string | null {
  let value = rawValue.trim()
  if (!value) return null

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value)
      const marker = `/storage/v1/object/public/${bucket}/`
      const index = url.pathname.indexOf(marker)
      if (index === -1) return value
      return decodeURIComponent(url.pathname.slice(index + marker.length))
    } catch {
      return value
    }
  }

  if (value.startsWith('/')) value = value.slice(1)

  const publicPrefix = `storage/v1/object/public/${bucket}/`
  if (value.startsWith(publicPrefix)) return decodeURIComponent(value.slice(publicPrefix.length))

  const bucketPrefix = `${bucket}/`
  if (value.startsWith(bucketPrefix)) return decodeURIComponent(value.slice(bucketPrefix.length))

  return decodeURIComponent(value)
}

function resolveStorageUrl(supabase: SupabaseClient, bucket: string, rawValue?: string | null): string | null {
  const value = rawValue?.trim()
  if (!value) return null
  const path = normalizeStoragePath(value, bucket)
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export function resolveEventImageUrl(supabase: SupabaseClient, imageValue?: string | null) {
  return resolveStorageUrl(supabase, EVENT_IMAGES_BUCKET, imageValue)
}

export function resolveAvatarUrl(supabase: SupabaseClient, avatarValue?: string | null) {
  return resolveStorageUrl(supabase, AVATARS_BUCKET, avatarValue)
}

export function resolveBannerUrl(supabase: SupabaseClient, bannerValue?: string | null) {
  return resolveStorageUrl(supabase, AVATARS_BUCKET, bannerValue)
}

export function resolveReviewPhotoUrl(supabase: SupabaseClient, photoValue?: string | null) {
  return resolveStorageUrl(supabase, REVIEW_PHOTOS_BUCKET, photoValue)
}
