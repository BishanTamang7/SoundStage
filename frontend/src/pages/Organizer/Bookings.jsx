import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import OrganizerSidebar from '../../components/OrganizerSidebar'
import { formatCurrency, formatDateTime } from '../../utils/formatters'

const BOOKINGS_PER_PAGE = 6

const parseNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const getCutoffTime = (rangeKey) => {
  const now = Date.now()
  if (rangeKey === '7d') return now - 7 * 24 * 60 * 60 * 1000
  if (rangeKey === '30d') return now - 30 * 24 * 60 * 60 * 1000
  return 0
}

const Bookings = () => {
  const { tokens } = useAuth()
  const [bookings, setBookings] = useState([])
  const [organizerConcertTitles, setOrganizerConcertTitles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [concertFilter, setConcertFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let isActive = true

    const loadBookings = async () => {
      if (!tokens?.access) {
        if (isActive) {
          setBookings([])
          setOrganizerConcertTitles([])
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError('')
        const [bookingsData, concertsData] = await Promise.all([
          api.organizerBookings(tokens.access),
          api.organizerConcerts(tokens.access),
        ])
        const bookingsList = bookingsData?.data?.bookings || bookingsData?.bookings || []
        const concertsList = concertsData?.data?.concerts || concertsData?.concerts || []
        if (isActive) {
          setBookings(Array.isArray(bookingsList) ? bookingsList : [])
          setOrganizerConcertTitles(
            Array.isArray(concertsList)
              ? concertsList
                  .map((concert) => String(concert?.title || '').trim())
                  .filter(Boolean)
              : []
          )
        }
      } catch (err) {
        if (isActive) {
          setError(err?.message || 'Failed to load bookings.')
          setBookings([])
          setOrganizerConcertTitles([])
        }
      } finally {
        if (isActive) setLoading(false)
      }
    }

    loadBookings()

    return () => {
      isActive = false
    }
  }, [tokens?.access])

  const rowTime = (value) => {
    if (!value) return 0
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 0 : date.getTime()
  }

  const bookingRows = useMemo(() => {
    return bookings
      .map((booking) => ({
        id: booking?.id,
        customer: booking?.attendee_name || booking?.attendee_email || 'Customer',
        customerEmail: booking?.attendee_email || '',
        concertTitle: booking?.concert_title || 'Untitled Concert',
        ticketType: booking?.ticket_type || 'Ticket',
        bookedAt: booking?.created_at || null,
        quantity: parseNumber(booking?.quantity),
        revenue: parseNumber(booking?.amount_rupees),
      }))
      .filter((row) => row.quantity > 0)
      .sort((a, b) => rowTime(b.bookedAt) - rowTime(a.bookedAt))
  }, [bookings])

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const cutoff = getCutoffTime(dateRange)

    return bookingRows.filter((row) => {
      const searchMatched =
        !needle ||
        row.customer.toLowerCase().includes(needle) ||
        row.customerEmail.toLowerCase().includes(needle) ||
        row.ticketType.toLowerCase().includes(needle)
      const timeMatched = cutoff === 0 || rowTime(row.bookedAt) >= cutoff
      const concertMatched = concertFilter === 'all' || row.concertTitle === concertFilter
      return searchMatched && timeMatched && concertMatched
    })
  }, [bookingRows, search, dateRange, concertFilter])

  const concertOptions = useMemo(() => {
    return Array.from(new Set(organizerConcertTitles)).sort((a, b) =>
      a.localeCompare(b)
    )
  }, [organizerConcertTitles])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, concertFilter, dateRange])

  const stats = useMemo(() => {
    const ticketsBooked = filteredRows.reduce((sum, row) => sum + row.quantity, 0)

    return {
      ticketsBooked,
    }
  }, [filteredRows])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / BOOKINGS_PER_PAGE))

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * BOOKINGS_PER_PAGE
    return filteredRows.slice(startIndex, startIndex + BOOKINGS_PER_PAGE)
  }, [filteredRows, currentPage])

  const paginationItems = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }, [totalPages])

  const pageStart = filteredRows.length === 0 ? 0 : (currentPage - 1) * BOOKINGS_PER_PAGE + 1
  const pageEnd = Math.min(currentPage * BOOKINGS_PER_PAGE, filteredRows.length)

  const exportCsv = () => {
    if (filteredRows.length === 0) return
    const headers = ['Customer', 'Concert', 'Booked At', 'Ticket Type', 'Quantity', 'Amount']
    const lines = filteredRows.map((row) =>
      [
        row.customer,
        row.concertTitle,
        formatDateTime(row.bookedAt, { separator: ' • ' }),
        row.ticketType,
        String(row.quantity),
        String(row.revenue),
      ]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [headers.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <OrganizerSidebar />

      <main className="ml-60 px-12 py-8 max-[1024px]:px-6 max-[768px]:ml-0 max-[768px]:px-4">
        <header className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h1 className="text-3xl font-black text-[#312E81]">Bookings</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">
            Simple view of all ticket bookings and revenue.
          </p>

          <div className="mt-5 grid gap-3 min-[720px]:grid-cols-1">
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Total Tickets Booked</div>
              <div className="mt-2 text-2xl font-black text-[#16A34A]">{stats.ticketsBooked.toLocaleString('en-US')}</div>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-4">
          <div className="grid grid-cols-1 gap-3 min-[980px]:grid-cols-[1fr_220px_180px_150px]">
            <input
              className="h-11 rounded-lg border border-[#D1D5DB] px-4 text-sm font-semibold text-[#312E81] outline-none transition focus:border-[#7C3AED]"
              placeholder="Search by attendee name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-sm font-semibold text-[#312E81] outline-none transition focus:border-[#7C3AED]"
              value={concertFilter}
              onChange={(event) => setConcertFilter(event.target.value)}
            >
              <option value="all">All Concerts</option>
              {concertOptions.map((concertTitle) => (
                <option key={concertTitle} value={concertTitle}>
                  {concertTitle}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-sm font-semibold text-[#312E81] outline-none transition focus:border-[#7C3AED]"
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="7d">Last 7 Days</option>
            </select>
            <button
              type="button"
              className="h-11 rounded-lg border border-[#7C3AED] px-4 text-sm font-bold text-[#7C3AED] transition hover:bg-[#F5F3FF] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={exportCsv}
              disabled={filteredRows.length === 0}
            >
              Export CSV
            </button>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Loading bookings...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] px-6 py-10 text-center text-sm font-semibold text-[#B91C1C]">
            {error}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            No bookings found yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
            <div className="hidden grid-cols-[1.3fr_1.5fr_0.8fr_0.6fr_0.8fr_1fr] gap-4 border-b border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3 text-xs font-black tracking-[0.08em] text-[#6B7280] uppercase md:grid">
              <div>Customer</div>
              <div>Concert</div>
              <div>Type</div>
              <div>Qty</div>
              <div>Amount</div>
              <div>Booked At</div>
            </div>
            <div className="divide-y divide-[#E5E7EB]">
              {paginatedRows.map((row) => (
                <div key={row.id} className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[1.3fr_1.5fr_0.8fr_0.6fr_0.8fr_1fr] md:items-center md:gap-4">
                  <div>
                    <div className="text-sm font-black text-[#312E81]">{row.customer}</div>
                    {row.customerEmail ? (
                      <div className="text-xs font-semibold text-[#6B7280]">{row.customerEmail}</div>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-[#312E81]">{row.concertTitle}</div>
                  <div>
                    <span className="inline-flex rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-extrabold text-[#1D4ED8]">
                      {row.ticketType}
                    </span>
                  </div>
                  <div className="text-sm font-black text-[#16A34A]">{row.quantity}</div>
                  <div className="text-sm font-black text-[#7C3AED]">{formatCurrency(row.revenue)}</div>
                  <div className="text-sm font-semibold text-[#6B7280]">
                    {formatDateTime(row.bookedAt, { separator: ' • ' })}
                  </div>
                </div>
              ))}
            </div>
            {filteredRows.length > BOOKINGS_PER_PAGE ? (
              <div className="flex flex-col gap-3 border-t border-[#E5E7EB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-semibold text-[#6B7280]">
                  Showing {pageStart}-{pageEnd} of {filteredRows.length} bookings
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm font-bold text-[#312E81] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  {paginationItems.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                        pageNumber === currentPage
                          ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                          : 'border-[#D1D5DB] text-[#312E81] hover:bg-[#F9FAFB]'
                      }`}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm font-bold text-[#312E81] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  )
}

export default Bookings
