import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

const getInitials = (name) => {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const MyTickets = () => {
  const { user, logout, role, isAuthenticated, tokens } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tickets, setTickets] = useState([])
  const menuRef = useRef(null)

  const initialsSource = user?.name || user?.username || user?.email || ''
  const initials = useMemo(() => getInitials(initialsSource) || 'SS', [initialsSource])

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

  useEffect(() => {
    let isActive = true

    const loadTickets = async () => {
      if (!tokens?.access) {
        if (isActive) setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError('')
        const response = await api.myTickets(tokens.access)
        if (isActive) {
          setTickets(response?.data?.tickets || [])
        }
      } catch (err) {
        if (isActive) setError(err?.message || 'Failed to load tickets.')
      } finally {
        if (isActive) setLoading(false)
      }
    }

    loadTickets()

    return () => {
      isActive = false
    }
  }, [tokens?.access])

  const handleLogout = async () => {
    navigate('/', { replace: true })
    await logout()
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] text-[#312E81]">
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
          <Link className="text-base font-semibold text-[#7C3AED]" to="/attendee/tickets">
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
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-semibold text-white">
                {initials}
              </span>
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
              <div className="mx-4 my-1 h-px bg-[#E5E7EB]" />
              <a className="flex items-center gap-3 px-4 py-3 text-sm text-[#312E81] hover:bg-[#F3F4F6]" href="#">
                <span className="text-lg">⚙️</span>
                <span>Settings</span>
              </a>
              <button
                className="flex w-full items-center gap-3 rounded-b-lg px-4 py-3 text-left text-sm text-[#EF4444] hover:bg-[#F3F4F6]"
                type="button"
                onClick={handleLogout}
                title="Logout"
              >
                <span className="text-lg">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-24">
        <section className="px-[5%] py-16">
          <div className="mx-auto max-w-5xl">
            {loading ? (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-14 text-center text-sm font-semibold text-[#6B7280] shadow-[0_10px_30px_rgba(49,46,129,0.08)]">
                Loading your tickets...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] px-6 py-10 text-center text-sm font-semibold text-[#B91C1C]">
                {error}
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-14 text-center shadow-[0_10px_30px_rgba(49,46,129,0.08)]">
                <div className="mb-4 text-5xl">🎫</div>
                <h1 className="font-['Playfair_Display'] text-4xl font-black text-[#312E81]">No Tickets Yet</h1>
                <p className="mt-3 text-base font-medium text-[#6B7280]">
                  Complete a payment and your QR tickets will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {tickets.map((ticket) => {
                  const qrData = `SOUNDSTAGE:${ticket.qr_token}`
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    qrData
                  )}`
                  return (
                    <article
                      key={ticket.id}
                      className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_30px_rgba(49,46,129,0.08)]"
                    >
                      <h2 className="text-lg font-black text-[#312E81]">{ticket.concert_title}</h2>
                      <div className="mt-2 space-y-1 text-sm font-semibold text-[#6B7280]">
                        <p>Type: {ticket.ticket_type}</p>
                        <p>Seat: #{ticket.seat_number}</p>
                        <p>Venue: {ticket.concert_venue}</p>
                        <p>Status: {ticket.is_used ? 'Used' : 'Valid'}</p>
                      </div>
                      <div className="mt-5 flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                        <img src={qrUrl} alt="Ticket QR code" className="h-44 w-44 rounded-lg bg-white p-1" />
                      </div>
                      <p className="mt-3 break-all font-mono text-xs text-[#6B7280]">{ticket.qr_token}</p>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-[#312E81] px-[5%] py-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-6 text-base">
          <div className="flex gap-8">
            <Link className="text-white/75" to="/attendee/about">
              About
            </Link>
            <Link className="text-white/75" to="/privacy">
              Privacy
            </Link>
            <Link className="text-white/75" to="/terms">
              Terms
            </Link>
          </div>
          <div>© 2026 SoundStage. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

export default MyTickets
