import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api, resolveMediaUrl } from '../../services/api'

const ConcertDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tokens, user, logout, role, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [concert, setConcert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const initialsSource = user?.name || user?.username || user?.email || ''
  const initials = useMemo(() => {
    if (!initialsSource) return 'SS'
    const parts = initialsSource.trim().split(/\s+/)
    const first = parts[0]?.[0] ?? ''
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (first + last).toUpperCase() || 'SS'
  }, [initialsSource])

  useEffect(() => {
    let isActive = true

    const loadConcert = async () => {
      if (!id) {
        if (isActive) setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const data = await api.getConcert(tokens?.access, id)
        const payload = data?.data || data
        if (isActive) setConcert(payload || null)
      } catch (err) {
        if (isActive) setError(err?.message || 'Failed to load concert.')
      } finally {
        if (isActive) setLoading(false)
      }
    }

    loadConcert()

    return () => {
      isActive = false
    }
  }, [id, tokens?.access])

  const formatDateTime = (value) => {
    if (!value) return 'TBD'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'TBD'
    const datePart = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
    const timePart = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
    return `${datePart} · ${timePart}`
  }

  const ticketCategories = useMemo(() => {
    if (Array.isArray(concert?.ticket_categories)) return concert.ticket_categories
    if (Array.isArray(concert?.tickets)) return concert.tickets
    return []
  }, [concert])

  const startingPrice = useMemo(() => {
    const prices = ticketCategories
      .map((ticket) => Number(ticket?.price))
      .filter((price) => Number.isFinite(price) && price > 0)
    if (!prices.length) return null
    return Math.min(...prices)
  }, [ticketCategories])

  const handleLogout = async () => {
    navigate('/', { replace: true })
    await logout()
  }

  const coverImage = resolveMediaUrl(concert?.cover_image)

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
          <Link className="text-base font-semibold text-[#7C3AED]" to="/attendee/concerts">
            Browse Concerts
          </Link>
          <Link className="text-base font-medium text-[#312E81]" to="/attendee/tickets">
            My Tickets
          </Link>
          <div className="relative">
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
              <a className="flex items-center gap-3 rounded-t-lg px-4 py-3 text-sm text-[#312E81] hover:bg-[#F3F4F6]" href="#">
                <span className="text-lg">👤</span>
                <span>My Profile</span>
              </a>
              <div className="mx-4 my-1 h-px bg-[#E5E7EB]" />
              <a className="flex items-center gap-3 px-4 py-3 text-sm text-[#312E81] hover:bg-[#F3F4F6]" href="#">
                <span className="text-lg">⚙️</span>
                <span>Settings</span>
              </a>
              <button
                className="flex w-full items-center gap-3 rounded-b-lg px-4 py-3 text-left text-sm text-[#EF4444] hover:bg-[#F3F4F6]"
                type="button"
                onClick={handleLogout}
                title="Logout"
              >
                <span className="text-lg">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-24">
        <section className="px-[5%] py-10">
          <div className="mx-auto max-w-5xl">
            <Link
              to="/attendee/concerts"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B7280] transition hover:text-[#7C3AED]"
            >
              <span>←</span>
              Back to Browse Concerts
            </Link>

            <div className="mt-6">
              {loading ? (
                <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
                  Loading concert...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-6 py-10 text-center text-sm font-semibold text-[#B91C1C]">
                  {error}
                </div>
              ) : !concert ? (
                <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
                  Concert not found.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(49,46,129,0.08)]">
                  <div className="h-64 bg-linear-to-br from-[#7C3AED] via-[#6D28D9] to-[#4F46E5] sm:h-72">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={concert?.title || 'Concert cover'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl text-white">
                        🎹
                      </div>
                    )}
                  </div>

                  <div className="grid gap-8 p-6 md:grid-cols-[2fr_1fr] md:p-8">
                    <div>
                      <h1 className="text-3xl font-black text-[#2C2E83]">
                        {concert?.title || 'Untitled Concert'}
                      </h1>
                      <p className="mt-2 text-sm font-semibold text-[#6B7280]">
                        {concert?.main_artist || 'Artist lineup TBD'}
                      </p>
                      <div className="mt-6 space-y-3 text-sm font-semibold text-[#6B7280]">
                        <div className="flex items-center gap-2">
                          <span>📅</span>
                          <span>{formatDateTime(concert?.date_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{concert?.venue || 'Venue TBD'}</span>
                        </div>
                      </div>
                      <div className="mt-6">
                        <h2 className="text-sm font-bold uppercase tracking-wide text-[#9CA3AF]">
                          About
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
                          {concert?.description ||
                            'Details about this concert will be updated soon.'}
                        </p>
                      </div>
                    </div>

                    <aside className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                          Starting from
                        </p>
                        <p className="mt-1 text-2xl font-black text-[#2C2E83]">
                          {startingPrice ? `Rs ${startingPrice}` : 'TBD'}
                        </p>
                      </div>
                      <Link
                        className="mt-4 block w-full rounded-lg bg-[#7C3AED] px-4 py-3 text-center text-sm font-bold text-white shadow-[0_10px_20px_rgba(124,58,237,0.3)] transition hover:bg-[#5B21B6]"
                        to={`/attendee/checkout/${concert?.id}`}
                      >
                        Book Now
                      </Link>
                      {ticketCategories.length > 0 ? (
                        <div className="mt-5 space-y-3">
                          {ticketCategories.map((ticket, index) => (
                            <div
                              key={`${ticket?.name || 'ticket'}-${index}`}
                              className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#6B7280]"
                            >
                              <span>{ticket?.name || 'General'}</span>
                              <span className="text-[#2C2E83]">
                                Rs {Number(ticket?.price || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-xs font-semibold text-[#9CA3AF]">
                          Ticket pricing will be available soon.
                        </p>
                      )}
                    </aside>
                  </div>
                </div>
              )}
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
            <a className="text-white/75" href="#">
              Privacy
            </a>
            <a className="text-white/75" href="#">
              Terms
            </a>
          </div>
          <div>© 2026 SoundStage. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

export default ConcertDetails
