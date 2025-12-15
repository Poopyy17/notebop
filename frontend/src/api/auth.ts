const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface UpdatePasswordParams {
  userId: string
  email: string
  oldPassword: string
  newPassword: string
}

interface UpdatePasswordResponse {
  success?: boolean
  message?: string
  error?: string
}

export async function updatePasswordApi({
  userId,
  email,
  oldPassword,
  newPassword,
}: UpdatePasswordParams): Promise<UpdatePasswordResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, email, oldPassword, newPassword }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update password')
  }

  return data
}
