import React from 'react'
import NotificationToggleRow from '../../components/NotificationToggleRow'
import useNotificationPreferences from '../../hooks/useNotificationPreferences'
import { useAuth } from '../../hooks/useAuth'
import OrganizerSidebar from '../../components/OrganizerSidebar'

const Settings = () => {
  const { getNotificationPreferences, updateNotificationPreferences } = useAuth()
  const {
    prefs,
    prefsMessage,
    prefsError,
    loadingPrefs: prefsLoading,
    savingPrefKey: prefsSavingKey,
    togglePreference,
  } = useNotificationPreferences(getNotificationPreferences, updateNotificationPreferences)

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <OrganizerSidebar />

      <main className="ml-60 px-12 py-8 max-[1024px]:px-6 max-[768px]:ml-0 max-[768px]:px-4">
        <header className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h1 className="text-2xl font-black text-[#312E81]">Settings</h1>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">
            Manage your organizer settings. Notifications are the only configurable option right now.
          </p>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#312E81]">Notification Preferences</h2>
                <p className="text-sm text-[#6B7280]">Choose which organizer updates you receive by email.</p>
              </div>
              {prefsMessage ? (
                <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-bold text-[#059669]">
                  {prefsMessage}
                </span>
              ) : null}
            </div>

            {prefsError ? <p className="mb-4 text-sm font-semibold text-[#B91C1C]">{prefsError}</p> : null}

            <div className="space-y-4">
              <NotificationToggleRow
                label="Booking confirmations"
                description="Get email updates when bookings are placed and ticket purchases are completed."
                checked={prefs.email_bookings}
                disabled={Boolean(prefsSavingKey)}
                onChange={() => togglePreference('email_bookings')}
                className={prefsSavingKey ? 'bg-[#FCFCFF]' : 'bg-[#FCFCFF] hover:bg-white'}
              />
            </div>

            {prefsLoading ? (
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                Loading notification settings...
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  )
}

export default Settings
