import React from 'react'
import { Link } from 'react-router-dom'

const About = () => {
  return (
    <div className="min-h-screen bg-[#F5F2EC] text-[#1F1A17]">
      <header className="border-b border-[#E3DBD1] bg-[#F5F2EC]">
        <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link className="font-['Playfair_Display'] text-2xl" to="/">
            SoundStage
          </Link>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link className="hover:text-[#8C2F0E]" to="/signin">
              Sign in
            </Link>
            <Link className="rounded-full border border-[#8C2F0E] px-4 py-2 text-[#8C2F0E] hover:bg-[#8C2F0E] hover:text-white" to="/register">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <section className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#8C2F0E]">About us</p>
            <h1 className="mt-3 font-['Playfair_Display'] text-4xl">Live music, made simple.</h1>
            <p className="mt-4 text-base leading-relaxed text-[#4B3F36]">
              SoundStage is a single place to discover shows, book tickets, and keep everything you need for the night out. We focus on clear listings, verified organizers, and a clean checkout that never surprises you.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[#4B3F36]">
              Our team works with venues and promoters to highlight events you can trust, and we build tools that keep fans informed from the first click to the final encore.
            </p>
          </div>
          <div className="rounded-3xl border border-[#E3DBD1] bg-white p-6 shadow-[0_12px_30px_rgba(31,26,23,0.08)]">
            <h2 className="text-lg font-semibold">What we care about</h2>
            <ul className="mt-4 space-y-3 text-sm text-[#4B3F36]">
              <li>Transparent pricing with no last-minute fees.</li>
              <li>Verified events and secure checkout.</li>
              <li>Support that answers quickly and clearly.</li>
            </ul>
          </div>
        </section>

        <section className="mt-12 rounded-3xl bg-[#1F1A17] px-8 py-10 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Ready to explore?</h2>
              <p className="mt-2 text-sm text-white/80">Browse local shows and keep your tickets in one place.</p>
            </div>
            <Link className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#1F1A17]" to="/signin">
              Start browsing
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E3DBD1] bg-[#F5F2EC]">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-[#4B3F36] md:flex-row">
          <div className="flex gap-6">
            <Link className="hover:text-[#8C2F0E]" to="/about">
              About
            </Link>
            <a className="hover:text-[#8C2F0E]" href="#">
              Privacy
            </a>
            <a className="hover:text-[#8C2F0E]" href="#">
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
