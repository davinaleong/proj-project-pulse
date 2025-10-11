import request from 'supertest'
import { createApp } from '../../../../src/app'
import { sessionsTestHelpers, prisma } from './sessions.helpers'

const app = createApp()

describe('Sessions CRUD Operations', () => {
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

  describe('GET /api/v1/sessions', () => {
    beforeEach(async () => {
      // Create additional test sessions
      await sessionsTestHelpers.createMultipleSessions(userId, 3)
    })

    afterEach(async () => {
      // Clean up additional sessions, keeping the main test session
      await prisma.session.deleteMany({
        where: {
          userId,
          id: { not: sessionId },
        },
      })
    })

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
      expect(response.body.data.sessions.length).toBeGreaterThan(0)
    })

    it('should return sessions with default pagination when no params provided', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.pagination).toBeDefined()
    })

    it('should filter active sessions', async () => {
      // Create a revoked session
      await sessionsTestHelpers.createTestSession(userId, {
        revokedAt: new Date(),
        token: 'revoked-session-token',
      })

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

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 'invalid', limit: '10' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should handle pagination edge cases', async () => {
      // Test with page beyond available data
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: '999', limit: '10' })

      expect(response.status).toBe(200)
      expect(response.body.data.sessions).toBeInstanceOf(Array)
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
      expect(response.body.data.userAgent).toBeDefined()
      expect(response.body.data.ipAddress).toBeDefined()
      expect(response.body.data.lastActiveAt).toBeDefined()
    })

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/99999')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })

    it('should return 400 for invalid session id format', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/invalid')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should not allow access to other users sessions', async () => {
      // Create another user and session
      const otherUser = await sessionsTestHelpers.createTestUser({
        email: 'other@example.com',
        uuid: 'other-user-uuid',
      })
      const otherSession = await sessionsTestHelpers.createTestSession(
        otherUser.id,
      )

      const response = await request(app)
        .get(`/api/v1/sessions/${otherSession.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404) // Should not find session for different user
    })
  })

  describe('PUT /api/v1/sessions/:id/activity', () => {
    it('should update session activity', async () => {
      const originalSession = await prisma.session.findUnique({
        where: { id: sessionId },
      })

      // Wait a moment to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10))

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
      expect(new Date(updatedSession!.lastActiveAt).getTime()).toBeGreaterThan(
        new Date(originalSession!.lastActiveAt).getTime(),
      )
    })

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .put('/api/v1/sessions/99999/activity')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid session id', async () => {
      const response = await request(app)
        .put('/api/v1/sessions/invalid/activity')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
    })
  })

  describe('Authentication Requirements', () => {
    it('should return 401 without auth token for session list', async () => {
      const response = await request(app).get('/api/v1/sessions')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })

    it('should return 401 without auth token for session details', async () => {
      const response = await request(app).get(`/api/v1/sessions/${sessionId}`)

      expect(response.status).toBe(401)
    })

    it('should return 401 without auth token for activity update', async () => {
      const response = await request(app).put(
        `/api/v1/sessions/${sessionId}/activity`,
      )

      expect(response.status).toBe(401)
    })

    it('should reject invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
    })

    it('should reject JWT tokens with wrong signature', async () => {
      const invalidToken = sessionsTestHelpers.generateInvalidToken()

      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${invalidToken}`)

      expect(response.status).toBe(401)
    })
  })
})
