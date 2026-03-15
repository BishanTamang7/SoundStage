import React from 'react'
import LegalPageLayout from '../../components/LegalPageLayout'

const privacySections = [
  {
    title: 'What we collect',
    body: 'Account details, basic profile info, ticket purchases, and event preferences you share with us.',
  },
  {
    title: 'How we use it',
    body: 'To process tickets, improve recommendations, and communicate important updates about your events.',
  },
  {
    title: 'What we share',
    body: 'Only with venues and organizers to fulfill your ticket purchases, or with vendors who power our platform.',
  },
  {
    title: 'Your choices',
    body: 'You can update your account info, manage marketing preferences, or request data deletion anytime.',
  },
  {
    title: 'Security',
    body: 'We use encryption and secure payment partners to keep your data protected in transit and at rest.',
  },
]

const Privacy = () => {
  return (
    <LegalPageLayout
      eyebrow="Privacy policy"
      title="Your data, handled with care."
      intro="This summary explains how SoundStage collects, uses, and protects information to help you discover and attend concerts. It is a simplified overview, not a substitute for legal advice."
      updatedAt="Last updated: February 10, 2026"
      tags={['Control over your data', 'Secure payments', 'Clear communication']}
      sections={privacySections}
      contactTitle="Questions or requests?"
      contactBody="Reach out if you want a copy of your data, updates to your profile, or help with privacy settings."
      contactChips={['privacy@soundstage.com', 'Response within 2 business days']}
    />
  )
}

export default Privacy
