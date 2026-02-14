import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'

const getInitials = (name) => {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const formatConcertDateTime = (value) => {
  if (!value) return 'Date TBD'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date TBD'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatCurrency = (amount) => {
  const parsed = Number(amount)
  if (Number.isNaN(parsed)) return 'Rs 0'
  return `Rs ${parsed.toLocaleString()}`
}

const ticketQrPayload = (ticket, user) => {
  if (!ticket?.qr_token) return ''

  const attendeeName = ticket?.attendee_name || user?.name || user?.username || user?.email || ''
  const attendeeEmail = ticket?.attendee_email || user?.email || ''
  const payloadLines = [
    `SoundStage: ${ticket.qr_token}`,
    `Attendee Name: ${attendeeName}`,
    `Attendee Email: ${attendeeEmail}`,
    `Concert Title: ${ticket?.concert_title || ''}`,
    `Concert Date Time: ${ticket?.concert_date_time || ''}`,
    `Concert Venue: ${ticket?.concert_venue || ''}`,
    `Ticket Type: ${ticket?.ticket_type || ''}`,
    `Booked At: ${ticket?.booked_at || ticket?.created_at || ''}`,
    `Booking Quantity: ${ticket?.booking_quantity ?? ''}`,
    `Booking Total Rupees: ${ticket?.booking_total_rupees ?? ''}`,
  ]
  return payloadLines.join('\n')
}

const ticketQrUrl = (ticket, user, size = 260) => {
  const data = ticketQrPayload(ticket, user)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`
}

const compactTicketId = (value) => {
  if (!value) return ''
  const text = String(value)
  if (text.length <= 14) return text
  return `${text.slice(0, 8)}...${text.slice(-4)}`
}

const MyTickets = () => {
  const { user, logout, role, isAuthenticated, tokens } = useAuth()
  const navigate = useNavigate()
  const menuRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [copiedTicketId, setCopiedTicketId] = useState('')

  const initialsSource = user?.name || user?.username || user?.email || ''
  const initials = useMemo(() => getInitials(initialsSource) || 'SS', [initialsSource])
  const attendeeName = user?.name || user?.username || user?.email || 'Attendee User'

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
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        setSelectedTicket(null)
      }
    }

    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  useEffect(() => {
    let active = true

    const loadTickets = async () => {
      if (!tokens?.access) {
        if (active) {
          setTickets([])
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError('')
        const response = await api.myTickets(tokens.access)
        if (!active) return
        setTickets(response?.data?.tickets || [])
      } catch (err) {
        if (!active) return
        setError(err?.message || 'Failed to load tickets.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadTickets()

    return () => {
      active = false
    }
  }, [tokens?.access])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  const normalizedTickets = useMemo(() => {
    return tickets
      .map((ticket) => {
        const date = ticket?.concert_date_time ? new Date(ticket.concert_date_time) : null
        const dateMs = date && !Number.isNaN(date.getTime()) ? date.getTime() : null
        return {
          ...ticket,
          _dateMs: dateMs,
        }
      })
      .sort((a, b) => {
        const aValue = a._dateMs ?? 0
        const bValue = b._dateMs ?? 0
        return aValue - bValue
      })
  }, [tickets])

  const now = Date.now()

  const upcomingTickets = useMemo(
    () => normalizedTickets.filter((ticket) => (ticket._dateMs ?? 0) >= now),
    [normalizedTickets, now]
  )
  const pastTickets = useMemo(
    () => normalizedTickets.filter((ticket) => (ticket._dateMs ?? 0) < now),
    [normalizedTickets, now]
  )

  const activeTickets = activeTab === 0 ? upcomingTickets : pastTickets
  const isUpcoming = activeTab === 0

  const handleDownloadQr = async (ticket) => {
    if (!ticket?.qr_token) return
    const url = ticketQrUrl(ticket, user, 600)
    const filename = `soundstage-ticket-${ticket.id}.png`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Download failed')
      }
      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleCopyTicketId = async (ticketId) => {
    if (!ticketId || !navigator?.clipboard?.writeText) return
    try {
      await navigator.clipboard.writeText(String(ticketId))
      setCopiedTicketId(String(ticketId))
      window.setTimeout(() => {
        setCopiedTicketId((prev) => (prev === String(ticketId) ? '' : prev))
      }, 1500)
    } catch {
      // no-op
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white px-8 py-14 text-center text-sm font-semibold text-[#6B7280] shadow-[0_10px_30px_rgba(49,46,129,0.08)]">
          Loading your tickets...
        </div>
      )
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] px-8 py-10 text-center text-sm font-semibold text-[#B91C1C]">
          {error}
        </div>
      )
    }

    if (activeTickets.length === 0) {
      return (
        <div className="rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-white px-8 py-16 text-center">
          <div className="mb-4 text-7xl opacity-50">🎫</div>
          <h2 className="mb-2 text-2xl font-black">No {isUpcoming ? 'upcoming' : 'past'} tickets</h2>
          <p className="mb-8 font-semibold text-[#6B7280]">
            {isUpcoming ? 'Book a concert and your tickets will appear here.' : 'Your attended ticket history will appear here.'}
          </p>
          <Link
            to="/attendee/concerts"
            className="inline-block rounded-xl bg-[#7C3AED] px-8 py-4 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4F46E5]"
          >
            Browse Concerts
          </Link>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
        {activeTickets.map((ticket) => {
          const statusLabel = isUpcoming ? 'Upcoming' : ticket.is_used ? 'Attended' : 'Past'
          return (
            <article
              key={ticket.id}
              className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
            >
              <header className="relative bg-linear-to-br from-[#7C3AED] to-[#4F46E5] p-6 text-white">
                <span
                  className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-black tracking-wide uppercase ${
                    isUpcoming ? 'bg-emerald-500/90' : 'bg-gray-500/90'
                  }`}
                >
                  {statusLabel}
                </span>
                <h3 className="mb-2 pr-28 text-2xl leading-tight font-black">{ticket.concert_title || 'Untitled Concert'}</h3>
                <p className="text-sm font-semibold opacity-90">{formatConcertDateTime(ticket.concert_date_time)}</p>
              </header>

              <div className="p-6">
                <div className="mb-6 space-y-0">
                  <div className="flex items-center justify-between border-b border-[#F3F4F6] py-3">
                    <span className="text-sm font-semibold text-[#6B7280]">Ticket ID</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#312E81]">{compactTicketId(ticket.id)}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyTicketId(ticket.id)}
                        className="rounded-md border border-[#7C3AED] px-2 py-1 text-xs font-bold text-[#7C3AED] transition hover:bg-[#F3F4F6]"
                      >
                        {copiedTicketId === String(ticket.id) ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#F3F4F6] py-3">
                    <span className="text-sm font-semibold text-[#6B7280]">Category</span>
                    <span className="text-sm font-black text-[#312E81]">{ticket.ticket_type || 'General'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#F3F4F6] py-3">
                    <span className="text-sm font-semibold text-[#6B7280]">Quantity</span>
                    <span className="text-sm font-black text-[#312E81]">1 ticket</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#F3F4F6] py-3">
                    <span className="text-sm font-semibold text-[#6B7280]">Venue</span>
                    <span className="max-w-44 text-right text-sm font-black text-[#312E81]">{ticket.concert_venue || 'TBD'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-semibold text-[#6B7280]">Total Paid</span>
                    <span className="text-sm font-black text-[#312E81]">{formatCurrency(ticket.ticket_price)}</span>
                  </div>
                </div>

                {isUpcoming ? (
                  <>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(ticket)}
                        className="flex-1 rounded-xl bg-[#7C3AED] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#4F46E5]"
                      >
                        View Ticket
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadQr(ticket)}
                        className="flex-1 rounded-xl border-2 border-[#7C3AED] bg-white px-4 py-3 text-sm font-bold text-[#7C3AED] transition hover:bg-[#F3F4F6]"
                      >
                        Download QR
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDownloadQr(ticket)}
                    className="w-full rounded-xl border-2 border-[#7C3AED] bg-white px-4 py-3 text-sm font-bold text-[#7C3AED] transition hover:bg-[#F3F4F6]"
                  >
                    Download Ticket
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-[#312E81]">
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-12 pt-28 text-[#312E81] md:px-12">
        <div className="mb-8 flex gap-2 border-b-2 border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => setActiveTab(0)}
            className={`-mb-0.5 border-b-[3px] px-8 py-4 text-sm font-bold whitespace-nowrap transition ${
              activeTab === 0
                ? 'border-b-[#7C3AED] text-[#7C3AED]'
                : 'border-b-transparent text-[#6B7280] hover:text-[#7C3AED]'
            }`}
          >
            Upcoming ({upcomingTickets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(1)}
            className={`-mb-0.5 border-b-[3px] px-8 py-4 text-sm font-bold whitespace-nowrap transition ${
              activeTab === 1
                ? 'border-b-[#7C3AED] text-[#7C3AED]'
                : 'border-b-transparent text-[#6B7280] hover:text-[#7C3AED]'
            }`}
          >
            Past ({pastTickets.length})
          </button>
        </div>

        {renderContent()}
      </main>

      {selectedTicket ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedTicket(null)
            }
          }}
          role="presentation"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white">
            <div className="rounded-t-3xl bg-linear-to-br from-[#7C3AED] to-[#4F46E5] p-8 text-white">
              <h3 className="mb-2 text-3xl font-black">{selectedTicket.concert_title || 'Untitled Concert'}</h3>
              <p className="text-sm opacity-90">
                {formatConcertDateTime(selectedTicket.concert_date_time)} • {selectedTicket.ticket_type || 'General'}
              </p>
            </div>

            <div className="p-8">
              <div className="mb-8 text-center">
                <img
                  src={ticketQrUrl(selectedTicket, user, 360)}
                  alt="Ticket QR code"
                  className="mx-auto mb-4 h-64 w-64 rounded-2xl border-4 border-[#7C3AED] bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
                />
                <p className="font-semibold text-[#6B7280]">Present this QR code at the venue entrance</p>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between border-b border-[#F3F4F6] py-3">
                  <span className="text-sm font-semibold text-[#6B7280]">Ticket ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#312E81]">{compactTicketId(selectedTicket.id)}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyTicketId(selectedTicket.id)}
                      className="rounded-md border border-[#7C3AED] px-2 py-1 text-xs font-bold text-[#7C3AED] transition hover:bg-[#F3F4F6]"
                    >
                      {copiedTicketId === String(selectedTicket.id) ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-[#F3F4F6] py-3">
                  <span className="text-sm font-semibold text-[#6B7280]">Holder</span>
                  <span className="text-sm font-black text-[#312E81]">{attendeeName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#F3F4F6] py-3">
                  <span className="text-sm font-semibold text-[#6B7280]">Quantity</span>
                  <span className="text-sm font-black text-[#312E81]">1 ticket</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-semibold text-[#6B7280]">Venue</span>
                  <span className="max-w-48 text-right text-sm font-black text-[#312E81]">{selectedTicket.concert_venue || 'TBD'}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 rounded-xl bg-[#F3F4F6] px-6 py-3 font-bold text-[#312E81] transition hover:bg-[#E5E7EB]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadQr(selectedTicket)}
                  className="flex-1 rounded-xl bg-[#7C3AED] px-6 py-3 font-bold text-white transition hover:bg-[#4F46E5]"
                >
                  Download QR
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
