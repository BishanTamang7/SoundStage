import { Link } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
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

const OrganizerHome = () => {
  const { user, role, tokens } = useAuth()
  const [organizerConcerts, setOrganizerConcerts] = useState([])
  const [dashboardStats, setDashboardStats] = useState({
    totalConcerts: 0,
    upcomingEvents: 0,
    totalRevenue: 0,
    attendees: 0,
  })
  const [recentBookings, setRecentBookings] = useState([])

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

    const loadDashboardStats = async () => {
      if (!tokens?.access) {
        if (isActive) {
          setOrganizerConcerts([])
          setDashboardStats({
            totalConcerts: 0,
            upcomingEvents: 0,
            totalRevenue: 0,
            attendees: 0,
          })
          setRecentBookings([])
        }
        return
      }

      try {
        const [concertsResult, bookingsResult] = await Promise.allSettled([
          api.organizerConcerts(tokens.access),
          api.organizerBookings(tokens.access),
        ])
        const concertsData =
          concertsResult.status === 'fulfilled' ? concertsResult.value : { data: { concerts: [] } }
        const list = concertsData?.data?.concerts || concertsData?.concerts || []
        const concerts = Array.isArray(list) ? list : []

        const upcomingEvents = concerts.filter((concert) => {
          const date = new Date(concert?.date_time)
          return !Number.isNaN(date.getTime()) && date.getTime() >= Date.now()
        }).length

        const totalRevenue = concerts.reduce((concertSum, concert) => {
          const categories = Array.isArray(concert?.ticket_categories) ? concert.ticket_categories : []
          return (
            concertSum +
            categories.reduce((categorySum, category) => {
              const sold = parseNumber(
                category?.sold ?? category?.sold_quantity ?? category?.tickets_sold
              )
              const price = parseNumber(category?.price)
              const revenue = parseNumber(category?.revenue)
              return categorySum + (revenue > 0 ? revenue : sold * price)
            }, 0)
          )
        }, 0)

        if (isActive) {
          setOrganizerConcerts(concerts)
          const bookingsData =
            bookingsResult.status === 'fulfilled' ? bookingsResult.value : { data: { bookings: [] } }
          const bookingList = bookingsData?.data?.bookings || bookingsData?.bookings || []
          const normalizedBookings = Array.isArray(bookingList) ? bookingList : []
          const uniqueAttendees = new Set(
            normalizedBookings
              .map((booking) => {
                const email = booking?.attendee_email
                return typeof email === 'string' ? email.trim().toLowerCase() : ''
              })
              .filter(Boolean)
          ).size

          setDashboardStats({
            totalConcerts: concerts.length,
            upcomingEvents,
            totalRevenue,
            attendees: uniqueAttendees,
          })
          setRecentBookings(normalizedBookings)
        }
      } catch {
        if (isActive) {
          setOrganizerConcerts([])
          setDashboardStats({
            totalConcerts: 0,
            upcomingEvents: 0,
            totalRevenue: 0,
            attendees: 0,
          })
          setRecentBookings([])
        }
      }
    }

    loadDashboardStats()

    return () => {
      isActive = false
    }
  }, [tokens?.access])

  const now = Date.now()
  const upcomingEvents = organizerConcerts
    .filter((concert) => {
      const date = new Date(concert?.date_time)
      return !Number.isNaN(date.getTime()) && date.getTime() >= now
    })
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <aside className="fixed left-0 top-0 h-screen w-60 border-r border-[#E5E7EB] bg-white py-6">
        <div className="px-6 pb-6 font-['Playfair_Display'] text-2xl font-black text-[#7C3AED]">
          SoundStage
        </div>

        <nav className="flex flex-col">
          <Link
            className="border-l-4 border-[#7C3AED] bg-[#F3F4F6] px-6 py-3 text-base font-semibold text-[#7C3AED]"
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
          <Link
            className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
            to="/organizer/tickets"
          >
            Tickets
          </Link>
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
          <h1 className="text-2xl font-black text-[#312E81]">Dashboard</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">
            Welcome back, {displayName}! Here's your concert overview.
          </p>
        </header>

        <section className="mb-8 rounded-lg border border-[#E5E7EB] bg-white p-6">
          <h2 className="mb-4 text-lg font-black text-[#312E81]">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-4">
            <Link
              className="inline-flex items-center justify-center rounded-lg bg-[#7C3AED] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9]"
              to="/organizer/concerts/new"
            >
              Create Concert
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-sm font-bold text-[#312E81] transition hover:bg-[#F9FAFB]"
              to="/organizer/tickets"
            >
              View Tickets
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-sm font-bold text-[#312E81] transition hover:bg-[#F9FAFB]"
              to="/organizer/bookings"
            >
              View Bookings
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-sm font-bold text-[#312E81] transition hover:bg-[#F9FAFB]"
              to="/organizer/analytics"
            >
              View Analytics
            </Link>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 min-[1024px]:grid-cols-2 min-[1280px]:grid-cols-4">
          {[
            { label: 'Total Concerts', value: String(dashboardStats.totalConcerts) },
            { label: 'Upcoming Events', value: dashboardStats.upcomingEvents.toLocaleString('en-US') },
            { label: 'Total Revenue', value: formatCurrency(dashboardStats.totalRevenue) },
            { label: 'Unique Attendees', value: dashboardStats.attendees.toLocaleString('en-US') },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-[#E5E7EB] bg-white p-5">
              <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                {stat.label}
              </div>
              <div className="mt-2 text-3xl font-black text-[#312E81]">{stat.value}</div>
            </div>
          ))}
        </section>

        <section className="mb-6 rounded-lg border border-[#E5E7EB] bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-black text-[#312E81]">Upcoming Events</h3>
            <Link className="text-sm font-extrabold text-[#7C3AED]" to="/organizer/concerts">
              View All
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="py-4 text-sm font-semibold text-[#6B7280]">No upcoming events.</div>
          ) : (
            upcomingEvents.map((event, index) => {
              const status = index === 0 ? 'Active' : 'Upcoming'
              return (
                <div
                  key={event.id || event.title}
                  className="flex items-center justify-between border-b border-[#E5E7EB] py-4 last:border-b-0"
                >
                  <div>
                    <div className="text-sm font-extrabold text-[#312E81]">{event.title || 'Untitled Event'}</div>
                    <div className="mt-1 text-xs font-semibold text-[#6B7280]">
                      {`${formatDateTime(event.date_time)} • ${event.venue || 'Venue TBD'}`}
                    </div>
                  </div>
                  <span
                    className={
                      status === 'Active'
                        ? 'rounded-md border border-[rgba(22,163,74,0.2)] bg-[#DCFCE7] px-3 py-1 text-xs font-extrabold text-[#16A34A]'
                        : 'rounded-md border border-[rgba(217,119,6,0.2)] bg-[#FEF3C7] px-3 py-1 text-xs font-extrabold text-[#D97706]'
                    }
                  >
                    {status}
                  </span>
                </div>
              )
            })
          )}
        </section>

        <section className="rounded-lg border border-[#E5E7EB] bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-black text-[#312E81]">Recent Bookings</h3>
            <Link className="text-sm font-extrabold text-[#7C3AED]" to="/organizer/bookings">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-xs font-extrabold uppercase tracking-wide text-[#6B7280]">
                  <th className="py-3">Attendees</th>
                  <th className="py-3">Event</th>
                  <th className="py-3">Tickets</th>
                  <th className="py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm font-semibold text-[#312E81]">
                {recentBookings.length === 0 ? (
                  <tr>
                    <td className="py-4 text-[#6B7280]" colSpan={4}>
                      No recent bookings yet.
                    </td>
                  </tr>
                ) : (
                  recentBookings.slice(0, 5).map((row) => (
                    <tr key={row.id} className="border-b border-[#E5E7EB] last:border-b-0">
                      <td className="py-4">{row.attendee_name || row.attendee_email || 'Customer'}</td>
                      <td className="py-4">
                        <div>{row.concert_title || 'Concert'}</div>
                        <div className="mt-1 text-xs font-semibold text-[#6B7280]">
                          {formatDateTime(row.created_at)}
                        </div>
                      </td>
                      <td className="py-4">{`${row.ticket_type || 'Ticket'} x${parseNumber(row.quantity || 0)}`}</td>
                      <td className="py-4 font-black text-[#7C3AED]">
                        {formatCurrency(parseNumber(row.amount_rupees || 0))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default OrganizerHome
