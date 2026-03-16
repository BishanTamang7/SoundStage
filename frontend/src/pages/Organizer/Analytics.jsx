import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import OrganizerSidebar from '../../components/OrganizerSidebar'

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

const getStatus = (value) => {
  if (!value) return 'Unscheduled'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unscheduled'
  return date.getTime() < Date.now() ? 'Completed' : 'Upcoming'
}

const Analytics = () => {
  const { tokens } = useAuth()
  const [concerts, setConcerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    const loadAnalytics = async () => {
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
          setError(err?.message || 'Failed to load analytics data.')
          setConcerts([])
        }
      } finally {
        if (isActive) setLoading(false)
      }
    }

    loadAnalytics()

    return () => {
      isActive = false
    }
  }, [tokens?.access])

  const analytics = useMemo(() => {
    const eventRows = concerts
      .map((concert) => {
        const categories = normalizeTicketCategories(concert?.ticket_categories).map((category) => {
          const sold = parseNumber(category?.sold ?? category?.sold_quantity ?? category?.tickets_sold)
          const remaining = parseNumber(category?.remaining ?? category?.quantity)
          const capacity = parseNumber(category?.capacity ?? sold + remaining)
          const revenue = parseNumber(category?.revenue ?? sold * parseNumber(category?.price))

          return {
            name: category?.name || 'Ticket',
            sold,
            remaining,
            capacity,
            revenue,
          }
        })

        const sold = categories.reduce((sum, category) => sum + category.sold, 0)
        const remaining = categories.reduce((sum, category) => sum + category.remaining, 0)
        const capacity = categories.reduce((sum, category) => sum + category.capacity, 0)
        const revenue = categories.reduce((sum, category) => sum + category.revenue, 0)
        const sellThrough = capacity > 0 ? (sold / capacity) * 100 : 0
        const date = concert?.date_time ? new Date(concert.date_time) : null
        const timestamp = date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : Number.POSITIVE_INFINITY

        return {
          id: concert?.id,
          title: concert?.title || 'Untitled Concert',
          venue: concert?.venue || 'Venue TBD',
          dateTime: concert?.date_time,
          dateLabel: formatDate(concert?.date_time),
          status: getStatus(concert?.date_time),
          sold,
          remaining,
          capacity,
          revenue,
          sellThrough,
          timestamp,
          categories,
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)

    const totalConcerts = eventRows.length
    const totalRevenue = eventRows.reduce((sum, event) => sum + event.revenue, 0)
    const totalSold = eventRows.reduce((sum, event) => sum + event.sold, 0)
    const totalCapacity = eventRows.reduce((sum, event) => sum + event.capacity, 0)
    const sellThrough = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0

    const topEvents = [...eventRows].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    const upcomingEvents = eventRows.filter((event) => event.status === 'Upcoming').slice(0, 5)

    const categoryTotals = eventRows.reduce((acc, event) => {
      event.categories.forEach((category) => {
        const key = String(category.name || 'Ticket').toLowerCase()
        if (!acc[key]) {
          acc[key] = { name: category.name || 'Ticket', sold: 0, remaining: 0, revenue: 0 }
        }
        acc[key].sold += category.sold
        acc[key].remaining += category.remaining
        acc[key].revenue += category.revenue
      })
      return acc
    }, {})

    const categoryRows = Object.values(categoryTotals).sort((a, b) => b.revenue - a.revenue)
    const topEvent = topEvents[0] || null
    const nextEvent = upcomingEvents[0] || null

    return {
      stats: {
        totalConcerts,
        totalRevenue,
        totalSold,
        totalCapacity,
        sellThrough,
      },
      topEvents,
      upcomingEvents,
      categoryRows,
      topEvent,
      nextEvent,
    }
  }, [concerts])

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#312E81]">
      <OrganizerSidebar />

      <main className="ml-60 px-12 py-8 max-[1024px]:px-6 max-[768px]:ml-0 max-[768px]:px-4">
        <header className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <div className="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
            <div>
              <h1 className="text-3xl font-black text-[#312E81]">Analytics</h1>
              <p className="mt-1 text-sm font-semibold text-[#6B7280]">
                Simple performance overview for your concerts.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#6D28D9]"
                to="/organizer/bookings"
              >
                View Bookings
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-bold text-[#312E81] transition hover:bg-[#F8FAFC]"
                to="/organizer/tickets"
              >
                View Tickets
              </Link>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 min-[720px]:grid-cols-2 min-[1100px]:grid-cols-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Total Concerts</div>
            <div className="mt-2 text-3xl font-black text-[#312E81]">{analytics.stats.totalConcerts}</div>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Revenue</div>
            <div className="mt-2 text-3xl font-black text-[#7C3AED]">{formatCurrency(analytics.stats.totalRevenue)}</div>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Tickets Sold</div>
            <div className="mt-2 text-3xl font-black text-[#16A34A]">
              {analytics.stats.totalSold.toLocaleString('en-US')}
            </div>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Sell Through</div>
            <div className="mt-2 text-3xl font-black text-[#D97706]">{analytics.stats.sellThrough.toFixed(1)}%</div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Loading analytics...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] px-6 py-10 text-center text-sm font-semibold text-[#B91C1C]">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 min-[1100px]:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-black text-[#312E81]">Top Concerts</h2>
                  <span className="text-sm font-semibold text-[#6B7280]">By revenue</span>
                </div>

                {analytics.topEvents.length === 0 ? (
                  <div className="text-sm font-semibold text-[#6B7280]">No analytics data available yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#E5E7EB] text-xs font-extrabold uppercase tracking-wide text-[#6B7280]">
                          <th className="py-3">Concert</th>
                          <th className="py-3">Date</th>
                          <th className="py-3">Sold</th>
                          <th className="py-3">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-semibold text-[#312E81]">
                        {analytics.topEvents.map((event) => (
                          <tr key={event.id || event.title} className="border-b border-[#E5E7EB] last:border-b-0">
                            <td className="py-4">
                              <div className="font-black text-[#312E81]">{event.title}</div>
                              <div className="mt-1 text-xs text-[#6B7280]">{event.venue}</div>
                            </td>
                            <td className="py-4">{event.dateLabel}</td>
                            <td className="py-4">{event.sold}</td>
                            <td className="py-4 font-black text-[#7C3AED]">{formatCurrency(event.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-black text-[#312E81]">Upcoming Concerts</h2>
                  <Link className="text-sm font-bold text-[#7C3AED]" to="/organizer/concerts">
                    View All
                  </Link>
                </div>

                {analytics.upcomingEvents.length === 0 ? (
                  <div className="text-sm font-semibold text-[#6B7280]">No upcoming concerts.</div>
                ) : (
                  <div className="space-y-3">
                    {analytics.upcomingEvents.map((event) => (
                      <div key={event.id || event.title} className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-black text-[#312E81]">{event.title}</div>
                            <div className="mt-1 text-sm font-semibold text-[#6B7280]">
                              {event.dateLabel} • {event.venue}
                            </div>
                          </div>
                          <span className="rounded-md border border-[rgba(22,163,74,0.18)] bg-[#F0FDF4] px-3 py-1 text-xs font-extrabold text-[#166534]">
                            {event.status}
                          </span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-[#E5E7EB]">
                          <div
                            className="h-2 rounded-full bg-[#14B8A6]"
                            style={{ width: `${Math.max(6, Math.min(event.sellThrough, 100))}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs font-semibold text-[#6B7280]">
                          {event.sold} sold of {event.capacity} tickets
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
                <h2 className="text-xl font-black text-[#312E81]">Highlights</h2>
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Top Concert</div>
                    <div className="mt-2 text-base font-black text-[#312E81]">
                      {analytics.topEvent?.title || 'N/A'}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#6B7280]">
                      {analytics.topEvent ? formatCurrency(analytics.topEvent.revenue) : 'No revenue yet'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Next Concert</div>
                    <div className="mt-2 text-base font-black text-[#312E81]">
                      {analytics.nextEvent?.title || 'N/A'}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#6B7280]">
                      {analytics.nextEvent ? analytics.nextEvent.dateLabel : 'No upcoming concert'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Capacity</div>
                    <div className="mt-2 text-base font-black text-[#312E81]">
                      {analytics.stats.totalCapacity.toLocaleString('en-US')} tickets
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#6B7280]">
                      Across all concerts
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
                <h2 className="text-xl font-black text-[#312E81]">Ticket Categories</h2>

                {analytics.categoryRows.length === 0 ? (
                  <div className="mt-4 text-sm font-semibold text-[#6B7280]">No ticket data available yet.</div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {analytics.categoryRows.map((category) => (
                      <div key={category.name} className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-black text-[#312E81]">{category.name}</div>
                          <div className="text-sm font-black text-[#7C3AED]">{formatCurrency(category.revenue)}</div>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-[#6B7280]">
                          Sold: {category.sold} • Remaining: {category.remaining}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Analytics
