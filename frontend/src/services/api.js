import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
})

const formatErrorMessage = (data) => {
  if (!data) return 'Request failed'
  if (typeof data === 'string') return data
  if (data.detail) return data.detail

  if (data.errors) {
    if (typeof data.errors === 'string') return data.errors
    if (Array.isArray(data.errors)) return data.errors.join(', ')
    if (typeof data.errors === 'object') {
      if (data.errors.username) {
        const usernameErrors = Array.isArray(data.errors.username)
          ? data.errors.username
          : [data.errors.username]
        return usernameErrors.map((item) => String(item)).join(', ')
      }
      if (data.errors.email) {
        const emailErrors = Array.isArray(data.errors.email) ? data.errors.email : [data.errors.email]
        return emailErrors
          .map((item) => String(item))
          .map((item) =>
            item === 'User with this email already exists.' ? 'Email already exists.' : item
          )
          .join(', ')
      }
      const messages = Object.entries(data.errors).flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((item) => String(item))
        }
        if (typeof value === 'string') {
          return [value]
        }
        return [`${key}: ${String(value)}`]
      })
      if (messages.length > 0) return messages.join(', ')
    }
  }

  if (data.message && typeof data.message === 'string') {
    if (data.message === 'Authentication failed') {
      return 'Invalid email or password.'
    }
    if (data.message === 'Validation error') {
      return 'Validation error.'
    }
    return data.message
  }

  if (typeof data === 'object') {
    const messages = Object.entries(data)
      .filter(([key]) => !['success', 'data'].includes(key))
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((item) => `${key}: ${String(item)}`)
        }
        if (typeof value === 'string') {
          return [`${key}: ${value}`]
        }
        if (value && typeof value === 'object') {
          const nested = Object.values(value).flatMap((item) =>
            Array.isArray(item) ? item.map((entry) => String(entry)) : [String(item)]
          )
          return nested.length > 0 ? nested.map((entry) => `${key}: ${entry}`) : [`${key}: ${String(value)}`]
        }
        return [`${key}: ${String(value)}`]
      })
    if (messages.length > 0) return messages.join(', ')
  }

  return 'Request failed'
}

const withAuth = (token) => {
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

const handleError = (error) => {
  if (error.response) {
    const message = formatErrorMessage(error.response.data)
    const err = new Error(message)
    err.status = error.response.status
    err.data = error.response.data
    throw err
  }

  if (error.request) {
    const err = new Error('Network error. Please try again.')
    err.status = 0
    throw err
  }

  throw error
}

export const resolveMediaUrl = (path) => {
  if (!path) return ''
  if (typeof path === 'string' && path.startsWith('http')) return path
  const base = BASE_URL.replace(/\/api\/?$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

export const api = {
  register: async (payload) => {
    try {
      const { data } = await apiClient.post('/accounts/register/', payload)
      return data
    } catch (error) {
      handleError(error)
    }
  },
  login: async (payload) => {
    try {
      const { data } = await apiClient.post('/accounts/login/', payload)
      return data
    } catch (error) {
      handleError(error)
    }
  },
  logout: async (token, refresh) => {
    try {
      const { data } = await apiClient.post(
        '/accounts/logout/',
        { refresh },
        { headers: withAuth(token) }
      )
      return data
    } catch (error) {
      handleError(error)
    }
  },
  refreshToken: async (refresh) => {
    try {
      const { data } = await apiClient.post('/accounts/token/refresh/', { refresh })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  verifyToken: async (token) => {
    try {
      const { data } = await apiClient.post('/accounts/token/verify/', { token })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  profile: async (token) => {
    try {
      const { data } = await apiClient.get('/accounts/profile/', {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  updateProfile: async (token, payload) => {
    try {
      const { data } = await apiClient.patch('/accounts/profile/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  deleteAccount: async (token) => {
    try {
      const { data } = await apiClient.delete('/accounts/profile/', {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  changePassword: async (token, payload) => {
    try {
      const { data } = await apiClient.post('/accounts/change-password/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  organizerConcerts: async (token) => {
    try {
      const { data } = await apiClient.get('/concerts/concerts/my_events/', {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  listConcerts: async () => {
    try {
      const { data } = await apiClient.get('/concerts/concerts/')
      return data
    } catch (error) {
      handleError(error)
    }
  },
  deleteConcert: async (token, concertId) => {
    try {
      const { data } = await apiClient.delete(`/concerts/concerts/${concertId}/`, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  createConcert: async (token, payload) => {
    try {
      const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData
      const headers = isFormData ? withAuth(token) : withAuth(token)
      const { data } = await apiClient.post('/concerts/concerts/', payload, { headers })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  getConcert: async (token, concertId) => {
    try {
      const { data } = await apiClient.get(`/concerts/concerts/${concertId}/`, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  updateConcert: async (token, concertId, payload) => {
    try {
      const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData
      const headers = isFormData ? withAuth(token) : withAuth(token)
      const { data } = await apiClient.put(`/concerts/concerts/${concertId}/`, payload, {
        headers,
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  khaltiInitiate: async (token, payload) => {
    try {
      const { data } = await apiClient.post('/concerts/payments/khalti/initiate/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  khaltiLookup: async (token, payload) => {
    try {
      const { data } = await apiClient.post('/concerts/payments/khalti/lookup/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  khaltiConfirm: async (token, payload) => {
    try {
      const { data } = await apiClient.post('/concerts/payments/khalti/confirm/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  myTickets: async (token) => {
    try {
      const { data } = await apiClient.get('/concerts/tickets/my/', {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  verifyTicket: async (token, payload) => {
    try {
      const { data } = await apiClient.post('/concerts/tickets/verify/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
}
