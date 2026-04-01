import React from 'react'
import OrganizerSidebar from '../../components/OrganizerSidebar'
import PasswordField from '../../components/PasswordField'
import useAccountProfile from '../../hooks/useAccountProfile'

const OrganizerProfile = () => {
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
    defaultProfileName: 'Organizer',
    defaultRole: 'organizer',
    initialsFallback: 'OR',
    deleteErrorMessage: 'Failed to delete account.',
  })

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <OrganizerSidebar />

      <main className="ml-60 px-8 pb-6 pt-12 max-[1024px]:px-6 max-[768px]:ml-0 max-[768px]:px-4">
        <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[0.86fr_1.14fr]">
          <aside className="grid gap-4">
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_30px_rgba(49,46,129,0.06)]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#A78BFA]">Organizer Profile</p>
              <div className="mt-4 flex flex-col items-center text-center">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={`${profileName} profile`}
                    className="h-24 w-24 rounded-full object-cover shadow-[0_10px_30px_rgba(49,46,129,0.14)]"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-[#7C3AED] to-[#4F46E5] text-3xl font-black text-white shadow-[0_10px_30px_rgba(49,46,129,0.14)]">
                    {initials}
                  </div>
                )}
                <button
                  className="mt-4 rounded-full border border-[#7C3AED] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#7C3AED] transition hover:bg-[#F5F3FF] disabled:cursor-not-allowed disabled:opacity-60"
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

                <h1 className="mt-5 text-3xl font-black text-[#312E81]">{profileName}</h1>
                <p className="mt-2 text-sm font-semibold text-[#6B7280]">{profileEmail}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <span className="rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#7C3AED]">
                    {accountType}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${
                      accountStatus === 'Active'
                        ? 'border border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]'
                        : 'border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
                    }`}
                  >
                    {accountStatus}
                  </span>
                </div>
              </div>

              {photoMessage ? <p className="mt-4 text-sm font-semibold text-[#059669]">{photoMessage}</p> : null}
              {photoError ? <p className="mt-4 text-sm font-semibold text-[#B91C1C]">{photoError}</p> : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9CA3AF]">Member Since</p>
                  <p className="mt-2 text-sm font-semibold text-[#312E81]">{memberSince}</p>
                </div>
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9CA3AF]">Dashboard Access</p>
                  <p className="mt-2 text-sm font-semibold text-[#312E81]">Organizer account enabled</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#FECACA] bg-white p-5 shadow-[0_10px_30px_rgba(185,28,28,0.06)]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#F87171]">Danger Zone</p>
              <h2 className="mt-3 text-xl font-black text-[#991B1B]">Delete organizer account</h2>
              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                This will delete your organizer account and remove your concerts, bookings, and ticket history.
              </p>
              {deleteError ? <p className="mt-4 text-sm font-semibold text-[#B91C1C]">{deleteError}</p> : null}
              <button
                className="mt-4 w-full rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-5 py-3 text-sm font-bold text-[#B91C1C] transition hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={openDeleteDialog}
                disabled={deletingAccount}
              >
                {deletingAccount ? 'Deleting Account...' : 'Delete Account'}
              </button>
            </section>
          </aside>

          <div className="grid gap-4">
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_30px_rgba(49,46,129,0.06)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#A78BFA]">Account Details</p>
                  <h2 className="mt-2 text-2xl font-black text-[#312E81]">Keep organizer details current</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">Update the details attached to your organizer account.</p>
                </div>
                {hasProfileChanges ? (
                  <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#B45309]">
                    Unsaved changes
                  </span>
                ) : null}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                    className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileInputChange}
                    className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="joined">
                    Member Since
                  </label>
                  <input
                    id="joined"
                    type="text"
                    value={memberSince}
                    disabled
                    readOnly
                    className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#312E81]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="role">
                    Account Type
                  </label>
                  <input
                    id="role"
                    type="text"
                    value={accountType}
                    disabled
                    readOnly
                    className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#312E81]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#312E81]" htmlFor="status">
                    Account Status
                  </label>
                  <input
                    id="status"
                    type="text"
                    value={accountStatus}
                    disabled
                    readOnly
                    className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#312E81]"
                  />
                </div>
              </div>

              {profileError ? <p className="mt-4 text-sm font-semibold text-[#B91C1C]">{profileError}</p> : null}
              {profileMessage ? <p className="mt-4 text-sm font-semibold text-[#059669]">{profileMessage}</p> : null}

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  className="rounded-xl border border-[#D1D5DB] bg-white px-5 py-3 text-sm font-bold text-[#312E81] transition hover:bg-[#F9FAFB]"
                  type="button"
                  onClick={handleCancelProfileChanges}
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  className="rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={handleSaveProfileChanges}
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_30px_rgba(49,46,129,0.06)]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#A78BFA]">Security</p>
                <h2 className="mt-2 text-2xl font-black text-[#312E81]">Protect organizer access</h2>
                <p className="mt-1 text-sm text-[#6B7280]">Change your password to protect organizer dashboard access.</p>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <PasswordField
                  id="current-password"
                  label="Current Password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  visible={showPassword.currentPassword}
                  onChange={handlePasswordInputChange}
                  onToggle={() => togglePasswordVisibility('currentPassword')}
                />
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

              {passwordError ? <p className="mt-4 text-sm font-semibold text-[#B91C1C]">{passwordError}</p> : null}
              {passwordMessage ? <p className="mt-4 text-sm font-semibold text-[#059669]">{passwordMessage}</p> : null}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#6B7280]">Use a unique password for your organizer dashboard.</p>
                <button
                  className="rounded-xl bg-[#312E81] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={savingPassword}
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {showDeleteDialog ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#111827]/55 px-4">
          <div
            className="w-full max-w-md rounded-2xl border border-[#FECACA] bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-organizer-profile-dialog-title"
            aria-describedby="delete-organizer-profile-dialog-description"
          >
            <h3 id="delete-organizer-profile-dialog-title" className="text-lg font-black text-[#B91C1C]">
              Delete organizer account?
            </h3>
            <p id="delete-organizer-profile-dialog-description" className="mt-3 text-sm leading-6 text-[#6B7280]">
              This will permanently delete your organizer account, concerts, bookings, and ticket history.
            </p>
            {deleteError ? <p className="mt-3 text-sm font-semibold text-[#B91C1C]">{deleteError}</p> : null}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-[#D1D5DB] bg-white px-5 py-2.5 text-sm font-bold text-[#374151] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={closeDeleteDialog}
                disabled={deletingAccount}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default OrganizerProfile
