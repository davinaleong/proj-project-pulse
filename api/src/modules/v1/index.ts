import { Router } from 'express'
import authRoutes from './auth/auth.routes'
import noteRoutes from './notes/note.routes'
import sessionRoutes from './sessions/session.routes'
import userRoutes from './users/user.routes'
import profileRoutes from './profiles/profile.routes'
import settingRoutes from './settings/setting.routes'
import passwordResetRoutes from './password-resets/passwordReset.routes'
import projectRoutes from './projects'

const router = Router()

// Mount module routes
router.use('/auth', authRoutes)
router.use('/notes', noteRoutes)
router.use('/sessions', sessionRoutes)
router.use('/users', userRoutes)
router.use('/profiles', profileRoutes)
router.use('/settings', settingRoutes)
router.use('/password-resets', passwordResetRoutes)
router.use('/projects', projectRoutes)

// Health check for v1 API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API v1 is healthy',
    timestamp: new Date().toISOString(),
  })
})

export default router
