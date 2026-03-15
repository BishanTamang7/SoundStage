import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import AttendeeHeader from '../../components/AttendeeHeader'
import { api } from '../../services/api'

const About = () => {
  const { isAuthenticated, role } = useAuth()
  const [weeklyConcertCount, setWeeklyConcertCount] = useState(null)
  const homeLink = isAuthenticated ? (role === 'organizer' ? '/organizer' : '/attendee') : '/'
  const showAttendeeHeader = isAuthenticated && role === 'attendee'
  const attendeeCtas = showAttendeeHeader

  useEffect(() => {
    let isActive = true

    const loadWeeklyConcertCount = async () => {
      try {
        const data = await api.listConcerts()
        const list = data?.data?.concerts || data?.concerts || []
        const concerts = Array.isArray(list) ? list : []
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const day = startOfToday.getDay()
        const diffToMonday = (day + 6) % 7
        const startOfWeek = new Date(startOfToday)
        startOfWeek.setDate(startOfWeek.getDate() - diffToMonday)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)

        const count = concerts.filter((concert) => {
          const createdAt = concert?.created_at || concert?.createdAt
          if (!createdAt) return false
          const createdDate = new Date(createdAt)
          if (Number.isNaN(createdDate.getTime())) return false
          return createdDate >= startOfWeek && createdDate <= endOfWeek
        }).length

        if (isActive) setWeeklyConcertCount(count)
      } catch {
        if (isActive) setWeeklyConcertCount(null)
      }
    }

    loadWeeklyConcertCount()

    return () => {
      isActive = false
    }
  }, [])

  const weeklyConcertHeadline = useMemo(() => {
    if (weeklyConcertCount == null) return 'Live concert updates'
    return `${weeklyConcertCount.toLocaleString('en-US')} concert${weeklyConcertCount === 1 ? '' : 's'} added`
  }, [weeklyConcertCount])

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F8F9FA] text-[#312E81]">
      {showAttendeeHeader ? (
        <AttendeeHeader />
      ) : (
        <nav className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-[rgba(49,46,129,0.15)] bg-[rgba(248,249,250,0.95)] px-[5%] backdrop-blur">
          <Link className="font-['Playfair_Display'] text-3xl font-black text-[#7C3AED]" to={homeLink}>
            SoundStage
          </Link>
          <div className="flex items-center gap-10 text-[0.95rem] font-medium text-[#312E81] max-[768px]:hidden">
            {isAuthenticated ? (
              <>
                <Link className="hover:text-[#7C3AED]" to={homeLink}>
                  Dashboard
                </Link>
                <Link
                  className="rounded-full bg-[#7C3AED] px-7 py-3 font-semibold text-white shadow-[0_12px_20px_rgba(124,58,237,0.25)] transition hover:-translate-y-0.5"
                  to={homeLink}
                >
                  Go to Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link className="hover:text-[#7C3AED]" to="/signin">
                  Sign in
                </Link>
                <Link
                  className="rounded-full bg-[#7C3AED] px-7 py-3 font-semibold text-white shadow-[0_12px_20px_rgba(124,58,237,0.25)] transition hover:-translate-y-0.5"
                  to="/register"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      )}

      <main className="flex flex-1 pt-20">
        <section className="relative flex flex-1 items-center overflow-hidden bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] px-[5%] py-8 text-[#312E81]">
          <div className="absolute inset-0">
            <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-[#7C3AED]/20 blur-[80px]" />
            <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-[#60A5FA]/20 blur-[120px]" />
            <div className="absolute bottom-0 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#A78BFA]/20 blur-[90px]" />
          </div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-[#C4B5FD]">About SoundStage</p>
              <h1 className="mt-4 font-['Playfair_Display'] text-4xl font-black sm:text-5xl lg:text-[3.4rem]">
                Live music, simplified for real fans.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#4B5563] sm:text-lg">
                SoundStage brings verified venues, transparent pricing, and instant QR tickets into one smooth flow so
                discovering a show feels as good as being there.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-[#4F46E5]">
                <span className="rounded-full border border-[#C7D2FE] bg-white/75 px-4 py-2">Verified venues</span>
                <span className="rounded-full border border-[#C7D2FE] bg-white/75 px-4 py-2">Secure checkout</span>
                <span className="rounded-full border border-[#C7D2FE] bg-white/75 px-4 py-2">Instant QR tickets</span>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  className="inline-flex items-center justify-center rounded-full bg-[#7C3AED] px-8 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#6D28D9] hover:shadow-[0_8px_20px_rgba(124,58,237,0.28)]"
                  to={attendeeCtas ? '/attendee/concerts' : '/signin'}
                >
                  Explore Concerts
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-full border border-[#C7D2FE] bg-white/65 px-8 py-3 text-sm font-semibold text-[#312E81] transition hover:bg-white"
                  to={attendeeCtas ? '/attendee/tickets' : '/register'}
                >
                  View My Tickets
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_24px_50px_rgba(99,102,241,0.12)] backdrop-blur">
                <p className="text-xs uppercase tracking-[0.35em] text-[#7C3AED]">This week</p>
                <h2 className="mt-2 text-2xl font-bold">{weeklyConcertHeadline}</h2>
                <p className="mt-2 text-sm text-[#6B7280]">
                  {weeklyConcertCount == null
                    ? 'Fresh lineups and new dates are loading.'
                    : 'Fresh lineups and new dates from your favorite cities.'}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_40px_rgba(99,102,241,0.1)] backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#EC4899]">How it works</p>
                  <div className="mt-4 grid gap-3 text-sm text-[#4B5563]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">1</span>
                      <span>Browse shows by city, date, and genre.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">2</span>
                      <span>Reserve tickets with secure checkout.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">3</span>
                      <span>Walk in with your QR code ready.</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#7C3AED]/20 bg-linear-to-br from-[#7C3AED] to-[#4F46E5] p-5 text-white shadow-[0_22px_50px_rgba(79,70,229,0.22)]">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/75">Need help fast?</p>
                  <h3 className="mt-3 text-2xl font-bold">Support that responds quickly</h3>
                  <p className="mt-3 text-sm text-white/90">
                    Our attendee team helps with ticket access, payment issues, and event questions within hours.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white">
                    <span className="rounded-full bg-white/15 px-3 py-2">support@soundstage.com</span>
                    <span className="rounded-full bg-white/15 px-3 py-2">Live chat 10am-8pm</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { title: 'Verified venues', body: 'We feature organizers and venues with trusted track records.' },
                  { title: 'Transparent pricing', body: 'You see the total before you pay. No hidden surprises.' },
                  { title: 'Fan-first updates', body: 'Community feedback shapes the shows and venues we highlight.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_14px_30px_rgba(99,102,241,0.08)] backdrop-blur">
                    <h3 className="text-base font-semibold text-[#312E81]">{item.title}</h3>
                    <p className="mt-2 text-sm text-[#6B7280]">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#312E81] px-[5%] py-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-6 text-sm max-[768px]:flex-col max-[768px]:text-center">
          <div className="flex gap-8 max-[768px]:justify-center">
            <Link className="text-[rgba(255,255,255,0.75)] hover:text-white" to="/about">
              About
            </Link>
            <Link className="text-[rgba(255,255,255,0.75)] hover:text-white" to="/privacy">
              Privacy
            </Link>
            <Link className="text-[rgba(255,255,255,0.75)] hover:text-white" to="/terms">
              Terms
            </Link>
          </div>
          <div>© 2026 SoundStage. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

export default About
