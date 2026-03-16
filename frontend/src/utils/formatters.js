export const formatDate = (
  value,
  {
    fallback = 'N/A',
    locale = 'en-US',
    month = 'long',
    day = 'numeric',
    year = 'numeric',
  } = {}
) => {
  if (!value) return fallback

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback

  return new Intl.DateTimeFormat(locale, { month, day, year }).format(date)
}

export const formatTime = (
  value,
  { fallback = '', locale = 'en-US', hour = 'numeric', minute = '2-digit' } = {}
) => {
  if (!value) return fallback

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback

  return new Intl.DateTimeFormat(locale, { hour, minute }).format(date)
}

export const formatDateTime = (
  value,
  {
    fallback = 'TBD',
    locale = 'en-US',
    dateOptions = { month: 'short', day: 'numeric', year: 'numeric' },
    timeOptions = { hour: 'numeric', minute: '2-digit' },
    separator = ' · ',
  } = {}
) => {
  if (!value) return fallback

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback

  const datePart = new Intl.DateTimeFormat(locale, dateOptions).format(date)
  const timePart = new Intl.DateTimeFormat(locale, timeOptions).format(date)
  return `${datePart}${separator}${timePart}`
}

export const formatCurrency = (
  value,
  { fallback = 'Rs 0', locale = 'en-US', round = true, minimum = 0, prefix = 'Rs ' } = {}
) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback

  const normalized = round ? Math.round(parsed) : parsed
  return `${prefix}${Math.max(minimum, normalized).toLocaleString(locale)}`
}

export const formatNepalDateTime = (value, { fallback = '', locale = 'en-US' } = {}) => {
  if (!value) return fallback

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date)
}
