import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import AttendeeHeader from '../../components/AttendeeHeader'

const Terms = () => {
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
        <section className="bg-[#0F172A] px-[5%] py-16 text-white">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C4B5FD]">Terms of service</p>
            <h1 className="mt-4 font-['Playfair_Display'] text-4xl font-black sm:text-5xl">
              The rules for using SoundStage.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/80">
              These terms outline how to use SoundStage, purchase tickets, and what to expect from us and our partners.
              This is a brief summary for clarity.
            </p>
            <p className="mt-2 text-xs text-white/70">Last updated: February 10, 2026</p>
          </div>
        </section>

        <section className="px-[5%] py-12">
          <div className="mx-auto grid max-w-5xl gap-6">
            {[
              {
                title: 'Account responsibilities',
                body: 'Keep your login secure and provide accurate information when booking tickets.',
              },
              {
                title: 'Ticket purchases',
                body: 'All ticket sales are final unless the organizer states otherwise or a show is canceled.',
              },
              {
                title: 'Event changes',
                body: 'Dates, times, and venues can change. We will notify you using the contact info on your account.',
              },
              {
                title: 'Acceptable use',
                body: 'Do not resell tickets or misuse the platform in ways that violate local laws or event policies.',
              },
              {
                title: 'Liability',
                body: 'We connect you with organizers and venues; event hosts are responsible for the live experience.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                <h2 className="text-lg font-semibold text-[#312E81]">{item.title}</h2>
                <p className="mt-2 text-sm text-[#6B7280]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#F8F9FA] px-[5%] pb-14">
          <div className="mx-auto max-w-5xl rounded-3xl border border-[#E5E7EB] bg-white p-8">
            <h2 className="text-2xl font-bold text-[#312E81]">Need a full copy?</h2>
            <p className="mt-3 text-sm text-[#6B7280]">
              Contact us for the complete terms and any clarification about your tickets or event policies.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-[#312E81]">
              <span className="rounded-full bg-[#EEF2FF] px-4 py-2">legal@soundstage.com</span>
              <span className="rounded-full bg-[#EEF2FF] px-4 py-2">Response within 2 business days</span>
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

export default Terms
