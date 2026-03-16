import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AttendeeFooter from '../../components/AttendeeFooter'
import AttendeeHeader from '../../components/AttendeeHeader'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

const KhaltiCallback = () => {
  const { tokens } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmData, setConfirmData] = useState(null)

  const pidx = searchParams.get('pidx') || ''
  const redirectStatus = searchParams.get('status') || ''
  const normalizedRedirectStatus = redirectStatus.trim().toLowerCase()
  const isCanceledRedirect =
    normalizedRedirectStatus.includes('cancel') || normalizedRedirectStatus.includes('abandon')

  useEffect(() => {
    let isActive = true

    const verifyPayment = async () => {
      if (isCanceledRedirect && !pidx) {
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
        const response = await api.khaltiConfirm(tokens?.access, { pidx })
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
  }, [isCanceledRedirect, navigate, pidx, tokens?.access])

  useEffect(() => {
    const normalizedLookupStatus = String(confirmData?.status || '')
      .trim()
      .toLowerCase()
    if (normalizedLookupStatus.includes('cancel') || normalizedLookupStatus.includes('abandon')) {
      navigate('/attendee/concerts', { replace: true })
    }
  }, [confirmData?.status, navigate])

  useEffect(() => {
    if (loading || error) return
    if (String(confirmData?.status || '').trim() === 'Completed') {
      navigate('/attendee/tickets', { replace: true })
    }
  }, [confirmData?.status, error, loading, navigate])

  const statusText = confirmData?.status || redirectStatus || 'Unknown'

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] text-[#312E81]">
        <AttendeeHeader />
        <main className="flex-1 px-[5%] pb-12 pt-28">
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_12px_30px_rgba(49,46,129,0.08)]">
            <h1 className="text-2xl font-black text-[#2C2E83]">Confirming Payment</h1>
            <p className="mt-4 text-sm font-semibold text-[#6B7280]">Confirming payment and issuing tickets...</p>
          </div>
        </main>
        <AttendeeFooter />
      </div>
    )
  }

  if (!error && statusText === 'Completed') {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] text-[#312E81]">
      <AttendeeHeader />
      <main className="flex-1 px-[5%] pb-12 pt-28">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_12px_30px_rgba(49,46,129,0.08)]">
          <h1 className="text-2xl font-black text-[#2C2E83]">Khalti Payment Status</h1>

          {error ? (
            <p className="mt-4 text-sm font-semibold text-[#B91C1C]">{error}</p>
          ) : (
            <div className="mt-5 space-y-3 text-sm font-semibold text-[#374151]">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="text-[#B45309]">{statusText}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>PIDX</span>
                <span className="font-mono text-xs">{pidx}</span>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/attendee/concerts"
              className="rounded-lg border border-[#D1D5DB] px-5 py-2.5 text-sm font-bold text-[#374151] transition hover:bg-[#F9FAFB]"
            >
              Back to Concerts
            </Link>
          </div>
        </div>
      </main>
      <AttendeeFooter />
    </div>
  )
}

export default KhaltiCallback
