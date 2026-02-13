import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'

const parseNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const formatCurrency = (value) => `Rs ${Math.max(0, Math.round(value)).toLocaleString('en-US')}`

const formatDateTime = (value) => {
  if (!value) return 'TBD'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'TBD'
  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
  return `${datePart} • ${timePart}`
}

const getCutoffTime = (rangeKey) => {
  const now = Date.now()
  if (rangeKey === '7d') return now - 7 * 24 * 60 * 60 * 1000
  if (rangeKey === '30d') return now - 30 * 24 * 60 * 60 * 1000
  return 0
}

const Bookings = () => {
  const { user, role, tokens } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState('all')

  const displayName = user?.username || user?.email || 'User'
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'
  const initialsSource = user?.username || user?.email || ''

  const getInitials = (value) => {
    if (!value) return 'UU'
    const base = value.split('@')[0]
    const parts = base.split(/[\s._-]+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  const initials = getInitials(initialsSource)

  useEffect(() => {
    let isActive = true

    const loadBookings = async () => {
      if (!tokens?.access) {
        if (isActive) {
          setBookings([])
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError('')
        const data = await api.organizerBookings(tokens.access)
        const list = data?.data?.bookings || data?.bookings || []
        if (isActive) setBookings(Array.isArray(list) ? list : [])
      } catch (err) {
        if (isActive) {
          setError(err?.message || 'Failed to load bookings.')
          setBookings([])
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
        concertTitle: booking?.concert_title || 'Untitled Concert',
        ticketType: booking?.ticket_type || 'Ticket',
        bookedAt: booking?.created_at || null,
        quantity: parseNumber(booking?.quantity),
        revenue: parseNumber(booking?.amount_rupees),
      }))
      .filter((row) => row.quantity > 0)
      .sort((a, b) => {
        const aTime = rowTime(a.bookedAt)
        const bTime = rowTime(b.bookedAt)
        return bTime - aTime
      })
  }, [bookings])

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const cutoff = getCutoffTime(dateRange)
    return bookingRows.filter((row) => {
      const searchMatched =
        !needle ||
        row.customer.toLowerCase().includes(needle) ||
        row.concertTitle.toLowerCase().includes(needle)
      const timeMatched = cutoff === 0 || rowTime(row.bookedAt) >= cutoff
      return searchMatched && timeMatched
    })
  }, [bookingRows, search, dateRange])

  const stats = useMemo(() => {
    const totalBookings = bookingRows.reduce((sum, row) => sum + row.quantity, 0)
    const totalRevenue = bookingRows.reduce((sum, row) => sum + row.revenue, 0)
    const eventsWithBookings = new Set(bookingRows.map((row) => row.concertTitle)).size
    const averageBookingValue = bookingRows.length > 0 ? totalRevenue / bookingRows.length : 0

    return {
      totalBookings,
      totalRevenue,
      eventsWithBookings,
      averageBookingValue,
    }
  }, [bookingRows])

  const exportCsv = () => {
    if (filteredRows.length === 0) return
    const headers = ['Customer', 'Concert', 'Booked At', 'Ticket Type', 'Quantity', 'Amount']
    const lines = filteredRows.map((row) =>
      [
        row.customer,
        row.concertTitle,
        formatDateTime(row.bookedAt),
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
      <aside className="fixed left-0 top-0 h-screen w-60 border-r border-[#E5E7EB] bg-white py-6">
        <div className="px-6 pb-6 font-['Playfair_Display'] text-2xl font-black text-[#7C3AED]">SoundStage</div>

        <nav className="flex flex-col">
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer">Dashboard</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/concerts">My Concerts</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/tickets">Tickets</Link>
          <span className="border-l-4 border-[#7C3AED] bg-[#F3F4F6] px-6 py-3 text-base font-semibold text-[#7C3AED]">Bookings</span>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/analytics">Analytics</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/settings">Settings</Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-lg border border-[rgba(124,58,237,0.12)] bg-[#F3F4F6] p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-extrabold text-white">{initials}</div>
          <div className="flex-1">
            <div className="text-sm font-extrabold leading-tight">{displayName}</div>
            <div className="mt-0.5 text-xs font-bold text-[#6B7280]">{displayRole}</div>
          </div>
          <a className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[rgba(239,68,68,0.08)] hover:text-[#EF4444]" href="/" title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </a>
        </div>
      </aside>

      <main className="ml-60 px-12 pt-2 pb-8 max-[1024px]:px-6 max-[768px]:ml-0">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-[#312E81]">Bookings</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">Track ticket bookings and revenue by event.</p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 min-[900px]:grid-cols-4">
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Total Bookings</div>
            <div className="mt-2 text-3xl font-black text-[#312E81]">{stats.totalBookings.toLocaleString('en-US')}</div>
          </div>
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Concerts Booked</div>
            <div className="mt-2 text-3xl font-black text-[#16A34A]">{stats.eventsWithBookings}</div>
          </div>
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Total Revenue</div>
            <div className="mt-2 text-3xl font-black text-[#7C3AED]">{formatCurrency(stats.totalRevenue)}</div>
          </div>
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Avg Ticket Value</div>
            <div className="mt-2 text-3xl font-black text-[#D97706]">{formatCurrency(stats.averageBookingValue)}</div>
          </div>
        </section>

        <section className="mb-4 rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-[1fr_180px_150px]">
            <input
              className="h-11 rounded-lg border border-[#D1D5DB] px-4 text-sm font-semibold text-[#312E81] outline-none transition focus:border-[#7C3AED]"
              placeholder="Search by customer or concert"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
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
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Loading bookings...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-6 py-10 text-center text-sm font-semibold text-[#B91C1C]">
            {error}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            No bookings found yet.
          </div>
        ) : (
          <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-xs font-extrabold uppercase tracking-wide text-[#6B7280]">
                    <th className="px-5 py-3">Attendee</th>
                    <th className="px-5 py-3">Music Concert</th>
                    <th className="px-5 py-3">Booked At</th>
                    <th className="px-5 py-3">Ticket Type</th>
                    <th className="px-5 py-3">Booked</th>
                    <th className="px-5 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-semibold text-[#312E81]">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="border-b border-[#E5E7EB] last:border-b-0">
                      <td className="px-5 py-4">{row.customer}</td>
                      <td className="px-5 py-4">{row.concertTitle}</td>
                      <td className="px-5 py-4 text-[#6B7280]">{formatDateTime(row.bookedAt)}</td>
                      <td className="px-5 py-4">{row.ticketType}</td>
                      <td className="px-5 py-4 text-[#16A34A]">{row.quantity}</td>
                      <td className="px-5 py-4 font-black text-[#7C3AED]">{formatCurrency(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default Bookings
