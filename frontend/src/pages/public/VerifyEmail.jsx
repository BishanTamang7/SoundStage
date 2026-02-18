import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const RESEND_COOLDOWN_SECONDS = 60

const VerifyEmail = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { verifyEmailOtp, resendEmailOtp } = useAuth()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('Enter the 6-digit OTP sent to your email.')
  const [status, setStatus] = useState('idle')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const interval = setInterval(() => {
      setCooldown((previous) => (previous <= 1 ? 0 : previous - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldown])

  const handleVerify = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus('loading')
    setMessage('Verifying OTP...')
    try {
      const response = await verifyEmailOtp({ email: email.trim(), otp: otp.trim() })
      setStatus('success')
      setMessage(response?.message || 'Email verified successfully.')
      setTimeout(() => {
        navigate('/signin?verified=1&email=' + encodeURIComponent(email.trim()))
      }, 700)
    } catch (error) {
      setStatus('error')
      setMessage(error?.message || 'Invalid OTP.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setResending(true)
    setStatus('loading')
    setMessage('Sending OTP...')
    try {
      const response = await resendEmailOtp({ email: email.trim() })
      setStatus('idle')
      setMessage(response?.message || 'If your email is valid, we sent an OTP.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setOtp('')
    } catch (error) {
      setStatus('error')
      setMessage(error?.message || 'Failed to resend OTP.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F9FA] px-6 py-10 text-[#312E81]">
      <main className="relative z-10 w-full max-w-2xl rounded-3xl border border-[rgba(49,46,129,0.18)] bg-white p-6 md:p-8">
        <div className="text-center">
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">Verify Email</h1>
          <p className="mt-2 text-[0.95rem] text-[#4B5563]">{message}</p>
        </div>

        <form className="mx-auto mt-8 flex w-full max-w-lg flex-col gap-4" onSubmit={handleVerify}>
          <label className="text-sm font-semibold" htmlFor="verification-email">
            Email
          </label>
          <input
            id="verification-email"
            type="email"
            className="rounded-[14px] border border-[rgba(49,46,129,0.22)] px-4 py-3 text-base outline-none focus:border-[rgba(124,58,237,0.7)] focus:ring-4 focus:ring-[rgba(124,58,237,0.12)]"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label className="text-sm font-semibold" htmlFor="verification-otp">
            6-digit OTP
          </label>
          <input
            id="verification-otp"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className="rounded-[14px] border border-[rgba(49,46,129,0.22)] px-4 py-3 text-base tracking-[0.32em] outline-none focus:border-[rgba(124,58,237,0.7)] focus:ring-4 focus:ring-[rgba(124,58,237,0.12)]"
            placeholder="000000"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            required
          />

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="rounded-full bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !email.trim()}
              className="rounded-full border border-[rgba(124,58,237,0.35)] bg-[rgba(124,58,237,0.08)] px-5 py-3 text-sm font-semibold text-[#5B21B6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="text-sm font-semibold text-[#4F46E5] underline-offset-3 hover:underline"
            >
              Back to login
            </button>
          </div>
        </form>

        {status === 'loading' ? (
          <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#6D28D9]">
            Processing...
          </p>
        ) : null}
      </main>
    </div>
  )
}

export default VerifyEmail
