import { Router } from 'express'
import { sessionController } from './session.controller'
import { auth } from '../../../middlewares/auth'

const sessionRouter = Router()

// Protected routes - require authentication
sessionRouter.use(auth)

// Get user sessions with filtering and pagination
sessionRouter.get('/', sessionController.getUserSessions)

// Get session statistics for the authenticated user
sessionRouter.get('/stats', sessionController.getSessionStats)

// Get session analytics for the authenticated user
sessionRouter.get('/analytics', sessionController.getSessionAnalytics)

// Check for suspicious activity in user sessions
sessionRouter.get('/security/alerts', sessionController.checkSuspiciousActivity)

// Get specific session by ID
sessionRouter.get('/:id', sessionController.getSessionById)

// Update session activity (keep-alive)
sessionRouter.put('/:id/activity', sessionController.updateSessionActivity)

// Revoke specific session
sessionRouter.delete('/:id', sessionController.revokeSession)

// Revoke all user sessions except current
sessionRouter.delete('/', sessionController.revokeAllUserSessions)

// Admin-only routes
// Clean up old sessions (admin only)
sessionRouter.delete('/admin/cleanup', sessionController.cleanupOldSessions)

// Bulk revoke sessions (admin only)
sessionRouter.post('/admin/bulk-revoke', sessionController.bulkRevokeSessions)

// Internal/utility routes
// Find session by token (for middleware/internal use)
sessionRouter.get('/token/:token', sessionController.findSessionByToken)

export default sessionRouter
