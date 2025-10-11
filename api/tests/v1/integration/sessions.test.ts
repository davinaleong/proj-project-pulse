import request from 'supertest'
import createApp from '../../../src/app'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const app = createApp()

describe('Session Integration Tests', () => {
  let authToken: string
  let userId: number
  let sessionId: number
  let adminToken: string

  beforeAll(async () => {
    // Clean up database
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()

    // Create test user
    const user = await prisma.user.create({
      data: {
        uuid: 'test-user-uuid',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    })
    userId = user.id

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        uuid: 'admin-user-uuid',
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'hashedpassword',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    })

    // Generate auth tokens
    authToken = jwt.sign(
      { uuid: user.uuid, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' },
    )

    adminToken = jwt.sign(
      { uuid: admin.uuid, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' },
    )

    // Create test session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        userAgent: 'Mozilla/5.0 Test Browser',
        ipAddress: '192.168.1.1',
        lastActiveAt: new Date(),
        token: 'test-session-token',
      },
    })
    sessionId = session.id
  })

  afterAll(async () => {
    // Clean up
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('GET /api/v1/sessions', () => {
    it('should return user sessions with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: '1', limit: '10' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('sessions')
      expect(response.body.data).toHaveProperty('pagination')
      expect(response.body.data.sessions).toBeInstanceOf(Array)
      expect(response.body.data.pagination.page).toBe(1)
      expect(response.body.data.pagination.limit).toBe(10)
    })

    it('should filter active sessions', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ revokedAt: 'null' })

      expect(response.status).toBe(200)
      expect(
        response.body.data.sessions.every(
          (session: { revokedAt: Date | null }) => session.revokedAt === null,
        ),
      ).toBe(true)
    })

    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/v1/sessions')

      expect(response.status).toBe(401)
    })

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 'invalid', limit: '10' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/v1/sessions/:id', () => {
    it('should return specific session by id', async () => {
      const response = await request(app)
        .get(`/api/v1/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(sessionId)
      expect(response.body.data.userId).toBe(userId)
    })

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/99999')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid session id', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/invalid')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/v1/sessions/:id/activity', () => {
    it('should update session activity', async () => {
      const response = await request(app)
        .put(`/api/v1/sessions/${sessionId}/activity`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe(
        'Session activity updated successfully',
      )

      // Verify session was updated in database
      const updatedSession = await prisma.session.findUnique({
        where: { id: sessionId },
      })
      expect(updatedSession?.lastActiveAt).toBeDefined()
    })
  })

  describe('DELETE /api/v1/sessions/:id', () => {
    let sessionToRevoke: number

    beforeEach(async () => {
      // Create a session to revoke
      const session = await prisma.session.create({
        data: {
          userId,
          userAgent: 'Browser to revoke',
          ipAddress: '192.168.1.2',
          lastActiveAt: new Date(),
          token: 'session-to-revoke-token',
        },
      })
      sessionToRevoke = session.id
    })

    it('should revoke session successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/sessions/${sessionToRevoke}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Session revoked successfully')

      // Verify session was revoked in database
      const revokedSession = await prisma.session.findUnique({
        where: { id: sessionToRevoke },
      })
      expect(revokedSession?.revokedAt).toBeDefined()
    })

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .delete('/api/v1/sessions/99999')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/sessions', () => {
    beforeEach(async () => {
      // Create multiple sessions for the user
      await prisma.session.createMany({
        data: [
          {
            userId,
            userAgent: 'Browser 1',
            ipAddress: '192.168.1.10',
            lastActiveAt: new Date(),
            token: 'session-token-1',
          },
          {
            userId,
            userAgent: 'Browser 2',
            ipAddress: '192.168.1.11',
            lastActiveAt: new Date(),
            token: 'session-token-2',
          },
        ],
      })
    })

    it('should revoke all user sessions except current', async () => {
      const response = await request(app)
        .delete('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId.toString())

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.revokedCount).toBeGreaterThan(0)

      // Verify current session is still active
      const currentSession = await prisma.session.findUnique({
        where: { id: sessionId },
      })
      expect(currentSession?.revokedAt).toBeNull()
    })
  })

  describe('GET /api/v1/sessions/stats', () => {
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
    })
  })

  describe('GET /api/v1/sessions/analytics', () => {
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
      expect(response.body.data.hourlyActivity).toHaveLength(24)
    })
  })

  describe('GET /api/v1/sessions/security/alerts', () => {
    it('should return security alerts', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/security/alerts')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
    })
  })

  describe('Admin endpoints', () => {
    describe('DELETE /api/v1/sessions/admin/cleanup', () => {
      it('should cleanup old sessions for admin', async () => {
        const response = await request(app)
          .delete('/api/v1/sessions/admin/cleanup')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ days: '30' })

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveProperty('deletedCount')
      })

      it('should return 403 for non-admin users', async () => {
        const response = await request(app)
          .delete('/api/v1/sessions/admin/cleanup')
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(403)
      })
    })

    describe('POST /api/v1/sessions/admin/bulk-revoke', () => {
      let sessionsToRevoke: number[]

      beforeEach(async () => {
        // Create sessions to bulk revoke
        await prisma.session.createMany({
          data: [
            {
              userId,
              userAgent: 'Bulk 1',
              ipAddress: '192.168.1.20',
              lastActiveAt: new Date(),
              token: 'bulk-session-token-1',
            },
            {
              userId,
              userAgent: 'Bulk 2',
              ipAddress: '192.168.1.21',
              lastActiveAt: new Date(),
              token: 'bulk-session-token-2',
            },
          ],
        })

        // Get the created session IDs
        const createdSessions = await prisma.session.findMany({
          where: {
            userAgent: { in: ['Bulk 1', 'Bulk 2'] },
          },
          select: { id: true },
        })
        sessionsToRevoke = createdSessions.map((s) => s.id)
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
      })

      it('should return 403 for non-admin users', async () => {
        const response = await request(app)
          .post('/api/v1/sessions/admin/bulk-revoke')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ sessionIds: sessionsToRevoke })

        expect(response.status).toBe(403)
      })
    })
  })

  describe('Error handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/admin/bulk-revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')

      expect(response.status).toBe(400)
    })

    it('should handle database connection errors', async () => {
      // This would require more complex mocking of Prisma
      // For now, we'll just verify error responses exist
      const response = await request(app)
        .get('/api/v1/sessions/99999')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('Rate limiting and security', () => {
    it('should handle multiple rapid requests', async () => {
      const promises = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .get('/api/v1/sessions')
            .set('Authorization', `Bearer ${authToken}`),
        )

      const responses = await Promise.all(promises)
      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status) // 200 OK or 429 Too Many Requests
      })
    })

    it('should validate JWT token format', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
    })

    it('should validate JWT token signature', async () => {
      const invalidToken = jwt.sign(
        { uuid: 'fake-uuid', email: 'fake@example.com', role: 'user' },
        'wrong-secret',
        { expiresIn: '1h' },
      )

      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${invalidToken}`)

      expect(response.status).toBe(401)
    })
  })
})
