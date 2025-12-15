import { useMutation } from '@tanstack/react-query'
import { useUser } from '@stackframe/react'
import { uploadProfileImageApi } from '@/api/upload'
import type { UploadProfileImageResponse } from '@/api/upload'

interface UseUploadProfileImageOptions {
  onSuccess?: (data: UploadProfileImageResponse) => void
  onError?: (error: Error) => void
}

export function useUploadProfileImage(options?: UseUploadProfileImageOptions) {
  const user = useUser()

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return uploadProfileImageApi({
        userId: user.id,
        file,
      })
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}
