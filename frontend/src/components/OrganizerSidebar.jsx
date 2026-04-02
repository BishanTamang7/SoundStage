import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getStoredProfilePhoto } from '../utils/profilePhoto'
import { getInitialsFromHandle } from '../utils/account'

const navItems = [
  { label: 'Dashboard', href: '/organizer' },
  { label: 'My Concerts', href: '/organizer/concerts' },
  { label: 'Tickets', href: '/organizer/tickets' },
  { label: 'Confirm Ticket', href: '/organizer/confirm-ticket' },
  { label: 'Bookings', href: '/organizer/bookings' },
  { label: 'Analytics', href: '/organizer/analytics' },
]

const OrganizerSidebar = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, role, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const displayName = user?.username || user?.email || 'User'
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'
  const initials = useMemo(() => getInitialsFromHandle(user?.username || user?.email || '', 'U'), [user])
  const profilePhoto = useMemo(() => getStoredProfilePhoto(user), [user])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const isActive = (href) => {
    if (href === '/organizer') return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-10 h-screen w-60 border-r border-[#E5E7EB] bg-white py-6 transition-transform max-[768px]:-translate-x-full">
      <div className="px-6 pb-6 font-['Playfair_Display'] text-2xl font-black text-[#7C3AED]">
        SoundStage
      </div>

      <nav className="flex flex-col">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              className={`border-l-4 px-6 py-3 text-base font-semibold transition ${
                active
                  ? 'border-[#7C3AED] bg-[#F3F4F6] text-[#7C3AED]'
                  : 'border-transparent text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#7C3AED]'
              }`}
              to={item.href}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-6 left-6 right-6" ref={menuRef}>
        {menuOpen ? (
          <div className="mb-2 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_16px_40px_rgba(49,46,129,0.14)]">
            <Link
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#312E81] transition hover:bg-[#F8FAFC]"
              to="/organizer/profile"
            >
              <span className="text-lg">👤</span>
              <span>My profile</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#312E81] transition hover:bg-[#F8FAFC]"
              to="/organizer/settings"
            >
              <span className="text-lg">⚙️</span>
              <span>Settings</span>
            </Link>
            <div className="mx-4 h-px bg-[#E5E7EB]" />
            <button
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#DC2626] transition hover:bg-[#FEF2F2]"
              type="button"
              onClick={handleLogout}
            >
              <span className="text-lg">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        ) : null}

        <button
          className="flex w-full items-center gap-3 rounded-lg border border-[rgba(124,58,237,0.12)] bg-[#F3F4F6] p-3 text-left transition hover:border-[rgba(124,58,237,0.22)] hover:bg-white"
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt={`${displayName} profile`}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-extrabold text-white">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <div className="text-sm font-extrabold leading-tight text-[#312E81]">{displayName}</div>
            <div className="mt-0.5 text-xs font-bold text-[#6B7280]">{displayRole}</div>
          </div>
          <svg
            className={`h-4 w-4 text-[#6B7280] transition ${menuOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m5 7.5 5 5 5-5" />
          </svg>
        </button>
      </div>
    </aside>
  )
}

export default OrganizerSidebar
