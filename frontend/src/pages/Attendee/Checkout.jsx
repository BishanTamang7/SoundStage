import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AttendeeFooter from '../../components/AttendeeFooter'
import AttendeeHeader from '../../components/AttendeeHeader'
import { useAuth } from '../../hooks/useAuth'
import { api, resolveMediaUrl } from '../../services/api'
import { formatDateTime } from '../../utils/formatters'

const Checkout = () => {
  const { id } = useParams()
  const { tokens } = useAuth()
  const [concert, setConcert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')

  useEffect(() => {
    let isActive = true

    const loadConcert = async () => {
      if (!id) {
        if (isActive) setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const data = await api.getConcert(tokens?.access, id)
        const payload = data?.data || data
        if (isActive) {
          setConcert(payload || null)
          // Do not preselect a ticket; require explicit user choice.
          setSelectedTicket(null)
        }
      } catch (err) {
        if (isActive) setError(err?.message || 'Failed to load concert.')
      } finally {
        if (isActive) setLoading(false)
      }
    }

    loadConcert()

    return () => {
      isActive = false
    }
  }, [id, tokens?.access])

  const ticketCategories = useMemo(() => {
    const list = Array.isArray(concert?.ticket_categories)
      ? concert.ticket_categories
      : Array.isArray(concert?.tickets)
        ? concert.tickets
        : []

    const priority = ['vip', 'regular']
    const withIndex = list.map((item, originalIndex) => ({ item, originalIndex }))

    withIndex.sort((a, b) => {
      const aName = String(a.item?.name || '').toLowerCase()
      const bName = String(b.item?.name || '').toLowerCase()
      const aPriority = priority.indexOf(aName)
      const bPriority = priority.indexOf(bName)

      const aScore = aPriority === -1 ? priority.length : aPriority
      const bScore = bPriority === -1 ? priority.length : bPriority

      if (aScore !== bScore) return aScore - bScore
      // preserve original ordering when priority is the same
      return a.originalIndex - b.originalIndex
    })

    return withIndex.map(({ item }) => item)
  }, [concert])

  const selectedTicketRemaining = Number(selectedTicket?.remaining ?? selectedTicket?.quantity ?? 0)
  const unitPrice = Number(selectedTicket?.price || 0)
  const totalPrice = unitPrice * quantity

  useEffect(() => {
    if (!selectedTicket?.id) {
      setQuantity(1)
      return
    }
    if (selectedTicketRemaining <= 0) {
      setQuantity(1)
      return
    }
    if (quantity > selectedTicketRemaining) {
      setQuantity(selectedTicketRemaining)
    }
  }, [quantity, selectedTicket?.id, selectedTicketRemaining])

  const coverImage = resolveMediaUrl(concert?.cover_image)

  const handleProceedToPayment = async () => {
    if (!selectedTicket?.id) {
      setPaymentError('Please select a ticket type.')
      return
    }

    if (!paymentMethod) {
      setPaymentError('Please select a payment method.')
      return
    }

    if (!id) {
      setPaymentError('Concert not found.')
      return
    }

    if (selectedTicketRemaining < 1) {
      setPaymentError('Selected ticket type is sold out.')
      return
    }

    if (quantity > selectedTicketRemaining) {
      setPaymentError(`Only ${selectedTicketRemaining} tickets are available for this category.`)
      return
    }

    try {
      setPaymentLoading(true)
      setPaymentError('')
      if (paymentMethod === 'esewa') {
        const response = await api.esewaInitiate(tokens?.access, {
          concert_id: id,
          ticket_category_id: selectedTicket.id,
          quantity,
        })
        const formUrl = response?.data?.form_url
        const params = response?.data?.params
        if (!formUrl || !params) {
          throw new Error('eSewa payment instructions were not returned.')
        }

        const form = document.createElement('form')
        form.method = 'POST'
        form.action = formUrl
        Object.entries(params).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = value ?? ''
          form.appendChild(input)
        })
        document.body.appendChild(form)
        form.submit()
      } else {
        const response = await api.khaltiInitiate(tokens?.access, {
          concert_id: id,
          ticket_category_id: selectedTicket.id,
          quantity,
        })
        const paymentUrl = response?.data?.payment_url
        if (!paymentUrl) {
          throw new Error('Khalti payment URL was not returned.')
        }
        window.location.href = paymentUrl
      }
    } catch (err) {
      setPaymentError(
        err?.message ||
          (paymentMethod === 'esewa'
            ? 'Failed to initiate eSewa payment.'
            : 'Failed to initiate Khalti payment.')
      )
    } finally {
      setPaymentLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] text-[#312E81]">
      <AttendeeHeader />

      <main className="flex-1 pt-24">
        <section className="px-[5%] py-10">
          <div className="mx-auto max-w-5xl">
            <Link
              to="/attendee/concerts"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B7280] transition hover:text-[#7C3AED]"
            >
              <span>←</span>
              Back to Browse Concerts
            </Link>

            <div className="mt-6">
              {loading ? (
                <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
                  Loading checkout...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-6 py-10 text-center text-sm font-semibold text-[#B91C1C]">
                  {error}
                </div>
              ) : !concert ? (
                <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
                  Concert not found.
                </div>
              ) : (
                <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                  <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_30px_rgba(49,46,129,0.08)]">
                    <div className="flex flex-col gap-6 md:flex-row">
                      <div className="h-44 w-full overflow-hidden rounded-xl bg-[#F3F4F6] md:w-56">
                        {coverImage ? (
                          <img
                            src={coverImage}
                            alt={concert?.title || 'Concert cover'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl text-[#9CA3AF]">
                            🎹
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h1 className="text-2xl font-black text-[#2C2E83]">
                          {concert?.title || 'Untitled Concert'}
                        </h1>
                        <p className="mt-2 text-sm font-semibold text-[#6B7280]">
                          {concert?.main_artist || 'Artist lineup TBD'}
                        </p>
                        <div className="mt-4 space-y-2 text-sm font-semibold text-[#6B7280]">
                          <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span>{formatDateTime(concert?.date_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span>{concert?.venue || 'Venue TBD'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-[#9CA3AF]">
                        Select Ticket Type
                      </h2>
                      <div className="mt-3 grid gap-3">
                        {ticketCategories.length > 0 ? (
                          ticketCategories.map((ticket, index) => {
                            const isSelected = selectedTicket === ticket
                            const remaining = Number(ticket?.remaining ?? ticket?.quantity ?? 0)
                            const soldOut = remaining <= 0
                            return (
                              <button
                                key={`${ticket?.name || 'ticket'}-${index}`}
                                type="button"
                                onClick={() => {
                                  setSelectedTicket(ticket)
                                  setPaymentError('')
                                }}
                                disabled={soldOut}
                                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                  isSelected
                                    ? 'border-[#7C3AED] bg-[#F3F0FF] text-[#2C2E83]'
                                    : soldOut
                                      ? 'cursor-not-allowed border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF]'
                                      : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#CBD5F5]'
                                }`}
                              >
                                <span>
                                  {ticket?.name || 'General'}
                                  <span className="ml-2 text-xs font-medium text-[#9CA3AF]">
                                    {soldOut ? 'Sold out' : `${remaining} left`}
                                  </span>
                                </span>
                                <span className={soldOut ? 'text-[#9CA3AF]' : 'text-[#2C2E83]'}>
                                  Rs {Number(ticket?.price || 0)}
                                </span>
                              </button>
                            )
                          })
                        ) : (
                          <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#9CA3AF]">
                            Ticket pricing will be available soon.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-[#9CA3AF]">
                        Quantity
                      </h2>
                      <div className="mt-3 flex w-36 items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-[#6B7280]">
                        <button
                          type="button"
                          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                          className="text-lg text-[#7C3AED]"
                          disabled={selectedTicketRemaining <= 0}
                        >
                          -
                        </button>
                        <span className="text-[#2C2E83]">{quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity((prev) =>
                              Math.min(selectedTicketRemaining || 1, prev + 1)
                            )
                          }
                          className="text-lg text-[#7C3AED]"
                          disabled={selectedTicketRemaining <= 0 || quantity >= selectedTicketRemaining}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <aside className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_30px_rgba(49,46,129,0.08)]">
                    <h2 className="text-base font-black text-[#2C2E83]">Order Summary</h2>
                    <div className="mt-4 space-y-3 text-sm font-semibold text-[#6B7280]">
                      <div className="flex items-center justify-between">
                        <span>Ticket</span>
                        <span>{selectedTicket?.name || 'TBD'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Unit Price</span>
                        <span>Rs {unitPrice || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Quantity</span>
                        <span>{quantity}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Remaining</span>
                        <span>{Math.max(0, selectedTicketRemaining)}</span>
                      </div>
                    </div>
                    <div className="my-5 h-px bg-[#E5E7EB]" />
                    <div className="flex items-center justify-between text-base font-black text-[#2C2E83]">
                      <span>Total</span>
                      <span>Rs {totalPrice || 0}</span>
                    </div>
                    <div className="mt-6">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-[#9CA3AF]">
                        Payment Method
                      </h3>
                      <div className="mt-3 grid gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('khalti')
                            setPaymentError('')
                          }}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                            paymentMethod === 'khalti'
                              ? 'border-[#7C3AED] bg-[#F3F0FF] text-[#2C2E83]'
                            : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#CBD5F5]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED] text-white">
                              K
                            </span>
                            Khalti
                          </span>
                          <span className="text-xs uppercase tracking-wide text-[#9CA3AF]">Digital Wallet</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('esewa')
                            setPaymentError('')
                          }}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                            paymentMethod === 'esewa'
                              ? 'border-[#10B981] bg-[#ECFDF3] text-[#065F46]'
                            : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1FAE5]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#10B981] text-white">
                              eS
                            </span>
                            eSewa
                          </span>
                          <span className="text-xs uppercase tracking-wide text-[#6EE7B7]">Digital Wallet</span>
                        </button>
                      </div>
                    </div>
                    <button
                      className={`mt-6 w-full rounded-lg px-4 py-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(124,58,237,0.3)] transition ${
                        paymentMethod === 'esewa'
                          ? 'bg-[#10B981] shadow-[0_10px_20px_rgba(16,185,129,0.25)] hover:bg-[#059669]'
                          : 'bg-[#7C3AED] hover:bg-[#5B21B6]'
                      }`}
                      type="button"
                      onClick={handleProceedToPayment}
                      disabled={
                        paymentLoading ||
                        !selectedTicket ||
                        !paymentMethod ||
                        selectedTicketRemaining < 1 ||
                        quantity > selectedTicketRemaining
                      }
                    >
                      {paymentLoading
                        ? paymentMethod
                          ? `Redirecting to ${paymentMethod === 'esewa' ? 'eSewa' : 'Khalti'}...`
                          : 'Processing...'
                        : paymentMethod
                          ? `Pay with ${paymentMethod === 'esewa' ? 'eSewa' : 'Khalti'}`
                          : 'Select payment method'}
                    </button>
                    {paymentError ? (
                      <p className="mt-3 text-xs font-semibold text-[#B91C1C]">{paymentError}</p>
                    ) : null}
                  </aside>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <AttendeeFooter />
    </div>
  )
}

export default Checkout
