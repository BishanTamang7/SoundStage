import React from 'react'

const Landing = () => {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F8F9FA] text-[#312E81]">
      <nav className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-[rgba(49,46,129,0.15)] bg-[rgba(248,249,250,0.95)] px-[5%] backdrop-blur">
        <div className="font-['Playfair_Display'] text-3xl font-black text-[#7C3AED]">
          SoundStage
        </div>
        <div className="flex items-center gap-10 text-[0.95rem] font-medium text-[#312E81] max-[768px]:hidden">
          <a className="hover:text-[#7C3AED]" href="/signin">
            Sign in
          </a>
          <a
            className="rounded-full bg-[#7C3AED] px-7 py-3 font-semibold text-white shadow-[0_12px_20px_rgba(124,58,237,0.25)] transition hover:-translate-y-0.5"
            href="/register"
          >
            Get Started
          </a>
        </div>
      </nav>

      <section className="relative flex flex-1 items-center justify-between overflow-hidden px-[5%] pb-[4.5rem] pt-[calc(80px+2rem)] max-[1024px]:flex-col max-[1024px]:text-center">
        <div className="absolute right-[-20%] top-[-50%] h-[800px] w-[800px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.15)_0%,transparent_70%)]" />

        <div className="relative z-10 max-w-[600px]">
          <h1 className="mb-6 font-['Playfair_Display'] text-[5rem] font-black leading-[1.1] max-[1024px]:text-[4rem] max-[768px]:text-[3rem]">
            Music meets <span className="text-[#7C3AED]">digital</span> experience
          </h1>
          <p className="mb-10 text-[1.3rem] leading-[1.7] text-[#4B5563] max-[768px]:text-[1.1rem]">
            A secure platform to create, manage, and attend concerts seamlessly. From booking to
            entry, everything in one place.
          </p>
          <a
            className="inline-block rounded-full bg-[#7C3AED] px-10 py-4 text-[1.05rem] font-semibold text-white shadow-[0_16px_28px_rgba(124,58,237,0.25)] transition hover:-translate-y-0.5"
            href="/signin"
          >
            Start exploring
          </a>
        </div>

        <div className="relative z-10 h-[500px] w-[500px] max-[1024px]:mt-12 max-[1024px]:h-[400px] max-[1024px]:w-[400px] max-[768px]:h-[300px] max-[768px]:w-[300px]">
          <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F46E5]" />
          <div className="absolute left-[55%] top-[45%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#4F46E5]" />
          <div className="absolute left-[45%] top-[55%] h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#C4B5FD]" />
          <div className="absolute left-[10%] top-[10%] text-3xl">🎵</div>
          <div className="absolute right-[10%] top-[15%] text-3xl">🎤</div>
          <div className="absolute bottom-[10%] right-[10%] text-3xl">🎸</div>
        </div>
      </section>

      <footer className="bg-[#312E81] px-[5%] py-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-6 text-sm max-[768px]:flex-col max-[768px]:text-center">
          <div className="flex gap-8 max-[768px]:justify-center">
            <a className="text-[rgba(255,255,255,0.75)] hover:text-white" href="#">
              About
            </a>
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

export default Landing
