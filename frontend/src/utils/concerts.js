export const getVenueParts = (venue, cityFromApi = '') => {
  const venueValue = (venue || '').trim()
  const cityValue = (cityFromApi || '').trim()

  // If API provided city, trust it and keep venue as-is.
  if (cityValue) {
    return { venueName: venueValue, city: cityValue }
  }

  if (!venueValue) return { venueName: '', city: '' }

  // Legacy parsing when city isn't provided separately.
  const parts = venueValue
    .split(/[,|•|-]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (parts.length > 1) {
    return {
      venueName: parts.slice(0, -1).join(', '),
      city: parts[parts.length - 1],
    }
  }

  return { venueName: venueValue, city: '' }
}
