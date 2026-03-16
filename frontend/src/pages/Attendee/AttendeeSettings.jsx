import React from 'react'
import AttendeeFooter from '../../components/AttendeeFooter'
import AttendeeHeader from '../../components/AttendeeHeader'
import NotificationToggleRow from '../../components/NotificationToggleRow'
import useNotificationPreferences from '../../hooks/useNotificationPreferences'
import { useAuth } from '../../hooks/useAuth'

const AttendeeSettings = () => {
  const { getNotificationPreferences, updateNotificationPreferences } = useAuth()
  const { prefs, prefsMessage, prefsError, loadingPrefs, savingPrefKey, togglePreference } =
    useNotificationPreferences(getNotificationPreferences, updateNotificationPreferences, {
      successMessageDurationMs: 1400,
    })

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] text-[#312E81]">
      <AttendeeHeader />

      <main className="flex-1 pt-24">
        <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-8">
          <section className="space-y-8">
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_30px_rgba(49,46,129,0.04)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                <div>
                  <h2 className="text-lg font-black text-[#312E81]">Notifications</h2>
                  <p className="text-sm text-[#6B7280]">
                    Choose which SoundStage updates you want to receive.
                  </p>
                </div>
                {prefsMessage ? (
                  <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-bold text-[#059669]">
                    {prefsMessage}
                  </span>
                ) : null}
              </div>
              {prefsError ? (
                <p className="mt-4 text-sm font-semibold text-[#EF4444]">{prefsError}</p>
              ) : null}
              <div className="mt-5 space-y-4">
                <NotificationToggleRow
                  label="Booking confirmations"
                  description="Receive email confirmations and purchase summaries for each successful booking."
                  checked={prefs.email_bookings}
                  onChange={() => togglePreference('email_bookings')}
                  disabled={Boolean(savingPrefKey)}
                  className={savingPrefKey ? 'bg-white' : 'bg-white'}
                />
                <NotificationToggleRow
                  label="Event reminders"
                  description="Receive booked-concert reminders and new concert announcements by email."
                  checked={prefs.event_reminders}
                  onChange={() => togglePreference('event_reminders')}
                  disabled={Boolean(savingPrefKey)}
                  className="bg-white"
                />
              </div>
              {loadingPrefs ? (
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                  Loading notification settings...
                </p>
              ) : null}
            </section>

          </section>
        </div>
      </main>

      <AttendeeFooter />
    </div>
  )
}

export default AttendeeSettings
