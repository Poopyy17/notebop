import { useState } from 'react'
import { useUser } from '@stackframe/react'
import { updatePasswordApi } from '@/api/auth'

interface UpdatePasswordParams {
  oldPassword: string
  newPassword: string
}

interface UseUpdatePasswordReturn {
  updatePassword: (params: UpdatePasswordParams) => Promise<boolean>
  isLoading: boolean
  error: string | null
  isSuccess: boolean
  reset: () => void
}

export function useUpdatePassword(): UseUpdatePasswordReturn {
  const user = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const reset = () => {
    setError(null)
    setIsSuccess(false)
  }

  const updatePassword = async ({ oldPassword, newPassword }: UpdatePasswordParams): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    setIsLoading(true)
    setError(null)
    setIsSuccess(false)

    try {
      if (!user.id || !user.primaryEmail) {
        setError('User information not available')
        return false
      }

      await updatePasswordApi({
        userId: user.id,
        email: user.primaryEmail,
        oldPassword,
        newPassword,
      })

      setIsSuccess(true)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update password'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    updatePassword,
    isLoading,
    error,
    isSuccess,
    reset,
  }
}
