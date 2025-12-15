import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import uploadRoutes from './routes/upload.js'
import boardsRoutes from './routes/boards.js'
import friendshipsRoutes from './routes/friendships.js'
import usersRoutes from './routes/users.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true,
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/boards', boardsRoutes)
app.use('/api/friendships', friendshipsRoutes)
app.use('/api/users', usersRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'okssss' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})