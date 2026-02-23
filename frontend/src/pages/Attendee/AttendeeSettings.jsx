import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const STORAGE_KEY = 'soundstage_attendee_settings'

const getInitials = (name) => {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const readPrefs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const defaultPrefs = {
  emailBookings: true,
  eventReminders: true,
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
  const { user, logout, role, isAuthenticated, changePassword, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState(() => ({ ...defaultPrefs, ...(readPrefs() || {}) }))
  const [prefsMessage, setPrefsMessage] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })

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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
      if (prefsMessage) return
      setPrefsMessage('Preferences saved.')
      const timeout = window.setTimeout(() => setPrefsMessage(''), 1200)
      return () => window.clearTimeout(timeout)
    } catch {
      setPrefsMessage('')
      return undefined
    }
  }, [prefs])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  const handlePasswordInputChange = (event) => {
    const { name, value } = event.target
    setPasswordMessage('')
    setPasswordError('')
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpdatePassword = async () => {
    setPasswordMessage('')
    setPasswordError('')

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All password fields are required.')
      return
    }

    try {
      setSavingPassword(true)
      await changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      })
      setPasswordMessage('Password updated successfully.')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setPasswordError(error?.message || 'Failed to update password.')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError('')
    const confirmed = window.confirm(
      'Delete your account permanently? This will remove your account access and cannot be undone.'
    )
    if (!confirmed) return

    try {
      setDeletingAccount(true)
      await deleteAccount()
      navigate('/', { replace: true })
    } catch (error) {
      setDeleteError(error?.message || 'Failed to delete account.')
    } finally {
      setDeletingAccount(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const togglePref = (key) => {
    setPrefsMessage('')
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
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
              <div className="mt-5 space-y-4">
                <ToggleRow
                  label="Booking confirmations"
                  description="Receive email confirmations and purchase summaries for each successful booking."
                  checked={prefs.emailBookings}
                  onChange={() => togglePref('emailBookings')}
                />
                <ToggleRow
                  label="Event reminders"
                  description="Get reminders before concerts you booked so you don’t miss entry time."
                  checked={prefs.eventReminders}
                  onChange={() => togglePref('eventReminders')}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_30px_rgba(49,46,129,0.04)]">
              <h2 className="border-b border-[#E5E7EB] pb-4 text-lg font-black text-[#312E81]">
                Security
              </h2>
              <p className="mt-3 text-sm text-[#6B7280]">
                Update your password to keep your account secure.
              </p>
              <div className="mt-5 grid gap-4">
                {[
                  ['currentPassword', 'Current Password', 'current-password'],
                  ['newPassword', 'New Password', 'new-password'],
                  ['confirmPassword', 'Confirm Password', 'confirm-password'],
                ].map(([key, label, id]) => (
                  <div key={key} className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-[#312E81]" htmlFor={id}>
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        id={id}
                        name={key}
                        type={showPassword[key] ? 'text' : 'password'}
                        value={passwordForm[key]}
                        onChange={handlePasswordInputChange}
                        className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 pr-16 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                        placeholder={label}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#4F46E5]"
                      >
                        {showPassword[key] ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {passwordError ? <p className="mt-4 text-sm font-semibold text-[#EF4444]">{passwordError}</p> : null}
              {passwordMessage ? (
                <p className="mt-4 text-sm font-semibold text-[#059669]">{passwordMessage}</p>
              ) : null}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={savingPassword}
                  className="rounded-lg bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:bg-[#A78BFA]"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-[#FECACA] bg-white p-6 shadow-[0_10px_30px_rgba(239,68,68,0.04)]">
              <h2 className="border-b border-[#FEE2E2] pb-4 text-lg font-black text-[#991B1B]">
                Danger Zone
              </h2>
              <p className="mt-3 text-sm text-[#7F1D1D]">
                Deleting your account is permanent and cannot be undone.
              </p>
              {deleteError ? <p className="mt-4 text-sm font-semibold text-[#EF4444]">{deleteError}</p> : null}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="rounded-lg border border-[#EF4444] bg-[#FEF2F2] px-5 py-3 text-sm font-bold text-[#B91C1C] transition hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </section>
          </section>
        </div>
      </main>
    </div>
  )
}

export default AttendeeSettings
