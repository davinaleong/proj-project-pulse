import { Request, Response } from 'express'
import { sessionController } from '../../../src/modules/v1/sessions/session.controller'
import { SessionService } from '../../../src/modules/v1/sessions/session.service'
import { createResponse } from '../../../src/utils/response'

// Mock dependencies
jest.mock('../../../src/modules/v1/sessions/session.service')
jest.mock('../../../src/utils/response')

// Helper functions
const createMockUser = (role: string = 'USER') => ({
  id: 1,
  uuid: 'test-uuid',
  email: 'test@example.com',
  role,
  name: 'Test User',
  status: 'ACTIVE',
  emailVerifiedAt: null,
  lastLoginAt: null,
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('SessionController', () => {
  let mockSessionService: jest.Mocked<SessionService>
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockCreateResponse: jest.MockedFunction<typeof createResponse>

  beforeEach(() => {
    mockSessionService = new SessionService() as jest.Mocked<SessionService>
    mockRequest = {
      user: createMockUser(),
      params: {},
      query: {},
      body: {},
      headers: {},
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    mockCreateResponse = createResponse as jest.MockedFunction<
      typeof createResponse
    >

    // Reset all mocks
    jest.clearAllMocks()
  })

  describe('getUserSessions', () => {
    it('should return user sessions successfully', async () => {
      const mockSessions = {
        sessions: [
          {
            id: 1,
            userId: 1,
            userAgent: 'Mozilla/5.0',
            ipAddress: '192.168.1.1',
            lastActiveAt: new Date(),
            revokedAt: null,
            isActive: true,
            createdAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      }

      mockSessionService.getUserSessions.mockResolvedValue(mockSessions)
      mockRequest.query = { page: '1', limit: '10' }

      await sessionController.getUserSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockSessionService.getUserSessions).toHaveBeenCalledWith(
        1,
        expect.any(Object),
      )
      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Sessions retrieved successfully',
        mockSessions,
      )
    })

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined

      await sessionController.getUserSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        401,
        'Unauthorized',
        'User not authenticated',
      )
      expect(mockSessionService.getUserSessions).not.toHaveBeenCalled()
    })

    it('should return 400 when query validation fails', async () => {
      mockRequest.query = { page: 'invalid', limit: '10' }

      await sessionController.getUserSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        400,
        'Validation error',
        expect.any(Array),
      )
      expect(mockSessionService.getUserSessions).not.toHaveBeenCalled()
    })

    it('should return 500 when service throws error', async () => {
      mockSessionService.getUserSessions.mockRejectedValue(
        new Error('Database error'),
      )
      mockRequest.query = { page: '1', limit: '10' }

      await sessionController.getUserSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        500,
        'Internal server error',
      )
    })
  })

  describe('getSessionById', () => {
    it('should return session by id successfully', async () => {
      const mockSession = {
        id: 1,
        userId: 1,
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        lastActiveAt: new Date(),
        revokedAt: null,
        isActive: true,
        createdAt: new Date(),
        user: {
          id: 1,
          uuid: 'user-uuid',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
        },
      }

      mockSessionService.getSessionById.mockResolvedValue(mockSession)
      mockRequest.params = { id: '1' }

      await sessionController.getSessionById(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockSessionService.getSessionById).toHaveBeenCalledWith(1, 1)
      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Session retrieved successfully',
        mockSession,
      )
    })

    it('should return 400 for invalid session ID', async () => {
      mockRequest.params = { id: 'invalid' }

      await sessionController.getSessionById(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        400,
        'Invalid session ID',
      )
      expect(mockSessionService.getSessionById).not.toHaveBeenCalled()
    })

    it('should return 404 when session not found', async () => {
      mockSessionService.getSessionById.mockResolvedValue(null)
      mockRequest.params = { id: '999' }

      await sessionController.getSessionById(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        404,
        'Session not found',
      )
    })
  })

  describe('updateSessionActivity', () => {
    it('should update session activity successfully', async () => {
      mockSessionService.updateSessionActivity.mockResolvedValue()
      mockRequest.params = { id: '1' }

      await sessionController.updateSessionActivity(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockSessionService.updateSessionActivity).toHaveBeenCalledWith(1)
      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Session activity updated successfully',
      )
    })

    it('should return 400 for invalid session ID', async () => {
      mockRequest.params = { id: 'invalid' }

      await sessionController.updateSessionActivity(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        400,
        'Invalid session ID',
      )
      expect(mockSessionService.updateSessionActivity).not.toHaveBeenCalled()
    })
  })

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      mockSessionService.revokeSession.mockResolvedValue(true)
      mockRequest.params = { id: '1' }

      await sessionController.revokeSession(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockSessionService.revokeSession).toHaveBeenCalledWith(1, 1)
      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Session revoked successfully',
      )
    })

    it('should return 404 when session not found', async () => {
      mockSessionService.revokeSession.mockResolvedValue(false)
      mockRequest.params = { id: '999' }

      await sessionController.revokeSession(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        404,
        'Session not found or access denied',
      )
    })

    it('should return 401 when user not authenticated', async () => {
      mockRequest.user = undefined
      mockRequest.params = { id: '1' }

      await sessionController.revokeSession(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        401,
        'Unauthorized',
      )
      expect(mockSessionService.revokeSession).not.toHaveBeenCalled()
    })
  })

  describe('revokeAllUserSessions', () => {
    it('should revoke all user sessions successfully', async () => {
      mockSessionService.revokeAllUserSessions.mockResolvedValue(3)
      mockRequest.headers = { 'x-session-id': '1' }

      await sessionController.revokeAllUserSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockSessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        1,
        1,
      )
      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Sessions revoked successfully',
        { revokedCount: 3 },
      )
    })

    it('should handle missing session ID header', async () => {
      mockSessionService.revokeAllUserSessions.mockResolvedValue(2)
      mockRequest.headers = {}

      await sessionController.revokeAllUserSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockSessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        1,
        undefined,
      )
    })

    it('should return 401 when user not authenticated', async () => {
      mockRequest.user = undefined

      await sessionController.revokeAllUserSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        401,
        'Unauthorized',
      )
      expect(mockSessionService.revokeAllUserSessions).not.toHaveBeenCalled()
    })
  })

  describe('cleanupOldSessions', () => {
    it('should cleanup old sessions successfully for admin', async () => {
      mockRequest.user = createMockUser('ADMIN')
      mockRequest.query = { days: '30' }
      mockSessionService.cleanupOldSessions.mockResolvedValue(5)

      await sessionController.cleanupOldSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockSessionService.cleanupOldSessions).toHaveBeenCalledWith(30)
      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Old sessions cleaned up successfully',
        { deletedCount: 5 },
      )
    })

    it('should use default days when not provided', async () => {
      mockRequest.user = createMockUser('ADMIN')
      mockRequest.query = {}
      mockSessionService.cleanupOldSessions.mockResolvedValue(2)

      await sessionController.cleanupOldSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockSessionService.cleanupOldSessions).toHaveBeenCalledWith(30)
    })

    it('should return 403 for non-admin users', async () => {
      mockRequest.user = createMockUser('USER')

      await sessionController.cleanupOldSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        403,
        'Access denied',
      )
      expect(mockSessionService.cleanupOldSessions).not.toHaveBeenCalled()
    })
  })

  describe('getSessionStats', () => {
    it('should return session statistics successfully', async () => {
      const mockStats = {
        totalSessions: 10,
        activeSessions: 5,
        revokedSessions: 5,
        uniqueDevices: 3,
        uniqueIpAddresses: 4,
        lastActivity: new Date(),
      }

      mockSessionService.getSessionStats.mockResolvedValue(mockStats)

      await sessionController.getSessionStats(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockSessionService.getSessionStats).toHaveBeenCalledWith(1)
      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Session statistics retrieved successfully',
        mockStats,
      )
    })

    it('should return 401 when user not authenticated', async () => {
      mockRequest.user = undefined

      await sessionController.getSessionStats(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        401,
        'Unauthorized',
      )
      expect(mockSessionService.getSessionStats).not.toHaveBeenCalled()
    })
  })

  describe('getSessionAnalytics', () => {
    it('should return session analytics successfully', async () => {
      const mockAnalytics = {
        totalSessions: 15,
        activeSessions: 5,
        sessionsToday: 3,
        sessionsThisWeek: 12,
        sessionsThisMonth: 45,
        averageSessionDuration: 3600000,
        topDevices: [{ device: 'desktop', count: 10 }],
        topLocations: [{ location: 'New York', count: 8 }],
        hourlyActivity: [{ hour: 14, count: 5 }],
      }

      mockSessionService.getSessionAnalytics.mockResolvedValue(mockAnalytics)

      await sessionController.getSessionAnalytics(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockSessionService.getSessionAnalytics).toHaveBeenCalledWith(1)
      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Session analytics retrieved successfully',
        mockAnalytics,
      )
    })

    it('should return 401 when user not authenticated', async () => {
      mockRequest.user = undefined

      await sessionController.getSessionAnalytics(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        401,
        'Unauthorized',
      )
      expect(mockSessionService.getSessionAnalytics).not.toHaveBeenCalled()
    })
  })

  describe('bulkRevokeSessions', () => {
    it('should bulk revoke sessions successfully for admin', async () => {
      mockRequest.user = createMockUser('ADMIN')
      mockRequest.body = { sessionIds: [1, 2, 3] }
      const mockResult = {
        success: 3,
        failed: 0,
        errors: [],
      }

      mockSessionService.bulkRevokeSessions.mockResolvedValue(mockResult)

      await sessionController.bulkRevokeSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockSessionService.bulkRevokeSessions).toHaveBeenCalledWith([
        1, 2, 3,
      ])
      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Bulk sessions revoked successfully',
        mockResult,
      )
    })

    it('should return 400 for invalid session IDs', async () => {
      mockRequest.user = createMockUser('ADMIN')
      mockRequest.body = { sessionIds: 'invalid' }

      await sessionController.bulkRevokeSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        400,
        'Invalid session IDs',
      )
      expect(mockSessionService.bulkRevokeSessions).not.toHaveBeenCalled()
    })

    it('should return 403 for non-admin users', async () => {
      mockRequest.user = createMockUser('USER')
      mockRequest.body = { sessionIds: [1, 2, 3] }

      await sessionController.bulkRevokeSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        403,
        'Access denied',
      )
      expect(mockSessionService.bulkRevokeSessions).not.toHaveBeenCalled()
    })
  })

  describe('checkSuspiciousActivity', () => {
    it('should return suspicious activity alerts', async () => {
      const mockAlerts = [
        {
          type: 'NEW_DEVICE' as const,
          sessionId: 123,
          userId: 1,
          details: { userAgent: 'New browser detected' },
          timestamp: new Date(),
        },
      ]

      mockSessionService.checkSuspiciousActivity.mockResolvedValue(mockAlerts)

      await sessionController.checkSuspiciousActivity(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockSessionService.checkSuspiciousActivity).toHaveBeenCalledWith(1)
      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Suspicious activity check completed',
        mockAlerts,
      )
    })

    it('should return 401 when user not authenticated', async () => {
      mockRequest.user = undefined

      await sessionController.checkSuspiciousActivity(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        401,
        'Unauthorized',
      )
      expect(mockSessionService.checkSuspiciousActivity).not.toHaveBeenCalled()
    })
  })

  describe('findSessionByToken', () => {
    it('should find session by token successfully', async () => {
      const mockSession = {
        id: 1,
        userId: 1,
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        lastActiveAt: new Date(),
        revokedAt: null,
        isActive: true,
        createdAt: new Date(),
      }

      mockSessionService.findSessionByToken.mockResolvedValue(mockSession)
      mockRequest.params = { token: 'valid-token' }

      await sessionController.findSessionByToken(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockSessionService.findSessionByToken).toHaveBeenCalledWith(
        'valid-token',
      )
      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Session found',
        mockSession,
      )
    })

    it('should return 400 when token is missing', async () => {
      mockRequest.params = {}

      await sessionController.findSessionByToken(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        400,
        'Token is required',
      )
      expect(mockSessionService.findSessionByToken).not.toHaveBeenCalled()
    })

    it('should return 404 when session not found', async () => {
      mockSessionService.findSessionByToken.mockResolvedValue(null)
      mockRequest.params = { token: 'invalid-token' }

      await sessionController.findSessionByToken(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        404,
        'Session not found',
      )
    })
  })

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      mockSessionService.getUserSessions.mockRejectedValue(
        new Error('Service error'),
      )
      mockRequest.query = { page: '1', limit: '10' }

      await sessionController.getUserSessions(
        mockRequest as Request,
        mockResponse as Response,
      )

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockResponse,
        500,
        'Internal server error',
      )
    })
  })
})
