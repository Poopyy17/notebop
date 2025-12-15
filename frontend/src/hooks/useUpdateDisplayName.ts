import { useState } from 'react'
import { useUser } from '@stackframe/react'

interface UseUpdateDisplayNameReturn {
  updateDisplayName: (displayName: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
  isSuccess: boolean
  reset: () => void
}

export function useUpdateDisplayName(): UseUpdateDisplayNameReturn {
  const user = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const reset = () => {
    setError(null)
    setIsSuccess(false)
  }

  const updateDisplayName = async (displayName: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    setIsLoading(true)
    setError(null)
    setIsSuccess(false)

    try {
      await user.update({ displayName })
      setIsSuccess(true)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update display name'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    updateDisplayName,
    isLoading,
    error,
    isSuccess,
    reset,
  }
}
