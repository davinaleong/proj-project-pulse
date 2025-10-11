import { SessionService } from '../../../src/modules/v1/sessions/session.service'
import { PrismaClient } from '@prisma/client'
import {
  SessionDto,
  SessionWithUserDto,
  SessionListResponse,
  SessionQueryParams,
  SessionStatsDto,
  SessionAnalytics,
  BulkOperationResult,
} from '../../../src/modules/v1/sessions/session.model'

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    session: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  })),
  Prisma: {
    SessionWhereInput: {},
  },
}))

describe('SessionService', () => {
  let sessionService: SessionService
  let mockPrisma: jest.Mocked<PrismaClient>

  beforeEach(() => {
    sessionService = new SessionService()
    mockPrisma = (sessionService as any).prisma
    jest.clearAllMocks()
  })

  describe('getUserSessions', () => {
    const mockUser = {
      id: 1,
      uuid: 'user-uuid',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    }
    const mockSession: SessionDto = {
      id: 1,
      userId: 1,
      userAgent: 'Mozilla/5.0',
      ipAddress: '192.168.1.1',
      lastActiveAt: new Date(),
      revokedAt: null,
      isActive: true,
      createdAt: new Date(),
    }

    it('should return paginated user sessions', async () => {
      const params: SessionQueryParams = {
        page: 1,
        limit: 10,
        sortBy: 'lastActiveAt',
        sortOrder: 'desc',
      }

      mockPrisma.session.findMany.mockResolvedValue([mockSession])
      mockPrisma.session.count.mockResolvedValue(1)

      const result = await sessionService.getUserSessions(1, params)

      expect(result).toEqual({
        sessions: [mockSession],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      })

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        select: expect.any(Object),
        orderBy: { lastActiveAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('should filter active sessions when active parameter is provided', async () => {
      const params: SessionQueryParams = {
        page: 1,
        limit: 10,
        sortBy: 'lastActiveAt',
        sortOrder: 'desc',
        active: true,
      }

      mockPrisma.session.findMany.mockResolvedValue([mockSession])
      mockPrisma.session.count.mockResolvedValue(1)

      await sessionService.getUserSessions(1, params)

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          revokedAt: null,
        },
        select: expect.any(Object),
        orderBy: { lastActiveAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('should filter inactive sessions when active is false', async () => {
      const params: SessionQueryParams = {
        page: 1,
        limit: 10,
        sortBy: 'lastActiveAt',
        sortOrder: 'desc',
        active: false,
      }

      mockPrisma.session.findMany.mockResolvedValue([])
      mockPrisma.session.count.mockResolvedValue(0)

      await sessionService.getUserSessions(1, params)

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          revokedAt: { not: null },
        },
        select: expect.any(Object),
        orderBy: { lastActiveAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('should handle pagination correctly', async () => {
      const params: SessionQueryParams = {
        page: 2,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      }

      mockPrisma.session.findMany.mockResolvedValue([])
      mockPrisma.session.count.mockResolvedValue(10)

      const result = await sessionService.getUserSessions(1, params)

      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 10,
        pages: 2,
      })

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        select: expect.any(Object),
        orderBy: { createdAt: 'asc' },
        skip: 5,
        take: 5,
      })
    })
  })

  describe('getSessionById', () => {
    const mockSessionWithUser = {
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

    it('should return session by id without user filter', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(mockSessionWithUser)

      const result = await sessionService.getSessionById(1)

      expect(result).toEqual(mockSessionWithUser)
      expect(mockPrisma.session.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { user: { select: expect.any(Object) } },
      })
    })

    it('should return session by id with user filter', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(mockSessionWithUser)

      const result = await sessionService.getSessionById(1, 1)

      expect(result).toEqual(mockSessionWithUser)
      expect(mockPrisma.session.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        include: { user: { select: expect.any(Object) } },
      })
    })

    it('should return null when session not found', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(null)

      const result = await sessionService.getSessionById(999)

      expect(result).toBeNull()
    })
  })

  describe('createSession', () => {
    const sessionData = {
      userId: 1,
      userAgent: 'Mozilla/5.0',
      ipAddress: '192.168.1.1',
    }

    it('should create a new session successfully', async () => {
      const mockCreatedSession = {
        id: 1,
        ...sessionData,
        lastActiveAt: new Date(),
        revokedAt: null,
        isActive: true,
        createdAt: new Date(),
      }

      mockPrisma.session.create.mockResolvedValue(mockCreatedSession)

      const result = await sessionService.createSession(sessionData)

      expect(result).toEqual(mockCreatedSession)
      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: {
          userId: sessionData.userId,
          userAgent: sessionData.userAgent,
          ipAddress: sessionData.ipAddress,
          lastActiveAt: expect.any(Date),
          isActive: true,
        },
      })
    })

    it('should handle missing optional fields', async () => {
      const minimalSessionData = { userId: 1 }
      const mockCreatedSession = {
        id: 1,
        userId: 1,
        userAgent: null,
        ipAddress: null,
        lastActiveAt: new Date(),
        revokedAt: null,
        isActive: true,
        createdAt: new Date(),
      }

      mockPrisma.session.create.mockResolvedValue(mockCreatedSession)

      const result = await sessionService.createSession(minimalSessionData)

      expect(result).toEqual(mockCreatedSession)
      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          userAgent: undefined,
          ipAddress: undefined,
          lastActiveAt: expect.any(Date),
          isActive: true,
        },
      })
    })
  })

  describe('updateSessionActivity', () => {
    it('should update session activity successfully', async () => {
      mockPrisma.session.update.mockResolvedValue({
        id: 1,
        userId: 1,
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        lastActiveAt: new Date(),
        revokedAt: null,
        isActive: true,
        createdAt: new Date(),
      })

      await sessionService.updateSessionActivity(1)

      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lastActiveAt: expect.any(Date) },
      })
    })

    it('should handle non-existent session', async () => {
      mockPrisma.session.update.mockRejectedValue(
        new Error('Session not found'),
      )

      await expect(sessionService.updateSessionActivity(999)).rejects.toThrow(
        'Session not found',
      )
    })
  })

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      mockPrisma.session.updateMany.mockResolvedValue({ count: 1 })

      const result = await sessionService.revokeSession(1)

      expect(result).toBe(true)
      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { revokedAt: expect.any(Date) },
      })
    })

    it('should revoke session with user filter', async () => {
      mockPrisma.session.updateMany.mockResolvedValue({ count: 1 })

      const result = await sessionService.revokeSession(1, 1)

      expect(result).toBe(true)
      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        data: { revokedAt: expect.any(Date) },
      })
    })

    it('should return false when session not found', async () => {
      mockPrisma.session.updateMany.mockResolvedValue({ count: 0 })

      const result = await sessionService.revokeSession(999)

      expect(result).toBe(false)
    })

    it('should handle database errors', async () => {
      mockPrisma.session.updateMany.mockRejectedValue(
        new Error('Database error'),
      )

      await expect(sessionService.revokeSession(1)).rejects.toThrow(
        'Database error',
      )
    })
  })

  describe('revokeAllUserSessions', () => {
    it('should revoke all user sessions', async () => {
      mockPrisma.session.updateMany.mockResolvedValue({ count: 3 })

      const result = await sessionService.revokeAllUserSessions(1)

      expect(result).toBe(3)
      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      })
    })

    it('should exclude specific session when provided', async () => {
      mockPrisma.session.updateMany.mockResolvedValue({ count: 2 })

      const result = await sessionService.revokeAllUserSessions(1, 5)

      expect(result).toBe(2)
      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          revokedAt: null,
          id: { not: 5 },
        },
        data: { revokedAt: expect.any(Date) },
      })
    })
  })

  describe('getSessionStats', () => {
    it('should return session statistics', async () => {
      const mockStats = [
        { _count: { id: 10 }, revokedAt: null }, // active sessions
        { _count: { id: 5 }, revokedAt: expect.any(Date) }, // revoked sessions
      ]

      mockPrisma.session.count
        .mockResolvedValueOnce(15) // total sessions
        .mockResolvedValueOnce(10) // active sessions
        .mockResolvedValueOnce(5) // revoked sessions

      mockPrisma.session.aggregate.mockResolvedValue({
        _count: { userAgent: 3, ipAddress: 4 },
        _max: { lastActiveAt: new Date() },
      })

      const result = await sessionService.getSessionStats(1)

      expect(result).toEqual({
        totalSessions: 15,
        activeSessions: 10,
        revokedSessions: 5,
        uniqueDevices: 3,
        uniqueIpAddresses: 4,
        lastActivity: expect.any(Date),
      })
    })

    it('should handle user with no sessions', async () => {
      mockPrisma.session.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)

      mockPrisma.session.aggregate.mockResolvedValue({
        _count: { userAgent: 0, ipAddress: 0 },
        _max: { lastActiveAt: null },
      })

      const result = await sessionService.getSessionStats(1)

      expect(result).toEqual({
        totalSessions: 0,
        activeSessions: 0,
        revokedSessions: 0,
        uniqueDevices: 0,
        uniqueIpAddresses: 0,
        lastActivity: null,
      })
    })
  })

  describe('getSessionAnalytics', () => {
    it('should return comprehensive session analytics', async () => {
      // Mock various analytics queries
      mockPrisma.session.count
        .mockResolvedValueOnce(15) // total sessions
        .mockResolvedValueOnce(5) // active sessions
        .mockResolvedValueOnce(3) // sessions today
        .mockResolvedValueOnce(12) // sessions this week
        .mockResolvedValueOnce(45) // sessions this month

      mockPrisma.session.aggregate.mockResolvedValue({
        _avg: { duration: 3600000 }, // average duration
      })

      // Mock device breakdown
      mockPrisma.session.findMany
        .mockResolvedValueOnce([
          {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
          },
          {
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0) Safari/604.1',
          },
        ])
        .mockResolvedValueOnce([
          { ipAddress: '192.168.1.1' },
          { ipAddress: '192.168.1.2' },
        ])

      const result = await sessionService.getSessionAnalytics(1)

      expect(result).toEqual({
        totalSessions: 15,
        activeSessions: 5,
        sessionsToday: 3,
        sessionsThisWeek: 12,
        sessionsThisMonth: 45,
        averageSessionDuration: 3600000,
        topDevices: expect.any(Array),
        topLocations: expect.any(Array),
        hourlyActivity: expect.any(Array),
      })

      expect(result.hourlyActivity).toHaveLength(24)
    })
  })

  describe('bulkRevokeSessions', () => {
    it('should revoke multiple sessions successfully', async () => {
      const sessionIds = [1, 2, 3]
      mockPrisma.session.updateMany.mockResolvedValue({ count: 3 })

      const result = await sessionService.bulkRevokeSessions(sessionIds)

      expect(result).toEqual({
        success: 3,
        failed: 0,
        errors: [],
      })

      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: { id: { in: sessionIds } },
        data: { revokedAt: expect.any(Date) },
      })
    })

    it('should handle partial failures', async () => {
      const sessionIds = [1, 2, 3, 999]
      mockPrisma.session.updateMany.mockResolvedValue({ count: 3 }) // Only 3 out of 4 updated

      const result = await sessionService.bulkRevokeSessions(sessionIds)

      expect(result).toEqual({
        success: 3,
        failed: 1,
        errors: [
          { sessionId: 999, error: 'Session not found or already revoked' },
        ],
      })
    })
  })

  describe('cleanupOldSessions', () => {
    it('should delete old sessions successfully', async () => {
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 5 })

      const result = await sessionService.cleanupOldSessions(30)

      expect(result).toBe(5)
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { revokedAt: { lt: expect.any(Date) } },
            {
              revokedAt: null,
              lastActiveAt: { lt: expect.any(Date) },
            },
          ],
        },
      })
    })

    it('should use default days when not provided', async () => {
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 2 })

      const result = await sessionService.cleanupOldSessions()

      expect(result).toBe(2)
      expect(mockPrisma.session.deleteMany).toHaveBeenCalled()
    })
  })

  describe('findSessionByToken', () => {
    it('should find session by token', async () => {
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

      mockPrisma.session.findFirst.mockResolvedValue(mockSession)

      const result = await sessionService.findSessionByToken('valid-token')

      expect(result).toEqual(mockSession)
      expect(mockPrisma.session.findFirst).toHaveBeenCalledWith({
        where: {
          isActive: true,
          revokedAt: null,
        },
      })
    })

    it('should return null for invalid token', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(null)

      const result = await sessionService.findSessionByToken('invalid-token')

      expect(result).toBeNull()
    })
  })

  describe('checkSuspiciousActivity', () => {
    it('should detect new device activity', async () => {
      // Mock recent sessions with different user agents
      mockPrisma.session.findMany.mockResolvedValue([
        {
          id: 1,
          userId: 1,
          userAgent: 'New Unknown Browser',
          ipAddress: '192.168.1.100',
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          userAgent: 'Chrome/91.0',
          ipAddress: '192.168.1.1',
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
      ])

      mockPrisma.session.count.mockResolvedValue(6) // More than 5 concurrent sessions

      const alerts = await sessionService.checkSuspiciousActivity(1)

      expect(alerts).toHaveLength(2) // New device + concurrent sessions
      expect(alerts[0].type).toBe('NEW_DEVICE')
      expect(alerts[1].type).toBe('CONCURRENT_SESSIONS')
    })

    it('should return empty array when no suspicious activity detected', async () => {
      mockPrisma.session.findMany.mockResolvedValue([])
      mockPrisma.session.count.mockResolvedValue(2)

      const alerts = await sessionService.checkSuspiciousActivity(1)

      expect(alerts).toHaveLength(0)
    })
  })
})
