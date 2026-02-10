import React from 'react'
import { Link } from 'react-router-dom'

const Landing = () => {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F8F9FA] text-[#312E81]">
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

      <section className="relative flex flex-1 items-center justify-between overflow-hidden px-[5%] pb-18 pt-28 max-[1024px]:flex-col max-[1024px]:text-center">
        <div className="absolute right-[-20%] top-[-50%] h-200 w-200 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.15)_0%,transparent_70%)]" />

        <div className="relative z-10 max-w-150">
          <h1 className="mb-6 font-['Playfair_Display'] text-[5rem] font-black leading-[1.1] max-[1024px]:text-[4rem] max-[768px]:text-[3rem]">
            Music meets <span className="text-[#7C3AED]">digital</span> experience
          </h1>
          <p className="mb-10 text-[1.3rem] leading-[1.7] text-[#4B5563] max-[768px]:text-[1.1rem]">
            A secure platform to create, manage, and attend concerts seamlessly. From booking to
            entry, everything in one place.
          </p>
          <Link
            className="inline-block rounded-full bg-[#7C3AED] px-10 py-4 text-[1.05rem] font-semibold text-white shadow-[0_16px_28px_rgba(124,58,237,0.25)] transition hover:-translate-y-0.5"
            to="/signin"
          >
            Start exploring
          </Link>
        </div>

        <div className="relative z-10 h-125 w-125 max-[1024px]:mt-12 max-[1024px]:h-100 max-[1024px]:w-100 max-[768px]:h-75 max-[768px]:w-75">
          <div className="absolute left-1/2 top-1/2 h-87.5 w-87.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-[#7C3AED] to-[#4F46E5]" />
          <div className="absolute left-[55%] top-[45%] h-70 w-70 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-[#C4B5FD] to-[#4F46E5]" />
          <div className="absolute left-[45%] top-[55%] h-50 w-50 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-[#7C3AED] to-[#C4B5FD]" />
          <div className="absolute left-[10%] top-[10%] text-3xl">🎵</div>
          <div className="absolute right-[10%] top-[15%] text-3xl">🎤</div>
          <div className="absolute bottom-[10%] right-[10%] text-3xl">🎸</div>
        </div>
      </section>

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

export default Landing
