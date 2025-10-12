import { Router } from 'express'
import authRoutes from './auth/auth.routes'
import noteRoutes from './notes/note.routes'
import sessionRoutes from './sessions/session.routes'
import userRoutes from './users/user.routes'
import profileRoutes from './profiles/profile.routes'

const router = Router()

// Mount module routes
router.use('/auth', authRoutes)
router.use('/notes', noteRoutes)
router.use('/sessions', sessionRoutes)
router.use('/users', userRoutes)
router.use('/profiles', profileRoutes)

// Health check for v1 API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API v1 is healthy',
    timestamp: new Date().toISOString(),
  })
})

export default router
