const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface UploadProfileImageParams {
  userId: string
  file: File
}

export interface UploadProfileImageResponse {
  success: boolean
  imageUrl: string
  message: string
}

export async function uploadProfileImageApi(
  params: UploadProfileImageParams
): Promise<UploadProfileImageResponse> {
  const formData = new FormData()
  formData.append('image', params.file)
  formData.append('userId', params.userId)

  const response = await fetch(`${API_URL}/api/upload/profile-image`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to upload profile image')
  }

  return response.json()
}
