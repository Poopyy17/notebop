import { useState, useEffect, useRef } from 'react'
import { useUser } from '@stackframe/react'
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'
import { useUpdateDisplayName } from '@/hooks/useUpdateDisplayName'
import { useUpdatePassword } from '@/hooks/useUpdatePassword'
import { useUploadProfileImage } from '@/hooks/useUploadProfileImage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Camera, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/lib/toast'

export default function Account() {
  const { setBreadcrumbs } = useBreadcrumb()
  const user = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hooks for updating profile
  const {
    updateDisplayName,
    isLoading: isDisplayNameLoading,
    error: displayNameError,
    reset: resetDisplayName,
  } = useUpdateDisplayName()

  const {
    updatePassword,
    isLoading: isPasswordLoading,
    error: passwordError,
    reset: resetPassword,
  } = useUpdatePassword()

  const uploadProfileImage = useUploadProfileImage()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localPasswordError, setLocalPasswordError] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Account' }
    ])
  }, [setBreadcrumbs])

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setEmail(user.primaryEmail || '')
      setProfileImage(user.profileImageUrl || null)
    }
  }, [user])

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png']
      const allowedExtensions = ['.jpg', '.jpeg', '.png']
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      
      if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
        toast.error('Invalid file type. Only JPEG, JPG, and PNG images are allowed.')
        e.target.value = '' // Reset the input
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 5MB.')
        e.target.value = '' // Reset the input
        return
      }

      // Store the file for upload
      setSelectedFile(file)
      // Preview the image
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    resetDisplayName()

    let hasError = false

    // Upload image if a new file was selected
    if (selectedFile) {
      try {
        await uploadProfileImage.mutateAsync(selectedFile)
        setSelectedFile(null) // Clear the selected file after successful upload
      } catch (error) {
        hasError = true
        toast.error(error instanceof Error ? error.message : 'Failed to upload image')
      }
    }

    // Update display name
    const displayNameSuccess = await updateDisplayName(displayName)
    if (!displayNameSuccess) {
      hasError = true
    }

    if (!hasError) {
      toast.success('Profile updated successfully!')
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalPasswordError(null)
    resetPassword()

    if (newPassword !== confirmPassword) {
      setLocalPasswordError('New passwords do not match.')
      return
    }

    if (newPassword.length < 8) {
      setLocalPasswordError('Password must be at least 8 characters.')
      return
    }

    const success = await updatePassword({
      oldPassword: currentPassword,
      newPassword,
    })

    if (success) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password updated successfully!')
    }
  }

  // TODO: Make this a global config
  const userInitials = user?.displayName?.slice(0, 2).toUpperCase() || 
                       user?.primaryEmail?.slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account information and security settings.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Section */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your profile picture and display name.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <form id="profile-form" onSubmit={handleProfileSubmit}>
              <FieldGroup>
                {/* Profile Image */}
                <Field>
                  <FieldLabel>Profile Picture</FieldLabel>
                  <div className="flex items-center gap-4">
                    <div 
                      className="relative cursor-pointer group"
                      onClick={handleImageClick}
                    >
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profileImage || undefined} alt={displayName} />
                        <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <div className="text-sm text-muted-foreground">
                      <p>Click to upload a new photo</p>
                      <p className="text-xs mt-1">JPEG, JPG, or PNG only (max 5MB)</p>
                    </div>
                  </div>
                </Field>

                <Separator />

                {/* Display Name */}
                <Field>
                  <FieldLabel htmlFor="displayName">Display Name</FieldLabel>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </Field>

                {/* Email (Read-only for now) */}
                <Field>
                  <FieldLabel htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address.
                  </p>
                </Field>

                {displayNameError && <FieldError>{displayNameError}</FieldError>}
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="profile-form" disabled={isDisplayNameLoading || uploadProfileImage.isPending} className="w-full">
              {(isDisplayNameLoading || uploadProfileImage.isPending) ? (
                <>
                  <Spinner />
                  {uploadProfileImage.isPending ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Password Section */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <form id="password-form" onSubmit={handlePasswordSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                <Separator />

                <Field>
                  <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                {(localPasswordError || passwordError) && (
                  <FieldError>{localPasswordError || passwordError}</FieldError>
                )}
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="password-form" disabled={isPasswordLoading} className="w-full">
              {isPasswordLoading ? (
                <>
                  <Spinner />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}