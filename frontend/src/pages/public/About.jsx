import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import AttendeeHeader from '../../components/AttendeeHeader'

const About = () => {
  const { isAuthenticated, role } = useAuth()
  const homeLink = isAuthenticated ? (role === 'organizer' ? '/organizer' : '/attendee') : '/'
  const showAttendeeHeader = isAuthenticated && role === 'attendee'

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

      <main className="flex-1 pt-20">
        <section className="relative overflow-hidden bg-[#0F172A] px-[5%] py-16 text-white">
          <div className="absolute inset-0">
            <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-[#7C3AED]/60 blur-[80px]" />
            <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-[#38BDF8]/40 blur-[120px]" />
            <div className="absolute bottom-0 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#F43F5E]/30 blur-[90px]" />
          </div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#C4B5FD]">For Attendees</p>
              <h1 className="mt-4 font-['Playfair_Display'] text-4xl font-black sm:text-5xl lg:text-6xl">
                We make live music feel personal again.
              </h1>
              <p className="mt-5 text-lg text-white/80">
                SoundStage connects you to trusted venues, transparent pricing, and the fastest path from discovery to
                standing in front of the stage.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#0F172A] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.3)]"
                  to="/signin"
                >
                  Explore Concerts
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-full border border-white/50 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  to="/register"
                >
                  Create account
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_60px_rgba(15,23,42,0.25)] backdrop-blur">
              <div className="grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#A5B4FC]">This week</p>
                  <h2 className="mt-2 text-2xl font-bold">38 concerts added</h2>
                  <p className="mt-2 text-sm text-white/70">Fresh lineups and new dates from your favorite cities.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#FDA4AF]">Instant access</p>
                  <h3 className="mt-2 text-2xl font-bold">Ticket delivery in seconds</h3>
                  <p className="mt-2 text-sm text-white/70">Secure QR tickets that live in your account.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F8F9FA] px-[5%] py-14">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl bg-white p-8 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
              <h2 className="font-['Playfair_Display'] text-3xl font-black">Our promise to attendees</h2>
              <p className="mt-4 text-base font-medium leading-relaxed text-[#6B7280]">
                We curate concerts that are easy to trust and even easier to attend. Every listing is verified, every
                checkout is protected, and every ticket lives with you long after purchase.
              </p>
              <div className="mt-6 grid gap-4">
                {[
                  { title: 'Verified venues', body: 'We spotlight organizers and venues with proven track records.' },
                  { title: 'Transparent pricing', body: 'No mystery fees. You see the total before you pay.' },
                  { title: 'Instant tickets', body: 'Digital passes arrive in your account the moment you confirm.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                    <h3 className="text-lg font-semibold text-[#312E81]">{item.title}</h3>
                    <p className="mt-2 text-sm text-[#6B7280]">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-6">
              <div className="rounded-3xl border border-[#E5E7EB] bg-white p-7">
                <p className="text-xs uppercase tracking-[0.3em] text-[#7C3AED]">How it works</p>
                <h3 className="mt-3 text-2xl font-bold text-[#312E81]">A smoother journey from discovery to encore</h3>
                <div className="mt-6 grid gap-4">
                  {[
                    { step: '1', title: 'Browse', text: 'Filter concerts by city, date, and vibe.' },
                    { step: '2', title: 'Reserve', text: 'Pick your ticket tier and checkout securely.' },
                    { step: '3', title: 'Go', text: 'Show your QR ticket at the door and enjoy.' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-bold text-white">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-[#312E81]">{item.title}</h4>
                        <p className="text-sm text-[#6B7280]">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-linear-to-br from-[#7C3AED] to-[#4F46E5] p-7 text-white">
                <h3 className="text-2xl font-bold">Need help fast?</h3>
                <p className="mt-3 text-sm text-white/90">
                  Our attendee support team responds within hours and never leaves you wondering.
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                  <span className="rounded-full bg-white/15 px-4 py-2">support@soundstage.com</span>
                  <span className="rounded-full bg-white/15 px-4 py-2">Live chat 10am-8pm</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0F172A] px-[5%] py-14 text-white">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#C4B5FD]">Community</p>
                <h2 className="mt-3 font-['Playfair_Display'] text-3xl font-black">Built for fans, shaped by fans</h2>
                <p className="mt-3 max-w-2xl text-sm text-white/75">
                  We partner with local communities to spotlight inclusive venues, accessible seating, and transparent
                  ticketing policies. Your feedback directly shapes the shows we feature.
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#0F172A] transition hover:-translate-y-0.5"
                to="/signin"
              >
                Start discovering
              </Link>
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
