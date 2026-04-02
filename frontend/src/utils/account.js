export const getInitialsFromWords = (
  value,
  { fallback = 'SS', singleWordMode = 'first-two' } = {}
) => {
  if (!value) return fallback

  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return fallback

  const first = parts[0]?.[0] ?? ''
  let second = ''

  if (parts.length > 1) {
    second = parts[parts.length - 1]?.[0] ?? ''
  } else if (singleWordMode === 'first-two') {
    second = parts[0]?.[1] ?? ''
  }

  return `${first}${second}`.toUpperCase() || fallback
}

export const getInitialsFromHandle = (value, fallback = 'U') => {
  if (!value) return fallback

  const base = String(value).split('@')[0]
  const parts = base.split(/[\s._-]+/).filter(Boolean)

  if (!parts.length) return fallback

  // Show only the first letter of the username/handle as the avatar initial
  return (parts[0][0] ?? fallback).toUpperCase()
}

export const toTitleCase = (value) => {
  if (!value) return ''

  return String(value)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
