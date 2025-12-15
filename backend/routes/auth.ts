import { Router, Request, Response } from 'express'
import { stackServerApp } from '../lib/stack.js'

const router = Router()

// Update password endpoint
// Takes userId, email, oldPassword, newPassword
// Verifies old password by attempting sign-in, then updates via server SDK
router.post('/update-password', async (req: Request, res: Response) => {
  try {
    const { userId, email, oldPassword, newPassword } = req.body

    if (!userId || !email) {
      return res.status(400).json({ error: 'User ID and email are required' })
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' })
    }

    // Get the user by ID from server
    const user = await stackServerApp.getUser(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify the email matches (basic security check)
    if (user.primaryEmail !== email) {
      return res.status(401).json({ error: 'Email mismatch' })
    }

    // Verify old password by attempting to sign in
    // This is the only way to verify password with Stack Auth
    const signInResult = await stackServerApp.signInWithCredential({
      email,
      password: oldPassword,
    })

    if (signInResult.status === 'error') {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    // Update the password using server API
    await user.setPassword({ password: newPassword })

    return res.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Password update error:', error)
    return res.status(500).json({ error: 'Failed to update password' })
  }
})

export default router
