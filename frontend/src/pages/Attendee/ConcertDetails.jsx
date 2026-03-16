import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AttendeeFooter from '../../components/AttendeeFooter'
import AttendeeHeader from '../../components/AttendeeHeader'
import { useAuth } from '../../hooks/useAuth'
import { api, resolveMediaUrl } from '../../services/api'

const ConcertDetails = () => {
  const { id } = useParams()
  const { tokens } = useAuth()
  const [concert, setConcert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const coverImage = resolveMediaUrl(concert?.cover_image)
  const { venueName, city } = getVenueParts(concert?.venue || '')

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] text-[#312E81]">
      <AttendeeHeader />

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
                          <span>{venueName || 'Venue TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>🏙️</span>
                          <span>{city || 'City TBD'}</span>
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

                    <aside className="self-start rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
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
                          {ticketCategories.map((ticket, index) => {
                            const remaining = Number(ticket?.remaining ?? ticket?.quantity ?? 0)
                            const soldOut = remaining <= 0
                            return (
                              <div
                                key={`${ticket?.name || 'ticket'}-${index}`}
                                className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#6B7280]"
                              >
                                <span>
                                  {ticket?.name || 'General'}
                                  <span className="ml-2 text-[11px] font-medium text-[#9CA3AF]">
                                    {soldOut ? 'Sold out' : `${remaining} left`}
                                  </span>
                                </span>
                                <span className={soldOut ? 'text-[#9CA3AF]' : 'text-[#2C2E83]'}>
                                  Rs {Number(ticket?.price || 0)}
                                </span>
                              </div>
                            )
                          })}
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

      <AttendeeFooter />
    </div>
  )
}

export default ConcertDetails
