import { Router } from 'express'
import noteRoutes from './notes/note.routes'
import { userRoutes } from './users/user.routes'

const router = Router()

// Mount module routes
router.use('/notes', noteRoutes)
router.use('/users', userRoutes)

// Health check for v1 API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API v1 is healthy',
    timestamp: new Date().toISOString(),
  })
})

export default router
