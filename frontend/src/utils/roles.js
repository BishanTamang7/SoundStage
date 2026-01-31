export const ROLES = {
  ORGANIZER: 'organizer',
  ATTENDEE: 'attendee',
  ADMIN: 'admin',
}

export const normalizeRole = (role) => {
  if (!role) return null
  return String(role).toLowerCase()
}
