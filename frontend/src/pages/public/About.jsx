import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import LegalPageLayout from '../../components/LegalPageLayout'

const aboutSections = [
  {
    title: 'What SoundStage does',
    body: 'SoundStage helps people discover concerts, book tickets, and access events with simple digital ticketing.',
  },
  {
    title: 'For attendees',
    body: 'Attendees can browse concerts, choose ticket types, pay online, and keep their QR tickets in one place.',
  },
  {
    title: 'For organizers',
    body: 'Organizers can create concerts, manage ticket inventory, verify entries, and monitor bookings and sales.',
  },
  {
    title: 'Our goal',
    body: 'The platform is designed to make concert discovery and ticket management easier for both fans and event organizers.',
  },
]

const About = () => {
  const { isAuthenticated, role } = useAuth()
  const isAttendee = isAuthenticated && role === 'attendee'

  return (
    <LegalPageLayout
      eyebrow="About SoundStage"
      title="A simple platform for concerts and tickets."
      intro="SoundStage is a concert ticketing platform that connects attendees and organizers through one clear system for browsing events, booking tickets, and managing entries."
      sections={aboutSections}
      actions={
        isAttendee
          ? [
              { label: 'Browse Concerts', to: '/attendee/concerts' },
              { label: 'My Tickets', to: '/attendee/tickets', variant: 'secondary' },
            ]
          : [
              { label: 'Sign In', to: '/signin' },
              { label: 'Register', to: '/register', variant: 'secondary' },
            ]
      }
      contactTitle="Need help?"
      contactBody="Contact the SoundStage support team if you need help with your account, tickets, or event access."
      contactChips={['support@soundstage.com', 'Concert support', 'Ticket help']}
    />
  )
}

export default About
