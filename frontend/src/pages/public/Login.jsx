import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROLES, normalizeRole } from '../../utils/roles'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const profile = await login({
        email: formData.email,
        password: formData.password,
      })
      const role = normalizeRole(profile?.role)
      if (role === ROLES.ORGANIZER) {
        navigate('/organizer')
      } else if (role === ROLES.ATTENDEE) {
        navigate('/attendee')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F9FA] text-[#312E81]">
      <div className="pointer-events-none absolute right-[-20%] top-[-40%] h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18)_0%,transparent_70%)]" />

      <main className="relative z-10 grid w-full max-w-[1100px] grid-cols-1 items-center gap-10 px-8 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="text-center lg:text-left">
          <h1 className="mb-4 font-['Playfair_Display'] text-[2.4rem] font-black leading-[1.12] md:text-[3rem] lg:text-[3.5rem]">
            Welcome back to <span className="text-[#7C3AED]">SoundStage</span>
          </h1>
          <p className="mx-auto max-w-[520px] text-[1.1rem] leading-[1.7] text-[#4B5563] lg:mx-0">
            Sign in to manage concerts, handle bookings, and generate secure QR entry tickets using
            the digital concert management system.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
            <span className="rounded-full border border-[rgba(196,181,253,0.7)] bg-[rgba(196,181,253,0.35)] px-4 py-2 text-sm font-semibold">
              🎫 Ticketing
            </span>
            <span className="rounded-full border border-[rgba(196,181,253,0.7)] bg-[rgba(196,181,253,0.35)] px-4 py-2 text-sm font-semibold">
              📅 Events
            </span>
            <span className="rounded-full border border-[rgba(196,181,253,0.7)] bg-[rgba(196,181,253,0.35)] px-4 py-2 text-sm font-semibold">
              🔐 Secure
            </span>
            <span className="rounded-full border border-[rgba(196,181,253,0.7)] bg-[rgba(196,181,253,0.35)] px-4 py-2 text-sm font-semibold">
              📲 QR Entry
            </span>
          </div>
        </section>

        <section className="relative rounded-[24px] border border-[rgba(49,46,129,0.18)] bg-white p-6 shadow-[0_20px_45px_rgba(49,46,129,0.08)] md:p-8">
          <a
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(196,181,253,0.7)] bg-[rgba(196,181,253,0.35)] text-lg font-bold text-[#312E81]"
            href="/"
          >
            ✕
          </a>

          <div className="text-center">
            <h2 className="mt-2 text-2xl font-bold">Login</h2>
            <p className="mb-6 text-[0.95rem] text-[#4B5563]">
              Enter your credentials to continue
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Email</label>
              <input
                className="rounded-[14px] border border-[rgba(49,46,129,0.22)] px-4 py-3 text-base outline-none focus:border-[rgba(124,58,237,0.7)] focus:ring-4 focus:ring-[rgba(124,58,237,0.12)]"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Password</label>
              <div className="relative">
                <input
                  className="w-full rounded-[14px] border border-[rgba(49,46,129,0.22)] px-4 py-3 pr-14 text-base outline-none focus:border-[rgba(124,58,237,0.7)] focus:ring-4 focus:ring-[rgba(124,58,237,0.12)]"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#4F46E5]"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[0.92rem] text-[#4B5563]">
              <label className="flex items-center gap-2">
                <input
                  className="h-4 w-4"
                  type="checkbox"
                />
                Remember me
              </label>
              <a className="font-bold text-[#4F46E5]" href="#">
                Forgot password?
              </a>
            </div>

            {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

            <button
              className="mt-2 rounded-full bg-[#7C3AED] py-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Login'}
            </button>

            <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
              <span className="h-px flex-1 bg-[#E5E7EB]" />
              <span>or</span>
              <span className="h-px flex-1 bg-[#E5E7EB]" />
            </div>

            <p className="text-center text-[0.95rem] text-[#4B5563]">
              Don’t have an account?{' '}
              <a className="font-bold text-[#4F46E5]" href="/register">
                Register
              </a>
            </p>
          </form>
        </section>
      </main>
    </div>
  )
}

export default Login
