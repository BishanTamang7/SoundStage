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
  sections = [],
  actions = [],
  contactTitle,
  contactBody,
  contactChips = [],
}) => {
  const { isAuthenticated, role } = useAuth()
  const homeLink = isAuthenticated ? (role === 'organizer' ? '/organizer' : '/attendee') : '/'
  const showAttendeeHeader = isAuthenticated && role === 'attendee'

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#312E81]">
      {showAttendeeHeader ? (
        <AttendeeHeader />
      ) : (
        <nav className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-[rgba(49,46,129,0.15)] bg-white px-[5%] backdrop-blur">
          <Link className="font-['Playfair_Display'] text-3xl font-black text-[#7C3AED]" to={homeLink}>
            SoundStage
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-[#312E81] md:flex">
            {isAuthenticated ? (
              <Link className="hover:text-[#7C3AED]" to={homeLink}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link className="hover:text-[#7C3AED]" to="/signin">
                  Sign in
                </Link>
                <Link className="rounded-lg bg-[#7C3AED] px-4 py-2.5 font-semibold text-white" to="/register">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      )}

      <main className="flex-1 pt-20">
        <section className="px-[5%] py-5">
          <div className="mx-auto max-w-4xl space-y-5">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7C3AED]">{eyebrow}</p>
                {updatedAt ? <p className="text-sm font-semibold text-[#6366F1] sm:text-right">{updatedAt}</p> : null}
              </div>
              <h1 className="mt-2.5 text-3xl font-black text-[#312E81] sm:text-4xl">{title}</h1>
              <p className="mt-3 max-w-2xl text-base leading-6 text-[#6B7280]">{intro}</p>

              {tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1.5 text-sm font-semibold text-[#5B21B6]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {actions.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {actions.map((action) => (
                    <Link
                      key={`${action.label}-${action.to}`}
                      className={
                        action.variant === 'secondary'
                          ? 'rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm font-semibold text-[#312E81] transition hover:bg-[#F8FAFC]'
                          : 'rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9]'
                      }
                      to={action.to}
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {sections.map((item) => (
                <section key={item.title} className="rounded-2xl border border-[#E5E7EB] bg-white p-3">
                  <h2 className="text-base font-black text-[#312E81] sm:text-lg">{item.title}</h2>
                  <p className="mt-1 text-sm leading-5 text-[#6B7280]">{item.body}</p>
                </section>
              ))}
            </div>

            {(contactTitle || contactBody || contactChips.length > 0) ? (
              <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                {contactTitle ? <h2 className="text-xl font-black text-[#312E81]">{contactTitle}</h2> : null}
                {contactBody ? <p className="mt-1.5 max-w-2xl text-sm leading-5 text-[#6B7280]">{contactBody}</p> : null}
                {contactChips.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {contactChips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1.5 text-sm font-semibold text-[#312E81]"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}
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
