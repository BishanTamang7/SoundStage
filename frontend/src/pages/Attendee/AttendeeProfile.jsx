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

const AttendeeProfile = () => {
  const { user, logout, role, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const baseProfile = useMemo(
    () => ({
      username: user?.username || 'attendee_user',
      email: user?.email || 'attendee@example.com',
      phone: user?.phone || '+977 9812345678',
    }),
    [user],
  )
  const [profileForm, setProfileForm] = useState(baseProfile)
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
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
    setProfileForm(baseProfile)
  }, [baseProfile])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = (event) => {
    event.preventDefault()
    // TODO: Hook to profile update API
    alert('Profile updated successfully! (Check console)')
    // eslint-disable-next-line no-console
    console.log('Profile Update:', profileForm)
  }

  const handleProfileReset = () => {
    setProfileForm(baseProfile)
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordSubmit = (event) => {
    event.preventDefault()
    if (passwordForm.next !== passwordForm.confirm) {
      alert('New passwords do not match!')
      return
    }
    // TODO: Hook to password update API
    alert('Password updated successfully! (Check console)')
    // eslint-disable-next-line no-console
    console.log('Password Update:', {
      current_password: passwordForm.current,
      new_password: passwordForm.next,
    })
    setPasswordForm({ current: '', next: '', confirm: '' })
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
              <a className="flex items-center gap-3 px-4 py-3 text-sm text-[#312E81] hover:bg-[#F3F4F6]" href="#">
                <span className="text-lg">⚙️</span>
                <span>Settings</span>
              </a>
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

      <main className="flex-1 pt-20">
        <section className="px-[5%] py-12">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <h1 className="font-['Playfair_Display'] text-3xl font-black text-[#312E81] sm:text-4xl">
                My Profile
              </h1>
              <p className="mt-2 text-base font-semibold text-[#6B7280]">
                Manage your account information and preferences
              </p>
            </div>

            <div className="mb-8 flex flex-col gap-8 rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_12px_30px_rgba(49,46,129,0.08)] md:flex-row md:items-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-[#7C3AED] to-[#4F46E5] text-4xl font-black text-white shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
                  {initials}
                </div>
                <button
                  className="rounded-lg border border-[#7C3AED] px-4 py-2 text-sm font-bold text-[#7C3AED] transition hover:bg-[#F3F4F6]"
                  type="button"
                >
                  Change Photo
                </button>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-black text-[#312E81]">
                  {user?.name || user?.username || 'Attendee User'}
                </h2>
                <p className="mt-1 text-base font-semibold text-[#6B7280]">
                  {user?.email || 'attendee@example.com'}
                </p>
                <span className="mt-3 inline-flex rounded-md bg-[#F3F4F6] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#7C3AED]">
                  Attendee
                </span>
              </div>
            </div>

            <div className="mb-8 rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <h3 className="border-b border-[#E5E7EB] pb-4 text-lg font-black text-[#312E81]">
                My Activity
              </h3>
              <div className="mt-6 grid gap-6 text-center sm:grid-cols-3">
                <div>
                  <div className="text-3xl font-black text-[#7C3AED]">12</div>
                  <div className="text-sm font-semibold text-[#6B7280]">Concerts Attended</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#7C3AED]">5</div>
                  <div className="text-sm font-semibold text-[#6B7280]">Upcoming Events</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#7C3AED]">17</div>
                  <div className="text-sm font-semibold text-[#6B7280]">Total Tickets</div>
                </div>
              </div>
            </div>

            <div className="mb-8 rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <h3 className="border-b border-[#E5E7EB] pb-4 text-lg font-black text-[#312E81]">
                Account Details
              </h3>
              <form className="mt-6" onSubmit={handleProfileSubmit}>
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#312E81]" htmlFor="username">
                    Username
                    <input
                      className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium text-[#312E81] shadow-sm transition focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/15"
                      id="username"
                      name="username"
                      onChange={handleProfileChange}
                      value={profileForm.username}
                      type="text"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#312E81]" htmlFor="email">
                    Email Address
                    <input
                      className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium text-[#312E81] shadow-sm transition focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/15"
                      id="email"
                      name="email"
                      onChange={handleProfileChange}
                      value={profileForm.email}
                      type="email"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#312E81]" htmlFor="phone">
                    Phone Number
                    <input
                      className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium text-[#312E81] shadow-sm transition focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/15"
                      id="phone"
                      name="phone"
                      onChange={handleProfileChange}
                      value={profileForm.phone}
                      type="tel"
                      placeholder="+977 9812345678"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#312E81]" htmlFor="joined">
                    Member Since
                    <input
                      className="rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-3 text-sm font-medium text-[#6B7280]"
                      id="joined"
                      value="February 1, 2026"
                      type="text"
                      disabled
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#312E81]" htmlFor="role">
                    Account Type
                    <input
                      className="rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-3 text-sm font-medium text-[#6B7280]"
                      id="role"
                      value="Attendee"
                      type="text"
                      disabled
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#312E81]" htmlFor="status">
                    Account Status
                    <input
                      className="rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-3 text-sm font-medium text-[#6B7280]"
                      id="status"
                      value="Active"
                      type="text"
                      disabled
                    />
                  </label>
                </div>
                <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                  <button
                    className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-bold text-[#6B7280] transition hover:bg-[#F3F4F6]"
                    type="button"
                    onClick={handleProfileReset}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-lg bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4F46E5]"
                    type="submit"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            <div className="mb-8 rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <h3 className="border-b border-[#E5E7EB] pb-4 text-lg font-black text-[#312E81]">
                Change Password
              </h3>
              <form className="mt-6" onSubmit={handlePasswordSubmit}>
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#312E81]" htmlFor="current">
                    Current Password
                    <input
                      className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium text-[#312E81] shadow-sm transition focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/15"
                      id="current"
                      name="current"
                      onChange={handlePasswordChange}
                      value={passwordForm.current}
                      type="password"
                      placeholder="Enter current password"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#312E81]" htmlFor="next">
                    New Password
                    <input
                      className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium text-[#312E81] shadow-sm transition focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/15"
                      id="next"
                      name="next"
                      onChange={handlePasswordChange}
                      value={passwordForm.next}
                      type="password"
                      placeholder="Enter new password"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#312E81]" htmlFor="confirm">
                    Confirm New Password
                    <input
                      className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium text-[#312E81] shadow-sm transition focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/15"
                      id="confirm"
                      name="confirm"
                      onChange={handlePasswordChange}
                      value={passwordForm.confirm}
                      type="password"
                      placeholder="Confirm new password"
                      required
                    />
                  </label>
                </div>
                <div className="mt-6">
                  <button
                    className="rounded-lg bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4F46E5]"
                    type="submit"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-2xl border border-[#EF4444] bg-white p-8">
              <h3 className="text-lg font-black text-[#EF4444]">Danger Zone</h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-[#6B7280]">
                Once you delete your account, there is no going back. All your tickets, bookings, and personal
                data will be permanently deleted. Please be certain.
              </p>
              <button
                className="mt-5 rounded-lg border border-[#EF4444] px-6 py-3 text-sm font-bold text-[#EF4444] transition hover:bg-[#FEE2E2]"
                type="button"
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>
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

export default AttendeeProfile
