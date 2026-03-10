import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import OrganizerSidebar from '../../components/OrganizerSidebar'

const DetailRow = ({ label, value }) => (
  <div className="rounded-lg border border-[#E5E7EB] bg-[#FCFCFF] p-3">
    <div className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">{label}</div>
    <div className="mt-1 text-sm font-semibold text-[#312E81]">{value || '-'}</div>
  </div>
)

const ConfirmTicket = () => {
  const { tokens } = useAuth()
  const [pinValue, setPinValue] = useState('')
  const [checking, setChecking] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [response, setResponse] = useState(null)
  const [checkedPin, setCheckedPin] = useState('')

  const validatePin = () => {
    const value = pinValue.trim()
    if (!value) {
      setResponse(null)
      setCheckedPin('')
      setError('Please enter a 4-digit PIN.')
      return ''
    }
    if (!/^\d{4}$/.test(value)) {
      setResponse(null)
      setCheckedPin('')
      setError('PIN must be exactly 4 digits.')
      return ''
    }
    return value
  }

  const handleCheckPin = async (event) => {
    event.preventDefault()
    setError('')
    const value = validatePin()
    if (!value) return

    if (!tokens?.access) {
      setResponse(null)
      setCheckedPin('')
      setError('Authentication token missing. Please sign in again.')
      return
    }

    try {
      setChecking(true)
      const result = await api.verifyTicket(tokens.access, { qr_token: value, confirm_entry: false })
      setResponse(result)
      setCheckedPin(value)
    } catch (err) {
      setResponse(null)
      setCheckedPin('')
      setError(err?.message || 'Failed to verify ticket.')
    } finally {
      setChecking(false)
    }
  }

  const handleConfirmEntry = async () => {
    setError('')
    if (!checkedPin || checkedPin !== pinValue.trim()) {
      setError('Please check the current PIN again before confirming entry.')
      return
    }
    if (!tokens?.access) {
      setError('Authentication token missing. Please sign in again.')
      return
    }

    try {
      setConfirming(true)
      const result = await api.verifyTicket(tokens.access, { qr_token: checkedPin, confirm_entry: true })
      setResponse(result)
    } catch (err) {
      setError(err?.message || 'Failed to confirm entry.')
    } finally {
      setConfirming(false)
    }
  }

  const ticketData = response?.data || {}
  const verifySuccess = Boolean(response?.success)
  const verifyMessage = response?.message || ''
  const needsConfirmation = Boolean(response?.requires_confirmation)

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <OrganizerSidebar />

      <main className="ml-60 px-12 py-8 max-[1024px]:px-6 max-[768px]:ml-0 max-[768px]:px-4">
        <header className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h1 className="text-3xl font-black text-[#312E81]">Confirm Ticket</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">
            Enter a 4-digit PIN to confirm attendee entry.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <form className="space-y-4" onSubmit={handleCheckPin}>
            <label className="block">
              <span className="text-sm font-bold text-[#312E81]">4-Digit PIN</span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-4 text-sm font-semibold text-[#312E81] outline-none transition focus:border-[#7C3AED]"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="Enter 4-digit PIN"
                value={pinValue}
                onChange={(event) => setPinValue(event.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={checking || confirming}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#7C3AED] px-5 text-sm font-bold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checking ? 'Checking...' : 'Check PIN'}
              </button>
              <button
                type="button"
                disabled={confirming || checking || !needsConfirmation || checkedPin !== pinValue.trim()}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#16A34A] px-5 text-sm font-bold text-white transition hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleConfirmEntry}
              >
                {confirming ? 'Confirming...' : 'Confirm Entry'}
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-[#D1D5DB] px-5 text-sm font-bold text-[#312E81] transition hover:bg-[#F9FAFB]"
                onClick={() => {
                  setPinValue('')
                  setError('')
                  setResponse(null)
                  setCheckedPin('')
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        {error ? (
          <div className="mb-6 rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] px-6 py-4 text-sm font-semibold text-[#B91C1C]">
            {error}
          </div>
        ) : null}

        {response ? (
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div
              className={`rounded-lg border px-4 py-3 text-sm font-bold ${
                verifySuccess
                  ? 'border-[#86EFAC] bg-[#F0FDF4] text-[#166534]'
                  : 'border-[#FCD34D] bg-[#FFFBEB] text-[#B45309]'
              }`}
            >
              {verifyMessage || (verifySuccess ? 'Ticket verified.' : 'Verification completed.')}
            </div>

            <div className="mt-4 grid gap-3 min-[760px]:grid-cols-2">
              <DetailRow label="Token PIN" value={ticketData.token} />
              <DetailRow label="Attendee" value={ticketData.attendee_name} />
              <DetailRow label="Attendee Email" value={ticketData.attendee_email} />
              <DetailRow label="Concert" value={ticketData.concert_title} />
              <DetailRow label="Date & Time" value={ticketData.concert_date_time} />
              <DetailRow label="Venue" value={ticketData.concert_venue} />
              <DetailRow label="Ticket Type" value={ticketData.ticket_type} />
              <DetailRow label="Booked At" value={ticketData.booked_at} />
              <DetailRow label="Booking Quantity" value={ticketData.total_booking_quantity} />
              <DetailRow label="Total Amount" value={ticketData.total_amount} />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}

export default ConfirmTicket
