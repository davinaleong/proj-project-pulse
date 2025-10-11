import request from 'supertest'
import { createApp } from '../../../../src/app'
import { sessionsTestHelpers, prisma } from './sessions.helpers'

const app = createApp()

describe('Sessions Admin Operations', () => {
  let authToken: string
  let adminToken: string
  let userId: number
  let adminId: number
  let sessionId: number

  beforeAll(async () => {
    await sessionsTestHelpers.cleanupDatabase()
    const {
      user,
      admin,
      session,
      authToken: userToken,
      adminToken: adminAuthToken,
    } = await sessionsTestHelpers.setupTestData()

    userId = user.id
    adminId = admin.id
    sessionId = session.id
    authToken = userToken
    adminToken = adminAuthToken
  })

  afterAll(async () => {
    await sessionsTestHelpers.disconnectDatabase()
  })

  describe('DELETE /api/v1/sessions/admin/cleanup', () => {
    let oldSessions: number[]

    beforeEach(async () => {
      // Create old sessions for cleanup testing
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 35) // 35 days ago (older than 30 day threshold)

      const sessions = await sessionsTestHelpers.createMultipleSessions(
        userId,
        3,
        [
          {
            userAgent: 'Old Browser 1',
            ipAddress: '192.168.1.30',
            token: 'old-token-1',
            lastActiveAt: oldDate,
          },
          {
            userAgent: 'Old Browser 2',
            ipAddress: '192.168.1.31',
            token: 'old-token-2',
            lastActiveAt: oldDate,
          },
          {
            userAgent: 'Old Browser 3',
            ipAddress: '192.168.1.32',
            token: 'old-token-3',
            lastActiveAt: oldDate,
            revokedAt: oldDate, // Already revoked
          },
        ],
      )
      oldSessions = sessions.map((s) => s.id)
    })

    afterEach(async () => {
      // Clean up any remaining old sessions
      await prisma.session.deleteMany({
        where: { id: { in: oldSessions } },
      })
    })

    it('should cleanup old sessions for admin', async () => {
      const response = await request(app)
        .delete('/api/v1/sessions/admin/cleanup')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ days: '30' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('deletedCount')
      expect(typeof response.body.data.deletedCount).toBe('number')
      expect(response.body.data.deletedCount).toBeGreaterThan(0)

      // Verify old sessions were deleted
      const remainingSessions = await prisma.session.findMany({
        where: { id: { in: oldSessions } },
      })
      expect(remainingSessions.length).toBeLessThan(oldSessions.length)
    })

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .delete('/api/v1/sessions/admin/cleanup')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ days: '30' })

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
    })

    it('should validate days parameter', async () => {
      const response = await request(app)
        .delete('/api/v1/sessions/admin/cleanup')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ days: 'invalid' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should require days parameter', async () => {
      const response = await request(app)
        .delete('/api/v1/sessions/admin/cleanup')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should handle minimum days threshold', async () => {
      // Try with very low days value
      const response = await request(app)
        .delete('/api/v1/sessions/admin/cleanup')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ days: '1' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('minimum')
    })

    it('should preserve recent sessions during cleanup', async () => {
      // Create a recent session
      const recentSession = await sessionsTestHelpers.createTestSession(
        userId,
        {
          userAgent: 'Recent Browser',
          ipAddress: '192.168.1.50',
          token: 'recent-token',
          lastActiveAt: new Date(), // Current time
        },
      )

      await request(app)
        .delete('/api/v1/sessions/admin/cleanup')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ days: '30' })
        .expect(200)

      // Verify recent session was preserved
      const preservedSession = await prisma.session.findUnique({
        where: { id: recentSession.id },
      })
      expect(preservedSession).not.toBeNull()

      // Clean up
      await prisma.session.delete({ where: { id: recentSession.id } })
    })
  })

  describe('POST /api/v1/sessions/admin/bulk-revoke', () => {
    let sessionsToRevoke: number[]

    beforeEach(async () => {
      // Create sessions to bulk revoke
      const sessions = await sessionsTestHelpers.createMultipleSessions(
        userId,
        4,
        [
          {
            userAgent: 'Bulk 1',
            ipAddress: '192.168.1.40',
            token: 'bulk-session-token-1',
          },
          {
            userAgent: 'Bulk 2',
            ipAddress: '192.168.1.41',
            token: 'bulk-session-token-2',
          },
          {
            userAgent: 'Bulk 3',
            ipAddress: '192.168.1.42',
            token: 'bulk-session-token-3',
          },
          {
            userAgent: 'Bulk 4',
            ipAddress: '192.168.1.43',
            token: 'bulk-session-token-4',
          },
        ],
      )
      sessionsToRevoke = sessions.map((s) => s.id)
    })

    afterEach(async () => {
      // Clean up bulk test sessions
      await prisma.session.deleteMany({
        where: { id: { in: sessionsToRevoke } },
      })
    })

    it('should bulk revoke sessions for admin', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sessionIds: sessionsToRevoke })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('success')
      expect(response.body.data).toHaveProperty('failed')
      expect(response.body.data).toHaveProperty('errors')

      // Validate response structure
      expect(typeof response.body.data.success).toBe('number')
      expect(typeof response.body.data.failed).toBe('number')
      expect(Array.isArray(response.body.data.errors)).toBe(true)

      // Most or all sessions should be successfully revoked
      expect(response.body.data.success).toBeGreaterThan(0)
      expect(response.body.data.success + response.body.data.failed).toBe(
        sessionsToRevoke.length,
      )

      // Verify sessions were actually revoked
      const revokedSessions = await prisma.session.findMany({
        where: {
          id: { in: sessionsToRevoke },
          revokedAt: { not: null },
        },
      })
      expect(revokedSessions.length).toBe(response.body.data.success)
    })

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sessionIds: sessionsToRevoke })

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
    })

    it('should validate session IDs array', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sessionIds: 'not-an-array' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should require session IDs', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should handle empty session IDs array', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sessionIds: [] })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('empty')
    })

    it('should handle mix of valid and invalid session IDs', async () => {
      const mixedIds = [...sessionsToRevoke, 99999, 99998] // Add non-existent IDs

      const response = await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sessionIds: mixedIds })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.success).toBe(sessionsToRevoke.length) // Only valid IDs
      expect(response.body.data.failed).toBe(2) // The invalid IDs
      expect(response.body.data.errors.length).toBe(2)
    })

    it('should handle already revoked sessions gracefully', async () => {
      // First, revoke some sessions
      await prisma.session.updateMany({
        where: { id: { in: sessionsToRevoke.slice(0, 2) } },
        data: { revokedAt: new Date() },
      })

      const response = await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sessionIds: sessionsToRevoke })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      // Should handle already revoked sessions appropriately
      expect(response.body.data.success + response.body.data.failed).toBe(
        sessionsToRevoke.length,
      )
    })

    it('should limit bulk operation size', async () => {
      // Create a large array of session IDs
      const largeArray = Array.from({ length: 1001 }, (_, i) => i + 1)

      const response = await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sessionIds: largeArray })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('limit')
    })
  })

  describe('Admin Authentication & Authorization', () => {
    it('should require authentication for all admin endpoints', async () => {
      // Test cleanup endpoint
      await request(app)
        .delete('/api/v1/sessions/admin/cleanup')
        .query({ days: '30' })
        .expect(401)

      // Test bulk revoke endpoint
      await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .send({ sessionIds: [1, 2, 3] })
        .expect(401)
    })

    it('should validate JWT token for admin endpoints', async () => {
      // Test with invalid token
      await request(app)
        .delete('/api/v1/sessions/admin/cleanup')
        .set('Authorization', 'Bearer invalid-token')
        .query({ days: '30' })
        .expect(401)

      await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .set('Authorization', 'Bearer invalid-token')
        .send({ sessionIds: [1, 2, 3] })
        .expect(401)
    })

    it('should verify admin role for all admin operations', async () => {
      // Regular user should be denied access
      const endpoints = [
        {
          method: 'delete',
          path: '/api/v1/sessions/admin/cleanup',
          query: { days: '30' },
        },
        {
          method: 'post',
          path: '/api/v1/sessions/admin/bulk-revoke',
          body: { sessionIds: [1, 2, 3] },
        },
      ]

      for (const endpoint of endpoints) {
        const req = request(app)
          [endpoint.method as 'delete' | 'post'](endpoint.path)
          .set('Authorization', `Bearer ${authToken}`)

        if (endpoint.query) {
          req.query(endpoint.query)
        }
        if (endpoint.body) {
          req.send(endpoint.body)
        }

        const response = await req
        expect(response.status).toBe(403)
      }
    })
  })

  describe('Admin Operations Error Handling', () => {
    it('should handle malformed JSON in bulk revoke', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      // Test with extremely large session ID that might cause database issues
      const response = await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sessionIds: [Number.MAX_SAFE_INTEGER] })

      expect(response.status).toBe(200) // Should handle gracefully
      expect(response.body.data.failed).toBe(1)
    })

    it('should provide detailed error information', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sessionIds: [99999, 99998] }) // Non-existent IDs

      expect(response.status).toBe(200)
      expect(response.body.data.errors).toBeInstanceOf(Array)
      expect(response.body.data.errors.length).toBe(2)

      response.body.data.errors.forEach((error: any) => {
        expect(error).toHaveProperty('sessionId')
        expect(error).toHaveProperty('error')
      })
    })
  })

  describe('Admin Operations Performance', () => {
    it('should handle large cleanup operations efficiently', async () => {
      // Create many old sessions
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 40)

      const largeBatch = []
      for (let i = 0; i < 50; i++) {
        largeBatch.push({
          userAgent: `Performance Test ${i}`,
          ipAddress: `10.0.0.${i + 1}`,
          token: `perf-token-${i}`,
          lastActiveAt: oldDate,
        })
      }

      await sessionsTestHelpers.createMultipleSessions(userId, 50, largeBatch)

      const startTime = Date.now()
      const response = await request(app)
        .delete('/api/v1/sessions/admin/cleanup')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ days: '30' })
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(10000) // Should complete within 10 seconds
      expect(response.body.data.deletedCount).toBeGreaterThan(0)
    })

    it('should handle concurrent admin operations', async () => {
      // Create sessions for concurrent operations
      const sessions = await sessionsTestHelpers.createMultipleSessions(
        userId,
        10,
      )
      const sessionIds = sessions.map((s) => s.id)

      // Run concurrent bulk revoke operations
      const promises = [
        request(app)
          .post('/api/v1/sessions/admin/bulk-revoke')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ sessionIds: sessionIds.slice(0, 5) }),
        request(app)
          .post('/api/v1/sessions/admin/bulk-revoke')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ sessionIds: sessionIds.slice(5, 10) }),
      ]

      const responses = await Promise.all(promises)

      responses.forEach((response) => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })

      // Clean up
      await prisma.session.deleteMany({
        where: { id: { in: sessionIds } },
      })
    })
  })
})
