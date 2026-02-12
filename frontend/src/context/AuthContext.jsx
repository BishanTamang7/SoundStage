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
  const [tokens, setTokens] = useState(() => {
    const stored = readStoredAuth()
    if (!stored?.access) return null
    return { access: stored.access, refresh: stored.refresh || null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const bootstrapAuth = async () => {
      const stored = readStoredAuth()
      if (!stored?.access) {
        if (!cancelled) {
          setLoading(false)
        }
        return
      }

      let activeAccess = stored.access
      let activeRefresh = stored.refresh || null

      try {
        const profileData = await api.profile(activeAccess)
        if (!cancelled) {
          const resolvedProfile = resolveProfile(profileData)
          setUser(resolvedProfile)
          setTokens({ access: activeAccess, refresh: activeRefresh })
        }
      } catch {
        if (!activeRefresh) {
          if (!cancelled) {
            setUser(null)
            setTokens(null)
            writeStoredAuth(null)
          }
          return
        }

        try {
          const refreshed = await api.refreshToken(activeRefresh)
          const nextAccess = refreshed?.access || refreshed?.data?.access
          const nextRefresh = refreshed?.refresh || refreshed?.data?.refresh || activeRefresh
          if (!nextAccess) {
            throw new Error('Token refresh failed')
          }

          activeAccess = nextAccess
          activeRefresh = nextRefresh
          const profileData = await api.profile(activeAccess)
          if (!cancelled) {
            const resolvedProfile = resolveProfile(profileData)
            setUser(resolvedProfile)
            setTokens({ access: activeAccess, refresh: activeRefresh })
          }
        } catch {
          if (!cancelled) {
            setUser(null)
            setTokens(null)
            writeStoredAuth(null)
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    bootstrapAuth()

    return () => {
      cancelled = true
    }
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
    const fallbackProfile = data?.data?.user || data?.user || data?.profile

    if (!access) {
      throw new Error('Login response missing access token')
    }

    setTokens({ access, refresh })

    try {
      const fetchedProfile = await api.profile(access)
      const resolvedProfile = resolveProfile(fetchedProfile)
      setUser(resolvedProfile)
      return resolvedProfile
    } catch (error) {
      if (fallbackProfile) {
        setUser(fallbackProfile)
        return fallbackProfile
      }
      throw error
    }
  }, [])

  const register = useCallback(async (payload) => api.register(payload), [])

  const updateProfile = useCallback(
    async (payload) => {
      const access = tokens?.access
      if (!access) {
        throw new Error('Authentication required')
      }
      const data = await api.updateProfile(access, payload)
      const resolvedProfile = resolveProfile(data)
      setUser(resolvedProfile)
      return resolvedProfile
    },
    [tokens?.access]
  )

  const changePassword = useCallback(
    async (payload) => {
      const access = tokens?.access
      if (!access) {
        throw new Error('Authentication required')
      }
      return api.changePassword(access, payload)
    },
    [tokens?.access]
  )

  const deleteAccount = useCallback(async () => {
    const access = tokens?.access
    if (!access) {
      throw new Error('Authentication required')
    }
    await api.deleteAccount(access)
    setUser(null)
    setTokens(null)
    writeStoredAuth(null)
  }, [tokens?.access])

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
      updateProfile,
      changePassword,
      deleteAccount,
      logout,
    }),
    [user, tokens, loading, login, register, updateProfile, changePassword, deleteAccount, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
