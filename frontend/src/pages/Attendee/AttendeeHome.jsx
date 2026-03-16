import React from 'react'
import { Link } from 'react-router-dom'
import AttendeeFooter from '../../components/AttendeeFooter'
import AttendeeHeader from '../../components/AttendeeHeader'

const AttendeeHome = () => {
  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] text-[#312E81]">
      <AttendeeHeader />

      <main className="flex-1 pt-20">
        <section className="bg-linear-to-br from-[#7C3AED] to-[#4F46E5] px-[5%] py-12 text-center text-white">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-['Playfair_Display'] text-4xl font-black sm:text-5xl lg:text-6xl">
              Welcome to SoundStage
            </h1>
            <p className="mt-4 text-lg text-white/95 sm:text-xl">
              Your trusted platform for discovering and booking live music concerts
            </p>
            <Link
              to="/attendee/concerts"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-sm font-bold text-[#7C3AED] transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
            >
              Browse Concerts
            </Link>
          </div>
        </section>

        <section className="bg-transparent px-[5%] py-8 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="font-['Playfair_Display'] text-3xl font-black text-[#312E81] sm:text-4xl">
                What We Offer
              </h2>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-white px-6 py-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[#7C3AED] to-[#4F46E5] text-4xl">
                  🎫
                </div>
                <h3 className="text-2xl font-black text-[#312E81]">Easy Booking</h3>
                <p className="mt-3 text-base font-medium leading-relaxed text-[#6B7280]">
                  Browse and book tickets to amazing concerts with just a few clicks
                </p>
              </div>

              <div className="rounded-xl bg-white px-6 py-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[#7C3AED] to-[#4F46E5] text-4xl">
                  🎵
                </div>
                <h3 className="text-2xl font-black text-[#312E81]">Live Events</h3>
                <p className="mt-3 text-base font-medium leading-relaxed text-[#6B7280]">
                  Discover upcoming concerts and live music events in your area
                </p>
              </div>

              <div className="rounded-xl bg-white px-6 py-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[#7C3AED] to-[#4F46E5] text-4xl">
                  📱
                </div>
                <h3 className="text-2xl font-black text-[#312E81]">Digital Tickets</h3>
                <p className="mt-3 text-base font-medium leading-relaxed text-[#6B7280]">
                  Get instant QR code tickets delivered right to your device
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AttendeeFooter />
    </div>
  )
}

export default AttendeeHome
