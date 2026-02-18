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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f6f6] px-6 py-10 text-[#101010]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(0,0,0,0.08)_0%,transparent_45%),radial-gradient(circle_at_90%_85%,rgba(0,0,0,0.08)_0%,transparent_45%)]" />
      <main className="relative z-10 w-full max-w-xl rounded-3xl border border-black/10 bg-white/95 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.12)] backdrop-blur-sm md:p-10">
        <p className="inline-flex rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-black/70">
          SoundStage Auth
        </p>
        <h1 className="mt-5 font-['Playfair_Display'] text-4xl font-black leading-tight md:text-5xl">
          Email OTP Verification
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-black/65">{message}</p>

        <form className="mt-8 flex flex-col gap-3" onSubmit={handleVerify}>
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-black/60" htmlFor="verification-email">
            Email
          </label>
          <input
            id="verification-email"
            type="email"
            className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-black/40"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-black/60" htmlFor="verification-otp">
            6-digit OTP
          </label>
          <input
            id="verification-otp"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm tracking-[0.32em] outline-none transition focus:border-black/40"
            placeholder="000000"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            required
          />

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !email.trim()}
              className="rounded-xl border border-black/20 px-5 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="text-sm font-semibold text-black/70 underline-offset-3 hover:underline"
            >
              Back to login
            </button>
          </div>
        </form>

        {status === 'loading' ? (
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-black/50">Processing...</p>
        ) : null}
      </main>
    </div>
  )
}

export default VerifyEmail
