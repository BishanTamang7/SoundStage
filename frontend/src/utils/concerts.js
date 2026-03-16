export const getVenueParts = (venue) => {
  if (!venue) return { venueName: '', city: '' }

  const parts = venue.split(/[,|•|-]+/).map((item) => item.trim()).filter(Boolean)
  if (parts.length > 1) {
    return {
      venueName: parts.slice(0, -1).join(', '),
      city: parts[parts.length - 1],
    }
  }

  return { venueName: venue.trim(), city: '' }
}
