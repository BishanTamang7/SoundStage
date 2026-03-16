import React from 'react'
import AttendeeFooter from '../../components/AttendeeFooter'
import AttendeeHeader from '../../components/AttendeeHeader'
import PasswordField from '../../components/PasswordField'
import useAccountProfile from '../../hooks/useAccountProfile'

const AttendeeProfile = () => {
  const {
    photoInputRef,
    profileName,
    profileEmail,
    initials,
    memberSince,
    accountType,
    accountStatus,
    hasProfileChanges,
    profileForm,
    savingProfile,
    profileMessage,
    profileError,
    passwordForm,
    showPassword,
    savingPassword,
    passwordMessage,
    passwordError,
    profilePhoto,
    savingPhoto,
    photoMessage,
    photoError,
    deletingAccount,
    deleteError,
    showDeleteDialog,
    handleProfileInputChange,
    handleCancelProfileChanges,
    handleSaveProfileChanges,
    handlePasswordInputChange,
    togglePasswordVisibility,
    handleUpdatePassword,
    handlePickPhoto,
    handlePhotoChange,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteAccount,
  } = useAccountProfile({
    defaultProfileName: 'Attendee',
    defaultRole: 'attendee',
    initialsFallback: 'AT',
    deleteErrorMessage: 'Failed to deactivate account.',
  })

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-[#F5F3FF] via-[#EEF2FF] to-[#E0EAFF] text-[#312E81]">
      <AttendeeHeader />

      <main className="mx-auto grid max-w-6xl flex-1 gap-6 px-6 py-8 pt-28 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <div className="flex flex-col items-center text-center">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={`${profileName} profile`}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#7C3AED] text-xl font-black text-white">
                  {initials}
                </div>
              )}

              <button
                className="mt-3 rounded-lg border border-[#7C3AED] px-3 py-2 text-sm font-bold text-[#7C3AED] transition hover:bg-[#F5F3FF]"
                type="button"
                onClick={handlePickPhoto}
                disabled={savingPhoto}
              >
                {savingPhoto ? 'Uploading...' : 'Change Photo'}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />

              <h1 className="mt-4 text-xl font-black text-[#312E81]">{profileName}</h1>
              <p className="mt-1 text-sm font-semibold text-[#6B7280] break-all">{profileEmail}</p>
            </div>

            {photoMessage ? <p className="mt-4 text-sm font-semibold text-[#059669]">{photoMessage}</p> : null}
            {photoError ? <p className="mt-3 text-sm font-semibold text-[#DC2626]">{photoError}</p> : null}

            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-[#F8FAFC] p-3.5">
                <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Account Type</div>
                <div className="mt-1 text-sm font-semibold text-[#312E81]">{accountType}</div>
              </div>
              <div className="rounded-xl bg-[#F8FAFC] p-3.5">
                <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Account Status</div>
                <div className="mt-1 text-sm font-semibold text-[#312E81]">{accountStatus}</div>
              </div>
              <div className="rounded-xl bg-[#F8FAFC] p-3.5">
                <div className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Member Since</div>
                <div className="mt-1 text-sm font-semibold text-[#312E81]">{memberSince}</div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#FECACA] bg-white p-6">
            <h2 className="text-lg font-black text-[#B91C1C]">Deactivate Account</h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              This removes sign-in access while keeping your ticket and booking history preserved.
            </p>
            {deleteError ? <p className="mt-3 text-sm font-semibold text-[#DC2626]">{deleteError}</p> : null}
            <button
              className="mt-4 w-full rounded-lg border border-[#DC2626] px-4 py-3 text-sm font-bold text-[#DC2626] transition hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={openDeleteDialog}
              disabled={deletingAccount}
            >
              {deletingAccount ? 'Deactivating...' : 'Deactivate Account'}
            </button>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-[#312E81]">Profile Details</h2>
                <p className="mt-1 text-sm text-[#6B7280]">Update your basic account information.</p>
              </div>
              {hasProfileChanges ? (
                <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#B45309]">
                  Unsaved changes
                </span>
              ) : null}
            </div>

            <form className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="username">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={profileForm.username}
                    onChange={handleProfileInputChange}
                    className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileInputChange}
                    className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              {profileError ? <p className="text-sm font-semibold text-[#DC2626]">{profileError}</p> : null}
              {profileMessage ? <p className="text-sm font-semibold text-[#059669]">{profileMessage}</p> : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  className="rounded-lg border border-[#D1D5DB] px-4 py-3 text-sm font-bold text-[#6B7280] transition hover:bg-[#F8FAFC]"
                  type="button"
                  onClick={handleCancelProfileChanges}
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-[#7C3AED] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={handleSaveProfileChanges}
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="text-2xl font-black text-[#312E81]">Change Password</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Use a strong password you do not reuse elsewhere.</p>

            <form className="mt-5 space-y-4">
              <PasswordField
                id="current-password"
                label="Current Password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                visible={showPassword.currentPassword}
                onChange={handlePasswordInputChange}
                onToggle={() => togglePasswordVisibility('currentPassword')}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <PasswordField
                  id="new-password"
                  label="New Password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  visible={showPassword.newPassword}
                  onChange={handlePasswordInputChange}
                  onToggle={() => togglePasswordVisibility('newPassword')}
                />
                <PasswordField
                  id="confirm-password"
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  visible={showPassword.confirmPassword}
                  onChange={handlePasswordInputChange}
                  onToggle={() => togglePasswordVisibility('confirmPassword')}
                />
              </div>

              {passwordError ? <p className="text-sm font-semibold text-[#DC2626]">{passwordError}</p> : null}
              {passwordMessage ? <p className="text-sm font-semibold text-[#059669]">{passwordMessage}</p> : null}

              <div className="flex justify-end">
                <button
                  className="rounded-lg bg-[#7C3AED] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={savingPassword}
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>

      <AttendeeFooter />
      {showDeleteDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 px-4">
          <div
            className="w-full max-w-md rounded-2xl border border-[#FECACA] bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-dialog-title"
            aria-describedby="delete-account-dialog-description"
          >
            <h3 id="delete-account-dialog-title" className="text-lg font-black text-[#B91C1C]">
              Deactivate account?
            </h3>
            <p id="delete-account-dialog-description" className="mt-3 text-sm leading-6 text-[#6B7280]">
              This removes sign-in access to your account. Your tickets and booking history will remain preserved.
            </p>
            {deleteError ? <p className="mt-3 text-sm font-semibold text-[#B91C1C]">{deleteError}</p> : null}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm font-bold text-[#374151] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={closeDeleteDialog}
                disabled={deletingAccount}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[#DC2626] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? 'Deactivating...' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AttendeeProfile
