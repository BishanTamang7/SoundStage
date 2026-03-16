import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getStoredProfilePhoto } from '../../utils/profilePhoto'

const getInitials = (value) => {
  if (!value) return 'AT'
  const parts = value.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? ''
  return `${first}${last}`.toUpperCase() || 'AT'
}

const toTitleCase = (value) => {
  if (!value) return ''
  return value
    .toString()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

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

const PasswordField = ({ id, label, name, value, visible, onChange, onToggle }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-bold text-[#312E81]" htmlFor={id}>
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 pr-16 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED]"
      />
      <button
        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#4F46E5]"
        type="button"
        onClick={onToggle}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  </div>
)

const AttendeeProfile = () => {
  const { user, role, isAuthenticated, updateProfile, changePassword, deleteAccount, logout } = useAuth()
  const navigate = useNavigate()
  const photoInputRef = useRef(null)
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)

  const [profileForm, setProfileForm] = useState({ username: '', email: '' })
  const [savingProfile, setSavingProfile] = useState(false)
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
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [profilePhoto, setProfilePhoto] = useState('')
  const [savingPhoto, setSavingPhoto] = useState(false)
  const [photoMessage, setPhotoMessage] = useState('')
  const [photoError, setPhotoError] = useState('')

  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const profileName = user?.username || user?.email || 'Attendee'
  const profileEmail = user?.email || 'N/A'
  const initialsSource = user?.name || user?.username || user?.email || ''
  const initials = useMemo(() => getInitials(profileName), [profileName])
  const memberSince = useMemo(() => formatDate(user?.date_joined || user?.dateJoined), [user])
  const accountType = useMemo(
    () => toTitleCase(user?.role || user?.user_type || user?.userType || role || 'attendee'),
    [role, user]
  )
  const accountStatus = user?.is_active === false ? 'Inactive' : 'Active'
  const hasProfileChanges =
    profileForm.username !== (user?.username || '') || profileForm.email !== (user?.email || '')

  useEffect(() => {
    setProfileForm({
      username: user?.username || '',
      email: user?.email || '',
    })
  }, [user])

  useEffect(() => {
    setProfilePhoto(getStoredProfilePhoto(user))
  }, [user])

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

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  const handleProfileInputChange = (event) => {
    const { name, value } = event.target
    setProfileMessage('')
    setProfileError('')
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCancelProfileChanges = () => {
    setProfileMessage('')
    setProfileError('')
    setProfileForm({
      username: user?.username || '',
      email: user?.email || '',
    })
  }

  const handleSaveProfileChanges = async () => {
    setProfileMessage('')
    setProfileError('')

    if (!hasProfileChanges) {
      setProfileMessage('No changes to save.')
      return
    }

    try {
      setSavingProfile(true)
      const response = await updateProfile({
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
      })
      if (response?.data?.requires_email_verification) {
        const verificationEmail = response?.data?.verification_email || profileForm.email.trim()
        await logout()
        navigate(`/verify-email?email=${encodeURIComponent(verificationEmail)}`, { replace: true })
        return
      }
      setProfileMessage(response?.message || 'Profile updated successfully.')
    } catch (error) {
      setProfileError(error?.message || 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordInputChange = (event) => {
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
      setSavingPassword(true)
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
      setSavingPassword(false)
    }
  }

  const handlePickPhoto = () => {
    setPhotoError('')
    setPhotoMessage('')
    photoInputRef.current?.click()
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file.')
      return
    }

    const maxSizeInBytes = 5 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      setPhotoError('Image size must be 5MB or smaller.')
      return
    }

    const uploadPhoto = async () => {
      setSavingPhoto(true)
      setPhotoError('')
      setPhotoMessage('')

      try {
        const payload = new FormData()
        payload.append('profile_photo', file)
        await updateProfile(payload)
        setPhotoMessage('Profile photo updated successfully.')
      } catch (error) {
        setPhotoError(error?.message || 'Failed to upload photo.')
      } finally {
        setSavingPhoto(false)
      }
    }

    uploadPhoto()
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
      setDeleteError(error?.message || 'Failed to deactivate account.')
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] text-[#312E81]">
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-20 items-center justify-between border-b border-[#312E81]/15 bg-white px-[5%] backdrop-blur">
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
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={`${profileName} profile`}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-semibold text-white">
                  {getInitials(initialsSource) || 'SS'}
                </span>
              )}
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
              <Link
                className="flex items-center gap-3 px-4 py-3 text-sm text-[#312E81] hover:bg-[#F3F4F6]"
                to="/attendee/settings"
              >
                <span className="text-lg">⚙️</span>
                <span>Settings</span>
              </Link>
              <div className="mx-4 my-1 h-px bg-[#E5E7EB]" />
              <button
                className="flex w-full items-center gap-3 rounded-b-lg px-4 py-3 text-left text-sm text-[#EF4444] hover:bg-[#F3F4F6]"
                onClick={handleLogout}
                title="Logout"
                type="button"
              >
                <span className="text-lg">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto grid max-w-6xl flex-1 gap-6 px-6 py-8 pt-28 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <div className="flex flex-col items-center text-center">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={`${profileName} profile`}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#7C3AED] text-xl font-black text-white">
                  {initials}
                </div>
              )}

              <button
                className="mt-3 rounded-lg border border-[#7C3AED] px-3 py-2 text-sm font-bold text-[#7C3AED] transition hover:bg-[#F5F3FF]"
                type="button"
                onClick={handlePickPhoto}
                disabled={savingPhoto}
              >
                {savingPhoto ? 'Uploading...' : 'Change Photo'}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />

              <h1 className="mt-4 text-xl font-black text-[#312E81]">{profileName}</h1>
              <p className="mt-1 text-sm font-semibold text-[#6B7280] break-all">{profileEmail}</p>
            </div>

            {photoMessage ? <p className="mt-4 text-sm font-semibold text-[#059669]">{photoMessage}</p> : null}
            {photoError ? <p className="mt-3 text-sm font-semibold text-[#DC2626]">{photoError}</p> : null}

            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-[#F8FAFC] p-3.5">
                <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Account Type</div>
                <div className="mt-1 text-sm font-semibold text-[#312E81]">{accountType}</div>
              </div>
              <div className="rounded-xl bg-[#F8FAFC] p-3.5">
                <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Account Status</div>
                <div className="mt-1 text-sm font-semibold text-[#312E81]">{accountStatus}</div>
              </div>
              <div className="rounded-xl bg-[#F8FAFC] p-3.5">
                <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Member Since</div>
                <div className="mt-1 text-sm font-semibold text-[#312E81]">{memberSince}</div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#FECACA] bg-white p-6">
            <h2 className="text-lg font-black text-[#B91C1C]">Deactivate Account</h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              This removes sign-in access while keeping your ticket and booking history preserved.
            </p>
            {deleteError ? <p className="mt-3 text-sm font-semibold text-[#DC2626]">{deleteError}</p> : null}
            <button
              className="mt-4 w-full rounded-lg border border-[#DC2626] px-4 py-3 text-sm font-bold text-[#DC2626] transition hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={openDeleteDialog}
              disabled={deletingAccount}
            >
              {deletingAccount ? 'Deactivating...' : 'Deactivate Account'}
            </button>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-[#312E81]">Profile Details</h2>
                <p className="mt-1 text-sm text-[#6B7280]">Update your basic account information.</p>
              </div>
              {hasProfileChanges ? (
                <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#B45309]">
                  Unsaved changes
                </span>
              ) : null}
            </div>

            <form className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="username">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={profileForm.username}
                    onChange={handleProfileInputChange}
                    className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileInputChange}
                    className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              {profileError ? <p className="text-sm font-semibold text-[#DC2626]">{profileError}</p> : null}
              {profileMessage ? <p className="text-sm font-semibold text-[#059669]">{profileMessage}</p> : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  className="rounded-lg border border-[#D1D5DB] px-4 py-3 text-sm font-bold text-[#6B7280] transition hover:bg-[#F8FAFC]"
                  type="button"
                  onClick={handleCancelProfileChanges}
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-[#7C3AED] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={handleSaveProfileChanges}
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="text-2xl font-black text-[#312E81]">Change Password</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Use a strong password you do not reuse elsewhere.</p>

            <form className="mt-5 space-y-4">
              <PasswordField
                id="current-password"
                label="Current Password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                visible={showPassword.currentPassword}
                onChange={handlePasswordInputChange}
                onToggle={() => togglePasswordVisibility('currentPassword')}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <PasswordField
                  id="new-password"
                  label="New Password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  visible={showPassword.newPassword}
                  onChange={handlePasswordInputChange}
                  onToggle={() => togglePasswordVisibility('newPassword')}
                />
                <PasswordField
                  id="confirm-password"
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  visible={showPassword.confirmPassword}
                  onChange={handlePasswordInputChange}
                  onToggle={() => togglePasswordVisibility('confirmPassword')}
                />
              </div>

              {passwordError ? <p className="text-sm font-semibold text-[#DC2626]">{passwordError}</p> : null}
              {passwordMessage ? <p className="text-sm font-semibold text-[#059669]">{passwordMessage}</p> : null}

              <div className="flex justify-end">
                <button
                  className="rounded-lg bg-[#7C3AED] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={savingPassword}
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
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
      {showDeleteDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 px-4">
          <div
            className="w-full max-w-md rounded-2xl border border-[#FECACA] bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-dialog-title"
            aria-describedby="delete-account-dialog-description"
          >
            <h3 id="delete-account-dialog-title" className="text-lg font-black text-[#B91C1C]">
              Deactivate account?
            </h3>
            <p id="delete-account-dialog-description" className="mt-3 text-sm leading-6 text-[#6B7280]">
              This removes sign-in access to your account. Your tickets and booking history will remain preserved.
            </p>
            {deleteError ? <p className="mt-3 text-sm font-semibold text-[#B91C1C]">{deleteError}</p> : null}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm font-bold text-[#374151] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={closeDeleteDialog}
                disabled={deletingAccount}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[#DC2626] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? 'Deactivating...' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AttendeeProfile
