import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AttendeeFooter from '../../components/AttendeeFooter'
import AttendeeHeader from '../../components/AttendeeHeader'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

const EsewaCallback = () => {
  const { tokens } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmData, setConfirmData] = useState(null)

  const dataParam = searchParams.get('data') || ''
  const transactionUuid = searchParams.get('transaction_uuid') || ''
  const redirectStatus = searchParams.get('status') || ''

  useEffect(() => {
    let isActive = true

    const verifyPayment = async () => {
      if (!dataParam && !transactionUuid) {
        if (isActive) {
          setError('Missing payment reference from eSewa.')
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError('')
        const response = await api.esewaConfirm(tokens?.access, {
          data: dataParam,
          transaction_uuid: transactionUuid,
        })
        if (isActive) {
          setConfirmData(response?.data || null)
        }
      } catch (err) {
        if (isActive) {
          setError(err?.message || 'Payment confirmation failed.')
        }
      } finally {
        if (isActive) setLoading(false)
      }
    }

    verifyPayment()

    return () => {
      isActive = false
    }
  }, [dataParam, transactionUuid, tokens?.access])

  useEffect(() => {
    const normalized = String(confirmData?.status || redirectStatus || '')
      .trim()
      .toLowerCase()

    if (normalized === 'complete' || normalized === 'completed') {
      navigate('/attendee/tickets', { replace: true })
      return
    }

    if (normalized.includes('cancel') || normalized === 'failure') {
      navigate('/attendee/concerts', { replace: true })
    }
  }, [confirmData?.status, navigate, redirectStatus])

  const statusText = confirmData?.status || redirectStatus || (error ? 'Failed' : 'Pending')
  const referenceText = confirmData?.transaction_uuid || transactionUuid || 'N/A'

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-linear-to-br from-[#ECFDF3] via-[#F0FDF4] to-[#E0F2F1] text-[#064E3B]">
        <AttendeeHeader />
        <main className="flex-1 px-[5%] pb-12 pt-28">
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#D1FAE5] bg-white p-8 shadow-[0_12px_30px_rgba(16,185,129,0.12)]">
            <h1 className="text-2xl font-black text-[#065F46]">Confirming eSewa Payment</h1>
            <p className="mt-4 text-sm font-semibold text-[#047857]">
              Verifying payment and issuing your tickets...
            </p>
          </div>
        </main>
        <AttendeeFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-[#ECFDF3] via-[#F0FDF4] to-[#E0F2F1] text-[#064E3B]">
      <AttendeeHeader />
      <main className="flex-1 px-[5%] pb-12 pt-28">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#D1FAE5] bg-white p-8 shadow-[0_12px_30px_rgba(16,185,129,0.12)]">
          <h1 className="text-2xl font-black text-[#065F46]">eSewa Payment Status</h1>

          {error ? (
            <p className="mt-4 text-sm font-semibold text-[#B91C1C]">{error}</p>
          ) : (
            <div className="mt-5 space-y-3 text-sm font-semibold text-[#065F46]">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="text-[#047857]">{statusText}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Transaction UUID</span>
                <span className="font-mono text-xs text-[#0F766E]">{referenceText}</span>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/attendee/concerts"
              className="rounded-lg border border-[#D1FAE5] px-5 py-2.5 text-sm font-bold text-[#065F46] transition hover:bg-[#ECFDF3]"
            >
              Back to Concerts
            </Link>
            <Link
              to="/attendee/tickets"
              className="rounded-lg bg-[#10B981] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(16,185,129,0.25)] transition hover:bg-[#059669]"
            >
              View Tickets
            </Link>
          </div>
        </div>
      </main>
      <AttendeeFooter />
    </div>
  )
}

export default EsewaCallback
