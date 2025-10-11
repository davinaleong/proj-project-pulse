import { PrismaClient, Prisma } from '@prisma/client'
import {
  SessionDto,
  SessionWithUserDto,
  SessionListResponse,
  SessionQueryParams,
  SessionStatsDto,
  SessionAnalytics,
  BulkOperationResult,
  DeviceInfo,
  SecurityAlert,
} from './session.model'

const prisma = new PrismaClient()

export class SessionService {
  // Get current user's sessions
  async getUserSessions(
    userId: number,
    params: SessionQueryParams,
  ): Promise<SessionListResponse> {
    const { page, limit, sortBy, sortOrder, active } = params

    const where: Prisma.SessionWhereInput = {
      userId,
    }

    if (active !== undefined) {
      if (active) {
        where.revokedAt = null
      } else {
        where.revokedAt = { not: null }
      }
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        select: {
          id: true,
          userId: true,
          userAgent: true,
          ipAddress: true,
          lastActiveAt: true,
          revokedAt: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.session.count({ where }),
    ])

    const sessionDtos: SessionDto[] = sessions.map((session) => ({
      ...session,
      isActive: session.revokedAt === null,
      createdAt: new Date(), // Placeholder since createdAt is not in schema
    }))

    return {
      sessions: sessionDtos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  // Get session details by ID
  async getSessionById(
    sessionId: number,
    userId?: number,
  ): Promise<SessionWithUserDto | null> {
    const where: Prisma.SessionWhereInput = { id: sessionId }
    if (userId) {
      where.userId = userId
    }

    const session = await prisma.session.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    if (!session) {
      return null
    }

    return {
      id: session.id,
      userId: session.userId,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      lastActiveAt: session.lastActiveAt,
      revokedAt: session.revokedAt,
      isActive: session.revokedAt === null,
      createdAt: new Date(), // Placeholder
      user: session.user,
    }
  }

  // Create new session
  async createSession(
    userId: number,
    token: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<SessionDto> {
    const session = await prisma.session.create({
      data: {
        userId,
        token,
        userAgent,
        ipAddress,
        lastActiveAt: new Date(),
      },
    })

    return {
      id: session.id,
      userId: session.userId,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      lastActiveAt: session.lastActiveAt,
      revokedAt: session.revokedAt,
      isActive: session.revokedAt === null,
      createdAt: new Date(), // Placeholder
    }
  }

  // Update session activity
  async updateSessionActivity(sessionId: number): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() },
    })
  }

  // Revoke session
  async revokeSession(sessionId: number, userId?: number): Promise<boolean> {
    const where: Prisma.SessionWhereInput = { id: sessionId }
    if (userId) {
      where.userId = userId
    }

    try {
      const result = await prisma.session.updateMany({
        where,
        data: { revokedAt: new Date() },
      })

      return result.count > 0
    } catch {
      return false
    }
  }

  // Revoke all user sessions except current
  async revokeAllUserSessions(
    userId: number,
    excludeSessionId?: number,
  ): Promise<number> {
    const where: Prisma.SessionWhereInput = {
      userId,
      revokedAt: null,
    }

    if (excludeSessionId) {
      where.id = { not: excludeSessionId }
    }

    const result = await prisma.session.updateMany({
      where,
      data: { revokedAt: new Date() },
    })

    return result.count
  }

  // Bulk revoke sessions
  async bulkRevokeSessions(
    sessionIds: number[],
    userId?: number,
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    }

    for (const sessionId of sessionIds) {
      try {
        const success = await this.revokeSession(sessionId, userId)
        if (success) {
          result.success++
        } else {
          result.failed++
          result.errors.push({
            sessionId,
            error: 'Session not found or already revoked',
          })
        }
      } catch (error) {
        result.failed++
        result.errors.push({
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return result
  }

  // Get session statistics
  async getSessionStats(userId: number): Promise<SessionStatsDto> {
    const [totalSessions, activeSessions, revokedSessions, lastSession] =
      await Promise.all([
        prisma.session.count({ where: { userId } }),
        prisma.session.count({ where: { userId, revokedAt: null } }),
        prisma.session.count({ where: { userId, revokedAt: { not: null } } }),
        prisma.session.findFirst({
          where: { userId },
          orderBy: { lastActiveAt: 'desc' },
          select: { lastActiveAt: true },
        }),
      ])

    // Get unique devices and IPs
    const uniqueDevices = await prisma.session.groupBy({
      by: ['userAgent'],
      where: { userId, userAgent: { not: null } },
    })

    const uniqueIps = await prisma.session.groupBy({
      by: ['ipAddress'],
      where: { userId, ipAddress: { not: null } },
    })

    return {
      totalSessions,
      activeSessions,
      revokedSessions,
      uniqueDevices: uniqueDevices.length,
      uniqueIpAddresses: uniqueIps.length,
      lastActivity: lastSession?.lastActiveAt || null,
    }
  }

  // Get session analytics
  async getSessionAnalytics(userId: number): Promise<SessionAnalytics> {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalSessions,
      activeSessions,
      sessionsToday,
      sessionsThisWeek,
      sessionsThisMonth,
    ] = await Promise.all([
      prisma.session.count({ where: { userId } }),
      prisma.session.count({ where: { userId, revokedAt: null } }),
      prisma.session.count({ where: { userId, lastActiveAt: { gte: today } } }),
      prisma.session.count({
        where: { userId, lastActiveAt: { gte: thisWeek } },
      }),
      prisma.session.count({
        where: { userId, lastActiveAt: { gte: thisMonth } },
      }),
    ])

    // Get top devices
    const deviceGroups = await prisma.session.groupBy({
      by: ['userAgent'],
      where: { userId, userAgent: { not: null } },
      _count: { userAgent: true },
      orderBy: { _count: { userAgent: 'desc' } },
      take: 5,
    })

    const topDevices = deviceGroups.map((group) => ({
      device: this.parseUserAgent(group.userAgent || '').browser,
      count: group._count.userAgent,
    }))

    // Get top locations (simplified by IP)
    const locationGroups = await prisma.session.groupBy({
      by: ['ipAddress'],
      where: { userId, ipAddress: { not: null } },
      _count: { ipAddress: true },
      orderBy: { _count: { ipAddress: 'desc' } },
      take: 5,
    })

    const topLocations = locationGroups.map((group) => ({
      location: group.ipAddress || 'Unknown',
      count: group._count.ipAddress,
    }))

    // Generate hourly activity (simplified)
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: Math.floor(Math.random() * 10), // Placeholder - would need actual hourly data
    }))

    return {
      totalSessions,
      activeSessions,
      sessionsToday,
      sessionsThisWeek,
      sessionsThisMonth,
      averageSessionDuration: 45, // Placeholder - would calculate from actual data
      topDevices,
      topLocations,
      hourlyActivity,
    }
  }

  // Check for suspicious activity
  async checkSuspiciousActivity(
    userId: number,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = []

    // Check for new device
    if (userAgent) {
      const existingDeviceSession = await prisma.session.findFirst({
        where: { userId, userAgent },
      })

      if (!existingDeviceSession) {
        alerts.push({
          type: 'NEW_DEVICE',
          sessionId: 0, // Would be set after session creation
          userId,
          details: { userAgent },
          timestamp: new Date(),
        })
      }
    }

    // Check for new location (simplified by IP)
    if (ipAddress) {
      const existingLocationSession = await prisma.session.findFirst({
        where: { userId, ipAddress },
      })

      if (!existingLocationSession) {
        alerts.push({
          type: 'SUSPICIOUS_LOCATION',
          sessionId: 0,
          userId,
          details: { ipAddress },
          timestamp: new Date(),
        })
      }
    }

    // Check for concurrent sessions
    const activeSessions = await prisma.session.count({
      where: { userId, revokedAt: null },
    })

    if (activeSessions > 5) {
      alerts.push({
        type: 'CONCURRENT_SESSIONS',
        sessionId: 0,
        userId,
        details: { deviceInfo: `${activeSessions} active sessions` },
        timestamp: new Date(),
      })
    }

    return alerts
  }

  // Clean up old sessions
  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          { revokedAt: { lt: cutoffDate } },
          { lastActiveAt: { lt: cutoffDate } },
        ],
      },
    })

    return result.count
  }

  // Find session by token
  async findSessionByToken(token: string): Promise<SessionDto | null> {
    const session = await prisma.session.findUnique({
      where: { token },
    })

    if (!session) {
      return null
    }

    return {
      id: session.id,
      userId: session.userId,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      lastActiveAt: session.lastActiveAt,
      revokedAt: session.revokedAt,
      isActive: session.revokedAt === null,
      createdAt: new Date(), // Placeholder
    }
  }

  // Helper method to parse user agent
  private parseUserAgent(userAgent: string): DeviceInfo {
    // Simplified user agent parsing
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)
    const isTablet = /iPad|Tablet/.test(userAgent)
    const isBot = /bot|crawler|spider/i.test(userAgent)

    let browser = 'Unknown'
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'

    let os = 'Unknown'
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS')) os = 'iOS'

    return {
      type: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
      browser,
      os,
      isBot,
    }
  }
}
