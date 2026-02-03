import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { AuthContext } from './AuthContextStore'
import { normalizeRole } from '../utils/roles'

const STORAGE_KEY = 'soundstage_auth'

const readStoredAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const writeStoredAuth = (value) => {
  if (!value) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

const getRoleFromUser = (user) => {
  return normalizeRole(user?.role || user?.user_type || user?.userType)
}

const resolveProfile = (response) => {
  if (!response) return null
  const data = response?.data ?? response
  return data?.user || data?.profile || data
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [tokens, setTokens] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = readStoredAuth()
    if (!stored?.access) {
      setLoading(false)
      return
    }

    setTokens({ access: stored.access, refresh: stored.refresh || null })
    api
      .profile(stored.access)
      .then((data) => {
        const resolvedProfile = resolveProfile(data)
        setUser(resolvedProfile)
      })
      .catch(() => {
        setUser(null)
        setTokens(null)
        writeStoredAuth(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tokens?.access) {
      writeStoredAuth({ access: tokens.access, refresh: tokens.refresh || null })
    } else {
      writeStoredAuth(null)
    }
  }, [tokens])

  const login = useCallback(async (payload) => {
    const data = await api.login(payload)
    const access = data?.data?.tokens?.access || data?.access || data?.tokens?.access
    const refresh = data?.data?.tokens?.refresh || data?.refresh || data?.tokens?.refresh
    const profile = data?.data?.user || data?.user || data?.profile

    if (!access) {
      throw new Error('Login response missing access token')
    }

    setTokens({ access, refresh })

    if (profile) {
      setUser(profile)
      return profile
    }

    const fetchedProfile = await api.profile(access)
    const resolvedProfile = resolveProfile(fetchedProfile)
    setUser(resolvedProfile)
    return resolvedProfile
  }, [])

  const register = useCallback(async (payload) => api.register(payload), [])

  const logout = useCallback(async () => {
    const token = tokens?.access
    const refresh = tokens?.refresh
    try {
      if (token) {
        await api.logout(token, refresh)
      }
    } finally {
      setUser(null)
      setTokens(null)
      writeStoredAuth(null)
    }
  }, [tokens?.access, tokens?.refresh])

  const value = useMemo(
    () => ({
      user,
      role: getRoleFromUser(user),
      tokens,
      loading,
      isAuthenticated: Boolean(tokens?.access),
      login,
      register,
      logout,
    }),
    [user, tokens, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
