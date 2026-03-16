import { useEffect, useState } from 'react'

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  email_bookings: true,
  event_reminders: true,
}

const normalizePreferences = (data) => ({
  email_bookings:
    typeof data?.email_bookings === 'boolean'
      ? data.email_bookings
      : DEFAULT_NOTIFICATION_PREFERENCES.email_bookings,
  event_reminders:
    typeof data?.event_reminders === 'boolean'
      ? data.event_reminders
      : DEFAULT_NOTIFICATION_PREFERENCES.event_reminders,
})

const useNotificationPreferences = (
  getNotificationPreferences,
  updateNotificationPreferences,
  { successMessageDurationMs = 0 } = {}
) => {
  const [prefs, setPrefs] = useState(DEFAULT_NOTIFICATION_PREFERENCES)
  const [prefsMessage, setPrefsMessage] = useState('')
  const [prefsError, setPrefsError] = useState('')
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [savingPrefKey, setSavingPrefKey] = useState('')

  useEffect(() => {
    let active = true

    const loadPreferences = async () => {
      try {
        setLoadingPrefs(true)
        setPrefsError('')
        const response = await getNotificationPreferences()
        if (!active) return
        setPrefs(normalizePreferences(response?.data || {}))
      } catch (error) {
        if (!active) return
        setPrefsError(error?.message || 'Failed to load notification settings.')
      } finally {
        if (active) setLoadingPrefs(false)
      }
    }

    loadPreferences()

    return () => {
      active = false
    }
  }, [getNotificationPreferences])

  useEffect(() => {
    if (!prefsMessage || successMessageDurationMs <= 0) return undefined

    const timeoutId = setTimeout(() => setPrefsMessage(''), successMessageDurationMs)
    return () => clearTimeout(timeoutId)
  }, [prefsMessage, successMessageDurationMs])

  const togglePreference = async (key) => {
    if (loadingPrefs || savingPrefKey) return

    const previous = prefs
    const nextPrefs = { ...prefs, [key]: !prefs[key] }
    setPrefs(nextPrefs)
    setPrefsMessage('')
    setPrefsError('')
    setSavingPrefKey(key)

    try {
      const response = await updateNotificationPreferences(nextPrefs)
      setPrefs(normalizePreferences(response?.data || nextPrefs))
      setPrefsMessage(response?.message || 'Notification settings updated.')
    } catch (error) {
      setPrefs(previous)
      setPrefsError(error?.message || 'Failed to update notification settings.')
    } finally {
      setSavingPrefKey('')
    }
  }

  return {
    prefs,
    prefsMessage,
    prefsError,
    loadingPrefs,
    savingPrefKey,
    togglePreference,
  }
}

export default useNotificationPreferences
