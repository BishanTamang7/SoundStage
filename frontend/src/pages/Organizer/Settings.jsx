import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const defaultPrefs = {
  email_bookings: true,
  event_reminders: true,
}

const getInitials = (value) => {
  if (!value) return 'UU'
  const base = value.split('@')[0]
  const parts = base.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

const toTitleCase = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const formatDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const ToggleRow = ({ label, description, checked, disabled, onChange }) => (
  <label
    className={`flex items-start justify-between gap-4 rounded-xl border bg-white p-4 transition ${
      disabled
        ? 'cursor-not-allowed border-[#E5E7EB] opacity-70'
        : 'cursor-pointer border-[#E5E7EB] hover:border-[#C4B5FD]'
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

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
    {open ? null : <path d="M4 4l16 16" />}
  </svg>
)

const Settings = () => {
  const {
    user,
    role,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    getNotificationPreferences,
    updateNotificationPreferences,
  } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.username || user?.email || 'User'
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'
  const initials = useMemo(() => getInitials(user?.username || user?.email || ''), [user])
  const memberSince = useMemo(() => formatDate(user?.date_joined || user?.dateJoined), [user])
  const accountType = useMemo(
    () => toTitleCase(user?.role || user?.user_type || user?.userType || role || 'organizer'),
    [role, user]
  )
  const accountStatus = user?.is_active === false ? 'Inactive' : 'Active'

  const [profileForm, setProfileForm] = useState({ username: '', email: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [prefs, setPrefs] = useState(defaultPrefs)
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [prefsSavingKey, setPrefsSavingKey] = useState('')
  const [prefsMessage, setPrefsMessage] = useState('')
  const [prefsError, setPrefsError] = useState('')

  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    setProfileForm({
      username: user?.username || '',
      email: user?.email || '',
    })
  }, [user])

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

  const hasProfileChanges =
    profileForm.username !== (user?.username || '') || profileForm.email !== (user?.email || '')

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setProfileMessage('')
    setProfileError('')
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileReset = () => {
    setProfileMessage('')
    setProfileError('')
    setProfileForm({
      username: user?.username || '',
      email: user?.email || '',
    })
  }

  const handleSaveProfile = async () => {
    setProfileMessage('')
    setProfileError('')

    if (!hasProfileChanges) {
      setProfileMessage('No changes to save.')
      return
    }

    try {
      setProfileSaving(true)
      await updateProfile({
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
      })
      setProfileMessage('Profile updated successfully.')
    } catch (error) {
      setProfileError(error?.message || 'Failed to update profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordInput = (event) => {
    const { name, value } = event.target
    setPasswordMessage('')
    setPasswordError('')
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handlePasswordSave = async () => {
    setPasswordMessage('')
    setPasswordError('')

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All password fields are required.')
      return
    }

    try {
      setPasswordSaving(true)
      await changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      })
      setPasswordMessage('Password updated successfully.')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      setPasswordError(error?.message || 'Failed to update password.')
    } finally {
      setPasswordSaving(false)
    }
  }

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

  const openDeleteDialog = () => {
    setDeleteError('')
    setShowDeleteDialog(true)
  }

  const closeDeleteDialog = () => {
    if (deletingAccount) return
    setShowDeleteDialog(false)
  }

  const handleDeleteAccount = async () => {
    setDeleteError('')

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

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <aside className="fixed left-0 top-0 h-screen w-60 border-r border-[#E5E7EB] bg-white py-6 transition-transform max-[768px]:-translate-x-full">
        <div className="px-6 pb-6 font-['Playfair_Display'] text-2xl font-black text-[#7C3AED]">
          SoundStage
        </div>

        <nav className="flex flex-col">
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer">Dashboard</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/concerts">My Concerts</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/tickets">Tickets</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/bookings">Bookings</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/analytics">Analytics</Link>
          <span className="border-l-4 border-[#7C3AED] bg-[#F3F4F6] px-6 py-3 text-base font-semibold text-[#7C3AED]">Settings</span>
        </nav>

        <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-lg border border-[rgba(124,58,237,0.12)] bg-[#F3F4F6] p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-extrabold text-white">
            {initials}
          </div>
          <div className="flex-1">
            <div className="text-sm font-extrabold leading-tight">{displayName}</div>
            <div className="mt-0.5 text-xs font-bold text-[#6B7280]">{displayRole}</div>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[rgba(239,68,68,0.08)] hover:text-[#EF4444]"
            type="button"
            title="Logout"
            onClick={handleLogout}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="ml-60 px-12 py-8 max-[1024px]:px-6 max-[768px]:ml-0 max-[768px]:px-4">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-[#312E81]">Settings</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">
            Manage your organizer account, security, and notification preferences.
          </p>
        </header>

        <div className="space-y-6">
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#312E81]">Account Summary</h2>
                <p className="text-sm text-[#6B7280]">Basic information for your organizer account.</p>
              </div>
              <span className="rounded-md bg-[#F3F4F6] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#7C3AED]">
                {accountType}
              </span>
            </div>

            <div className="grid gap-4 min-[900px]:grid-cols-3">
              <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Username</div>
                <div className="mt-2 text-sm font-bold text-[#312E81]">{user?.username || 'N/A'}</div>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Status</div>
                <div className="mt-2 text-sm font-bold text-[#16A34A]">{accountStatus}</div>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Member Since</div>
                <div className="mt-2 text-sm font-bold text-[#312E81]">{memberSince}</div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-5 border-b border-[#E5E7EB] pb-4">
              <h2 className="text-lg font-black text-[#312E81]">Profile Details</h2>
              <p className="text-sm text-[#6B7280]">Update the contact details used for your organizer account.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#312E81]" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={profileForm.username}
                  onChange={handleProfileChange}
                  className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#312E81]" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                />
              </div>
            </div>

            {profileMessage ? (
              <p className="mt-4 text-sm font-semibold text-[#059669]">{profileMessage}</p>
            ) : null}
            {profileError ? (
              <p className="mt-4 text-sm font-semibold text-[#B91C1C]">{profileError}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-lg bg-[#7C3AED] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleSaveProfile}
                disabled={profileSaving}
              >
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="rounded-lg border border-[#D1D5DB] bg-white px-5 py-2.5 text-sm font-bold text-[#312E81] transition hover:bg-[#F9FAFB]"
                type="button"
                onClick={handleProfileReset}
              >
                Reset
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-5 border-b border-[#E5E7EB] pb-4">
              <h2 className="text-lg font-black text-[#312E81]">Security</h2>
              <p className="text-sm text-[#6B7280]">Change your password to protect dashboard access.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#312E81]" htmlFor="currentPassword">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showPassword.currentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInput}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 pr-12 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                  />
                  <button
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#312E81]"
                    type="button"
                    onClick={() => togglePasswordVisibility('currentPassword')}
                    aria-label={showPassword.currentPassword ? 'Hide current password' : 'Show current password'}
                    title={showPassword.currentPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword.currentPassword} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#312E81]" htmlFor="newPassword">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword.newPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInput}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 pr-12 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                  />
                  <button
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#312E81]"
                    type="button"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    aria-label={showPassword.newPassword ? 'Hide new password' : 'Show new password'}
                    title={showPassword.newPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword.newPassword} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#312E81]" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword.confirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInput}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 pr-12 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                  />
                  <button
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#312E81]"
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    aria-label={showPassword.confirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    title={showPassword.confirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword.confirmPassword} />
                  </button>
                </div>
              </div>
            </div>

            {passwordMessage ? (
              <p className="mt-4 text-sm font-semibold text-[#059669]">{passwordMessage}</p>
            ) : null}
            {passwordError ? (
              <p className="mt-4 text-sm font-semibold text-[#B91C1C]">{passwordError}</p>
            ) : null}

            <button
              className="mt-6 rounded-lg bg-[#312E81] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={handlePasswordSave}
              disabled={passwordSaving}
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#312E81]">Notifications</h2>
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

          <section className="rounded-xl border border-[#FECACA] bg-white p-6">
            <div className="mb-4 border-b border-[#FEE2E2] pb-4">
              <h2 className="text-lg font-black text-[#991B1B]">Danger Zone</h2>
              <p className="text-sm text-[#B91C1C]">
                Permanently delete your account. This action cannot be undone.
              </p>
            </div>

            {deleteError ? <p className="mb-4 text-sm font-semibold text-[#B91C1C]">{deleteError}</p> : null}

            <button
              className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-5 py-2.5 text-sm font-bold text-[#B91C1C] transition hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={openDeleteDialog}
              disabled={deletingAccount}
            >
              {deletingAccount ? 'Deleting Account...' : 'Delete Account'}
            </button>
          </section>
        </div>
      </main>

      {showDeleteDialog ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111827]/55 px-4">
          <div
            className="w-full max-w-md rounded-2xl border border-[#FECACA] bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-organizer-account-dialog-title"
            aria-describedby="delete-organizer-account-dialog-description"
          >
            <h3 id="delete-organizer-account-dialog-title" className="text-lg font-black text-[#B91C1C]">
              Delete organizer account?
            </h3>
            <p
              id="delete-organizer-account-dialog-description"
              className="mt-3 text-sm leading-6 text-[#6B7280]"
            >
              This action cannot be undone. Your organizer dashboard access and account data will be permanently removed.
            </p>
            {deleteError ? (
              <p className="mt-3 text-sm font-semibold text-[#B91C1C]">{deleteError}</p>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-[#D1D5DB] bg-white px-5 py-2.5 text-sm font-bold text-[#374151] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={closeDeleteDialog}
                disabled={deletingAccount}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Settings
