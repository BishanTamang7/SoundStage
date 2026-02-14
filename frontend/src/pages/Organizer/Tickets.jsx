import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'

const parseNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const normalizeTicketCategories = (raw) => {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.results)) return raw.results
    if (Array.isArray(raw.items)) return raw.items
  }
  return []
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

const getTicketStatus = (remaining, dateValue) => {
  const date = dateValue ? new Date(dateValue) : null
  const isPast = date instanceof Date && !Number.isNaN(date.getTime()) && date.getTime() < Date.now()

  if (remaining <= 0) return 'Sold Out'
  if (isPast) return 'Closed'
  if (remaining <= 10) return 'Low Stock'
  return 'On Sale'
}

const Tickets = () => {
  const { user, role, tokens } = useAuth()
  const [concerts, setConcerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

    const loadConcerts = async () => {
      if (!tokens?.access) {
        if (isActive) {
          setConcerts([])
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError('')
        const data = await api.organizerConcerts(tokens.access)
        const list = data?.data?.concerts || data?.concerts || []
        if (isActive) setConcerts(Array.isArray(list) ? list : [])
      } catch (err) {
        if (isActive) {
          setError(err?.message || 'Failed to load ticket data.')
          setConcerts([])
        }
      } finally {
        if (isActive) setLoading(false)
      }
    }

    loadConcerts()

    return () => {
      isActive = false
    }
  }, [tokens?.access])

  const allTicketRows = useMemo(() => {
    return concerts.flatMap((concert) => {
      const categories = normalizeTicketCategories(concert?.ticket_categories)

      if (categories.length === 0) {
        return [
          {
            id: `${concert?.id || 'concert'}-no-ticket`,
            concertTitle: concert?.title || 'Untitled Concert',
            dateTime: concert?.date_time || null,
            ticketType: 'No ticket category',
            price: 0,
            capacity: 0,
            sold: 0,
            remaining: 0,
            revenue: 0,
            status: 'No Tickets',
          },
        ]
      }

      return categories.map((ticket, index) => {
        const remainingFromApi = ticket?.remaining ?? ticket?.quantity
        const capacity = parseNumber(ticket?.capacity ?? ticket?.total_quantity ?? ticket?.quantity)
        const soldValue = ticket?.sold ?? ticket?.sold_quantity ?? ticket?.tickets_sold
        const hasSoldData =
          soldValue !== null && soldValue !== undefined && String(soldValue).trim() !== ''
        const sold = hasSoldData ? Math.min(capacity, parseNumber(soldValue)) : null
        const remaining = hasSoldData
          ? parseNumber(remainingFromApi ?? Math.max(0, capacity - sold))
          : parseNumber(remainingFromApi ?? capacity)
        const price = parseNumber(ticket?.price)
        const revenue = hasSoldData ? parseNumber(ticket?.revenue ?? sold * price) : null
        const status = getTicketStatus(remaining, concert?.date_time)

        return {
          id: `${concert?.id || 'concert'}-${ticket?.id || index}`,
          concertTitle: concert?.title || 'Untitled Concert',
          dateTime: concert?.date_time || null,
          ticketType: ticket?.name || 'Ticket',
          price,
          capacity,
          sold,
          remaining,
          revenue,
          status,
        }
      })
    })
  }, [concerts])

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase()

    return allTicketRows.filter((row) => {
      const searchMatched =
        !needle ||
        row.concertTitle.toLowerCase().includes(needle) ||
        row.ticketType.toLowerCase().includes(needle)

      const statusMatched = statusFilter === 'all' || row.status === statusFilter

      return searchMatched && statusMatched
    })
  }, [allTicketRows, search, statusFilter])

  const stats = useMemo(() => {
    const totalTypes = new Set(
      allTicketRows
        .map((row) => row.ticketType?.trim().toLowerCase())
        .filter((value) => value && value !== 'no ticket category')
    ).size
    const totalCapacity = allTicketRows.reduce((sum, row) => sum + row.capacity, 0)
    const totalRemaining = allTicketRows.reduce((sum, row) => sum + row.remaining, 0)
    const lowStockAlerts = allTicketRows.filter(
      (row) => row.status === 'Low Stock' || row.status === 'Sold Out'
    ).length

    return {
      totalTypes,
      totalCapacity,
      totalRemaining,
      lowStockAlerts,
    }
  }, [allTicketRows])

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <aside className="fixed left-0 top-0 h-screen w-60 border-r border-[#E5E7EB] bg-white py-6">
        <div className="px-6 pb-6 font-['Playfair_Display'] text-2xl font-black text-[#7C3AED]">
          SoundStage
        </div>

        <nav className="flex flex-col">
          <Link
            className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
            to="/organizer"
          >
            Dashboard
          </Link>
          <Link
            className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
            to="/organizer/concerts"
          >
            My Concerts
          </Link>
          <span className="border-l-4 border-[#7C3AED] bg-[#F3F4F6] px-6 py-3 text-base font-semibold text-[#7C3AED]">
            Tickets
          </span>
          <Link
            className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
            to="/organizer/bookings"
          >
            Bookings
          </Link>
          <Link
            className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
            to="/organizer/analytics"
          >
            Analytics
          </Link>
          <Link
            className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
            to="/organizer/settings"
          >
            Settings
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-lg border border-[rgba(124,58,237,0.12)] bg-[#F3F4F6] p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-extrabold text-white">
            {initials}
          </div>
          <div className="flex-1">
            <div className="text-sm font-extrabold leading-tight">{displayName}</div>
            <div className="mt-0.5 text-xs font-bold text-[#6B7280]">{displayRole}</div>
          </div>
          <a
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[rgba(239,68,68,0.08)] hover:text-[#EF4444]"
            href="/"
            title="Logout"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </a>
        </div>
      </aside>

      <main className="ml-60 px-12 pt-2 pb-8 max-[1024px]:px-6 max-[768px]:ml-0">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-[#312E81]">Tickets</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">
            Manage ticket inventory and sales by concert.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 min-[900px]:grid-cols-4">
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Ticket Types</div>
            <div className="mt-2 text-3xl font-black text-[#312E81]">{stats.totalTypes}</div>
          </div>
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Total Capacity</div>
            <div className="mt-2 text-3xl font-black text-[#16A34A]">{stats.totalCapacity}</div>
          </div>
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Remaining Stock</div>
            <div className="mt-2 text-3xl font-black text-[#D97706]">{stats.totalRemaining}</div>
          </div>
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Low Stock Alerts</div>
            <div className="mt-2 text-3xl font-black text-[#7C3AED]">{stats.lowStockAlerts}</div>
          </div>
        </section>

        <section className="mb-4 rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-[1fr_200px]">
            <input
              className="h-11 rounded-lg border border-[#D1D5DB] px-4 text-sm font-semibold text-[#312E81] outline-none transition focus:border-[#7C3AED]"
              placeholder="Search by concert or ticket type"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-sm font-semibold text-[#312E81] outline-none transition focus:border-[#7C3AED]"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="On Sale">On Sale</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Sold Out">Sold Out</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Loading ticket data...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-6 py-10 text-center text-sm font-semibold text-[#B91C1C]">
            {error}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-16 text-center">
            <div className="text-sm font-semibold text-[#6B7280]">No ticket categories found.</div>
            <Link
              to="/organizer/concerts/new"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#7C3AED] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#6D28D9]"
            >
              Create Concert
            </Link>
          </div>
        ) : (
          <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-230 text-left">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-xs font-extrabold uppercase tracking-wide text-[#6B7280]">
                    <th className="px-5 py-3">Concert</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Capacity</th>
                    <th className="px-5 py-3">Sold</th>
                    <th className="px-5 py-3">Remaining</th>
                    <th className="px-5 py-3">Revenue</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-semibold text-[#312E81]">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="border-b border-[#E5E7EB] last:border-b-0">
                      <td className="px-5 py-4">{row.concertTitle}</td>
                      <td className="px-5 py-4 text-[#6B7280]">{formatDateTime(row.dateTime)}</td>
                      <td className="px-5 py-4">{row.ticketType}</td>
                      <td className="px-5 py-4">{formatCurrency(row.price)}</td>
                      <td className="px-5 py-4">{row.capacity}</td>
                      <td className="px-5 py-4 text-[#16A34A]">{row.sold ?? '-'}</td>
                      <td className="px-5 py-4 text-[#D97706]">{row.remaining}</td>
                      <td className="px-5 py-4 font-black text-[#7C3AED]">
                        {row.revenue === null ? '-' : formatCurrency(row.revenue)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
            row.status === 'Sold Out'
                              ? 'rounded-full border border-[rgba(239,68,68,0.2)] bg-[#FEE2E2] px-3 py-1 text-xs font-extrabold text-[#DC2626]'
                              : row.status === 'Low Stock'
                                ? 'rounded-full border border-[rgba(217,119,6,0.2)] bg-[#FEF3C7] px-3 py-1 text-xs font-extrabold text-[#D97706]'
                                : row.status === 'Closed'
                                  ? 'rounded-full border border-[rgba(107,114,128,0.2)] bg-[#F3F4F6] px-3 py-1 text-xs font-extrabold text-[#6B7280]'
                                  : row.status === 'No Tickets'
                                    ? 'rounded-full border border-[rgba(59,130,246,0.2)] bg-[#DBEAFE] px-3 py-1 text-xs font-extrabold text-[#2563EB]'
                                  : 'rounded-full border border-[rgba(22,163,74,0.2)] bg-[#DCFCE7] px-3 py-1 text-xs font-extrabold text-[#16A34A]'
                          }
                        >
                          {row.status}
                        </span>
                      </td>
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

export default Tickets
