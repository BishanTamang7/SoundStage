import React from 'react'

const AttendeeHome = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-6 text-[#312E81]">
      <div className="w-full max-w-xl rounded-3xl border border-[rgba(49,46,129,0.18)] bg-white p-10 text-center shadow-[0_20px_45px_rgba(49,46,129,0.08)]">
        <h1 className="mb-3 font-['Playfair_Display'] text-3xl font-black">Attendee Dashboard</h1>
        <p className="text-[#4B5563]">Simple placeholder for attendee home.</p>
        <a className="mt-6 inline-block font-bold text-[#4F46E5]" href="/">
          Back to home
        </a>
      </div>
    </div>
  )
}

export default AttendeeHome
