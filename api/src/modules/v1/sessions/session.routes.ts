import { Router } from 'express'
import { sessionController } from './session.controller'
import { auth } from '../../../middlewares/auth'

const router = Router()

// Protected routes - require authentication
router.use(auth)

// Get user sessions with filtering and pagination
router.get('/', sessionController.getUserSessions)

// Get session statistics for the authenticated user
router.get('/stats', sessionController.getSessionStats)

// Get session analytics for the authenticated user
router.get('/analytics', sessionController.getSessionAnalytics)

// Check for suspicious activity in user sessions
router.get('/security/alerts', sessionController.checkSuspiciousActivity)

// Get specific session by ID
router.get('/:id', sessionController.getSessionById)

// Update session activity (keep-alive)
router.put('/:id/activity', sessionController.updateSessionActivity)

// Revoke specific session
router.delete('/:id', sessionController.revokeSession)

// Revoke all user sessions except current
router.delete('/', sessionController.revokeAllUserSessions)

// Admin-only routes
// Clean up old sessions (admin only)
router.delete('/admin/cleanup', sessionController.cleanupOldSessions)

// Bulk revoke sessions (admin only)
router.post('/admin/bulk-revoke', sessionController.bulkRevokeSessions)

// Internal/utility routes
// Find session by token (for middleware/internal use)
router.get('/token/:token', sessionController.findSessionByToken)

export default router
