import { Link, useNavigate } from 'react-router-dom'
import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const Settings = () => {
  const { user, role, updateProfile, changePassword, deleteAccount } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.username || user?.email || 'User'
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'
  const initialsSource = user?.username || user?.email || ''

  const getInitials = (value) => {
    if (!value) return 'UU'
    const base = value.split('@')[0]
    const parts = base.split(/[\s._-]+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  const initials = getInitials(initialsSource)

  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
  })
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

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    setProfileForm({
      username: user?.username || '',
      email: user?.email || '',
    })
  }, [user])

  const hasProfileChanges = useMemo(
    () =>
      profileForm.username !== (user?.username || '') ||
      profileForm.email !== (user?.email || ''),
    [profileForm, user]
  )

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setProfileMessage('')
    setProfileError('')
    setProfileForm((prev) => ({ ...prev, [name]: value }))
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

  const handleCancelProfile = () => {
    setProfileMessage('')
    setProfileError('')
    setProfileForm({
      username: user?.username || '',
      email: user?.email || '',
    })
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordMessage('')
    setPasswordError('')
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleUpdatePassword = async () => {
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

  const handleDeleteAccount = async () => {
    setDeleteError('')
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This cannot be undone.'
    )
    if (!confirmed) return

    try {
      setDeleting(true)
      await deleteAccount()
      navigate('/', { replace: true })
    } catch (error) {
      setDeleteError(error?.message || 'Failed to delete account.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <aside className="fixed left-0 top-0 h-screen w-60 border-r border-[#E5E7EB] bg-white py-6">
        <div className="px-6 pb-6 font-['Playfair_Display'] text-2xl font-black text-[#7C3AED]">SoundStage</div>

        <nav className="flex flex-col">
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer">Dashboard</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/concerts">My Concerts</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/tickets">Tickets</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/bookings">Bookings</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/analytics">Analytics</Link>
          <span className="border-l-4 border-[#7C3AED] bg-[#F3F4F6] px-6 py-3 text-base font-semibold text-[#7C3AED]">Settings</span>
        </nav>

        <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-lg border border-[rgba(124,58,237,0.12)] bg-[#F3F4F6] p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-extrabold text-white">{initials}</div>
          <div className="flex-1">
            <div className="text-sm font-extrabold leading-tight">{displayName}</div>
            <div className="mt-0.5 text-xs font-bold text-[#6B7280]">{displayRole}</div>
          </div>
          <a className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[rgba(239,68,68,0.08)] hover:text-[#EF4444]" href="/" title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </a>
        </div>
      </aside>

      <main className="ml-60 px-12 py-8 max-[1024px]:px-6 max-[768px]:ml-0">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-[#312E81]">Settings</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">Manage your organizer account.</p>
        </header>

        <section className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="mb-5 text-lg font-black text-[#312E81]">Organizer Profile</h2>
          <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#6B7280]" htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                value={profileForm.username}
                onChange={handleProfileChange}
                className="h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm font-semibold text-[#312E81] outline-none focus:border-[#7C3AED]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#6B7280]" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                className="h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm font-semibold text-[#312E81] outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          {profileError ? <p className="mt-4 text-sm font-semibold text-[#B91C1C]">{profileError}</p> : null}
          {profileMessage ? <p className="mt-4 text-sm font-semibold text-[#059669]">{profileMessage}</p> : null}

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelProfile}
              className="rounded-lg border border-[#D1D5DB] px-5 py-2.5 text-sm font-bold text-[#312E81] transition hover:bg-[#F9FAFB]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={!hasProfileChanges || profileSaving}
              className="rounded-lg bg-[#7C3AED] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="mb-5 text-lg font-black text-[#312E81]">Security</h2>
          <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#6B7280]" htmlFor="currentPassword">Current Password</label>
              <div className="relative">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showPassword.currentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="h-11 w-full rounded-lg border border-[#D1D5DB] px-3 pr-16 text-sm font-semibold text-[#312E81] outline-none focus:border-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('currentPassword')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-bold text-[#6B7280] hover:bg-[#F3F4F6]"
                >
                  {showPassword.currentPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#6B7280]" htmlFor="newPassword">New Password</label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword.newPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="h-11 w-full rounded-lg border border-[#D1D5DB] px-3 pr-16 text-sm font-semibold text-[#312E81] outline-none focus:border-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('newPassword')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-bold text-[#6B7280] hover:bg-[#F3F4F6]"
                >
                  {showPassword.newPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#6B7280]" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword.confirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="h-11 w-full rounded-lg border border-[#D1D5DB] px-3 pr-16 text-sm font-semibold text-[#312E81] outline-none focus:border-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-bold text-[#6B7280] hover:bg-[#F3F4F6]"
                >
                  {showPassword.confirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>

          {passwordError ? <p className="mt-4 text-sm font-semibold text-[#B91C1C]">{passwordError}</p> : null}
          {passwordMessage ? <p className="mt-4 text-sm font-semibold text-[#059669]">{passwordMessage}</p> : null}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleUpdatePassword}
              disabled={passwordSaving}
              className="rounded-lg border border-[#7C3AED] px-5 py-2.5 text-sm font-bold text-[#7C3AED] transition hover:bg-[#F5F3FF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-6">
          <h2 className="mb-3 text-lg font-black text-[#B91C1C]">Danger Zone</h2>
          <p className="mb-4 text-sm font-semibold text-[#7F1D1D]">Deleting your organizer account will permanently remove your access.</p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-lg border border-[#EF4444] px-4 py-2 text-sm font-bold text-[#EF4444] transition hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? 'Deleting...' : 'Delete Account'}
          </button>
          {deleteError ? <p className="mt-3 text-sm font-semibold text-[#B91C1C]">{deleteError}</p> : null}
        </section>
      </main>
    </div>
  )
}

export default Settings
