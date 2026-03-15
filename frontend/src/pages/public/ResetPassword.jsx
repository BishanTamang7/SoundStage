import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPasswordConfirm } = useAuth()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''
  const [formData, setFormData] = useState({ new_password: '', confirm_password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!uid || !token) {
      setError('Invalid password reset link.')
      return
    }

    setSubmitting(true)
    try {
      const response = await resetPasswordConfirm({
        uid,
        token,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      })
      setMessage(response?.message || 'Password reset successfully. You can log in now.')
      setTimeout(() => {
        const suffix = email ? `?email=${encodeURIComponent(email)}` : ''
        navigate(`/signin${suffix}`)
      }, 900)
    } catch (submitError) {
      setError(submitError?.message || 'Failed to reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] px-6 py-10 text-[#312E81]">
      <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-[#7C3AED]/20 blur-[80px]" />
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-[#60A5FA]/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#A78BFA]/20 blur-[90px]" />
      <main className="relative z-10 w-full max-w-xl rounded-3xl border border-[rgba(49,46,129,0.18)] bg-white p-6 shadow-[0_20px_45px_rgba(49,46,129,0.08)] md:p-8">
        <div className="text-center">
          <h1 className="font-['Playfair_Display'] text-[2rem] font-black leading-tight">
            Reset Password
          </h1>
          <p className="mt-3 text-[0.98rem] text-[#4B5563]">
            Enter your new password to finish resetting your account.
          </p>
        </div>

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold">New password</label>
            <input
              className="rounded-[14px] border border-[rgba(49,46,129,0.22)] px-4 py-3 text-base outline-none focus:border-[rgba(124,58,237,0.7)] focus:ring-4 focus:ring-[rgba(124,58,237,0.12)]"
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold">Confirm password</label>
            <input
              className="rounded-[14px] border border-[rgba(49,46,129,0.22)] px-4 py-3 text-base outline-none focus:border-[rgba(124,58,237,0.7)] focus:ring-4 focus:ring-[rgba(124,58,237,0.12)]"
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
            />
          </div>

          {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

          <button
            className="mt-2 rounded-full bg-[#7C3AED] py-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <p className="mt-6 text-center text-[0.95rem] text-[#4B5563]">
          <a className="font-bold text-[#4F46E5]" href="/signin">
            Back to login
          </a>
        </p>
      </main>
    </div>
  )
}

export default ResetPassword
