import { Request, Response } from 'express'
import { SessionService } from './session.service'
import { createResponse } from '../../../utils/response'
import { sessionQuerySchema } from './session.model'

const sessionService = new SessionService()

class SessionController {
  // Get user sessions with filters and pagination
  async getUserSessions(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createResponse(
          res,
          401,
          'Unauthorized',
          'User not authenticated',
        )
      }

      const queryValidation = sessionQuerySchema.safeParse(req.query)
      if (!queryValidation.success) {
        return createResponse(
          res,
          400,
          'Validation error',
          queryValidation.error.issues,
        )
      }

      const result = await sessionService.getUserSessions(
        userId,
        queryValidation.data,
      )
      return createResponse(res, 200, 'Sessions retrieved successfully', result)
    } catch (error) {
      console.error('Get user sessions error:', error)
      return createResponse(res, 500, 'Internal server error')
    }
  }

  // Get session by ID
  async getSessionById(req: Request, res: Response) {
    try {
      const sessionId = parseInt(req.params.id)
      const userId = req.user?.id

      if (isNaN(sessionId)) {
        return createResponse(res, 400, 'Invalid session ID')
      }

      const session = await sessionService.getSessionById(sessionId, userId)
      if (!session) {
        return createResponse(res, 404, 'Session not found')
      }

      return createResponse(res, 200, 'Session retrieved successfully', session)
    } catch (error) {
      console.error('Get session by ID error:', error)
      return createResponse(res, 500, 'Internal server error')
    }
  }

  // Update session activity
  async updateSessionActivity(req: Request, res: Response) {
    try {
      const sessionId = parseInt(req.params.id)

      if (isNaN(sessionId)) {
        return createResponse(res, 400, 'Invalid session ID')
      }

      await sessionService.updateSessionActivity(sessionId)
      return createResponse(res, 200, 'Session activity updated successfully')
    } catch (error) {
      console.error('Update session activity error:', error)
      return createResponse(res, 500, 'Internal server error')
    }
  }

  // Revoke session
  async revokeSession(req: Request, res: Response) {
    try {
      const sessionId = parseInt(req.params.id)
      const userId = req.user?.id

      if (isNaN(sessionId)) {
        return createResponse(res, 400, 'Invalid session ID')
      }

      if (!userId) {
        return createResponse(res, 401, 'Unauthorized')
      }

      const success = await sessionService.revokeSession(sessionId, userId)
      if (!success) {
        return createResponse(res, 404, 'Session not found or access denied')
      }

      return createResponse(res, 200, 'Session revoked successfully')
    } catch (error) {
      console.error('Revoke session error:', error)
      return createResponse(res, 500, 'Internal server error')
    }
  }

  // Revoke all user sessions except current
  async revokeAllUserSessions(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      // Get current session ID from authorization header or custom header
      const currentSessionId = req.headers['x-session-id']
        ? parseInt(req.headers['x-session-id'] as string)
        : undefined

      if (!userId) {
        return createResponse(res, 401, 'Unauthorized')
      }

      const revokedCount = await sessionService.revokeAllUserSessions(
        userId,
        currentSessionId,
      )
      return createResponse(res, 200, 'Sessions revoked successfully', {
        revokedCount,
      })
    } catch (error) {
      console.error('Revoke all sessions error:', error)
      return createResponse(res, 500, 'Internal server error')
    }
  }

  // Clean up old sessions
  async cleanupOldSessions(req: Request, res: Response) {
    try {
      // This endpoint should be protected and only accessible by admin users
      if (req.user?.role !== 'admin') {
        return createResponse(res, 403, 'Access denied')
      }

      const daysOld = req.query.days ? parseInt(req.query.days as string) : 30
      const deletedCount = await sessionService.cleanupOldSessions(daysOld)
      return createResponse(res, 200, 'Old sessions cleaned up successfully', {
        deletedCount,
      })
    } catch (error) {
      console.error('Cleanup old sessions error:', error)
      return createResponse(res, 500, 'Internal server error')
    }
  }

  // Get session statistics
  async getSessionStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createResponse(res, 401, 'Unauthorized')
      }

      const stats = await sessionService.getSessionStats(userId)
      return createResponse(
        res,
        200,
        'Session statistics retrieved successfully',
        stats,
      )
    } catch (error) {
      console.error('Get session stats error:', error)
      return createResponse(res, 500, 'Internal server error')
    }
  }

  // Get session analytics
  async getSessionAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createResponse(res, 401, 'Unauthorized')
      }

      const analytics = await sessionService.getSessionAnalytics(userId)
      return createResponse(
        res,
        200,
        'Session analytics retrieved successfully',
        analytics,
      )
    } catch (error) {
      console.error('Get session analytics error:', error)
      return createResponse(res, 500, 'Internal server error')
    }
  }

  // Bulk revoke sessions (for admin purposes)
  async bulkRevokeSessions(req: Request, res: Response) {
    try {
      // This endpoint should be protected and only accessible by admin users
      if (req.user?.role !== 'admin') {
        return createResponse(res, 403, 'Access denied')
      }

      const { sessionIds } = req.body

      if (!Array.isArray(sessionIds)) {
        return createResponse(res, 400, 'Invalid session IDs')
      }

      const result = await sessionService.bulkRevokeSessions(sessionIds)
      return createResponse(
        res,
        200,
        'Bulk sessions revoked successfully',
        result,
      )
    } catch (error) {
      console.error('Bulk revoke sessions error:', error)
      return createResponse(res, 500, 'Internal server error')
    }
  }

  // Check for suspicious activity
  async checkSuspiciousActivity(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createResponse(res, 401, 'Unauthorized')
      }

      const alerts = await sessionService.checkSuspiciousActivity(userId)
      return createResponse(
        res,
        200,
        'Suspicious activity check completed',
        alerts,
      )
    } catch (error) {
      console.error('Check suspicious activity error:', error)
      return createResponse(res, 500, 'Internal server error')
    }
  }

  // Find session by token (for internal use)
  async findSessionByToken(req: Request, res: Response) {
    try {
      const { token } = req.params

      if (!token) {
        return createResponse(res, 400, 'Token is required')
      }

      const session = await sessionService.findSessionByToken(token)
      if (!session) {
        return createResponse(res, 404, 'Session not found')
      }

      return createResponse(res, 200, 'Session found', session)
    } catch (error) {
      console.error('Find session by token error:', error)
      return createResponse(res, 500, 'Internal server error')
    }
  }
}

export const sessionController = new SessionController()
