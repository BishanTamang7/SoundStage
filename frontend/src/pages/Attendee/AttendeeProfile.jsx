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

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
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
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-10 shadow-[0_12px_30px_rgba(49,46,129,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#7C3AED]">
                Account Overview
              </p>
              <h1 className="mt-4 font-['Playfair_Display'] text-4xl font-black text-[#312E81]">
                Your Profile
              </h1>
              <p className="mt-2 text-base font-medium text-[#6B7280]">
                Review your attendee details and manage your SoundStage presence.
              </p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA] px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6B7280]">Name</p>
                  <p className="mt-2 text-lg font-semibold text-[#312E81]">
                    {user?.name || user?.username || 'Attendee'}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA] px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6B7280]">Email</p>
                  <p className="mt-2 text-lg font-semibold text-[#312E81]">
                    {user?.email || 'Not provided'}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA] px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6B7280]">Username</p>
                  <p className="mt-2 text-lg font-semibold text-[#312E81]">
                    {user?.username || 'Not set'}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA] px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6B7280]">Member Since</p>
                  <p className="mt-2 text-lg font-semibold text-[#312E81]">Coming soon</p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white px-6 py-5">
                <h2 className="text-lg font-semibold text-[#312E81]">What’s next</h2>
                <p className="mt-2 text-sm font-medium text-[#6B7280]">
                  Profile editing and preferences will be available in a future update.
                </p>
              </div>
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
