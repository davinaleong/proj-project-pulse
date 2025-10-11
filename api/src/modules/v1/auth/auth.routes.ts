import { Router } from 'express'
import { AuthController } from './auth.controller'
import { auth } from '../../../middlewares/auth'

const router = Router()
const authController = new AuthController()

// Public routes (no authentication required)
router.post('/login', authController.login)
router.post('/register', authController.register)
router.post('/refresh', authController.refreshToken)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)
router.post('/verify-email', authController.verifyEmail)

// Protected routes (authentication required)
router.get('/me', auth, authController.getCurrentUser)
router.post('/logout', auth, authController.logout)

export default router
