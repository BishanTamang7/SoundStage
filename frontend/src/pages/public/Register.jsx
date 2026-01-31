import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    role: 'organizer',
    username: '',
    email: '',
    password: '',
    confirm: '',
    agree: false,
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (formData.password !== formData.confirm) {
      setError('Passwords do not match.')
      return
    }

    if (!formData.agree) {
      setError('Please accept the Terms and Privacy Policy.')
      return
    }

    setSubmitting(true)
    try {
      await register({
        role: formData.role.toUpperCase(),
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm,
      })
      navigate('/signin')
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F9FA] text-[#312E81]">
      <div className="pointer-events-none absolute left-[-20%] top-[-40%] h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18)_0%,transparent_70%)]" />

      <main className="relative z-10 grid w-full max-w-[1100px] grid-cols-1 items-center gap-10 px-8 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="text-center lg:text-left">
          <h1 className="mb-4 font-['Playfair_Display'] text-[2.4rem] font-black leading-[1.12] md:text-[3rem] lg:text-[3.3rem]">
            Create your <span className="text-[#7C3AED]">SoundStage</span> account
          </h1>
          <p className="mx-auto max-w-[540px] text-[1.1rem] leading-[1.7] text-[#4B5563] lg:mx-0">
            Register to book concerts, manage tickets, and use secure QR entry. This platform is
            built for audiences and organizers in one digital system.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
            <span className="rounded-full border border-[rgba(196,181,253,0.7)] bg-[rgba(196,181,253,0.35)] px-4 py-2 text-sm font-semibold">
              ✅ Easy Signup
            </span>
            <span className="rounded-full border border-[rgba(196,181,253,0.7)] bg-[rgba(196,181,253,0.35)] px-4 py-2 text-sm font-semibold">
              🎫 Ticketing
            </span>
            <span className="rounded-full border border-[rgba(196,181,253,0.7)] bg-[rgba(196,181,253,0.35)] px-4 py-2 text-sm font-semibold">
              📅 Organizer Tools
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

          <h2 className="mt-2 text-2xl font-bold">Register</h2>
          <p className="mb-6 text-[0.95rem] text-[#4B5563]">Fill the details to create a new account</p>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold" htmlFor="role">
                Role
              </label>
              <select
                className="rounded-[14px] border border-[rgba(49,46,129,0.22)] bg-white px-4 py-3 text-base text-[#312E81] outline-none focus:border-[rgba(124,58,237,0.7)] focus:ring-4 focus:ring-[rgba(124,58,237,0.12)]"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="organizer">Organizer</option>
                <option value="attendee">Attendee</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold" htmlFor="username">
                Username
              </label>
              <input
                className="rounded-[14px] border border-[rgba(49,46,129,0.22)] px-4 py-3 text-base outline-none focus:border-[rgba(124,58,237,0.7)] focus:ring-4 focus:ring-[rgba(124,58,237,0.12)]"
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold" htmlFor="email">
                Email
              </label>
              <input
                className="rounded-[14px] border border-[rgba(49,46,129,0.22)] px-4 py-3 text-base outline-none focus:border-[rgba(124,58,237,0.7)] focus:ring-4 focus:ring-[rgba(124,58,237,0.12)]"
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-[14px] border border-[rgba(49,46,129,0.22)] px-4 py-3 pr-14 text-base outline-none focus:border-[rgba(124,58,237,0.7)] focus:ring-4 focus:ring-[rgba(124,58,237,0.12)]"
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password"
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

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold" htmlFor="confirm">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-[14px] border border-[rgba(49,46,129,0.22)] px-4 py-3 pr-14 text-base outline-none focus:border-[rgba(124,58,237,0.7)] focus:ring-4 focus:ring-[rgba(124,58,237,0.12)]"
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={formData.confirm}
                  onChange={handleChange}
                  required
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#4F46E5]"
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 text-[0.92rem] text-[#4B5563]">
              <input
                className="mt-1 h-4 w-4"
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                required
              />
              <span>I agree to the Terms and Privacy Policy.</span>
            </label>

            {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

            <button
              className="mt-1 rounded-full bg-[#7C3AED] py-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>

            <p className="text-center text-[0.95rem] text-[#4B5563]">
              Already have an account?{' '}
              <a className="font-bold text-[#4F46E5]" href="/signin">
                Login
              </a>
            </p>
          </form>
        </section>
      </main>
    </div>
  )
}

export default Register
