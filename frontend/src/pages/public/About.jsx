import React from 'react'
import { Link } from 'react-router-dom'

const About = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] text-[#312E81]">
      <nav className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-[rgba(49,46,129,0.15)] bg-[rgba(248,249,250,0.95)] px-[5%] backdrop-blur">
        <Link className="font-['Playfair_Display'] text-3xl font-black text-[#7C3AED]" to="/">
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
        <section className="relative overflow-hidden bg-[#0F172A] px-[5%] py-16 text-white">
          <div className="absolute inset-0">
            <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#7C3AED]/50 blur-[90px]" />
            <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-[#38BDF8]/40 blur-[120px]" />
            <div className="absolute bottom-0 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#F43F5E]/30 blur-[90px]" />
          </div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#C4B5FD]">About SoundStage</p>
              <h1 className="mt-4 font-['Playfair_Display'] text-4xl font-black sm:text-5xl lg:text-6xl">
                Where live music meets a smoother way to book.
              </h1>
              <p className="mt-5 text-lg text-white/80">
                SoundStage brings concert discovery, trusted organizers, and instant tickets into one platform. From
                first click to the final encore, we focus on clarity, safety, and a better night out.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#0F172A] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.3)]"
                  to="/signin"
                >
                  Start Exploring
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-full border border-white/50 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  to="/register"
                >
                  Create an account
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_60px_rgba(15,23,42,0.25)] backdrop-blur">
              <div className="grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#A5B4FC]">Trusted events</p>
                  <h2 className="mt-2 text-2xl font-bold">Verified venues and organizers</h2>
                  <p className="mt-2 text-sm text-white/70">We spotlight teams with strong reviews and clear policies.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#FDA4AF]">Instant access</p>
                  <h3 className="mt-2 text-2xl font-bold">Tickets delivered in seconds</h3>
                  <p className="mt-2 text-sm text-white/70">Your QR tickets live safely in your SoundStage account.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F8F9FA] px-[5%] py-14">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl bg-white p-8 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
              <h2 className="font-['Playfair_Display'] text-3xl font-black">What we stand for</h2>
              <p className="mt-4 text-base font-medium leading-relaxed text-[#6B7280]">
                We believe concerts should feel exciting, not stressful. Our team obsessively designs the path from
                discovery to entry so you always know what you are getting and what comes next.
              </p>
              <div className="mt-6 grid gap-4">
                {[
                  { title: 'Clarity first', body: 'Transparent pricing and accurate listings every time.' },
                  { title: 'Safety built-in', body: 'Verified organizers and secure checkout flow.' },
                  { title: 'Fan-focused', body: 'Support that responds quickly when plans change.' },
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
                <h3 className="mt-3 text-2xl font-bold text-[#312E81]">From discovery to the encore</h3>
                <div className="mt-6 grid gap-4">
                  {[
                    { step: '1', title: 'Discover', text: 'Browse concerts by city, genre, and date.' },
                    { step: '2', title: 'Book', text: 'Select your ticket tier and check out securely.' },
                    { step: '3', title: 'Enjoy', text: 'Show your QR ticket and head to your seat.' },
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
                <p className="mt-3 text-sm text-white/90">Our support team responds quickly and keeps you informed.</p>
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
                <h2 className="mt-3 font-['Playfair_Display'] text-3xl font-black">Built with the live music community</h2>
                <p className="mt-3 max-w-2xl text-sm text-white/75">
                  We partner with local venues, artists, and promoters to keep discovery inclusive and transparent.
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
            <a className="text-[rgba(255,255,255,0.75)] hover:text-white" href="#">
              Privacy
            </a>
            <a className="text-[rgba(255,255,255,0.75)] hover:text-white" href="#">
              Terms
            </a>
          </div>
          <div>© 2026 SoundStage. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

export default About
