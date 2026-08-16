import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'
import { getApiErrorMessage } from '../api/errors'
import { useAuth } from '../features/auth/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { roleLabels } from '../lib/constants'
import { formatDate } from '../lib/format'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()

  const [name, setName] = useState(user?.name ?? '')
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const updateProfileMutation = useMutation({
    mutationFn: (newName: string) => authApi.updateProfile(newName),
    onSuccess: async () => {
      setNameSaved(true)
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError(null)
      setPasswordMessage('Password changed successfully.')
    },
  })

  const handleUpdateName = () => {
    setNameError(null)
    if (!name.trim()) {
      setNameError('Name is required.')
      return
    }
    updateProfileMutation.mutate(name.trim(), {
      onError: (err) => setNameError(getApiErrorMessage(err)),
    })
  }

  const handleChangePassword = () => {
    setPasswordMessage(null)
    setPasswordError(null)
    if (!currentPassword) {
      setPasswordError('Enter your current password.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      { onError: (err) => setPasswordError(getApiErrorMessage(err)) },
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Profile</h1>
        <p className="text-sm text-gray-500">Your account information.</p>
      </div>

      <Card className="p-5">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="mt-1 font-medium text-gray-800">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Role</dt>
            <dd className="mt-1">
              <Badge tone="blue">{user ? roleLabels[user.role] : ''}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Department</dt>
            <dd className="mt-1 text-gray-800">{user?.departmentName ?? '\u2014'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Member since</dt>
            <dd className="mt-1 text-gray-800">{formatDate(user?.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Status</dt>
            <dd className="mt-1">
              <Badge tone={user?.isActive ? 'green' : 'gray'}>
                {user?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-800">Edit name</h2>
        <div className="mt-4 space-y-4">
          <Input
            id="profile-name"
            label="Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setNameSaved(false)
            }}
          />
          {nameError && <p className="text-xs text-red-600">{nameError}</p>}
          {nameSaved && <p className="text-xs text-green-600">Saved successfully.</p>}
          <div className="flex justify-end">
            <Button onClick={handleUpdateName} loading={updateProfileMutation.isPending}>
              Save changes
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-800">Change password</h2>
        <div className="mt-4 space-y-4">
          <Input
            id="current-password"
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            id="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            id="confirm-password"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
          {passwordMessage && <p className="text-xs text-green-600">{passwordMessage}</p>}
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} loading={changePasswordMutation.isPending}>
              Update password
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}