import { Link } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import OrganizerSidebar from '../../components/OrganizerSidebar'
import { formatCurrency, formatDateTime } from '../../utils/formatters'

const parseNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const OrganizerHome = () => {
  const { user, tokens } = useAuth()
  const [organizerConcerts, setOrganizerConcerts] = useState([])
  const [currentTime, setCurrentTime] = useState(0)
  const [recentBookings, setRecentBookings] = useState([])

  const displayName = user?.username || user?.email || 'User'
  useEffect(() => {
    let isActive = true

    const loadDashboardStats = async () => {
      if (!tokens?.access) {
        if (isActive) {
          setOrganizerConcerts([])
          setCurrentTime(0)
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
        const nowTs = Date.now()

        if (isActive) {
          setOrganizerConcerts(concerts)
          setCurrentTime(nowTs)
          const bookingsData =
            bookingsResult.status === 'fulfilled' ? bookingsResult.value : { data: { bookings: [] } }
          const bookingList = bookingsData?.data?.bookings || bookingsData?.bookings || []
          const normalizedBookings = Array.isArray(bookingList) ? bookingList : []
          setRecentBookings(normalizedBookings)
        }
      } catch {
        if (isActive) {
          setOrganizerConcerts([])
          setCurrentTime(0)
          setRecentBookings([])
        }
      }
    }

    loadDashboardStats()

    return () => {
      isActive = false
    }
  }, [tokens?.access])

  const upcomingEvents = organizerConcerts
    .filter((concert) => {
      const date = new Date(concert?.date_time)
      return !Number.isNaN(date.getTime()) && date.getTime() >= currentTime
    })
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <OrganizerSidebar />

      <main className="ml-60 px-12 py-8 max-[1024px]:px-6 max-[768px]:ml-0 max-[768px]:px-4">
        <header className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h1 className="text-2xl font-black text-[#312E81]">Dashboard</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">
            Welcome back, {displayName}! Here's your concert overview.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
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

        <section className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-black text-[#312E81]">Upcoming Events</h3>
            <Link className="text-sm font-extrabold text-[#7C3AED]" to="/organizer/concerts">
              View All
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="py-4 text-sm font-semibold text-[#6B7280]">No upcoming events.</div>
          ) : (
            upcomingEvents.map((event) => {
              const status = 'Upcoming'
              return (
                <div
                  key={event.id || event.title}
                  className="mb-3 flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#FCFCFF] p-4 last:mb-0"
                >
                  <div>
                    <div className="text-sm font-extrabold text-[#312E81]">{event.title || 'Untitled Event'}</div>
                    <div className="mt-1 text-xs font-semibold text-[#6B7280]">
                      {`${formatDateTime(event.date_time, { separator: ' • ' })} • ${event.venue || 'Venue TBD'}`}
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

        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
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
                  recentBookings.slice(0, 2).map((row) => (
                    <tr key={row.id} className="border-b border-[#E5E7EB] last:border-b-0">
                      <td className="py-4">{row.attendee_name || row.attendee_email || 'Customer'}</td>
                      <td className="py-4">
                        <div>{row.concert_title || 'Concert'}</div>
                        <div className="mt-1 text-xs font-semibold text-[#6B7280]">
                          {formatDateTime(row.created_at, { separator: ' • ' })}
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
