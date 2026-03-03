import { resolveMediaUrl } from '../services/api'

const PHOTO_STORAGE_KEY = 'soundstage_attendee_profile_photo'

export const getUserPhotoStorageKey = (user) => {
  return String(user?.id || user?.email || user?.username || 'guest')
}

export const getStoredProfilePhoto = (user) => {
  const serverPhoto = resolveMediaUrl(
    user?.profile_photo || user?.profilePhoto || user?.avatar || user?.photo
  )
  if (serverPhoto) return serverPhoto

  try {
    const savedPhotos = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY) || '{}')
    const key = getUserPhotoStorageKey(user)
    return typeof savedPhotos[key] === 'string' ? savedPhotos[key] : ''
  } catch {
    return ''
  }
}

export const saveStoredProfilePhoto = (user, photoDataUrl) => {
  const key = getUserPhotoStorageKey(user)
  const savedPhotos = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY) || '{}')
  savedPhotos[key] = photoDataUrl
  localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(savedPhotos))
}
