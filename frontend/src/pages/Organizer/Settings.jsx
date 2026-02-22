import { Link } from 'react-router-dom'
import React from 'react'
import { useAuth } from '../../hooks/useAuth'

const Settings = () => {
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
        <div className="px-6 pb-6 font-['Playfair_Display'] text-2xl font-black text-[#7C3AED]">SoundStage</div>

        <nav className="flex flex-col">
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer">Dashboard</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/concerts">My Concerts</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/tickets">Tickets</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/bookings">Bookings</Link>
          <Link className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]" to="/organizer/analytics">Analytics</Link>
          <span className="border-l-4 border-[#7C3AED] bg-[#F3F4F6] px-6 py-3 text-base font-semibold text-[#7C3AED]">Settings</span>
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

      <main className="ml-60 px-12 py-8 max-[1024px]:px-6 max-[768px]:ml-0">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-[#312E81]">Settings</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">Organizer settings are not available yet.</p>
        </header>

        <section className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-[#D1D5DB] bg-white p-8 text-center">
          <div className="max-w-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F3FF] text-[#7C3AED]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-[#312E81]">Coming Soon</h2>
            <p className="mt-2 text-sm font-semibold text-[#6B7280]">
              Organizer settings are under development. Check back later for account and security controls.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Settings
