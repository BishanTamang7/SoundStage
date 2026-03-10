import React, { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import OrganizerSidebar from '../../components/OrganizerSidebar'

const defaultPrefs = {
  email_bookings: true,
  event_reminders: true,
}

const ToggleRow = ({ label, description, checked, disabled, onChange }) => (
  <label
    className={`flex items-start justify-between gap-4 rounded-xl border bg-[#FCFCFF] p-4 transition ${
      disabled
        ? 'cursor-not-allowed border-[#E5E7EB] opacity-70'
        : 'cursor-pointer border-[#E5E7EB] hover:border-[#C4B5FD] hover:bg-white'
    }`}
  >
    <div>
      <p className="text-sm font-bold text-[#312E81]">{label}</p>
      <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
    </div>
    <span
      className={`relative mt-1 inline-flex h-7 w-12 items-center rounded-full transition ${
        checked ? 'bg-[#7C3AED]' : 'bg-[#D1D5DB]'
      }`}
    >
      <input className="sr-only" type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </span>
  </label>
)

const Settings = () => {
  const { getNotificationPreferences, updateNotificationPreferences } = useAuth()
  const [prefs, setPrefs] = useState(defaultPrefs)
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [prefsSavingKey, setPrefsSavingKey] = useState('')
  const [prefsMessage, setPrefsMessage] = useState('')
  const [prefsError, setPrefsError] = useState('')

  useEffect(() => {
    let active = true

    const loadPreferences = async () => {
      try {
        setPrefsLoading(true)
        setPrefsError('')
        const response = await getNotificationPreferences()
        if (!active) return
        const data = response?.data || {}
        setPrefs({
          email_bookings:
            typeof data.email_bookings === 'boolean' ? data.email_bookings : defaultPrefs.email_bookings,
          event_reminders:
            typeof data.event_reminders === 'boolean'
              ? data.event_reminders
              : defaultPrefs.event_reminders,
        })
      } catch (error) {
        if (!active) return
        setPrefsError(error?.message || 'Failed to load notification settings.')
      } finally {
        if (active) setPrefsLoading(false)
      }
    }

    loadPreferences()

    return () => {
      active = false
    }
  }, [getNotificationPreferences])

  const togglePreference = async (key) => {
    if (prefsLoading || prefsSavingKey) return

    const previous = prefs
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setPrefsMessage('')
    setPrefsError('')
    setPrefsSavingKey(key)

    try {
      const response = await updateNotificationPreferences(next)
      const data = response?.data || {}
      setPrefs({
        email_bookings:
          typeof data.email_bookings === 'boolean' ? data.email_bookings : next.email_bookings,
        event_reminders:
          typeof data.event_reminders === 'boolean' ? data.event_reminders : next.event_reminders,
      })
      setPrefsMessage(response?.message || 'Notification settings updated.')
    } catch (error) {
      setPrefs(previous)
      setPrefsError(error?.message || 'Failed to update notification settings.')
    } finally {
      setPrefsSavingKey('')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <OrganizerSidebar />

      <main className="ml-60 px-12 py-8 max-[1024px]:px-6 max-[768px]:ml-0 max-[768px]:px-4">
        <header className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h1 className="text-2xl font-black text-[#312E81]">Settings</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">
            Manage your organizer settings. Notifications are the only configurable option right now.
          </p>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#312E81]">Notification Preferences</h2>
                <p className="text-sm text-[#6B7280]">Choose which organizer updates you receive by email.</p>
              </div>
              {prefsMessage ? (
                <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-bold text-[#059669]">
                  {prefsMessage}
                </span>
              ) : null}
            </div>

            {prefsError ? <p className="mb-4 text-sm font-semibold text-[#B91C1C]">{prefsError}</p> : null}

            <div className="space-y-4">
              <ToggleRow
                label="Booking confirmations"
                description="Get email updates when bookings are placed and ticket purchases are completed."
                checked={prefs.email_bookings}
                disabled={Boolean(prefsSavingKey)}
                onChange={() => togglePreference('email_bookings')}
              />
            </div>

            {prefsLoading ? (
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                Loading notification settings...
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  )
}

export default Settings
