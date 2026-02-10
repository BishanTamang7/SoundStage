import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const Privacy = () => {
  const { isAuthenticated, role } = useAuth()
  const homeLink = isAuthenticated ? (role === 'organizer' ? '/organizer' : '/attendee') : '/'

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F8F9FA] text-[#312E81]">
      <nav className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-[rgba(49,46,129,0.15)] bg-[rgba(248,249,250,0.95)] px-[5%] backdrop-blur">
        <Link className="font-['Playfair_Display'] text-3xl font-black text-[#7C3AED]" to={homeLink}>
          SoundStage
        </Link>
        <div className="flex items-center gap-10 text-[0.95rem] font-medium text-[#312E81] max-[768px]:hidden">
          <Link className="hover:text-[#7C3AED]" to="/signin">
            Sign in
          </Link>
          <Link
            className="rounded-full bg-[#7C3AED] px-7 py-3 font-semibold text-white shadow-[0_12px_20px_rgba(124,58,237,0.25)] transition hover:-translate-y-0.5"
            to="/register"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-1 pt-20">
        <section className="bg-[#0F172A] px-[5%] py-16 text-white">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C4B5FD]">Privacy policy</p>
            <h1 className="mt-4 font-['Playfair_Display'] text-4xl font-black sm:text-5xl">
              Your data, handled with care.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/80">
              This summary explains how SoundStage collects, uses, and protects information to help you discover and
              attend concerts. It is a simplified overview, not a substitute for legal advice.
            </p>
            <p className="mt-2 text-xs text-white/70">Last updated: February 10, 2026</p>
          </div>
        </section>

        <section className="px-[5%] py-12">
          <div className="mx-auto grid max-w-5xl gap-6">
            {[
              {
                title: 'What we collect',
                body: 'Account details, basic profile info, ticket purchases, and event preferences you share with us.',
              },
              {
                title: 'How we use it',
                body: 'To process tickets, improve recommendations, and communicate important updates about your events.',
              },
              {
                title: 'What we share',
                body: 'Only with venues and organizers to fulfill your ticket purchases, or with vendors who power our platform.',
              },
              {
                title: 'Your choices',
                body: 'You can update your account info, manage marketing preferences, or request data deletion anytime.',
              },
              {
                title: 'Security',
                body: 'We use encryption and secure payment partners to keep your data protected in transit and at rest.',
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
            <h2 className="text-2xl font-bold text-[#312E81]">Questions or requests?</h2>
            <p className="mt-3 text-sm text-[#6B7280]">
              Reach out to us if you want a copy of your data, updates to your profile, or help with privacy settings.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-[#312E81]">
              <span className="rounded-full bg-[#EEF2FF] px-4 py-2">privacy@soundstage.com</span>
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

export default Privacy
