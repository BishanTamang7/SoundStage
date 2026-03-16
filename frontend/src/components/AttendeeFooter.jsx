import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const AttendeeFooter = () => {
  const { isAuthenticated, role } = useAuth()
  const aboutLink = isAuthenticated && role === 'attendee' ? '/attendee/about' : '/about'

  return (
    <footer className="bg-[#312E81] px-[5%] py-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-6 text-sm max-[768px]:flex-col max-[768px]:text-center">
        <div className="flex gap-8 max-[768px]:justify-center">
          <Link className="text-[rgba(255,255,255,0.75)] transition hover:text-white" to={aboutLink}>
            About
          </Link>
          <Link className="text-[rgba(255,255,255,0.75)] transition hover:text-white" to="/privacy">
            Privacy
          </Link>
          <Link className="text-[rgba(255,255,255,0.75)] transition hover:text-white" to="/terms">
            Terms
          </Link>
        </div>
        <div>© 2026 SoundStage. All rights reserved.</div>
      </div>
    </footer>
  )
}

export default AttendeeFooter
