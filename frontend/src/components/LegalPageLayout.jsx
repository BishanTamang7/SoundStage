import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AttendeeHeader from './AttendeeHeader'

const LegalPageLayout = ({
  eyebrow,
  title,
  intro,
  updatedAt,
  tags = [],
  sections,
  contactTitle,
  contactBody,
  contactChips,
}) => {
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

      <main className="flex flex-1 pt-20">
        <section className="relative flex flex-1 items-center overflow-hidden bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] px-[5%] py-8 text-[#312E81]">
          <div className="absolute inset-0">
            <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-[#7C3AED]/20 blur-[80px]" />
            <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-[#60A5FA]/20 blur-[120px]" />
            <div className="absolute bottom-0 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#A78BFA]/20 blur-[90px]" />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-[#A78BFA]">{eyebrow}</p>
              <h1 className="mt-4 font-['Playfair_Display'] text-4xl font-black sm:text-5xl lg:text-[3.25rem]">
                {title}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#4B5563] sm:text-lg">{intro}</p>
              <p className="mt-4 text-sm font-semibold text-[#6366F1]">{updatedAt}</p>

              {tags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-[#4F46E5]">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-[#C7D2FE] bg-white/75 px-4 py-2">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {sections.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_14px_30px_rgba(99,102,241,0.08)] backdrop-blur"
                  >
                    <h2 className="text-base font-semibold text-[#312E81]">{item.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{item.body}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-[#7C3AED]/20 bg-linear-to-br from-[#7C3AED] to-[#4F46E5] p-6 text-white shadow-[0_22px_50px_rgba(79,70,229,0.22)]">
                <p className="text-xs uppercase tracking-[0.3em] text-white/75">Need help?</p>
                <h2 className="mt-3 text-2xl font-bold">{contactTitle}</h2>
                <p className="mt-3 max-w-2xl text-sm text-white/90">{contactBody}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white">
                  {contactChips.map((chip) => (
                    <span key={chip} className="rounded-full bg-white/15 px-3 py-2">
                      {chip}
                    </span>
                  ))}
                </div>
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

export default LegalPageLayout
