import { Router } from 'express'
import * as passwordResetController from './passwordReset.controller'

const router = Router()

// Public routes (no authentication required)
router.post('/request', passwordResetController.requestPasswordReset)
router.post('/verify', passwordResetController.verifyResetToken)
router.post('/reset', passwordResetController.resetPassword)

// Admin routes (these would need admin authentication in production)
router.get('/tokens/:uuid', passwordResetController.getResetTokenDetails)
router.delete('/cleanup', passwordResetController.cleanupExpiredTokens)
router.get('/users/:userId/tokens', passwordResetController.getUserActiveTokens)
router.delete(
  '/users/:userId/tokens',
  passwordResetController.cancelUserResetTokens,
)

export default router
