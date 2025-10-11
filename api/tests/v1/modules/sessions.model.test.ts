import {
  sessionQuerySchema,
  SessionDto,
  SessionWithUserDto,
  SessionListResponse,
  SessionStatsDto,
  SessionAnalytics,
  BulkOperationResult,
  DeviceInfo,
  SecurityAlert,
} from '../../../src/modules/v1/sessions/session.model'

describe('Session Model', () => {
  describe('sessionQuerySchema', () => {
    it('should validate valid query parameters', () => {
      const validQuery = {
        page: '1',
        limit: '20',
        sortBy: 'lastActiveAt',
        sortOrder: 'desc',
        active: 'true',
      }

      const result = sessionQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
        expect(result.data.sortBy).toBe('lastActiveAt')
        expect(result.data.sortOrder).toBe('desc')
        expect(result.data.active).toBe(true)
      }
    })

    it('should apply default values for optional fields', () => {
      const minimalQuery = {}

      const result = sessionQuerySchema.safeParse(minimalQuery)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(10) // Default is 10, not 20
        expect(result.data.sortBy).toBe('lastActiveAt')
        expect(result.data.sortOrder).toBe('desc')
        expect(result.data.active).toBeUndefined()
      }
    })

    it('should validate page constraints', () => {
      const invalidPage = { page: '0' }
      const result = sessionQuerySchema.safeParse(invalidPage)
      expect(result.success).toBe(false)
    })

    it('should validate limit constraints', () => {
      const invalidLimit = { limit: '150' }
      const result = sessionQuerySchema.safeParse(invalidLimit)
      expect(result.success).toBe(false)
    })

    it('should validate sortBy enum values', () => {
      const invalidSortBy = { sortBy: 'invalidField' }
      const result = sessionQuerySchema.safeParse(invalidSortBy)
      expect(result.success).toBe(false)
    })

    it('should validate sortOrder enum values', () => {
      const invalidSortOrder = { sortOrder: 'random' }
      const result = sessionQuerySchema.safeParse(invalidSortOrder)
      expect(result.success).toBe(false)
    })

    it('should handle string numbers for page and limit', () => {
      const stringNumbers = { page: '2', limit: '50' }
      const result = sessionQuerySchema.safeParse(stringNumbers)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(50)
      }
    })

    it('should handle string boolean for active', () => {
      const stringBoolean = { active: 'true' }
      const result = sessionQuerySchema.safeParse(stringBoolean)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.active).toBe(true)
      }
    })
  })

  describe('SessionDto interface', () => {
    it('should define correct session structure', () => {
      const session: SessionDto = {
        id: 1,
        userId: 123,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.1',
        lastActiveAt: new Date(),
        revokedAt: null,
        isActive: true,
        createdAt: new Date(),
      }

      expect(session.id).toBeDefined()
      expect(session.userId).toBeDefined()
      expect(typeof session.isActive).toBe('boolean')
    })
  })

  describe('SessionWithUserDto interface', () => {
    it('should extend SessionDto with user information', () => {
      const sessionWithUser: SessionWithUserDto = {
        id: 1,
        userId: 123,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.1',
        lastActiveAt: new Date(),
        revokedAt: null,
        isActive: true,
        createdAt: new Date(),
        user: {
          id: 123,
          uuid: 'user_uuid_123',
          name: 'Test User',
          email: 'user@example.com',
          role: 'user',
        },
      }

      expect(sessionWithUser.user).toBeDefined()
      expect(sessionWithUser.user.email).toBe('user@example.com')
    })
  })

  describe('SessionListResponse interface', () => {
    it('should define correct pagination structure', () => {
      const response: SessionListResponse = {
        sessions: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      }

      expect(response.sessions).toBeDefined()
      expect(response.pagination).toBeDefined()
      expect(typeof response.pagination.pages).toBe('number')
    })
  })

  describe('SessionStatsDto interface', () => {
    it('should define correct statistics structure', () => {
      const stats: SessionStatsDto = {
        totalSessions: 10,
        activeSessions: 3,
        revokedSessions: 7,
        uniqueDevices: 5,
        uniqueIpAddresses: 3,
        lastActivity: new Date(),
      }

      expect(typeof stats.totalSessions).toBe('number')
      expect(typeof stats.activeSessions).toBe('number')
      expect(typeof stats.uniqueDevices).toBe('number')
      expect(stats.lastActivity).toBeInstanceOf(Date)
    })
  })

  describe('SessionAnalytics interface', () => {
    it('should define correct analytics structure', () => {
      const analytics: SessionAnalytics = {
        totalSessions: 15,
        activeSessions: 5,
        sessionsToday: 3,
        sessionsThisWeek: 12,
        sessionsThisMonth: 45,
        averageSessionDuration: 3600000,
        topDevices: [
          { device: 'desktop', count: 10 },
          { device: 'mobile', count: 5 },
        ],
        topLocations: [
          { location: 'New York, NY', count: 8 },
          { location: 'Los Angeles, CA', count: 7 },
        ],
        hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          count: Math.floor(Math.random() * 10),
        })),
      }

      expect(typeof analytics.totalSessions).toBe('number')
      expect(Array.isArray(analytics.topDevices)).toBe(true)
      expect(Array.isArray(analytics.topLocations)).toBe(true)
      expect(Array.isArray(analytics.hourlyActivity)).toBe(true)
      expect(analytics.hourlyActivity).toHaveLength(24)
    })
  })

  describe('BulkOperationResult interface', () => {
    it('should define correct bulk operation result structure', () => {
      const result: BulkOperationResult = {
        success: 8,
        failed: 2,
        errors: [
          { sessionId: 1, error: 'Session not found' },
          { sessionId: 2, error: 'Access denied' },
        ],
      }

      expect(typeof result.success).toBe('number')
      expect(typeof result.failed).toBe('number')
      expect(Array.isArray(result.errors)).toBe(true)
      expect(result.errors[0]).toHaveProperty('sessionId')
      expect(result.errors[0]).toHaveProperty('error')
    })
  })

  describe('DeviceInfo interface', () => {
    it('should define correct device info structure', () => {
      const deviceInfo: DeviceInfo = {
        type: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
        isBot: false,
      }

      expect(['desktop', 'mobile', 'tablet', 'unknown']).toContain(
        deviceInfo.type,
      )
      expect(typeof deviceInfo.browser).toBe('string')
      expect(typeof deviceInfo.os).toBe('string')
      expect(typeof deviceInfo.isBot).toBe('boolean')
    })
  })

  describe('SecurityAlert interface', () => {
    it('should define correct security alert structure', () => {
      const alert: SecurityAlert = {
        type: 'NEW_DEVICE',
        sessionId: 123,
        userId: 456,
        details: {
          userAgent: 'New browser detected',
          ipAddress: '192.168.1.100',
          location: 'Unknown location',
          deviceInfo: 'Mobile device',
        },
        timestamp: new Date(),
      }

      expect([
        'NEW_DEVICE',
        'SUSPICIOUS_LOCATION',
        'CONCURRENT_SESSIONS',
      ]).toContain(alert.type)
      expect(typeof alert.sessionId).toBe('number')
      expect(typeof alert.userId).toBe('number')
      expect(alert.details).toBeDefined()
      expect(alert.timestamp).toBeInstanceOf(Date)
    })

    it('should handle all security alert types', () => {
      const alertTypes: SecurityAlert['type'][] = [
        'NEW_DEVICE',
        'SUSPICIOUS_LOCATION',
        'CONCURRENT_SESSIONS',
      ]

      alertTypes.forEach((type) => {
        const alert: SecurityAlert = {
          type,
          sessionId: 123,
          userId: 456,
          details: {},
          timestamp: new Date(),
        }
        expect(alert.type).toBe(type)
      })
    })
  })

  describe('Type compatibility', () => {
    it('should ensure SessionQueryParams matches schema output', () => {
      const query = {
        page: '1',
        limit: '20',
        sortBy: 'lastActiveAt' as const,
        sortOrder: 'desc' as const,
        active: 'true',
      }

      const result = sessionQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
    })

    it('should handle optional fields correctly', () => {
      const minimalQuery = {
        page: '2',
      }

      const result = sessionQuerySchema.safeParse(minimalQuery)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(10) // default
        expect(result.data.sortBy).toBe('lastActiveAt') // default
      }
    })
  })
})
