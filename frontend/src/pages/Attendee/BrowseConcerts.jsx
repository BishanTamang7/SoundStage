import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api, resolveMediaUrl } from '../../services/api'

const getInitials = (name) => {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const BrowseConcerts = () => {
  const { user, logout, role, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const [concerts, setConcerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('all')
  const [genre, setGenre] = useState('')
  const [dateRange, setDateRange] = useState('all')

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
    let isActive = true

    const loadConcerts = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await api.listConcerts()
        const list = data?.data?.concerts || data?.concerts || []
        if (isActive) setConcerts(Array.isArray(list) ? list : [])
      } catch (err) {
        if (isActive) setError(err?.message || 'Failed to load concerts.')
      } finally {
        if (isActive) setLoading(false)
      }
    }

    loadConcerts()

    return () => {
      isActive = false
    }
  }, [])

  const handleLogout = async () => {
    navigate('/', { replace: true })
    await logout()
  }

  const extractCity = (venue) => {
    if (!venue) return ''
    const parts = venue.split(/[,|•|-]+/).map((item) => item.trim()).filter(Boolean)
    return parts.length > 1 ? parts[parts.length - 1] : venue.trim()
  }

  const cityOptions = useMemo(() => {
    const options = new Map()
    concerts.forEach((concert) => {
      const value = extractCity(concert?.venue)
      if (value) options.set(value.toLowerCase(), value)
    })
    return Array.from(options.values()).sort((a, b) => a.localeCompare(b))
  }, [concerts])

  const filteredConcerts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const normalizedGenre = genre.trim().toLowerCase()
    const normalizedCity = city === 'all' ? '' : city.toLowerCase()
    const normalizedRange = dateRange

    return concerts.filter((concert) => {
      const title = concert?.title || ''
      const artist = concert?.main_artist || ''
      const venue = concert?.venue || ''
      const haystack = `${title} ${artist} ${venue}`.toLowerCase()
      const matchesQuery = normalizedQuery ? haystack.includes(normalizedQuery) : true
      const matchesCity = normalizedCity
        ? extractCity(venue).toLowerCase() === normalizedCity
        : true
      const matchesGenre = normalizedGenre
        ? `${title} ${artist}`.toLowerCase().includes(normalizedGenre)
        : true

      if (!matchesQuery || !matchesCity || !matchesGenre) return false

      if (normalizedRange === 'all') return true

      const concertDate = concert?.date_time ? new Date(concert.date_time) : null
      if (!concertDate || Number.isNaN(concertDate.getTime())) return false

      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

      if (normalizedRange === 'today') {
        return concertDate >= startOfToday && concertDate <= endOfToday
      }

      if (normalizedRange === 'week') {
        const day = startOfToday.getDay()
        const diffToMonday = (day + 6) % 7
        const startOfWeek = new Date(startOfToday)
        startOfWeek.setDate(startOfWeek.getDate() - diffToMonday)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)
        return concertDate >= startOfWeek && concertDate <= endOfWeek
      }

      if (normalizedRange === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        return concertDate >= startOfMonth && concertDate <= endOfMonth
      }

      return true
    })
  }, [city, concerts, dateRange, genre, query])

  const formatDate = (value) => {
    if (!value) return 'TBD'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'TBD'
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const formatTime = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  const handleResetFilters = () => {
    setQuery('')
    setCity('all')
    setGenre('')
    setDateRange('all')
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
          <Link className="text-base font-semibold text-[#7C3AED]" to="/attendee/concerts">
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
        <section className="px-[5%] py-12">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h1 className="text-3xl font-black text-[#2C2E83] sm:text-4xl">
                Browse Concerts
              </h1>
              <p className="mt-2 text-sm font-medium text-[#6B7280] sm:text-base">
                Discover the perfect concerts for your next night out
              </p>
            </div>

            <div className="mt-8">
              <div className="flex flex-col gap-4">
                <div className="flex w-full flex-col gap-4 md:flex-row md:items-center">
                  <input
                    className="w-full flex-1 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 text-sm font-semibold text-[#1F2937] shadow-[0_10px_30px_rgba(15,23,42,0.08)] outline-none placeholder:text-[#9CA3AF] focus:border-[#7C3AED]"
                    placeholder="Search by concert name, artist, or venue..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    type="text"
                  />
                  <button
                    className="flex h-12 items-center justify-center rounded-lg bg-[#7C3AED] px-8 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(124,58,237,0.25)] transition hover:bg-[#6D28D9]"
                    type="button"
                  >
                    Search
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <select
                    className="min-w-45 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1F2937] shadow-[0_10px_30px_rgba(15,23,42,0.06)] outline-none focus:border-[#7C3AED]"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  >
                    <option value="all">All Cities</option>
                    {cityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <select
                    className="min-w-45 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1F2937] shadow-[0_10px_30px_rgba(15,23,42,0.06)] outline-none focus:border-[#7C3AED]"
                    value={genre}
                    onChange={(event) => setGenre(event.target.value)}
                  >
                    <option value="">All Genres</option>
                    <option value="rock">Rock</option>
                    <option value="jazz">Jazz</option>
                    <option value="edm">EDM</option>
                    <option value="acoustic">Acoustic</option>
                    <option value="hip hop">Hip Hop</option>
                  </select>
                  <select
                    className="min-w-45 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1F2937] shadow-[0_10px_30px_rgba(15,23,42,0.06)] outline-none focus:border-[#7C3AED]"
                    value={dateRange}
                    onChange={(event) => setDateRange(event.target.value)}
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                  <button
                    className="rounded-lg border border-[#E5E7EB] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B7280] transition hover:border-[#CBD5F5] hover:text-[#1F2937]"
                    onClick={handleResetFilters}
                    type="button"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              {loading ? (
                <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
                  Loading concerts...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-6 py-10 text-center text-sm font-semibold text-[#B91C1C]">
                  {error}
                </div>
              ) : filteredConcerts.length === 0 ? (
                <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
                  No concerts match those filters yet.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredConcerts.map((concert) => {
                    const imageUrl = resolveMediaUrl(concert?.cover_image)
                    return (
                      <article
                        key={concert.id}
                        className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_10px_30px_rgba(49,46,129,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(49,46,129,0.12)]"
                      >
                        <div className="relative h-40 bg-linear-to-br from-[#7C3AED] via-[#6D28D9] to-[#4F46E5]">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={concert?.title || 'Concert cover'}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-4xl text-white">
                              🎹
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="text-lg font-black text-[#2C2E83]">
                            {concert?.title || 'Untitled Concert'}
                          </h3>
                          <div className="mt-3 space-y-2 text-sm font-semibold text-[#6B7280]">
                            <div className="flex items-center gap-2">
                              <span>📅</span>
                              <span>
                                {formatDate(concert?.date_time)} · {formatTime(concert?.date_time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>📍</span>
                              <span>{concert?.venue || 'Venue TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>🎤</span>
                              <span>{concert?.main_artist || 'Artist lineup TBD'}</span>
                            </div>
                          </div>
                          <div className="my-4 h-px bg-[#E5E7EB]" />
                          <div className="flex items-center justify-between gap-3">
                            <Link
                              className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-xs font-bold text-[#6B7280] transition hover:border-[#CBD5F5] hover:text-[#1F2937]"
                              to={`/attendee/concerts/${concert.id}`}
                            >
                              View Details
                            </Link>
                            <Link
                              className="rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-bold text-white shadow-[0_8px_18px_rgba(124,58,237,0.3)] transition hover:bg-[#5B21B6]"
                              to={`/attendee/checkout/${concert.id}`}
                            >
                              Book Now
                            </Link>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#312E81] px-[5%] py-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-6 text-base">
          <div className="flex gap-8">
            <a className="text-white/75" href="#">
              About
            </a>
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

export default BrowseConcerts
