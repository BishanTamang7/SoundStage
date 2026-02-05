import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const OrganizerHome = () => {
  const { user, role } = useAuth()

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
          {['Tickets', 'Scan QR', 'Analytics', 'Settings'].map((item) => (
            <a
              key={item}
              className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
              href="#"
            >
              {item}
            </a>
          ))}
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

        <section className="mb-8 grid grid-cols-1 gap-6 min-[1024px]:grid-cols-2 min-[1280px]:grid-cols-4">
          {[
            { label: 'Total Events', value: '12' },
            { label: 'Tickets Sold', value: '2,847' },
            { label: 'Total Revenue', value: 'Rs 4.2M' },
            { label: 'Attendees', value: '2,654' },
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
            <a className="text-sm font-extrabold text-[#7C3AED]" href="#">
              View All 
            </a>
          </div>

          {[
            { name: 'Rock Night 2026', details: 'Feb 15, 2026  Kathmandu', status: 'Active' },
            { name: 'Jazz Evening', details: 'Feb 22, 2026  Pokhara', status: 'Upcoming' },
            { name: 'EDM Festival', details: 'Mar 5, 2026  Chitwan', status: 'Upcoming' },
          ].map((event) => (
            <div
              key={event.name}
              className="flex items-center justify-between border-b border-[#E5E7EB] py-4 last:border-b-0"
            >
              <div>
                <div className="text-sm font-extrabold text-[#312E81]">{event.name}</div>
                <div className="mt-1 text-xs font-semibold text-[#6B7280]">{event.details}</div>
              </div>
              <span
                className={
                  event.status === 'Active'
                    ? 'rounded-md border border-[rgba(22,163,74,0.2)] bg-[#DCFCE7] px-3 py-1 text-xs font-extrabold text-[#16A34A]'
                    : 'rounded-md border border-[rgba(217,119,6,0.2)] bg-[#FEF3C7] px-3 py-1 text-xs font-extrabold text-[#D97706]'
                }
              >
                {event.status}
              </span>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-[#E5E7EB] bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-black text-[#312E81]">Recent Bookings</h3>
            <a className="text-sm font-extrabold text-[#7C3AED]" href="#">
              View All 
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-xs font-extrabold uppercase tracking-wide text-[#6B7280]">
                  <th className="py-3">Customer</th>
                  <th className="py-3">Event</th>
                  <th className="py-3">Tickets</th>
                  <th className="py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm font-semibold text-[#312E81]">
                {[
                  { customer: 'Raj Kumar', event: 'Rock Night 2026', tickets: 'VIP x2', amount: 'Rs 2,000' },
                  { customer: 'Sita Poudel', event: 'Jazz Evening', tickets: 'Regular x3', amount: 'Rs 1,500' },
                  { customer: 'Amit Maharjan', event: 'Rock Night 2026', tickets: 'Student x1', amount: 'Rs 400' },
                  { customer: 'Priya Shrestha', event: 'EDM Festival', tickets: 'VIP x1', amount: 'Rs 1,000' },
                ].map((row) => (
                  <tr key={row.customer} className="border-b border-[#E5E7EB] last:border-b-0">
                    <td className="py-4">{row.customer}</td>
                    <td className="py-4">{row.event}</td>
                    <td className="py-4">{row.tickets}</td>
                    <td className="py-4 font-black text-[#7C3AED]">{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default OrganizerHome
