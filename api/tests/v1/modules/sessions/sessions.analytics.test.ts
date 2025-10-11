import request from 'supertest'
import { createApp } from '../../../../src/app'
import { sessionsTestHelpers, prisma } from './sessions.helpers'

const app = createApp()

describe('Sessions Analytics & Statistics', () => {
  let authToken: string
  let userId: number
  let sessionId: number

  beforeAll(async () => {
    await sessionsTestHelpers.cleanupDatabase()
    const {
      user,
      session,
      authToken: token,
    } = await sessionsTestHelpers.setupTestData()
    userId = user.id
    sessionId = session.id
    authToken = token
  })

  afterAll(async () => {
    await sessionsTestHelpers.disconnectDatabase()
  })

  describe('GET /api/v1/sessions/stats', () => {
    beforeEach(async () => {
      // Create diverse session data for statistics
      await sessionsTestHelpers.createMultipleSessions(userId, 5, [
        {
          userAgent: 'Chrome Browser',
          ipAddress: '192.168.1.10',
          token: 'stats-token-1',
        },
        {
          userAgent: 'Firefox Browser',
          ipAddress: '192.168.1.11',
          token: 'stats-token-2',
        },
        {
          userAgent: 'Safari Browser',
          ipAddress: '192.168.1.12',
          token: 'stats-token-3',
          revokedAt: new Date(), // Revoked session
        },
        {
          userAgent: 'Edge Browser',
          ipAddress: '192.168.1.13',
          token: 'stats-token-4',
        },
        {
          userAgent: 'Mobile Safari',
          ipAddress: '192.168.1.14',
          token: 'stats-token-5',
        },
      ])
    })

    afterEach(async () => {
      // Clean up test sessions, keeping the main one
      await prisma.session.deleteMany({
        where: {
          userId,
          id: { not: sessionId },
        },
      })
    })

    it('should return session statistics', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/stats')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('totalSessions')
      expect(response.body.data).toHaveProperty('activeSessions')
      expect(response.body.data).toHaveProperty('revokedSessions')
      expect(response.body.data).toHaveProperty('uniqueDevices')
      expect(response.body.data).toHaveProperty('uniqueIpAddresses')

      // Validate data types
      expect(typeof response.body.data.totalSessions).toBe('number')
      expect(typeof response.body.data.activeSessions).toBe('number')
      expect(typeof response.body.data.revokedSessions).toBe('number')
      expect(typeof response.body.data.uniqueDevices).toBe('number')
      expect(typeof response.body.data.uniqueIpAddresses).toBe('number')

      // Validate logic
      expect(response.body.data.totalSessions).toBeGreaterThan(0)
      expect(
        response.body.data.activeSessions + response.body.data.revokedSessions,
      ).toBe(response.body.data.totalSessions)
    })

    it('should calculate unique devices correctly', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/stats')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.uniqueDevices).toBeGreaterThan(0)
      expect(response.body.data.uniqueDevices).toBeLessThanOrEqual(
        response.body.data.totalSessions,
      )
    })

    it('should calculate unique IP addresses correctly', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/stats')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.uniqueIpAddresses).toBeGreaterThan(0)
      expect(response.body.data.uniqueIpAddresses).toBeLessThanOrEqual(
        response.body.data.totalSessions,
      )
    })

    it('should only return stats for current user', async () => {
      // Create another user with sessions
      const otherUser = await sessionsTestHelpers.createTestUser({
        email: 'other@example.com',
        uuid: 'other-user-uuid',
      })
      await sessionsTestHelpers.createTestSession(otherUser.id)

      const response = await request(app)
        .get('/api/v1/sessions/stats')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      // Stats should not include other user's sessions
      expect(response.body.data.totalSessions).toBeLessThan(10) // Should be reasonable for current user only
    })
  })

  describe('GET /api/v1/sessions/analytics', () => {
    beforeEach(async () => {
      // Create sessions with different timestamps for analytics
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      await sessionsTestHelpers.createMultipleSessions(userId, 4, [
        {
          userAgent: 'Chrome Analytics',
          ipAddress: '192.168.1.20',
          token: 'analytics-token-1',
          lastActiveAt: today, // Today
        },
        {
          userAgent: 'Firefox Analytics',
          ipAddress: '192.168.1.21',
          token: 'analytics-token-2',
          lastActiveAt: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        },
        {
          userAgent: 'Safari Analytics',
          ipAddress: '192.168.1.22',
          token: 'analytics-token-3',
          lastActiveAt: today,
        },
        {
          userAgent: 'Edge Analytics',
          ipAddress: '192.168.1.23',
          token: 'analytics-token-4',
          lastActiveAt: new Date(today.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
        },
      ])
    })

    afterEach(async () => {
      // Clean up analytics test sessions
      await prisma.session.deleteMany({
        where: {
          userId,
          id: { not: sessionId },
        },
      })
    })

    it('should return session analytics', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/analytics')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('totalSessions')
      expect(response.body.data).toHaveProperty('activeSessions')
      expect(response.body.data).toHaveProperty('sessionsToday')
      expect(response.body.data).toHaveProperty('topDevices')
      expect(response.body.data).toHaveProperty('hourlyActivity')

      // Validate hourly activity structure
      expect(response.body.data.hourlyActivity).toBeInstanceOf(Array)
      expect(response.body.data.hourlyActivity).toHaveLength(24)

      // Each hour should have proper structure
      response.body.data.hourlyActivity.forEach((hour: any) => {
        expect(hour).toHaveProperty('hour')
        expect(hour).toHaveProperty('count')
        expect(typeof hour.hour).toBe('number')
        expect(typeof hour.count).toBe('number')
        expect(hour.hour).toBeGreaterThanOrEqual(0)
        expect(hour.hour).toBeLessThanOrEqual(23)
      })
    })

    it('should return top devices analytics', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/analytics')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.topDevices).toBeInstanceOf(Array)

      // Each device entry should have proper structure
      response.body.data.topDevices.forEach((device: any) => {
        expect(device).toHaveProperty('userAgent')
        expect(device).toHaveProperty('count')
        expect(typeof device.userAgent).toBe('string')
        expect(typeof device.count).toBe('number')
        expect(device.count).toBeGreaterThan(0)
      })
    })

    it('should calculate sessions today correctly', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/analytics')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(typeof response.body.data.sessionsToday).toBe('number')
      expect(response.body.data.sessionsToday).toBeGreaterThanOrEqual(0)
      expect(response.body.data.sessionsToday).toBeLessThanOrEqual(
        response.body.data.totalSessions,
      )
    })

    it('should handle date range queries', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 7 days ago
          endDate: new Date().toISOString(),
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.totalSessions).toBeGreaterThanOrEqual(0)
    })

    it('should validate date range parameters', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: 'invalid-date',
          endDate: new Date().toISOString(),
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/v1/sessions/security/alerts', () => {
    beforeEach(async () => {
      // Create sessions that might trigger security alerts
      await sessionsTestHelpers.createMultipleSessions(userId, 3, [
        {
          userAgent: 'Suspicious Browser',
          ipAddress: '10.0.0.1', // Different IP range
          token: 'suspicious-token-1',
        },
        {
          userAgent: 'Unknown Device',
          ipAddress: '172.16.0.1', // Another different IP range
          token: 'suspicious-token-2',
        },
        {
          userAgent: 'Normal Browser',
          ipAddress: '192.168.1.100',
          token: 'normal-token',
        },
      ])
    })

    afterEach(async () => {
      // Clean up security test sessions
      await prisma.session.deleteMany({
        where: {
          userId,
          id: { not: sessionId },
        },
      })
    })

    it('should return security alerts', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/security/alerts')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
    })

    it('should include alert details when present', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/security/alerts')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)

      // If alerts exist, they should have proper structure
      if (response.body.data.length > 0) {
        response.body.data.forEach((alert: any) => {
          expect(alert).toHaveProperty('type')
          expect(alert).toHaveProperty('message')
          expect(alert).toHaveProperty('severity')
          expect(alert).toHaveProperty('timestamp')
          expect(['low', 'medium', 'high', 'critical']).toContain(
            alert.severity,
          )
        })
      }
    })

    it('should handle empty alerts gracefully', async () => {
      // Clean all sessions except main one (might result in no alerts)
      await prisma.session.deleteMany({
        where: {
          userId,
          id: { not: sessionId },
        },
      })

      const response = await request(app)
        .get('/api/v1/sessions/security/alerts')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
    })
  })

  describe('Analytics Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // Create many sessions to test performance
      const largeBatch = []
      for (let i = 0; i < 20; i++) {
        largeBatch.push({
          userAgent: `Performance Test Browser ${i}`,
          ipAddress: `192.168.2.${i + 1}`,
          token: `perf-token-${i}`,
        })
      }

      await sessionsTestHelpers.createMultipleSessions(userId, 20, largeBatch)

      const startTime = Date.now()
      const response = await request(app)
        .get('/api/v1/sessions/analytics')
        .set('Authorization', `Bearer ${authToken}`)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(5000) // Should respond within 5 seconds

      // Clean up large dataset
      await prisma.session.deleteMany({
        where: {
          userId,
          id: { not: sessionId },
        },
      })
    })

    it('should cache analytics data appropriately', async () => {
      // Make multiple requests to the same endpoint
      const responses = await Promise.all([
        request(app)
          .get('/api/v1/sessions/stats')
          .set('Authorization', `Bearer ${authToken}`),
        request(app)
          .get('/api/v1/sessions/stats')
          .set('Authorization', `Bearer ${authToken}`),
        request(app)
          .get('/api/v1/sessions/stats')
          .set('Authorization', `Bearer ${authToken}`),
      ])

      responses.forEach((response) => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })

      // Results should be consistent (if caching is working)
      const firstResult = responses[0].body.data
      responses.slice(1).forEach((response) => {
        expect(response.body.data.totalSessions).toBe(firstResult.totalSessions)
      })
    })
  })
})
