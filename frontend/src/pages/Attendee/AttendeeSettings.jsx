import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const getInitials = (name) => {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

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
  const { user, logout, role, isAuthenticated, getNotificationPreferences, updateNotificationPreferences } =
    useAuth()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState(defaultPrefs)
  const [prefsMessage, setPrefsMessage] = useState('')
  const [prefsError, setPrefsError] = useState('')
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [savingPrefKey, setSavingPrefKey] = useState('')

  const initialsSource = user?.name || user?.username || user?.email || ''
  const initials = useMemo(() => getInitials(initialsSource) || 'SS', [initialsSource])

  useEffect(() => {
    const handleClick = (event) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

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

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

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
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] text-[#312E81]">
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-20 items-center justify-between border-b border-[#312E81]/15 bg-white/95 px-[5%] backdrop-blur">
        <Link
          className="font-['Playfair_Display'] text-2xl font-black text-[#7C3AED]"
          to={isAuthenticated && role === 'attendee' ? '/attendee' : '/'}
        >
          SoundStage
        </Link>
        <div className="hidden items-center gap-10 md:flex">
          <Link className="text-base font-medium text-[#312E81]" to="/attendee/concerts">
            Browse Concerts
          </Link>
          <Link className="text-base font-medium text-[#312E81]" to="/attendee/tickets">
            My Tickets
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center"
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-semibold text-white">
                {initials}
              </span>
            </button>
            <div
              className={`absolute right-0 top-[calc(100%+0.5rem)] min-w-50 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${
                open ? 'block' : 'hidden'
              }`}
              role="menu"
            >
              <Link
                className="flex items-center gap-3 rounded-t-lg px-4 py-3 text-sm text-[#312E81] hover:bg-[#F3F4F6]"
                to="/attendee/profile"
              >
                <span className="text-lg">👤</span>
                <span>My Profile</span>
              </Link>
              <div className="mx-4 my-1 h-px bg-[#E5E7EB]" />
              <Link
                className="flex items-center gap-3 bg-[#F5F3FF] px-4 py-3 text-sm font-semibold text-[#5B21B6]"
                to="/attendee/settings"
              >
                <span className="text-lg">⚙️</span>
                <span>Settings</span>
              </Link>
              <button
                className="flex w-full items-center gap-3 rounded-b-lg px-4 py-3 text-left text-sm text-[#EF4444] hover:bg-[#F3F4F6]"
                type="button"
                onClick={handleLogout}
              >
                <span className="text-lg">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

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

      <footer className="bg-[#312E81] px-[5%] py-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-6 text-base">
          <div className="flex gap-8">
            <Link className="text-white/75" to="/attendee/about">
              About
            </Link>
            <Link className="text-white/75" to="/privacy">
              Privacy
            </Link>
            <Link className="text-white/75" to="/terms">
              Terms
            </Link>
          </div>
          <div>© 2026 SoundStage. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

export default AttendeeSettings
