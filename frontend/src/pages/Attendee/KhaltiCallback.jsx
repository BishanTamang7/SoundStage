import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

const KhaltiCallback = () => {
  const { tokens } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lookupData, setLookupData] = useState(null)

  const pidx = searchParams.get('pidx') || ''
  const redirectStatus = searchParams.get('status') || ''
  const normalizedRedirectStatus = redirectStatus.trim().toLowerCase()
  const isCanceledRedirect =
    normalizedRedirectStatus.includes('cancel') || normalizedRedirectStatus.includes('abandon')

  useEffect(() => {
    let isActive = true

    const verifyPayment = async () => {
      if (isCanceledRedirect) {
        navigate('/attendee/concerts', { replace: true })
        return
      }

      if (!pidx) {
        if (isActive) {
          setError('Missing payment reference (pidx).')
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError('')
        const response = await api.khaltiLookup(tokens?.access, { pidx })
        if (isActive) {
          setLookupData(response?.data || null)
        }
      } catch (err) {
        if (isActive) {
          setError(err?.message || 'Payment verification failed.')
        }
      } finally {
        if (isActive) setLoading(false)
      }
    }

    verifyPayment()

    return () => {
      isActive = false
    }
  }, [isCanceledRedirect, navigate, pidx, tokens?.access])

  useEffect(() => {
    const normalizedLookupStatus = String(lookupData?.status || '')
      .trim()
      .toLowerCase()
    if (normalizedLookupStatus.includes('cancel') || normalizedLookupStatus.includes('abandon')) {
      navigate('/attendee/concerts', { replace: true })
    }
  }, [lookupData?.status, navigate])

  const statusText = lookupData?.status || redirectStatus || 'Unknown'
  const isSuccess = statusText === 'Completed'

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-[5%] py-14 text-[#312E81]">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_12px_30px_rgba(49,46,129,0.08)]">
        <h1 className="text-2xl font-black text-[#2C2E83]">Khalti Payment Status</h1>

        {loading ? (
          <p className="mt-4 text-sm font-semibold text-[#6B7280]">Verifying payment with Khalti...</p>
        ) : error ? (
          <p className="mt-4 text-sm font-semibold text-[#B91C1C]">{error}</p>
        ) : (
          <div className="mt-5 space-y-3 text-sm font-semibold text-[#374151]">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className={isSuccess ? 'text-[#15803D]' : 'text-[#B45309]'}>{statusText}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>PIDX</span>
              <span className="font-mono text-xs">{lookupData?.pidx || pidx}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Amount (paisa)</span>
              <span>{lookupData?.total_amount ?? '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Transaction ID</span>
              <span className="font-mono text-xs">{lookupData?.transaction_id || '-'}</span>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/attendee/tickets"
            className="rounded-lg bg-[#7C3AED] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5B21B6]"
          >
            Go to My Tickets
          </Link>
          <Link
            to="/attendee/concerts"
            className="rounded-lg border border-[#D1D5DB] px-5 py-2.5 text-sm font-bold text-[#374151] transition hover:bg-[#F9FAFB]"
          >
            Back to Concerts
          </Link>
        </div>
      </div>
    </div>
  )
}

export default KhaltiCallback
