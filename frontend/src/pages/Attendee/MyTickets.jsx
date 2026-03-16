import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AttendeeFooter from '../../components/AttendeeFooter'
import AttendeeHeader from '../../components/AttendeeHeader'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'

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

const formatQrAmount = (amount) => {
  const parsed = Number(amount)
  if (Number.isNaN(parsed)) return '0'
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2)
}

const formatNepalDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date)
}

const getTokenPin = (qrToken) => {
  const value = String(qrToken || '')
  if (!value) return '0000'
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 10000
  }
  return String(hash).padStart(4, '0')
}

const ticketQrPayload = (ticket, user, aggregateSource) => {
  if (!ticket?.qr_token) return ''

  const attendeeName = ticket?.attendee_name || user?.name || user?.username || user?.email || ''
  const attendeeEmail = ticket?.attendee_email || user?.email || ''
  const tokenPin = ticket?.token_pin
    ? String(ticket.token_pin).padStart(4, '0')
    : getTokenPin(ticket?.qr_token)
  const groupedTickets = Array.isArray(aggregateSource?._groupTickets)
    ? aggregateSource._groupTickets
    : []
  const totalBookingQuantity = groupedTickets.length > 0
    ? groupedTickets.reduce((sum, item) => sum + (Number(item?.booking_quantity) || 1), 0)
    : Number(ticket?.booking_quantity) || 1
  const totalAmount = groupedTickets.length > 0
    ? groupedTickets.reduce((sum, item) => sum + (Number(item?.booking_total_rupees) || 0), 0)
    : Number(ticket?.booking_total_rupees) || 0
  const bookedAtValue = (() => {
    if (groupedTickets.length > 1) {
      const values = groupedTickets
        .map((item) => item?.booked_at || item?.created_at || '')
        .filter(Boolean)
      return values.length > 0 ? values.join(' | ') : ''
    }
    return ticket?.booked_at || ticket?.created_at || ''
  })()
  const payloadLines = [
    `Token: ${tokenPin}`,
    `Attendee Name: ${attendeeName}`,
    `Attendee Email: ${attendeeEmail}`,
    `Concert Title: ${ticket?.concert_title || ''}`,
    `Concert Date Time: ${formatNepalDateTime(ticket?.concert_date_time)}`,
    `Concert Venue: ${ticket?.concert_venue || ''}`,
    `Ticket Type: ${ticket?.ticket_type || ''}`,
    `Booked At: ${bookedAtValue
      .split(' | ')
      .map((value) => formatNepalDateTime(value))
      .join(' | ')}`,
    `Total Booking Quantity: ${totalBookingQuantity}`,
    `Total Amount: NPR ${formatQrAmount(totalAmount)}`,
  ]
  return payloadLines.join('\n')
}

const ticketQrUrl = (ticket, user, size = 260, aggregateSource = null) => {
  const data = ticketQrPayload(ticket, user, aggregateSource)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`
}

const getTicketUiTheme = (ticketType) => {
  const value = String(ticketType || '').trim().toLowerCase()

  if (value.includes('vip')) {
    return {
      kind: 'vip',
      headerClass:
        'bg-linear-to-br from-[#B45309] via-[#D97706] to-[#F59E0B]',
      cardAccentClass: 'ring-2 ring-[#F59E0B]/30',
      badgeClass:
        'border border-[#F59E0B]/40 bg-[#FFF7ED] text-[#B45309]',
      badgeLabel: 'VIP Access',
      qrBorderClass: 'border-[#F59E0B]',
      actionClass: 'bg-[#D97706] hover:bg-[#B45309]',
    }
  }

  if (value.includes('regular')) {
    return {
      kind: 'regular',
      headerClass:
        'bg-linear-to-br from-[#0F766E] via-[#0D9488] to-[#14B8A6]',
      cardAccentClass: 'ring-2 ring-[#14B8A6]/20',
      badgeClass:
        'border border-[#14B8A6]/35 bg-[#F0FDFA] text-[#0F766E]',
      badgeLabel: 'Regular',
      qrBorderClass: 'border-[#14B8A6]',
      actionClass: 'bg-[#0D9488] hover:bg-[#0F766E]',
    }
  }

  return {
    kind: 'default',
    headerClass: 'bg-linear-to-br from-[#7C3AED] to-[#4F46E5]',
    cardAccentClass: '',
    badgeClass:
      'border border-[rgba(124,58,237,0.22)] bg-[rgba(124,58,237,0.08)] text-[#5B21B6]',
    badgeLabel: ticketType || 'General',
    qrBorderClass: 'border-[#7C3AED]',
    actionClass: 'bg-[#7C3AED] hover:bg-[#4F46E5]',
  }
}

const getTicketGroupKey = (ticket) => {
  return [
    ticket?.attendee_email || '',
    ticket?.concert_title || '',
    ticket?.concert_date_time || '',
    ticket?.concert_venue || '',
    (ticket?.ticket_type || '').trim().toLowerCase(),
    ticket?.is_used ? 'used' : 'unused',
  ].join('::')
}

const getDisplayQuantity = (ticket) => {
  const grouped = Array.isArray(ticket?._groupTickets) ? ticket._groupTickets.length : 0
  if (grouped > 0) {
    const totalQuantity = ticket._groupTickets.reduce(
      (sum, item) => sum + (Number(item?.booking_quantity) || 1),
      0
    )
    return totalQuantity
  }
  return Number(ticket?.booking_quantity) || 1
}

const getDisplayTotalPaid = (ticket) => {
  const groupedTickets = Array.isArray(ticket?._groupTickets) ? ticket._groupTickets : []
  if (groupedTickets.length > 0) {
    const total = groupedTickets.reduce((sum, item) => {
      const price = Number(item?.ticket_price) || 0
      const quantity = Number(item?.booking_quantity) || 1
      return sum + price * quantity
    }, 0)
    return total
  }
  return (Number(ticket?.ticket_price) || 0) * (Number(ticket?.booking_quantity) || 1)
}

const getPrimaryTicket = (ticket) => {
  const groupedTickets = Array.isArray(ticket?._groupTickets) ? ticket._groupTickets : []
  return groupedTickets[0] || ticket
}

const MyTickets = () => {
  const { user, tokens } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)

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

  const normalizedTickets = useMemo(() => {
    const normalized = tickets
      .map((ticket) => {
        const date = ticket?.concert_date_time ? new Date(ticket.concert_date_time) : null
        const dateMs = date && !Number.isNaN(date.getTime()) ? date.getTime() : null
        const createdAt = ticket?.created_at ? new Date(ticket.created_at) : null
        const createdAtMs = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.getTime() : null
        return {
          ...ticket,
          _dateMs: dateMs,
          _createdAtMs: createdAtMs,
        }
      })
      .sort((a, b) => {
        const aValue = a._dateMs ?? 0
        const bValue = b._dateMs ?? 0
        if (aValue !== bValue) return aValue - bValue
        const aCreated = a._createdAtMs ?? 0
        const bCreated = b._createdAtMs ?? 0
        return aCreated - bCreated
      })
    const groupedMap = new Map()

    normalized.forEach((ticket) => {
      const key = getTicketGroupKey(ticket)
      const existing = groupedMap.get(key)
      if (!existing) {
        groupedMap.set(key, {
          ...ticket,
          _groupKey: key,
          _groupTickets: [ticket],
        })
        return
      }

      existing._groupTickets.push(ticket)
    })

    return Array.from(groupedMap.values()).sort((a, b) => {
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

  const handleDownloadQr = async (ticket, aggregateSource = null) => {
    if (!ticket?.qr_token) return
    const url = ticketQrUrl(ticket, user, 600, aggregateSource)
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

  const handleDownloadQrGroup = async (ticket) => {
    await handleDownloadQr(getPrimaryTicket(ticket), ticket)
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
          const ticketTheme = getTicketUiTheme(ticket.ticket_type)
          return (
            <article
              key={ticket._groupKey || ticket.id}
              className={`overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] ${ticketTheme.cardAccentClass}`}
            >
              <header className={`relative p-6 text-white ${ticketTheme.headerClass}`}>
                <span
                  className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-black tracking-wide uppercase ${
                    isUpcoming ? 'bg-emerald-500/90' : 'bg-gray-500/90'
                  }`}
                >
                  {statusLabel}
                </span>
                <span
                  className={`mb-3 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black tracking-[0.14em] uppercase ${ticketTheme.kind === 'vip' ? 'bg-white/18 text-white ring-1 ring-white/35' : ticketTheme.kind === 'regular' ? 'bg-white/15 text-white ring-1 ring-white/25' : 'bg-white/15 text-white ring-1 ring-white/20'}`}
                >
                  {ticketTheme.badgeLabel}
                </span>
                <h3 className="mb-2 pr-28 text-2xl leading-tight font-black">{ticket.concert_title || 'Untitled Concert'}</h3>
                <p className="text-sm font-semibold opacity-90">{formatConcertDateTime(ticket.concert_date_time)}</p>
              </header>

              <div className="p-6">
                <div className="mb-6 space-y-0">
                  <div className="flex items-center justify-between border-b border-[#F3F4F6] py-3">
                    <span className="text-sm font-semibold text-[#6B7280]">Category</span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${ticketTheme.badgeClass}`}>
                      {ticket.ticket_type || 'General'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#F3F4F6] py-3">
                    <span className="text-sm font-semibold text-[#6B7280]">Quantity</span>
                    <span className="text-sm font-black text-[#312E81]">
                      {getDisplayQuantity(ticket)} {getDisplayQuantity(ticket) === 1 ? 'ticket' : 'tickets'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#F3F4F6] py-3">
                    <span className="text-sm font-semibold text-[#6B7280]">Venue</span>
                    <span className="max-w-44 text-right text-sm font-black text-[#312E81]">{ticket.concert_venue || 'TBD'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-semibold text-[#6B7280]">Total Paid</span>
                    <span className="text-sm font-black text-[#312E81]">{formatCurrency(getDisplayTotalPaid(ticket))}</span>
                  </div>
                </div>

                {isUpcoming ? (
                  <>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(ticket)}
                        className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition ${ticketTheme.actionClass}`}
                      >
                        View Ticket
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadQrGroup(ticket)}
                        className="flex-1 rounded-xl border-2 border-[#7C3AED] bg-white px-4 py-3 text-sm font-bold text-[#7C3AED] transition hover:bg-[#F3F4F6]"
                      >
                        Download QR
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleDownloadQrGroup(ticket)}
                      className="w-full rounded-xl border-2 border-[#7C3AED] bg-white px-4 py-3 text-sm font-bold text-[#7C3AED] transition hover:bg-[#F3F4F6]"
                    >
                      Download Ticket
                    </button>
                    <p className="text-center text-xs font-semibold text-[#6B7280]">
                      Ticket history is preserved automatically and cannot be deleted.
                    </p>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] text-[#312E81]">
      <AttendeeHeader />

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-[2px] sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedTicket(null)
            }
          }}
          role="presentation"
        >
          {(() => {
            const selectedTheme = getTicketUiTheme(selectedTicket.ticket_type)
            return (
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-7">
              <div className="mb-5">
                <div className="text-xs font-black tracking-[0.14em] text-[#6B7280] uppercase">Ticket QR</div>
              </div>

              <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-center sm:p-5">
                <img
                  src={ticketQrUrl(getPrimaryTicket(selectedTicket), user, 360, selectedTicket)}
                  alt="Ticket QR code"
                  className={`mx-auto h-64 w-64 rounded-2xl border-4 bg-white p-2 shadow-[0_10px_26px_rgba(0,0,0,0.12)] ${selectedTheme.qrBorderClass}`}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 rounded-xl bg-[#F3F4F6] px-6 py-3 font-bold text-[#312E81] transition hover:bg-[#E5E7EB]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadQrGroup(selectedTicket)}
                  className={`flex-1 rounded-xl px-6 py-3 font-bold text-white transition ${selectedTheme.actionClass}`}
                >
                  Download QR
                </button>
              </div>
          </div>
            )
          })()}
        </div>
      ) : null}

      <AttendeeFooter />
    </div>
  )
}

export default MyTickets
