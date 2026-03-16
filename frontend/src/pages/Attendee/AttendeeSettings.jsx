import React, { useEffect, useState } from 'react'
import AttendeeFooter from '../../components/AttendeeFooter'
import AttendeeHeader from '../../components/AttendeeHeader'
import { useAuth } from '../../hooks/useAuth'

const defaultPrefs = {
  email_bookings: true,
  event_reminders: true,
}

const ToggleRow = ({ label, description, checked, onChange }) => (
  <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4 transition hover:border-[#C4B5FD]">
    <div>
      <p className="text-sm font-bold text-[#312E81]">{label}</p>
      <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
    </div>
    <span
      className={`relative mt-1 inline-flex h-7 w-12 items-center rounded-full transition ${
        checked ? 'bg-[#7C3AED]' : 'bg-[#D1D5DB]'
      }`}
    >
      <input
        className="sr-only"
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </span>
  </label>
)

const AttendeeSettings = () => {
  const { getNotificationPreferences, updateNotificationPreferences } = useAuth()
  const [prefs, setPrefs] = useState(defaultPrefs)
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
        if (active) {
          setLoadingPrefs(false)
        }
      }
    }

    loadPreferences()

    return () => {
      active = false
    }
  }, [getNotificationPreferences])

  const togglePref = async (key) => {
    if (loadingPrefs || savingPrefKey) return

    const previous = prefs
    const nextPrefs = { ...prefs, [key]: !prefs[key] }
    setPrefs(nextPrefs)
    setPrefsMessage('')
    setPrefsError('')
    setSavingPrefKey(key)

    try {
      const response = await updateNotificationPreferences({
        email_bookings: nextPrefs.email_bookings,
        event_reminders: nextPrefs.event_reminders,
      })
      const data = response?.data || {}
      setPrefs({
        email_bookings:
          typeof data.email_bookings === 'boolean' ? data.email_bookings : nextPrefs.email_bookings,
        event_reminders:
          typeof data.event_reminders === 'boolean'
            ? data.event_reminders
            : nextPrefs.event_reminders,
      })
      setPrefsMessage(response?.message || 'Notification settings updated.')
      window.setTimeout(() => setPrefsMessage(''), 1400)
    } catch (error) {
      setPrefs(previous)
      setPrefsError(error?.message || 'Failed to update notification settings.')
    } finally {
      setSavingPrefKey('')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] text-[#312E81]">
      <AttendeeHeader />

      <main className="flex-1 pt-24">
        <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-8">
          <section className="space-y-8">
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_30px_rgba(49,46,129,0.04)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                <div>
                  <h2 className="text-lg font-black text-[#312E81]">Notifications</h2>
                  <p className="text-sm text-[#6B7280]">
                    Choose which SoundStage updates you want to receive.
                  </p>
                </div>
                {prefsMessage ? (
                  <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-bold text-[#059669]">
                    {prefsMessage}
                  </span>
                ) : null}
              </div>
              {prefsError ? (
                <p className="mt-4 text-sm font-semibold text-[#EF4444]">{prefsError}</p>
              ) : null}
              <div className="mt-5 space-y-4">
                <ToggleRow
                  label="Booking confirmations"
                  description="Receive email confirmations and purchase summaries for each successful booking."
                  checked={prefs.email_bookings}
                  onChange={() => togglePref('email_bookings')}
                />
                <ToggleRow
                  label="Event reminders"
                  description="Receive booked-concert reminders and new concert announcements by email."
                  checked={prefs.event_reminders}
                  onChange={() => togglePref('event_reminders')}
                />
              </div>
              {loadingPrefs ? (
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                  Loading notification settings...
                </p>
              ) : null}
            </section>

          </section>
        </div>
      </main>

      <AttendeeFooter />
    </div>
  )
}

export default AttendeeSettings
