import React from 'react'

const ForgotPassword = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F9FA] text-[#312E81]">
      <div className="pointer-events-none absolute left-[-18%] top-[-38%] h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-[-35%] right-[-18%] h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.16)_0%,transparent_70%)]" />

      <main className="relative z-10 w-full max-w-xl px-6 py-10">
        <section className="rounded-3xl border border-[rgba(49,46,129,0.18)] bg-white p-6 shadow-[0_20px_45px_rgba(49,46,129,0.08)] md:p-8">
          <a
            className="absolute right-10 top-14 flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(196,181,253,0.7)] bg-[rgba(196,181,253,0.35)] text-lg font-bold text-[#312E81]"
            href="/signin"
          >
            ✕
          </a>

          <div className="text-center">
            <h1 className="font-['Playfair_Display'] text-[2rem] font-black leading-tight">
              Forgot your password?
            </h1>
            <p className="mt-3 text-[0.98rem] text-[#4B5563]">
              Enter your email address and we will send you a password reset link.
            </p>
          </div>

          <form className="mt-8 flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Email</label>
              <input
                className="rounded-[14px] border border-[rgba(49,46,129,0.22)] px-4 py-3 text-base outline-none focus:border-[rgba(124,58,237,0.7)] focus:ring-4 focus:ring-[rgba(124,58,237,0.12)]"
                type="email"
                name="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              className="mt-2 rounded-full bg-[#7C3AED] py-4 text-base font-bold text-white"
              type="submit"
            >
              Send reset link
            </button>
          </form>

          <p className="mt-6 text-center text-[0.95rem] text-[#4B5563]">
            Remember your password?{' '}
            <a className="font-bold text-[#4F46E5]" href="/signin">
              Back to login
            </a>
          </p>
        </section>
      </main>
    </div>
  )
}

export default ForgotPassword
