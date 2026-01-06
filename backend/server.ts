import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import uploadRoutes from './routes/upload.js'
import boardsRoutes from './routes/boards.js'
import friendshipsRoutes from './routes/friendships.js'
import usersRoutes from './routes/users.js'
import notesRoutes from './routes/notes.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite dev server
  credentials: true,
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/boards', boardsRoutes)
app.use('/api/friendships', friendshipsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/notes', notesRoutes)

// Health check
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    services: {
      database: 'unknown',
      stackAuth: 'configured',
      s3: 'configured'
    }
  }

  // Check database connection
  try {
    const { default: postgres } = await import('@neondatabase/serverless')
    const sql = postgres(process.env.DATABASE_URL!)
    await sql`SELECT 1`
    healthCheck.services.database = 'connected'
  } catch (error) {
    healthCheck.services.database = 'disconnected'
    healthCheck.status = 'degraded'
  }

  // Check required environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'STACK_PROJECT_ID',
    'STACK_PUBLISHABLE_CLIENT_KEY',
    'STACK_SECRET_SERVER_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_S3_BUCKET'
  ]

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])
  if (missingEnvVars.length > 0) {
    healthCheck.status = 'error'
    healthCheck.services.stackAuth = missingEnvVars.some(v => v.startsWith('STACK_')) ? 'misconfigured' : 'configured'
    healthCheck.services.s3 = missingEnvVars.some(v => v.startsWith('AWS_')) ? 'misconfigured' : 'configured'
  }

  const statusCode = healthCheck.status === 'ok' ? 200 : healthCheck.status === 'degraded' ? 503 : 500
  res.status(statusCode).json(healthCheck)
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})