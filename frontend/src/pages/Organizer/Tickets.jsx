import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import OrganizerSidebar from '../../components/OrganizerSidebar'
import { formatCurrency } from '../../utils/formatters'

const parseNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const FIXED_TICKET_TYPES = [
  { key: 'vip', label: 'VIP', accent: 'orange' },
  { key: 'regular', label: 'Regular', accent: 'teal' },
]

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

const getTicketStatus = (remaining, dateValue) => {
  const date = dateValue ? new Date(dateValue) : null
  const isPast = date instanceof Date && !Number.isNaN(date.getTime()) && date.getTime() < Date.now()

  if (isPast) return 'Closed'
  if (remaining <= 0) return 'Sold Out'
  if (remaining <= 10) return 'Low Stock'
  return 'On Sale'
}

const getStatusClasses = (status) => {
  if (status === 'Not Set') return 'border-[#D1D5DB] bg-[#F9FAFB] text-[#6B7280]'
  if (status === 'Sold Out') return 'border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]'
  if (status === 'Low Stock') return 'border-[#FCD34D] bg-[#FFFBEB] text-[#B45309]'
  if (status === 'Closed') return 'border-[#D1D5DB] bg-[#F9FAFB] text-[#6B7280]'
  return 'border-[#86EFAC] bg-[#F0FDF4] text-[#166534]'
}

const Tickets = () => {
  const { tokens } = useAuth()
  const [concerts, setConcerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [concertFilter, setConcertFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

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
      const categoryByName = new Map(
        categories.map((item) => [String(item?.name || '').trim().toLowerCase(), item])
      )

      const rows = FIXED_TICKET_TYPES.map((type, index) => {
        const ticket = categoryByName.get(type.key)
        const hasTicketConfig = Boolean(ticket)
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
        const status = hasTicketConfig ? getTicketStatus(remaining, concert?.date_time) : 'Not Set'

        return {
          id: `${concert?.id || 'concert'}-${ticket?.id || type.key || index}`,
          ticketType: type.label,
          accent: type.accent,
          price,
          capacity,
          sold,
          remaining,
          revenue,
          status,
        }
      })
      const totalCapacity = rows.reduce((sum, row) => sum + row.capacity, 0)
      const totalRemaining = rows.reduce((sum, row) => sum + row.remaining, 0)
      const totalRevenue = rows.reduce((sum, row) => sum + (row.revenue ?? 0), 0)

      return {
        concertId: concert?.id,
        concertTitle: concert?.title || 'Untitled Concert',
        dateTime: concert?.date_time,
        rows,
        totalCapacity,
        totalRemaining,
        totalRevenue,
      }
    })
  }, [concerts])

  const concertOptions = useMemo(() => {
    return concertBlocks
      .map((block) => ({
        id: block.concertId ? String(block.concertId) : '',
        title: block.concertTitle,
      }))
      .filter((option) => option.id && option.title)
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [concertBlocks])

  const filteredBlocks = useMemo(() => {
    return concertBlocks
      .map((block) => {
        const concertMatched = concertFilter === 'all' || String(block.concertId) === concertFilter
        if (!concertMatched) return null

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
  }, [concertBlocks, concertFilter, statusFilter])

  const tableRows = useMemo(
    () =>
      filteredBlocks.flatMap((block) =>
        block.rows.map((row) => ({
          id: row.id,
          concertId: block.concertId,
          concertTitle: block.concertTitle,
          dateTime: block.dateTime,
          ...row,
        }))
      ),
    [filteredBlocks]
  )

  const tableStats = useMemo(() => {
    const totalConfigs = tableRows.length
    const totalCapacity = tableRows.reduce((sum, row) => sum + row.capacity, 0)
    const totalRemaining = tableRows.reduce((sum, row) => sum + row.remaining, 0)
    const totalRevenue = tableRows.reduce((sum, row) => sum + (row.revenue ?? 0), 0)
    return { totalConfigs, totalCapacity, totalRemaining, totalRevenue }
  }, [tableRows])

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <OrganizerSidebar />

      <main className="ml-60 px-12 py-8 max-[1024px]:px-6 max-[768px]:ml-0 max-[768px]:px-4">
        <header className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h1 className="text-3xl font-black text-[#312E81]">Tickets</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">
            Simple view of VIP and Regular ticket inventory.
          </p>
          <div className="mt-5 grid gap-3 min-[720px]:grid-cols-3">
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Capacity</div>
              <div className="mt-2 text-2xl font-black text-[#312E81]">{tableStats.totalCapacity}</div>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Remaining</div>
              <div className="mt-2 text-2xl font-black text-[#D97706]">{tableStats.totalRemaining}</div>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Revenue</div>
              <div className="mt-2 text-2xl font-black text-[#7C3AED]">{formatCurrency(tableStats.totalRevenue)}</div>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-4">
          <div className="grid gap-3 min-[900px]:grid-cols-[1fr_220px]">
            <select
              className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-sm font-semibold text-[#312E81] outline-none transition focus:border-[#7C3AED]"
              value={concertFilter}
              onChange={(event) => setConcertFilter(event.target.value)}
            >
              <option value="all">All Concerts</option>
              {concertOptions.map((concert) => (
                <option key={concert.id} value={concert.id}>
                  {concert.title}
                </option>
              ))}
            </select>
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
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Loading ticket data...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] px-6 py-10 text-center text-sm font-semibold text-[#B91C1C]">
            {error}
          </div>
        ) : tableRows.length === 0 ? (
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
          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
            <div className="hidden grid-cols-[1.7fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_0.9fr_1fr] gap-3 border-b border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3 text-xs font-black tracking-[0.08em] text-[#6B7280] uppercase md:grid">
              <div>Concert</div>
              <div>Type</div>
              <div>Price</div>
              <div>Capacity</div>
              <div>Sold</div>
              <div>Remaining</div>
              <div>Revenue</div>
              <div>Status</div>
            </div>
            <div className="divide-y divide-[#E5E7EB]">
              {tableRows.map((row) => {
                return (
                  <div key={row.id} className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[1.7fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_0.9fr_1fr] md:items-center md:gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-[#312E81]">{row.concertTitle}</span>
                    </div>
                  <div>
                    <span className="inline-flex rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-extrabold text-[#1D4ED8]">
                      {row.ticketType}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#312E81]">{formatCurrency(row.price)}</div>
                  <div className="text-sm font-bold text-[#312E81]">{row.capacity}</div>
                  <div className="text-sm font-bold text-[#16A34A]">{row.sold ?? '-'}</div>
                  <div className="text-sm font-bold text-[#D97706]">{row.remaining}</div>
                  <div className="text-sm font-bold text-[#7C3AED]">
                    {row.revenue === null ? '-' : formatCurrency(row.revenue)}
                  </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${getStatusClasses(row.status)}`}>
                        {row.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Tickets
