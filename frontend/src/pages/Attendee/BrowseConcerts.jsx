import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AttendeeFooter from '../../components/AttendeeFooter'
import AttendeeHeader from '../../components/AttendeeHeader'
import { api, resolveMediaUrl } from '../../services/api'

const CITY_OPTIONS = [
  'Kathmandu',
  'Pokhara',
  'Dharan',
  'Butwal',
  'Biratnagar',
]

const GENRE_OPTIONS = [
  { value: 'rock', label: 'Rock' },
  { value: 'hip-hop-rap', label: 'Hip-Hop / Rap' },
  { value: 'pop', label: 'Pop' },
  { value: 'folk-dohori', label: 'Folk / Dohori' },
]

const BrowseConcerts = () => {
  const [concerts, setConcerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('all')
  const [genre, setGenre] = useState('')
  const [dateRange, setDateRange] = useState('all')

  useEffect(() => {
    let isActive = true

    const loadConcerts = async () => {
      try {
        setLoading(true)
        setError('')
        const search = query.trim()
        const data = await api.listConcerts(search ? { search } : {})
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
  }, [query])

  const getVenueParts = (venue) => {
    if (!venue) return { venueName: '', city: '' }
    const parts = venue.split(/[,|•|-]+/).map((item) => item.trim()).filter(Boolean)
    if (parts.length > 1) {
      return {
        venueName: parts.slice(0, -1).join(', '),
        city: parts[parts.length - 1],
      }
    }
    return { venueName: venue.trim(), city: '' }
  }

  const cityOptions = CITY_OPTIONS

  const filteredConcerts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const normalizedGenre = genre.trim().toLowerCase()
    const normalizedCity = city === 'all' ? '' : city.toLowerCase()
    const normalizedRange = dateRange

    return concerts.filter((concert) => {
      const title = concert?.title || ''
      const venue = concert?.venue || ''
      const matchesQuery = normalizedQuery ? title.toLowerCase().includes(normalizedQuery) : true
      const matchesCity = normalizedCity
        ? getVenueParts(venue).city.toLowerCase() === normalizedCity
        : true
      const matchesGenre = normalizedGenre ? (concert?.genre || '').toLowerCase() === normalizedGenre : true

      const concertDate = concert?.date_time ? new Date(concert.date_time) : null
      if (!concertDate || Number.isNaN(concertDate.getTime())) return false

      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      if (!matchesQuery || !matchesCity || !matchesGenre) return false

      // Never show concerts that already happened.
      if (concertDate < now) return false

      if (normalizedRange === 'all') return true

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
    setSearchInput('')
    setQuery('')
    setCity('all')
    setGenre('')
    setDateRange('all')
  }

  const handleSearch = () => {
    setQuery(searchInput)
  }

  const hasSearchQuery = query.trim().length > 0
  const hasActiveFilters = city !== 'all' || genre.trim().length > 0 || dateRange !== 'all'
  const emptyStateMessage = concerts.length === 0
    ? 'No concerts are available yet.'
    : hasSearchQuery
      ? `No concerts found for "${query.trim()}".`
      : hasActiveFilters
        ? 'No concerts match your current filters.'
        : 'No concerts are available yet.'

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] text-[#312E81]">
      <AttendeeHeader />

      <main className="flex-1 pt-20">
        <section className="px-[5%] pb-12 pt-3">
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
                    placeholder="Search by concert name..."
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleSearch()
                      }
                    }}
                    type="text"
                  />
                  <button
                    className="flex h-12 items-center justify-center rounded-lg bg-[#7C3AED] px-8 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(124,58,237,0.25)] transition hover:bg-[#6D28D9]"
                    type="button"
                    onClick={handleSearch}
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
                    {GENRE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
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
                  {emptyStateMessage}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredConcerts.map((concert) => {
                    const imageUrl = resolveMediaUrl(concert?.cover_image)
                    const { venueName, city: concertCity } = getVenueParts(concert?.venue || '')
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
                              <span>{venueName || 'Venue TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>🏙️</span>
                              <span>{concertCity || 'City TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>🎤</span>
                              <span>{concert?.main_artist || 'Artist lineup TBD'}</span>
                            </div>
                            {concert?.genre_display ? (
                              <div className="flex items-center gap-2">
                                <span>🎼</span>
                                <span>{concert.genre_display}</span>
                              </div>
                            ) : null}
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

      <AttendeeFooter />
    </div>
  )
}

export default BrowseConcerts
