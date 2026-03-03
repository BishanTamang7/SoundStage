import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getStoredProfilePhoto } from '../../utils/profilePhoto'

const getInitials = (name) => {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
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
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const AttendeeProfile = () => {
  const { user, logout, role, isAuthenticated, updateProfile, changePassword, deleteAccount } =
    useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    phone: '',
  })
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [profilePhoto, setProfilePhoto] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [savingPhoto, setSavingPhoto] = useState(false)
  const photoInputRef = useRef(null)

  const initialsSource = user?.name || user?.username || user?.email || ''
  const initials = useMemo(() => getInitials(initialsSource) || 'SS', [initialsSource])
  const memberSince = useMemo(() => formatDate(user?.date_joined || user?.dateJoined), [user])
  const accountType = useMemo(
    () => toTitleCase(user?.role || user?.user_type || user?.userType || role || 'Attendee'),
    [role, user]
  )
  const accountStatus = user?.is_active === false ? 'Inactive' : 'Active'
  const profileName = user?.name || user?.username || 'Attendee User'
  const profileEmail = user?.email || 'N/A'
  const hasProfileChanges =
    profileForm.username !== (user?.username || '') ||
    profileForm.email !== (user?.email || '') ||
    profileForm.phone !== (user?.phone || user?.phone_number || user?.phoneNumber || '')

  useEffect(() => {
    setProfileForm({
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || user?.phone_number || user?.phoneNumber || '',
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
      phone: user?.phone || user?.phone_number || user?.phoneNumber || '',
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
      await updateProfile({
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
      })
      setProfileMessage('Profile updated successfully.')
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

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
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

  const handlePickPhoto = () => {
    setPhotoError('')
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
      setPhotoError('')
      setSavingPhoto(true)
      setProfileMessage('')
      setProfileError('')
      try {
        const payload = new FormData()
        payload.append('profile_photo', file)
        await updateProfile(payload)
        setProfileMessage('Profile photo updated successfully.')
      } catch (error) {
        setPhotoError(error?.message || 'Failed to upload photo.')
      } finally {
        setSavingPhoto(false)
      }
    }

    uploadPhoto()
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
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={`${profileName} profile`}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-semibold text-white">
                  {initials}
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
              <div className="mx-4 my-1 h-px bg-[#E5E7EB]" />
              <Link className="flex items-center gap-3 px-4 py-3 text-sm text-[#312E81] hover:bg-[#F3F4F6]" to="/attendee/settings">
                <span className="text-lg">⚙️</span>
                <span>Settings</span>
              </Link>
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

      <main className="flex-1 bg-[#FAFAFA] pt-24">
        <div className="mx-auto max-w-5xl px-6 pt-8 pb-12">
          <section className="mb-8 flex flex-col gap-6 rounded-2xl border border-[#E5E7EB] bg-white p-8 md:flex-row md:items-center">
            <div className="flex flex-col items-center gap-4 md:w-60">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={`${profileName} profile`}
                  className="h-28 w-28 rounded-full object-cover shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-[#7C3AED] to-[#4F46E5] text-4xl font-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                  {initials}
                </div>
              )}
              <button
                className="rounded-lg border border-[#7C3AED] px-4 py-2 text-sm font-bold text-[#7C3AED] transition hover:bg-[#F3F4F6]"
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
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-[#312E81]">{profileName}</h2>
              <p className="mt-1 text-sm font-semibold text-[#6B7280]">{profileEmail}</p>
              <p className="mt-1 text-sm font-semibold text-[#6B7280]">Member since {memberSince}</p>
              {photoError ? <p className="mt-2 text-sm font-semibold text-[#EF4444]">{photoError}</p> : null}
              <span className="mt-3 inline-flex rounded-md bg-[#F3F4F6] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#7C3AED]">
                {accountType}
              </span>
            </div>
          </section>

          <section className="mb-8 rounded-2xl border border-[#E5E7EB] bg-white p-8">
            <h3 className="border-b-2 border-[#E5E7EB] pb-3 text-lg font-black text-[#312E81]">
              Account Details
            </h3>
            <form className="mt-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="username">
                    Username
                  </label>
                  <input
                    className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    id="username"
                    name="username"
                    type="text"
                    value={profileForm.username}
                    onChange={handleProfileInputChange}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileInputChange}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    id="phone"
                    name="phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={handleProfileInputChange}
                    placeholder="+977 9812345678"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="joined">
                    Member Since
                  </label>
                  <input
                    className="rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-3 text-sm text-[#312E81]"
                    id="joined"
                    type="text"
                    value={memberSince}
                    disabled
                    readOnly
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="role">
                    Account Type
                  </label>
                  <input
                    className="rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-3 text-sm text-[#312E81]"
                    id="role"
                    type="text"
                    value={accountType}
                    disabled
                    readOnly
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="status">
                    Account Status
                  </label>
                  <input
                    className="rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-3 text-sm text-[#312E81]"
                    id="status"
                    type="text"
                    value={accountStatus}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              {profileError ? (
                <p className="mt-4 text-sm font-semibold text-[#EF4444]">{profileError}</p>
              ) : null}
              {profileMessage ? (
                <p className="mt-4 text-sm font-semibold text-[#059669]">{profileMessage}</p>
              ) : null}
              <div className="mt-6 flex flex-col gap-4 md:flex-row">
                <button
                  className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-bold text-[#6B7280] transition hover:bg-[#F3F4F6]"
                  type="button"
                  onClick={handleCancelProfileChanges}
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:bg-[#A78BFA]"
                  type="button"
                  onClick={handleSaveProfileChanges}
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>

          <section className="mb-8 rounded-2xl border border-[#E5E7EB] bg-white p-8">
            <h3 className="border-b-2 border-[#E5E7EB] pb-3 text-lg font-black text-[#312E81]">
              Change Password
            </h3>
            <form className="mt-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="current-password">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 pr-16 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                      id="current-password"
                      name="currentPassword"
                      type={showPassword.currentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordInputChange}
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#4F46E5]"
                      type="button"
                      onClick={() => togglePasswordVisibility('currentPassword')}
                    >
                      {showPassword.currentPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 pr-16 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                      id="new-password"
                      name="newPassword"
                      type={showPassword.newPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordInputChange}
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#4F46E5]"
                      type="button"
                      onClick={() => togglePasswordVisibility('newPassword')}
                    >
                      {showPassword.newPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 pr-16 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                      id="confirm-password"
                      name="confirmPassword"
                      type={showPassword.confirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordInputChange}
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#4F46E5]"
                      type="button"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                    >
                      {showPassword.confirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>
              {passwordError ? (
                <p className="mt-4 text-sm font-semibold text-[#EF4444]">{passwordError}</p>
              ) : null}
              {passwordMessage ? (
                <p className="mt-4 text-sm font-semibold text-[#059669]">{passwordMessage}</p>
              ) : null}
              <div className="mt-6">
                <button
                  className="rounded-lg bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:bg-[#A78BFA]"
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={savingPassword}
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-[#EF4444] bg-white p-8">
            <h3 className="text-lg font-black text-[#EF4444]">Danger Zone</h3>
            <p className="mt-3 text-sm font-medium leading-6 text-[#6B7280]">
              Once you delete your account, there is no going back. All your tickets, bookings,
              and personal data will be permanently deleted. Please be certain.
            </p>
            {deleteError ? (
              <p className="mt-4 text-sm font-semibold text-[#EF4444]">{deleteError}</p>
            ) : null}
            <button
              className="mt-5 rounded-lg border border-[#EF4444] bg-white px-6 py-3 text-sm font-bold text-[#EF4444] transition hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={openDeleteDialog}
              disabled={deletingAccount}
            >
              {deletingAccount ? 'Deleting...' : 'Delete Account'}
            </button>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111827]/55 px-4">
          <div
            className="w-full max-w-md rounded-2xl border border-[#FECACA] bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-dialog-title"
            aria-describedby="delete-account-dialog-description"
          >
            <h3 id="delete-account-dialog-title" className="text-lg font-black text-[#B91C1C]">
              Delete account?
            </h3>
            <p id="delete-account-dialog-description" className="mt-3 text-sm leading-6 text-[#6B7280]">
              This action cannot be undone. Your tickets, bookings, and profile data will be permanently removed.
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

export default AttendeeProfile
