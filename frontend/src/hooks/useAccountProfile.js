import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { getInitialsFromWords, toTitleCase } from '../utils/account'
import { formatDate } from '../utils/formatters'
import { getStoredProfilePhoto } from '../utils/profilePhoto'

const MAX_PROFILE_PHOTO_SIZE_BYTES = 5 * 1024 * 1024

const useAccountProfile = ({
  defaultProfileName = 'User',
  defaultRole = 'user',
  initialsFallback = 'UU',
  deleteErrorMessage = 'Failed to delete account.',
}) => {
  const { user, role, updateProfile, changePassword, deleteAccount, logout } = useAuth()
  const navigate = useNavigate()
  const photoInputRef = useRef(null)

  const [profileForm, setProfileForm] = useState({ username: '', email: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [profilePhoto, setProfilePhoto] = useState('')
  const [savingPhoto, setSavingPhoto] = useState(false)
  const [photoMessage, setPhotoMessage] = useState('')
  const [photoError, setPhotoError] = useState('')

  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const profileName = user?.username || user?.email || defaultProfileName
  const profileEmail = user?.email || 'N/A'
  const initials = useMemo(
    () => getInitialsFromWords(profileName, { fallback: initialsFallback }),
    [initialsFallback, profileName]
  )
  const memberSince = useMemo(
    () =>
      formatDate(user?.date_joined || user?.dateJoined, {
        fallback: 'N/A',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [user]
  )
  const accountType = useMemo(
    () => toTitleCase(user?.role || user?.user_type || user?.userType || role || defaultRole),
    [defaultRole, role, user]
  )
  const accountStatus = user?.is_active === false ? 'Inactive' : 'Active'
  const hasProfileChanges =
    profileForm.username !== (user?.username || '') || profileForm.email !== (user?.email || '')

  useEffect(() => {
    setProfileForm({
      username: user?.username || '',
      email: user?.email || '',
    })
  }, [user])

  useEffect(() => {
    setProfilePhoto(getStoredProfilePhoto(user))
  }, [user])

  const handleProfileInputChange = (event) => {
    const { name, value } = event.target
    setProfileMessage('')
    setProfileError('')
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCancelProfileChanges = () => {
    setProfileMessage('')
    setProfileError('')
    setProfileForm({
      username: user?.username || '',
      email: user?.email || '',
    })
  }

  const handleSaveProfileChanges = async () => {
    setProfileMessage('')
    setProfileError('')

    if (!hasProfileChanges) {
      setProfileMessage('No changes to save.')
      return
    }

    try {
      setSavingProfile(true)
      const response = await updateProfile({
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
      })
      if (response?.data?.requires_email_verification) {
        const verificationEmail = response?.data?.verification_email || profileForm.email.trim()
        await logout()
        navigate(`/verify-email?email=${encodeURIComponent(verificationEmail)}`, { replace: true })
        return
      }
      setProfileMessage(response?.message || 'Profile updated successfully.')
    } catch (error) {
      setProfileError(error?.message || 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordInputChange = (event) => {
    const { name, value } = event.target
    setPasswordMessage('')
    setPasswordError('')
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleUpdatePassword = async () => {
    setPasswordMessage('')
    setPasswordError('')

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All password fields are required.')
      return
    }

    try {
      setSavingPassword(true)
      await changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      })
      setPasswordMessage('Password updated successfully.')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      setPasswordError(error?.message || 'Failed to update password.')
    } finally {
      setSavingPassword(false)
    }
  }

  const handlePickPhoto = () => {
    setPhotoError('')
    setPhotoMessage('')
    photoInputRef.current?.click()
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file.')
      return
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE_BYTES) {
      setPhotoError('Image size must be 5MB or smaller.')
      return
    }

    const uploadPhoto = async () => {
      setSavingPhoto(true)
      setPhotoError('')
      setPhotoMessage('')

      try {
        const payload = new FormData()
        payload.append('profile_photo', file)
        await updateProfile(payload)
        setPhotoMessage('Profile photo updated successfully.')
      } catch (error) {
        setPhotoError(error?.message || 'Failed to upload photo.')
      } finally {
        setSavingPhoto(false)
      }
    }

    uploadPhoto()
  }

  const openDeleteDialog = () => {
    setDeleteError('')
    setShowDeleteDialog(true)
  }

  const closeDeleteDialog = () => {
    if (deletingAccount) return
    setShowDeleteDialog(false)
  }

  const handleDeleteAccount = async () => {
    setDeleteError('')

    try {
      setDeletingAccount(true)
      await deleteAccount()
      navigate('/', { replace: true })
    } catch (error) {
      setDeleteError(error?.message || deleteErrorMessage)
    } finally {
      setDeletingAccount(false)
    }
  }

  return {
    user,
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
  }
}

export default useAccountProfile
