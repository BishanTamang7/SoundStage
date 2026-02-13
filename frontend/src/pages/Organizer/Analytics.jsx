import { Link } from 'react-router-dom'
import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'

const parseNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
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

const Analytics = () => {
  const { user, role, tokens } = useAuth()
  const [concerts, setConcerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const stats = useMemo(() => {
    const totalConcerts = concerts.length

    const totals = concerts.reduce(
      (acc, concert) => {
        const categories = Array.isArray(concert?.ticket_categories) ? concert.ticket_categories : []
        categories.forEach((category) => {
          const sold = parseNumber(category?.sold ?? category?.sold_quantity ?? category?.tickets_sold)
          const remaining = parseNumber(category?.remaining ?? category?.quantity)
          const capacity = parseNumber(category?.capacity ?? sold + remaining)
          const revenue = parseNumber(category?.revenue ?? sold * parseNumber(category?.price))

          acc.ticketsSold += sold
          acc.totalCapacity += capacity
          acc.revenue += revenue
        })
        return acc
      },
      { ticketsSold: 0, totalCapacity: 0, revenue: 0 }
    )

    const sellThrough = totals.totalCapacity > 0 ? (totals.ticketsSold / totals.totalCapacity) * 100 : 0

    return {
      totalConcerts,
      ticketsSold: totals.ticketsSold,
      revenue: totals.revenue,
      sellThrough,
    }
  }, [concerts])

  const topEvents = useMemo(() => {
    return concerts
      .map((concert) => {
        const categories = Array.isArray(concert?.ticket_categories) ? concert.ticket_categories : []
        const sold = categories.reduce(
          (sum, category) => sum + parseNumber(category?.sold ?? category?.sold_quantity ?? category?.tickets_sold),
          0
        )
        const revenue = categories.reduce(
          (sum, category) =>
            sum + parseNumber(category?.revenue ?? parseNumber(category?.price) * parseNumber(category?.sold ?? 0)),
          0
        )

        return {
          id: concert?.id,
          title: concert?.title || 'Untitled Concert',
          date: concert?.date_time,
          sold,
          revenue,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [concerts])
  const maxRevenue = topEvents.reduce((max, event) => Math.max(max, event.revenue), 0)
  const maxTicketsSold = topEvents.reduce((max, event) => Math.max(max, event.sold), 0)
  const topEvent = topEvents[0] || null

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <aside className="fixed left-0 top-0 h-screen w-60 border-r border-[#E5E7EB] bg-white py-6">
        <div className="px-6 pb-6 font-['Playfair_Display'] text-2xl font-black text-[#7C3AED]">
          SoundStage
        </div>

        <nav className="flex flex-col">
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer">Dashboard</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/concerts">My Concerts</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/tickets">Tickets</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/bookings">Bookings</Link>
          <span className="border-l-4 border-[#7C3AED] bg-[#F3F4F6] px-6 py-3 text-base font-semibold text-[#7C3AED]">Analytics</span>
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
          <h1 className="text-2xl font-black text-[#312E81]">Analytics</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">Simple overview of sales performance.</p>
        </header>

        {loading ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Loading analytics...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-6 py-10 text-center text-sm font-semibold text-[#B91C1C]">
            {error}
          </div>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-1 gap-4 min-[900px]:grid-cols-4">
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Total Concerts</div>
                <div className="mt-2 text-3xl font-black text-[#312E81]">{stats.totalConcerts}</div>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Tickets Sold</div>
                <div className="mt-2 text-3xl font-black text-[#16A34A]">{stats.ticketsSold.toLocaleString('en-US')}</div>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Revenue</div>
                <div className="mt-2 text-3xl font-black text-[#7C3AED]">{formatCurrency(stats.revenue)}</div>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Sell Through</div>
                <div className="mt-2 text-3xl font-black text-[#D97706]">{stats.sellThrough.toFixed(1)}%</div>
              </div>
            </section>

            <section className="mb-6 rounded-lg border border-[#E5E7EB] bg-white p-5">
              <h2 className="mb-4 text-lg font-black text-[#312E81]">Revenue by Event</h2>
              {topEvents.length === 0 ? (
                <div className="text-sm font-semibold text-[#6B7280]">No graph data available yet.</div>
              ) : (
                <div className="space-y-3">
                  {topEvents.map((event) => {
                    const widthPct = maxRevenue > 0 ? Math.max(8, (event.revenue / maxRevenue) * 100) : 8
                    return (
                      <div key={`graph-${event.id || event.title}`} className="grid grid-cols-[240px_1fr_110px] items-center gap-3 max-[900px]:grid-cols-1">
                        <div className="truncate text-sm font-semibold text-[#312E81]">{event.title}</div>
                        <div className="h-3 rounded-full bg-[#E5E7EB]">
                          <div
                            className="h-3 rounded-full bg-[#7C3AED]"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <div className="text-right text-sm font-extrabold text-[#7C3AED]">{formatCurrency(event.revenue)}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="mb-6 rounded-lg border border-[#E5E7EB] bg-white p-5">
              <h2 className="mb-4 text-lg font-black text-[#312E81]">Tickets Sold by Event</h2>
              {topEvents.length === 0 ? (
                <div className="text-sm font-semibold text-[#6B7280]">No ticket volume data available yet.</div>
              ) : (
                <div className="space-y-3">
                  {topEvents.map((event) => {
                    const widthPct = maxTicketsSold > 0 ? Math.max(8, (event.sold / maxTicketsSold) * 100) : 8
                    return (
                      <div key={`sold-${event.id || event.title}`} className="grid grid-cols-[240px_1fr_110px] items-center gap-3 max-[900px]:grid-cols-1">
                        <div className="truncate text-sm font-semibold text-[#312E81]">{event.title}</div>
                        <div className="h-3 rounded-full bg-[#E5E7EB]">
                          <div className="h-3 rounded-full bg-[#16A34A]" style={{ width: `${widthPct}%` }} />
                        </div>
                        <div className="text-right text-sm font-extrabold text-[#16A34A]">{event.sold.toLocaleString('en-US')}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-[#E5E7EB] bg-white p-5">
              <h2 className="mb-4 text-lg font-black text-[#312E81]">Insights</h2>
              <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-3">
                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Top Event</div>
                  <div className="mt-2 text-sm font-extrabold text-[#312E81]">{topEvent?.title || 'N/A'}</div>
                </div>
                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Top Event Revenue</div>
                  <div className="mt-2 text-sm font-extrabold text-[#7C3AED]">
                    {topEvent ? formatCurrency(topEvent.revenue) : 'Rs 0'}
                  </div>
                </div>
                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Top Event Date</div>
                  <div className="mt-2 text-sm font-extrabold text-[#312E81]">{topEvent ? formatDate(topEvent.date) : 'N/A'}</div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default Analytics
