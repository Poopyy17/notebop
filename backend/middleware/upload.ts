import multer from 'multer'

// Configure multer for memory storage (we'll upload to S3)
const storage = multer.memoryStorage()

// File filter to only accept JPEG, JPG, PNG images
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png']
  const allowedExtensions = ['.jpg', '.jpeg', '.png']
  
  const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'))
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, and PNG images are allowed.'))
  }
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})
