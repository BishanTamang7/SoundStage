import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getStoredProfilePhoto } from '../utils/profilePhoto'

const getInitials = (name) => {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const AttendeeHeader = () => {
  const { user, logout, role, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  const initialsSource = user?.name || user?.username || user?.email || ''
  const initials = useMemo(() => getInitials(initialsSource) || 'SS', [initialsSource])
  const profilePhoto = useMemo(() => getStoredProfilePhoto(user), [user])

  useEffect(() => {
    const handleClick = (event) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex h-20 items-center justify-between border-b border-[#312E81]/15 bg-white/95 px-[5%] backdrop-blur">
      <Link
        className="font-['Playfair_Display'] text-2xl font-black text-[#7C3AED]"
        to={isAuthenticated && role === 'attendee' ? '/attendee' : '/'}
      >
        SoundStage
      </Link>
      <div className="hidden items-center gap-10 md:flex">
        <Link className="text-base font-medium text-[#312E81]" to="/attendee/concerts">
          Browse Concerts
        </Link>
        <Link className="text-base font-medium text-[#312E81]" to="/attendee/tickets">
          My Tickets
        </Link>
        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center"
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt={`${user?.username || 'Attendee'} profile`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-semibold text-white">
                {initials}
              </span>
            )}
          </button>
          <div
            className={`absolute right-0 top-[calc(100%+0.5rem)] min-w-50 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${
              open ? 'block' : 'hidden'
            }`}
            role="menu"
          >
            <Link
              className="flex items-center gap-3 rounded-t-lg px-4 py-3 text-sm text-[#312E81] hover:bg-[#F3F4F6]"
              to="/attendee/profile"
            >
              <span className="text-lg">👤</span>
              <span>My Profile</span>
            </Link>
            <a className="flex items-center gap-3 px-4 py-3 text-sm text-[#312E81] hover:bg-[#F3F4F6]" href="#">
              <span className="text-lg">⚙️</span>
              <span>Settings</span>
            </a>
            <div className="mx-4 my-1 h-px bg-[#E5E7EB]" />
            <button
              className="flex w-full items-center gap-3 rounded-b-lg px-4 py-3 text-left text-sm text-[#EF4444] hover:bg-[#F3F4F6]"
              onClick={handleLogout}
              title="Logout"
              type="button"
            >
              <span className="text-lg">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default AttendeeHeader
