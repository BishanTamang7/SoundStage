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
  if (data.message && typeof data.message === 'string') {
    if (data.message === 'Authentication failed') {
      return 'Invalid email or password.'
    }
    return data.message
  }
  if (data.errors) {
    if (typeof data.errors === 'string') return data.errors
    if (Array.isArray(data.errors)) return data.errors.join(', ')
    if (typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0]
      const firstVal = data.errors[firstKey]
      if (Array.isArray(firstVal)) return `${firstKey}: ${firstVal.join(', ')}`
      return `${firstKey}: ${String(firstVal)}`
    }
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
