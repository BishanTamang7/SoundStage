import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { getStoredProfilePhoto } from '../../utils/profilePhoto'

const getInitials = (name) => {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const AttendeeAbout = () => {
  const { user, logout, role, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const [weeklyConcertCount, setWeeklyConcertCount] = useState(null)

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

  useEffect(() => {
    let isActive = true

    const loadWeeklyConcertCount = async () => {
      try {
        const data = await api.listConcerts()
        const list = data?.data?.concerts || data?.concerts || []
        const concerts = Array.isArray(list) ? list : []
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const day = startOfToday.getDay()
        const diffToMonday = (day + 6) % 7
        const startOfWeek = new Date(startOfToday)
        startOfWeek.setDate(startOfWeek.getDate() - diffToMonday)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)

        const count = concerts.filter((concert) => {
          const createdAt = concert?.created_at || concert?.createdAt
          if (!createdAt) return false
          const createdDate = new Date(createdAt)
          if (Number.isNaN(createdDate.getTime())) return false
          return createdDate >= startOfWeek && createdDate <= endOfWeek
        }).length

        if (isActive) setWeeklyConcertCount(count)
      } catch {
        if (isActive) setWeeklyConcertCount(null)
      }
    }

    loadWeeklyConcertCount()

    return () => {
      isActive = false
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  const weeklyConcertHeadline = useMemo(() => {
    if (weeklyConcertCount == null) return 'Live concert updates'
    return `${weeklyConcertCount.toLocaleString('en-US')} concert${weeklyConcertCount === 1 ? '' : 's'} added`
  }, [weeklyConcertCount])

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

      <main className="flex flex-1 pt-20">
        <section className="relative flex flex-1 items-center overflow-hidden bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] px-[5%] py-8 text-[#312E81]">
          <div className="absolute inset-0">
            <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-[#7C3AED]/20 blur-[80px]" />
            <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-[#60A5FA]/20 blur-[120px]" />
            <div className="absolute bottom-0 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#A78BFA]/20 blur-[90px]" />
          </div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-[#C4B5FD]">About SoundStage</p>
              <h1 className="mt-4 font-['Playfair_Display'] text-4xl font-black sm:text-5xl lg:text-[3.4rem]">
                Live music, simplified for real fans.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#4B5563] sm:text-lg">
                SoundStage brings verified venues, transparent pricing, and instant QR tickets into one smooth flow so
                discovering a show feels as good as being there.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-[#4F46E5]">
                <span className="rounded-full border border-[#C7D2FE] bg-white/75 px-4 py-2">Verified venues</span>
                <span className="rounded-full border border-[#C7D2FE] bg-white/75 px-4 py-2">Secure checkout</span>
                <span className="rounded-full border border-[#C7D2FE] bg-white/75 px-4 py-2">Instant QR tickets</span>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  className="inline-flex items-center justify-center rounded-full bg-[#7C3AED] px-8 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#6D28D9] hover:shadow-[0_8px_20px_rgba(124,58,237,0.28)]"
                  to="/attendee/concerts"
                >
                  Explore Concerts
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-full border border-[#C7D2FE] bg-white/65 px-8 py-3 text-sm font-semibold text-[#312E81] transition hover:bg-white"
                  to="/attendee/tickets"
                >
                  View My Tickets
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_24px_50px_rgba(99,102,241,0.12)] backdrop-blur">
                <p className="text-xs uppercase tracking-[0.35em] text-[#7C3AED]">This week</p>
                <h2 className="mt-2 text-2xl font-bold">{weeklyConcertHeadline}</h2>
                <p className="mt-2 text-sm text-[#6B7280]">
                  {weeklyConcertCount == null
                    ? 'Fresh lineups and new dates are loading.'
                    : 'Fresh lineups and new dates from your favorite cities.'}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_40px_rgba(99,102,241,0.1)] backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#EC4899]">How it works</p>
                  <div className="mt-4 grid gap-3 text-sm text-[#4B5563]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">1</span>
                      <span>Browse shows by city, date, and genre.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">2</span>
                      <span>Reserve tickets with secure checkout.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">3</span>
                      <span>Walk in with your QR code ready.</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#7C3AED]/20 bg-linear-to-br from-[#7C3AED] to-[#4F46E5] p-5 text-white shadow-[0_22px_50px_rgba(79,70,229,0.22)]">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/75">Need help fast?</p>
                  <h3 className="mt-3 text-2xl font-bold">Support that responds quickly</h3>
                  <p className="mt-3 text-sm text-white/90">
                    Our attendee team helps with ticket access, payment issues, and event questions within hours.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white">
                    <span className="rounded-full bg-white/15 px-3 py-2">support@soundstage.com</span>
                    <span className="rounded-full bg-white/15 px-3 py-2">Live chat 10am-8pm</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { title: 'Verified venues', body: 'We feature organizers and venues with trusted track records.' },
                  { title: 'Transparent pricing', body: 'You see the total before you pay. No hidden surprises.' },
                  { title: 'Fan-first updates', body: 'Community feedback shapes the shows and venues we highlight.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_14px_30px_rgba(99,102,241,0.08)] backdrop-blur">
                    <h3 className="text-base font-semibold text-[#312E81]">{item.title}</h3>
                    <p className="mt-2 text-sm text-[#6B7280]">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#312E81] px-[5%] py-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-6 text-base">
          <div className="flex gap-8">
            <Link className="text-white/75" to="/about">
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

export default AttendeeAbout
