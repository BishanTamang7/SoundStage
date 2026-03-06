import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api, resolveMediaUrl } from '../../services/api'

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

const getTicketStatus = (remaining, dateValue) => {
  const date = dateValue ? new Date(dateValue) : null
  const isPast = date instanceof Date && !Number.isNaN(date.getTime()) && date.getTime() < Date.now()

  if (isPast) return 'Closed'
  if (remaining <= 0) return 'Sold Out'
  if (remaining <= 10) return 'Low Stock'
  return 'On Sale'
}

const getStatusClasses = (status) => {
  if (status === 'Sold Out') return 'border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]'
  if (status === 'Low Stock') return 'border-[#FCD34D] bg-[#FFFBEB] text-[#B45309]'
  if (status === 'Closed') return 'border-[#D1D5DB] bg-[#F9FAFB] text-[#6B7280]'
  if (status === 'No Tickets') return 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
  return 'border-[#86EFAC] bg-[#F0FDF4] text-[#166534]'
}

const Tickets = () => {
  const { user, role, tokens, logout } = useAuth()
  const navigate = useNavigate()
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

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

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

  const concertBlocks = useMemo(() => {
    return concerts.map((concert) => {
      const categories = normalizeTicketCategories(concert?.ticket_categories)
      const { venueName, city } = getVenueParts(concert?.venue || '')

      const rows = categories.map((ticket, index) => {
        const remainingFromApi = ticket?.remaining ?? ticket?.quantity
        const capacity = parseNumber(ticket?.capacity ?? ticket?.total_quantity ?? ticket?.quantity)
        const soldValue = ticket?.sold ?? ticket?.sold_quantity ?? ticket?.tickets_sold
        const hasSoldData = soldValue !== null && soldValue !== undefined && String(soldValue).trim() !== ''
        const sold = hasSoldData ? Math.min(capacity, parseNumber(soldValue)) : null
        const remaining = hasSoldData
          ? parseNumber(remainingFromApi ?? Math.max(0, capacity - sold))
          : parseNumber(remainingFromApi ?? capacity)
        const price = parseNumber(ticket?.price)
        const revenue = hasSoldData ? parseNumber(ticket?.revenue ?? sold * price) : null
        const status = getTicketStatus(remaining, concert?.date_time)

        return {
          id: `${concert?.id || 'concert'}-${ticket?.id || index}`,
          ticketType: ticket?.name || 'Ticket',
          price,
          capacity,
          sold,
          remaining,
          revenue,
          status,
        }
      })

      const normalizedRows = rows.length
        ? rows
        : [
            {
              id: `${concert?.id || 'concert'}-no-ticket`,
              ticketType: 'No ticket category',
              price: 0,
              capacity: 0,
              sold: 0,
              remaining: 0,
              revenue: 0,
              status: 'No Tickets',
            },
          ]

      const totalCapacity = normalizedRows.reduce((sum, row) => sum + row.capacity, 0)
      const totalRemaining = normalizedRows.reduce((sum, row) => sum + row.remaining, 0)
      const totalRevenue = normalizedRows.reduce((sum, row) => sum + (row.revenue ?? 0), 0)

      return {
        concertId: concert?.id,
        concertTitle: concert?.title || 'Untitled Concert',
        dateTime: concert?.date_time || null,
        coverImage: resolveMediaUrl(concert?.cover_image),
        venueName,
        city,
        rows: normalizedRows,
        totalCapacity,
        totalRemaining,
        totalRevenue,
      }
    })
  }, [concerts])

  const filteredBlocks = useMemo(() => {
    const needle = search.trim().toLowerCase()

    return concertBlocks
      .map((block) => {
        const searchMatched =
          !needle ||
          block.concertTitle.toLowerCase().includes(needle) ||
          block.venueName.toLowerCase().includes(needle) ||
          block.city.toLowerCase().includes(needle) ||
          block.rows.some((row) => row.ticketType.toLowerCase().includes(needle))

        if (!searchMatched) return null

        const rows = block.rows.filter((row) => statusFilter === 'all' || row.status === statusFilter)
        if (!rows.length) return null

        const totalCapacity = rows.reduce((sum, row) => sum + row.capacity, 0)
        const totalRemaining = rows.reduce((sum, row) => sum + row.remaining, 0)
        const totalRevenue = rows.reduce((sum, row) => sum + (row.revenue ?? 0), 0)

        return {
          ...block,
          rows,
          totalCapacity,
          totalRemaining,
          totalRevenue,
        }
      })
      .filter(Boolean)
  }, [concertBlocks, search, statusFilter])

  const stats = useMemo(() => {
    const allRows = filteredBlocks.flatMap((block) => block.rows)
    const totalTypes = allRows.filter((row) => row.status !== 'No Tickets').length
    const totalCapacity = allRows.reduce((sum, row) => sum + row.capacity, 0)
    const totalRemaining = allRows.reduce((sum, row) => sum + row.remaining, 0)
    const lowStockAlerts = allRows.filter(
      (row) => row.status === 'Low Stock' || row.status === 'Sold Out'
    ).length

    return { totalTypes, totalCapacity, totalRemaining, lowStockAlerts }
  }, [filteredBlocks])

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <aside className="fixed left-0 top-0 h-screen w-60 border-r border-[#E5E7EB] bg-white py-6 max-[768px]:-translate-x-full">
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
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[rgba(239,68,68,0.08)] hover:text-[#EF4444]"
            title="Logout"
            type="button"
            onClick={handleLogout}
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
          </button>
        </div>
      </aside>

      <main className="ml-60 px-12 py-8 max-[1024px]:px-6 max-[768px]:ml-0 max-[768px]:px-4">
        <header className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h1 className="text-3xl font-black text-[#312E81]">Ticket Command Center</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">
            Track ticket inventory by concert and spot low stock before it sells out.
          </p>

          <div className="mt-5 grid gap-3 min-[720px]:grid-cols-4">
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Ticket Types</div>
              <div className="mt-2 text-2xl font-black text-[#312E81]">{stats.totalTypes}</div>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Total Capacity</div>
              <div className="mt-2 text-2xl font-black text-[#16A34A]">{stats.totalCapacity}</div>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Remaining</div>
              <div className="mt-2 text-2xl font-black text-[#D97706]">{stats.totalRemaining}</div>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Alerts</div>
              <div className="mt-2 text-2xl font-black text-[#DC2626]">{stats.lowStockAlerts}</div>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-4">
          <div className="grid gap-3 min-[900px]:grid-cols-[1fr_220px]">
            <input
              className="h-11 rounded-lg border border-[#D1D5DB] px-4 text-sm font-semibold text-[#312E81] outline-none transition focus:border-[#7C3AED]"
              placeholder="Search by concert, venue, city, or ticket type"
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
              <option value="No Tickets">No Tickets</option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Loading ticket data...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] px-6 py-10 text-center text-sm font-semibold text-[#B91C1C]">
            {error}
          </div>
        ) : filteredBlocks.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center">
            <div className="text-sm font-semibold text-[#6B7280]">No ticket categories found.</div>
            <Link
              to="/organizer/concerts/new"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#7C3AED] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#6D28D9]"
            >
              Create Concert
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredBlocks.map((block) => (
              <article key={block.concertId} className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
                <div className="grid gap-4 border-b border-[#E5E7EB] bg-[#FCFCFF] p-5 min-[950px]:grid-cols-[180px_1fr_auto] min-[950px]:items-center">
                  <div className="h-28 overflow-hidden rounded-xl bg-[#EEF2FF]">
                    {block.coverImage ? (
                      <img src={block.coverImage} alt={`${block.concertTitle} cover`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl">🎫</div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-[#2E2B72]">{block.concertTitle}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-[#6B7280]">
                      <span>📅 {formatDateTime(block.dateTime)}</span>
                      <span>📍 {block.venueName || 'Venue TBD'}</span>
                      <span>🏙️ {block.city || 'City TBD'}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span className="rounded-full border border-[#D1D5DB] bg-white px-3 py-1 text-[#374151]">
                        Capacity {block.totalCapacity}
                      </span>
                      <span className="rounded-full border border-[#FCD34D] bg-[#FFFBEB] px-3 py-1 text-[#B45309]">
                        Remaining {block.totalRemaining}
                      </span>
                      <span className="rounded-full border border-[#C4B5FD] bg-[#F5F3FF] px-3 py-1 text-[#5B21B6]">
                        Revenue {formatCurrency(block.totalRevenue)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 min-[950px]:justify-end">
                    <Link
                      to={`/organizer/concerts/${block.concertId}`}
                      className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-bold text-[#374151] transition hover:bg-[#F9FAFB]"
                    >
                      View Concert
                    </Link>
                    <Link
                      to={`/organizer/concerts/${block.concertId}/edit`}
                      className="rounded-lg bg-[#7C3AED] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#6D28D9]"
                    >
                      Edit Tickets
                    </Link>
                  </div>
                </div>

                <div className="grid gap-3 p-5 min-[840px]:grid-cols-2 xl:grid-cols-3">
                  {block.rows.map((row) => {
                    const soldValue = row.sold ?? 0
                    const progress = row.capacity > 0 ? Math.min(100, Math.round((soldValue / row.capacity) * 100)) : 0

                    return (
                      <div key={row.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-black text-[#312E81]">{row.ticketType}</h3>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${getStatusClasses(row.status)}`}>
                            {row.status}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-semibold text-[#6B7280]">
                          <div>
                            <div className="uppercase tracking-wide">Price</div>
                            <div className="mt-1 text-sm font-black text-[#1F2937]">{formatCurrency(row.price)}</div>
                          </div>
                          <div>
                            <div className="uppercase tracking-wide">Revenue</div>
                            <div className="mt-1 text-sm font-black text-[#5B21B6]">
                              {row.revenue === null ? '-' : formatCurrency(row.revenue)}
                            </div>
                          </div>
                          <div>
                            <div className="uppercase tracking-wide">Sold</div>
                            <div className="mt-1 text-sm font-black text-[#16A34A]">{row.sold ?? '-'}</div>
                          </div>
                          <div>
                            <div className="uppercase tracking-wide">Remaining</div>
                            <div className="mt-1 text-sm font-black text-[#D97706]">{row.remaining}</div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-[#6B7280]">
                            <span>Sales Progress</span>
                            <span>{row.capacity > 0 ? `${progress}%` : '0%'}</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-[#E5E7EB]">
                            <div
                              className={`h-full ${progress >= 80 ? 'bg-[#16A34A]' : progress >= 40 ? 'bg-[#7C3AED]' : 'bg-[#D97706]'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="mt-1 text-[11px] font-semibold text-[#9CA3AF]">
                            Capacity: {row.capacity}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Tickets
