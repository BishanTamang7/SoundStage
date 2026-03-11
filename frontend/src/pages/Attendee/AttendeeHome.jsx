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

const AttendeeHome = () => {
  const { user, logout, role, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  const initialsSource = user?.name || user?.username || user?.email || ''
  const initials = useMemo(() => getInitials(initialsSource) || 'SS', [initialsSource])
  const profilePhoto = useMemo(() => getStoredProfilePhoto(user), [user])

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
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={`${user?.username || 'Attendee'} profile`}
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
              <Link className="flex items-center gap-3 px-4 py-3 text-sm text-[#312E81] hover:bg-[#F3F4F6]" to="/attendee/settings">
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

      <main className="flex-1 pt-20">
        <section className="bg-linear-to-br from-[#7C3AED] to-[#4F46E5] px-[5%] py-12 text-center text-white">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-['Playfair_Display'] text-4xl font-black sm:text-5xl lg:text-6xl">
              Welcome to SoundStage
            </h1>
            <p className="mt-4 text-lg text-white/95 sm:text-xl">
              Your trusted platform for discovering and booking live music concerts
            </p>
            <Link
              to="/attendee/concerts"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-sm font-bold text-[#7C3AED] transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
            >
              Browse Concerts
            </Link>
          </div>
        </section>

        <section className="bg-[#F8F9FA] px-[5%] py-8 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="font-['Playfair_Display'] text-3xl font-black text-[#312E81] sm:text-4xl">
                What We Offer
              </h2>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-white px-6 py-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[#7C3AED] to-[#4F46E5] text-4xl">
                  🎫
                </div>
                <h3 className="text-2xl font-black text-[#312E81]">Easy Booking</h3>
                <p className="mt-3 text-base font-medium leading-relaxed text-[#6B7280]">
                  Browse and book tickets to amazing concerts with just a few clicks
                </p>
              </div>

              <div className="rounded-xl bg-white px-6 py-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[#7C3AED] to-[#4F46E5] text-4xl">
                  🎵
                </div>
                <h3 className="text-2xl font-black text-[#312E81]">Live Events</h3>
                <p className="mt-3 text-base font-medium leading-relaxed text-[#6B7280]">
                  Discover upcoming concerts and live music events in your area
                </p>
              </div>

              <div className="rounded-xl bg-white px-6 py-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[#7C3AED] to-[#4F46E5] text-4xl">
                  📱
                </div>
                <h3 className="text-2xl font-black text-[#312E81]">Digital Tickets</h3>
                <p className="mt-3 text-base font-medium leading-relaxed text-[#6B7280]">
                  Get instant QR code tickets delivered right to your device
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

export default AttendeeHome
