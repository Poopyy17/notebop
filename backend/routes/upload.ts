import { Router, Request, Response } from 'express'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { s3Client, S3_BUCKET } from '../lib/s3.js'
import { uploadImage } from '../middleware/upload.js'
import { stackServerApp } from '../lib/stack.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Helper function to extract S3 key from URL
function getS3KeyFromUrl(url: string): string | null {
  const bucketUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`
  if (url.startsWith(bucketUrl)) {
    return url.replace(bucketUrl, '')
  }
  return null
}

// Upload profile image endpoint
router.post(
  '/profile-image',
  uploadImage.single('image'),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.body

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' })
      }

      // Get user to check for existing profile image
      const user = await stackServerApp.getUser(userId)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Delete previous profile image from S3 if it exists
      const previousImageUrl = user.profileImageUrl
      if (previousImageUrl) {
        const previousKey = getS3KeyFromUrl(previousImageUrl)
        if (previousKey) {
          try {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: S3_BUCKET,
              Key: previousKey,
            })
            await s3Client.send(deleteCommand)
            console.log(`Deleted previous profile image: ${previousKey}`)
          } catch (deleteError) {
            // Log but don't fail the upload if delete fails
            console.error('Failed to delete previous profile image:', deleteError)
          }
        }
      }

      // Generate unique filename
      const fileExtension = req.file.originalname.split('.').pop()
      const fileName = `profile-images/${userId}/${uuidv4()}.${fileExtension}`

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })

      await s3Client.send(uploadCommand)

      // Construct the public URL
      const imageUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`

      // Update user profile in Stack Auth
      await user.update({ profileImageUrl: imageUrl })

      return res.json({
        success: true,
        imageUrl,
        message: 'Profile image uploaded successfully',
      })
    } catch (error) {
      console.error('Profile image upload error:', error)
      return res.status(500).json({ error: 'Failed to upload profile image' })
    }
  }
)

export default router
