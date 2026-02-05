import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
}
