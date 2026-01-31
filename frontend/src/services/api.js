const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const buildHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

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

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const message = formatErrorMessage(data)
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export const api = {
  register: async (payload) => {
    const response = await fetch(`${BASE_URL}/accounts/register/`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse(response)
  },
  login: async (payload) => {
    const response = await fetch(`${BASE_URL}/accounts/login/`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse(response)
  },
  logout: async (token, refresh) => {
    const response = await fetch(`${BASE_URL}/accounts/logout/`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify({ refresh }),
    })
    return handleResponse(response)
  },
  refreshToken: async (refresh) => {
    const response = await fetch(`${BASE_URL}/accounts/token/refresh/`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ refresh }),
    })
    return handleResponse(response)
  },
  verifyToken: async (token) => {
    const response = await fetch(`${BASE_URL}/accounts/token/verify/`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ token }),
    })
    return handleResponse(response)
  },
  profile: async (token) => {
    const response = await fetch(`${BASE_URL}/accounts/profile/`, {
      method: 'GET',
      headers: buildHeaders(token),
    })
    return handleResponse(response)
  },
}
