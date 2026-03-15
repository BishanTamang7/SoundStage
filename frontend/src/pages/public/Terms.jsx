import React from 'react'
import LegalPageLayout from '../../components/LegalPageLayout'

const termsSections = [
  {
    title: 'Account responsibilities',
    body: 'Keep your login secure and provide accurate information when booking tickets.',
  },
  {
    title: 'Ticket purchases',
    body: 'All ticket sales are final unless the organizer states otherwise or a show is canceled.',
  },
  {
    title: 'Event changes',
    body: 'Dates, times, and venues can change. We will notify you using the contact info on your account.',
  },
  {
    title: 'Acceptable use',
    body: 'Do not resell tickets or misuse the platform in ways that violate local laws or event policies.',
  },
  {
    title: 'Liability',
    body: 'We connect you with organizers and venues; event hosts are responsible for the live experience.',
  },
]

const Terms = () => {
  return (
    <LegalPageLayout
      eyebrow="Terms of service"
      title="The rules for using SoundStage."
      intro="These terms outline how to use SoundStage, purchase tickets, and what to expect from us and our partners. This is a brief summary for clarity."
      updatedAt="Last updated: February 10, 2026"
      tags={['Ticket policies', 'Platform rules', 'Event changes']}
      sections={termsSections}
      contactTitle="Need a full copy?"
      contactBody="Contact us for the complete terms and any clarification about your tickets or event policies."
      contactChips={['legal@soundstage.com', 'Response within 2 business days']}
    />
  )
}

export default Terms
