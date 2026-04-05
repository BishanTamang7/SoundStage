import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
})

let authTokens = { access: null, refresh: null }
const authTokenListeners = new Set()

const notifyAuthTokenListeners = (tokens) => {
  authTokenListeners.forEach((listener) => {
    try {
      listener(tokens)
    } catch {
      // Swallow listener errors to avoid breaking the chain
    }
  })
}

export const addAuthTokenListener = (listener) => {
  authTokenListeners.add(listener)
  return () => authTokenListeners.delete(listener)
}

export const setAuthTokens = (tokens) => {
  authTokens = {
    access: tokens?.access || null,
    refresh: tokens?.refresh || null,
  }
  notifyAuthTokenListeners(authTokens)
}

export const clearAuthTokens = () => {
  authTokens = { access: null, refresh: null }
  notifyAuthTokenListeners(authTokens)
}

const formatErrorMessage = (data) => {
  if (!data) return 'Request failed'
  if (typeof data === 'string') return data
  if (data.detail) return data.detail

  if (data.errors) {
    if (typeof data.errors === 'string') return data.errors
    if (Array.isArray(data.errors)) return data.errors.join(', ')
    if (typeof data.errors === 'object') {
      if (data.errors.non_field_errors) {
        const list = Array.isArray(data.errors.non_field_errors)
          ? data.errors.non_field_errors
          : [data.errors.non_field_errors]
        const cleaned = list.map((item) => String(item)).filter(Boolean)
        if (cleaned.length > 0) return cleaned.join(', ')
      }
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
        if (key === 'contact_phone') {
          const items = Array.isArray(value) ? value : [value]
          return items.map((item) => String(item))
        }
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
      return 'Invalid password.'
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
        if (key === 'contact_phone') {
          const items = Array.isArray(value) ? value : [value]
          return items.map((item) => String(item))
        }
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
  const effective = authTokens.access || token
  if (!effective) return {}
  return { Authorization: `Bearer ${effective}` }
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

const refreshTokenRequest = async (refresh) => {
  const { data } = await apiClient.post(
    '/accounts/token/refresh/',
    { refresh },
    { skipAuthRefresh: true }
  )
  return data
}

let refreshPromise = null

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error

    if (!response || config?.skipAuthRefresh) {
      return Promise.reject(error)
    }

    if (response.status !== 401 || config._retry || !authTokens.refresh) {
      return Promise.reject(error)
    }

    // Mark the request so we don't retry twice
    config._retry = true

    if (!refreshPromise) {
      refreshPromise = refreshTokenRequest(authTokens.refresh)
        .then((data) => {
          const nextAccess = data?.access || data?.data?.access
          const nextRefresh = data?.refresh || data?.data?.refresh || authTokens.refresh
          if (!nextAccess) {
            throw new Error('Token refresh failed')
          }
          setAuthTokens({ access: nextAccess, refresh: nextRefresh })
          return { access: nextAccess, refresh: nextRefresh }
        })
        .catch((refreshError) => {
          clearAuthTokens()
          throw refreshError
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    try {
      const tokens = await refreshPromise
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${tokens.access}`,
      }
      return apiClient(config)
    } catch {
      return Promise.reject(error)
    }
  }
)

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
  verifyEmailOtp: async (payload) => {
    try {
      const { data } = await apiClient.post('/accounts/verify-email-otp/', payload)
      return data
    } catch (error) {
      handleError(error)
    }
  },
  resendEmailOtp: async (payload) => {
    try {
      const { data } = await apiClient.post('/accounts/resend-email-otp/', payload)
      return data
    } catch (error) {
      handleError(error)
    }
  },
  forgotPassword: async (payload) => {
    try {
      const { data } = await apiClient.post('/accounts/forgot-password/', payload)
      return data
    } catch (error) {
      handleError(error)
    }
  },
  resetPasswordConfirm: async (payload) => {
    try {
      const { data } = await apiClient.post('/accounts/reset-password-confirm/', payload)
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
      return await refreshTokenRequest(refresh)
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
  notificationPreferences: async (token) => {
    try {
      const { data } = await apiClient.get('/notifications/preferences/', {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  updateNotificationPreferences: async (token, payload) => {
    try {
      const { data } = await apiClient.patch('/notifications/preferences/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  organizerConcerts: async (token) => {
    try {
      const { data } = await apiClient.get('/events/concerts/my_events/', {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  listConcerts: async (params = {}) => {
    try {
      const { data } = await apiClient.get('/events/concerts/', { params })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  deleteConcert: async (token, concertId) => {
    try {
      const { data } = await apiClient.delete(`/events/concerts/${concertId}/`, {
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
      const { data } = await apiClient.post('/events/concerts/', payload, { headers })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  getConcert: async (token, concertId) => {
    try {
      const { data } = await apiClient.get(`/events/concerts/${concertId}/`, {
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
      const { data } = await apiClient.put(`/events/concerts/${concertId}/`, payload, {
        headers,
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  khaltiInitiate: async (token, payload) => {
    try {
      const { data } = await apiClient.post('/payments/khalti/initiate/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  khaltiLookup: async (token, payload) => {
    try {
      const { data } = await apiClient.post('/payments/khalti/lookup/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  khaltiConfirm: async (token, payload) => {
    try {
      const { data } = await apiClient.post('/payments/khalti/confirm/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  esewaInitiate: async (token, payload) => {
    try {
      const { data } = await apiClient.post('/payments/esewa/initiate/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  esewaLookup: async (token, payload) => {
    try {
      const { data } = await apiClient.post('/payments/esewa/lookup/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  esewaConfirm: async (token, payload) => {
    try {
      const { data } = await apiClient.post('/payments/esewa/confirm/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  myTickets: async (token) => {
    try {
      const { data } = await apiClient.get('/tickets/my/', {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  organizerBookings: async (token) => {
    try {
      const { data } = await apiClient.get('/tickets/organizer/bookings/', {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  deleteMyTicket: async (token, ticketId) => {
    try {
      const { data } = await apiClient.delete(`/tickets/${ticketId}/`, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
  verifyTicket: async (token, payload) => {
    try {
      const { data } = await apiClient.post('/tickets/verify/', payload, {
        headers: withAuth(token),
      })
      return data
    } catch (error) {
      handleError(error)
    }
  },
}
